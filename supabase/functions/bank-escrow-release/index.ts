// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * BANK ESCROW RELEASE — Afrikoni Trade OS
 * =========================================
 * Called automatically by trade-transition when trade reaches ACCEPTED state.
 *
 * ARCHITECTURE:
 * - Funds are held in a bank escrow sub-account (Flutterwave subaccount).
 * - Afrikoni's platform fee (8.5%) was already split to our account at
 *   payment collection time — we are always cash positive from day 1.
 * - This function instructs Flutterwave to release the seller's portion
 *   (91.5%) from the escrow sub-account to the seller's bank account.
 *
 * FLOW:
 *   trade.ACCEPTED → trade-transition calls this function
 *       → Flutterwave Transfer API → bank releases to seller
 *       → trade status → SETTLED
 *
 * WHAT IT NEEDS:
 *   trade.payment_data.bank_escrow_reference  (flw_ref from original payment)
 *   trade.payment_data.seller_release_amount  (91.5% of trade value)
 *   seller company's bank details in companies.payout_details
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FLUTTERWAVE_SECRET_KEY = Deno.env.get("FLUTTERWAVE_SECRET_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { trade_id } = await req.json();

    if (!trade_id) {
      return new Response(
        JSON.stringify({ success: false, error: "trade_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Fetch trade with payment data and seller info
    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .select(`
        id, status, title, currency, total_amount,
        payment_data,
        seller_id,
        companies!trades_seller_id_fkey (
          id, company_name, payout_details
        )
      `)
      .eq("id", trade_id)
      .single();

    if (tradeError || !trade) {
      throw new Error(`Trade not found: ${tradeError?.message}`);
    }

    if (trade.status !== "accepted") {
      throw new Error(`Trade is not in ACCEPTED state. Current: ${trade.status}`);
    }

    const paymentData = trade.payment_data as any;

    if (!paymentData?.bank_escrow_reference) {
      throw new Error("No bank_escrow_reference found in trade payment_data. Was the trade paid via bank escrow?");
    }

    const releaseAmount = paymentData.seller_release_amount;
    const currency = trade.currency || "USD";
    const sellerCompany = (trade as any).companies;
    const payoutDetails = sellerCompany?.payout_details;

    if (!payoutDetails?.account_number || !payoutDetails?.bank_code) {
      // Log and queue for manual release — seller hasn't added bank details yet
      await supabase.from("trade_events").insert({
        trade_id,
        event_type: "escrow_release_pending_bank_details",
        metadata: {
          release_amount: releaseAmount,
          currency,
          bank_escrow_reference: paymentData.bank_escrow_reference,
          reason: "Seller has not provided payout bank details",
        },
        created_at: new Date().toISOString(),
      });

      // Notify seller to add bank details
      await supabase.from("notifications").insert({
        user_id: trade.seller_id,
        type: "payout_pending_bank_details",
        title: "Add your bank details to receive payment",
        message: `Your trade "${trade.title}" has been accepted! Add your bank account details in Settings → Payout to receive ${currency} ${releaseAmount?.toLocaleString()}.`,
        metadata: { trade_id },
        created_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: false,
          queued: true,
          reason: "Seller bank details missing — release queued, seller notified",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Initiate Flutterwave Transfer to seller's bank account
    // This moves funds from the escrow sub-account to the seller
    const transferPayload = {
      account_bank: payoutDetails.bank_code,          // e.g. "044" for Access Bank Nigeria
      account_number: payoutDetails.account_number,   // Seller's account number
      amount: releaseAmount,
      narration: `Afrikoni trade payout: ${trade.title}`,
      currency: currency,
      reference: `ESC-REL-${trade_id}-${Date.now()}`,
      callback_url: `${SUPABASE_URL}/functions/v1/bank-escrow-release-webhook`,
      debit_currency: currency,
      // Source: the bank escrow sub-account (not Afrikoni main account)
      // Flutterwave will debit from the subaccount that received the funds
      meta: {
        trade_id,
        bank_escrow_reference: paymentData.bank_escrow_reference,
        release_type: "escrow_release",
        seller_company_id: sellerCompany?.id,
      },
    };

    const transferRes = await fetch("https://api.flutterwave.com/v3/transfers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transferPayload),
    });

    const transferData = await transferRes.json();

    if (transferData.status !== "success") {
      throw new Error(`Flutterwave transfer failed: ${transferData.message}`);
    }

    const transferRef = transferData.data?.reference;

    // 3. Record the release in DB
    await supabase.from("escrow_events").insert({
      trade_id,
      event_type: "bank_escrow_released",
      amount: releaseAmount,
      currency,
      metadata: {
        flw_transfer_ref: transferRef,
        bank_escrow_reference: paymentData.bank_escrow_reference,
        seller_account: payoutDetails.account_number,
        seller_bank_code: payoutDetails.bank_code,
        release_initiated_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    // 4. Log trade event
    await supabase.from("trade_events").insert({
      trade_id,
      event_type: "escrow_release_initiated",
      metadata: {
        release_amount: releaseAmount,
        currency,
        flw_transfer_ref: transferRef,
      },
      created_at: new Date().toISOString(),
    });

    // 5. Notify seller
    await supabase.from("notifications").insert({
      user_id: trade.seller_id,
      type: "payout_initiated",
      title: "Payment is on its way 🎉",
      message: `${currency} ${releaseAmount?.toLocaleString()} has been released from escrow and is being transferred to your bank account. Expected arrival: 1–3 business days.`,
      metadata: { trade_id, transfer_ref: transferRef },
      created_at: new Date().toISOString(),
    });

    console.log(`[bank-escrow-release] Trade ${trade_id} released: ${currency} ${releaseAmount} → ${payoutDetails.account_number}`);

    return new Response(
      JSON.stringify({
        success: true,
        transfer_ref: transferRef,
        released_amount: releaseAmount,
        currency,
        message: "Escrow released to seller bank account",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[bank-escrow-release] Error:", err);

    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
