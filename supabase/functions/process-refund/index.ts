/**
 * Supabase Edge Function: Process Stripe Refund (SECURED)
 * Called when buyer rejects delivery or dispute is resolved
 * 
 * Deploy: supabase functions deploy process-refund
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.10.0' // Align with webhook version

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validate Auth (CRITICAL P0 FIX)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      console.warn('[Security] Unauthorized refund attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { escrow_id, payment_intent_id, amount, reason } = await req.json()

    if (!escrow_id || !payment_intent_id || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: escrow_id, payment_intent_id, amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const refundAmountCents = Math.round(Number(amount))
    if (!Number.isFinite(refundAmountCents) || refundAmountCents <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be a positive integer in cents' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Authorize and validate via service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('company_id, is_admin')
      .eq('id', user.id)
      .single()

    const { data: escrow, error: escrowError } = await supabaseAdmin
      .from('escrows')
      .select('*')
      .eq('id', escrow_id)
      .single()

    if (escrowError || !escrow) {
      return new Response(
        JSON.stringify({ error: 'Escrow not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const buyerCompanyId = escrow.buyer_company_id ?? escrow.buyer_id
    const isAdmin = profile?.is_admin === true
    const isBuyerParty = !!profile?.company_id && !!buyerCompanyId && profile.company_id === buyerCompanyId

    // Restrict refunds to admin or buyer side.
    if (!isAdmin && !isBuyerParty) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: refund permission denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id, amount, currency, escrow_id, stripe_payment_intent_id')
      .eq('stripe_payment_intent_id', payment_intent_id)
      .single()

    if (!payment || (payment.escrow_id && payment.escrow_id !== escrow_id)) {
      return new Response(
        JSON.stringify({ error: 'Payment intent is not linked to the provided escrow' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const maxAmountCents = Math.round(Number(payment.amount || 0) * 100)
    if (refundAmountCents > maxAmountCents) {
      return new Response(
        JSON.stringify({ error: 'Refund amount exceeds original payment amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: existingRefund } = await supabaseAdmin
      .from('refunds')
      .select('id')
      .eq('escrow_id', escrow_id)
      .eq('status', 'completed')
      .limit(1)
      .maybeSingle()

    if (existingRefund) {
      return new Response(
        JSON.stringify({ error: 'Refund already completed for this escrow' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Create refund on Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment_intent_id,
      amount: refundAmountCents,
      reason: reason || 'requested_by_customer',
      metadata: {
        escrow_id,
        reason,
        triggered_by: user.id
      }
    })

    // 4. Persist refund + audit artifacts
    await supabaseAdmin.from('refunds').insert({
      escrow_id,
      payment_id: payment.id,
      stripe_refund_id: refund.id,
      amount: refundAmountCents / 100,
      status: 'completed',
      reason: reason || 'requested_by_customer',
      metadata: {
        stripe_refund_id: refund.id,
        initiated_by: user.id
      }
    })

    await supabaseAdmin.from('trade_events').insert({
      trade_id: escrow.trade_id || null,
      event_type: 'refund_initiated',
      payload: {
        escrow_id,
        stripe_refund_id: refund.id,
        initiated_by: user.id,
        amount: refundAmountCents / 100,
        currency: payment.currency || escrow.currency || 'USD'
      }
    }).then(() => { })

    await supabaseAdmin
      .from('escrows')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        balance: 0
      })
      .eq('id', escrow_id)

    return new Response(
      JSON.stringify({
        refundId: refund.id,
        status: refund.status,
        amount: refundAmountCents / 100,
        created: refund.created
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Refund processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
