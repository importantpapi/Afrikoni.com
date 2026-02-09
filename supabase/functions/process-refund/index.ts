/**
 * Supabase Edge Function: Process Stripe Refund
 * Called when buyer rejects delivery or dispute is resolved
 * 
 * Deploy: supabase functions deploy process-refund
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

async function main(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { escrow_id, payment_intent_id, amount, reason } = await req.json();

    if (!payment_intent_id || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Create refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment_intent_id,
      amount: Math.round(amount), // Already in cents
      reason: reason || 'requested_by_customer',
      metadata: {
        escrow_id,
        reason
      }
    });

    // Record in refunds table
    if (escrow_id) {
      const { data: payment } = await supabase
        .from('payments')
        .select('id')
        .eq('stripe_payment_intent_id', payment_intent_id)
        .single();

      if (payment) {
        await supabase.from('refunds').insert({
          escrow_id,
          payment_id: payment.id,
          stripe_refund_id: refund.id,
          amount: amount / 100,
          status: 'completed',
          reason: reason || 'requested_by_customer',
          metadata: { stripe_refund_id: refund.id }
        });
      }
    }

    return new Response(
      JSON.stringify({
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
        created: refund.created
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Refund processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

Deno.serve(main);
