/**
 * Supabase Edge Function: Handle Stripe Webhooks
 * Listens to payment.intent.succeeded, payment.intent.payment_failed, charge.refunded
 * 
 * Deploy: supabase functions deploy handle-stripe-webhook
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16'
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

async function handlePaymentIntentSucceeded(paymentIntent) {
  const escrowId = paymentIntent.metadata.escrow_id;
  const companyId = paymentIntent.metadata.company_id;

  // Create payment record
  const { error: paymentError } = await supabase.from('payments').insert({
    escrow_id: escrowId,
    company_id: companyId,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_payment_method_id: paymentIntent.payment_method,
    amount: paymentIntent.amount / 100, // Convert from cents
    currency: paymentIntent.currency.toUpperCase(),
    status: 'completed',
    payment_method: 'stripe',
    metadata: {
      receipt_email: paymentIntent.receipt_email,
      statement_descriptor: paymentIntent.statement_descriptor
    }
  });

  if (paymentError) {
    console.error('Failed to create payment record:', paymentError);
    return;
  }

  // Update escrow status to FUNDED
  const { data: escrow, error: escrowFetchError } = await supabase
    .from('escrows')
    .select('trade_id')
    .eq('id', escrowId)
    .single();

  if (escrowFetchError) {
    console.error('Failed to fetch escrow:', escrowFetchError);
    return;
  }

  // Update escrow
  await supabase
    .from('escrows')
    .update({
      status: 'funded',
      funded_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntent.id
    })
    .eq('id', escrowId);

  // Create trade event
  await supabase.from('trade_events').insert({
    trade_id: escrow.trade_id,
    event_type: 'escrow_funded',
    description: `Escrow payment of ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()} confirmed`,
    metadata: {
      payment_intent_id: paymentIntent.id,
      payment_method: paymentIntent.payment_method,
      amount: paymentIntent.amount / 100
    }
  });

  // Trigger automation: If escrow funded, move to PRODUCTION state
  await supabase.functions.invoke('transition-trade-state', {
    body: {
      trade_id: escrow.trade_id,
      target_state: 'production',
      trigger: 'escrow_funded'
    }
  });
}

async function handlePaymentIntentFailed(paymentIntent) {
  const escrowId = paymentIntent.metadata.escrow_id;

  // Create failed payment record
  await supabase.from('payments').insert({
    escrow_id: escrowId,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_payment_method_id: paymentIntent.payment_method,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    status: 'failed',
    payment_method: 'stripe',
    error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
    metadata: {
      failure_code: paymentIntent.last_payment_error?.code,
      failure_message: paymentIntent.last_payment_error?.message
    }
  });

  // Update escrow status
  await supabase
    .from('escrows')
    .update({
      status: 'payment_failed',
      payment_failed_at: new Date().toISOString()
    })
    .eq('id', escrowId);

  // Get trade_id and create event
  const { data: escrow } = await supabase
    .from('escrows')
    .select('trade_id')
    .eq('id', escrowId)
    .single();

  if (escrow) {
    await supabase.from('trade_events').insert({
      trade_id: escrow.trade_id,
      event_type: 'payment_failed',
      description: `Escrow payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
      metadata: {
        payment_intent_id: paymentIntent.id,
        error_code: paymentIntent.last_payment_error?.code
      }
    });
  }
}

async function handleChargeRefunded(charge) {
  const paymentIntentId = charge.payment_intent;

  // Find the payment record
  const { data: payment } = await supabase
    .from('payments')
    .select('escrow_id, amount')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (!payment) return;

  // Create refund record
  const { error: refundError } = await supabase.from('refunds').insert({
    escrow_id: payment.escrow_id,
    stripe_charge_id: charge.id,
    stripe_refund_id: charge.refunds.data[0].id,
    amount: charge.refunded / 100,
    currency: charge.currency.toUpperCase(),
    status: 'completed',
    reason: charge.refunds.data[0].reason || 'requested_by_customer',
    metadata: {
      charge_id: charge.id,
      receipt_number: charge.receipt_number
    }
  });

  if (refundError) {
    console.error('Failed to create refund record:', refundError);
    return;
  }

  // Update escrow status
  await supabase
    .from('escrows')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString()
    })
    .eq('id', payment.escrow_id);

  // Get trade_id and create event
  const { data: escrow } = await supabase
    .from('escrows')
    .select('trade_id')
    .eq('id', payment.escrow_id)
    .single();

  if (escrow) {
    await supabase.from('trade_events').insert({
      trade_id: escrow.trade_id,
      event_type: 'escrow_refunded',
      description: `Refund of ${charge.refunded / 100} ${charge.currency.toUpperCase()} processed`,
      metadata: {
        refund_id: charge.refunds.data[0].id,
        amount: charge.refunded / 100,
        reason: charge.refunds.data[0].reason
      }
    });
  }
}

async function verifyWebhookSignature(body, signature) {
  try {
    const event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
}

async function main(req) {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 });
    }

    // Verify webhook signature
    const event = await verifyWebhookSignature(body, signature);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

Deno.serve(main);
