/**
 * Supabase Edge Function: Create Stripe PaymentIntent
 * Called from frontend when buyer clicks "Fund Escrow"
 * 
 * Deploy: supabase functions deploy create-payment-intent
 */

import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16'
});

async function main(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { escrow_id, amount, currency, buyer_email } = await req.json();

    if (!escrow_id || !amount || !currency) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Already in cents from frontend
      currency: currency.toLowerCase(),
      metadata: {
        escrow_id,
        type: 'escrow_funding'
      },
      receipt_email: buyer_email,
      statement_descriptor: `AFRIKONI ESCROW ${escrow_id.substring(0, 8)}`
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY')
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

Deno.serve(main);
