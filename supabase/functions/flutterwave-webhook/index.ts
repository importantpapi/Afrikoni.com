// Supabase Edge Function to handle Flutterwave webhooks
// Processes payment confirmations, refunds, and status updates

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

interface FlutterwaveWebhookPayload {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    meta?: {
      user_id?: string;
      company_id?: string;
      order_id?: string;
      order_type?: string;
      [key: string]: unknown;
    };
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
  };
}

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get environment variables
  const FLUTTERWAVE_SECRET_HASH = Deno.env.get("FLUTTERWAVE_SECRET_HASH");
  const FLUTTERWAVE_SECRET_KEY = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase configuration");
    return new Response(
      JSON.stringify({ success: false, error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Verify webhook signature
    const signature = req.headers.get("verif-hash");
    if (FLUTTERWAVE_SECRET_HASH && signature !== FLUTTERWAVE_SECRET_HASH) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid signature" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload: FlutterwaveWebhookPayload = await req.json();
    console.log("Flutterwave webhook received:", payload.event, payload.data?.tx_ref);

    const { event, data } = payload;

    // Handle different event types
    switch (event) {
      case "charge.completed": {
        // Verify the transaction with Flutterwave
        const verifyResponse = await fetch(
          `https://api.flutterwave.com/v3/transactions/${data.id}/verify`,
          {
            headers: {
              Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
            },
          }
        );
        const verifyData = await verifyResponse.json();

        if (verifyData.status !== "success" || verifyData.data.status !== "successful") {
          console.error("Transaction verification failed:", verifyData);

          // Update billing history as failed
          await supabase
            .from("billing_history")
            .update({
              status: "failed",
              error_message: verifyData.message || "Verification failed",
              updated_at: new Date().toISOString(),
            })
            .eq("provider_reference", data.tx_ref);

          return new Response(
            JSON.stringify({ success: false, error: "Verification failed" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Update billing history
        const { error: billingError } = await supabase
          .from("billing_history")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
            provider_response: verifyData.data,
            metadata: {
              flw_ref: data.flw_ref,
              processor_response: data.processor_response,
              payment_type: data.payment_type,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("provider_reference", data.tx_ref);

        if (billingError) {
          console.error("Billing update error:", billingError);
        }

        // Update escrow if order payment
        if (data.meta?.order_id) {
          const { error: escrowError } = await supabase
            .from("escrow_payments")
            .update({
              status: "held",
              updated_at: new Date().toISOString(),
            })
            .eq("order_id", data.meta.order_id)
            .eq("status", "pending");

          if (escrowError) {
            console.error("Escrow update error:", escrowError);
          }

          // Create escrow event
          const { data: escrowData } = await supabase
            .from("escrow_payments")
            .select("id")
            .eq("order_id", data.meta.order_id)
            .single();

          if (escrowData) {
            await supabase.from("escrow_events").insert({
              escrow_id: escrowData.id,
              event_type: "hold",
              amount: data.amount,
              currency: data.currency,
              metadata: {
                flw_ref: data.flw_ref,
                tx_ref: data.tx_ref,
                payment_type: data.payment_type,
              },
            });
          }

          // Update order workflow to step 5 (Payment Confirmed)
          await supabase.rpc("advance_order_workflow", {
            p_order_id: data.meta.order_id,
            p_notes: "Payment confirmed via Flutterwave",
            p_metadata: {
              payment_ref: data.flw_ref,
              payment_amount: data.amount,
              payment_currency: data.currency,
            },
          });
        }

        // Create notification for user
        if (data.meta?.user_id) {
          await supabase.from("notifications").insert({
            user_id: data.meta.user_id,
            type: "payment_received",
            title: "Payment Confirmed",
            message: `Your payment of ${data.currency} ${data.amount.toLocaleString()} has been confirmed.`,
            metadata: {
              order_id: data.meta.order_id,
              amount: data.amount,
              currency: data.currency,
              reference: data.flw_ref,
            },
          });
        }

        break;
      }

      case "transfer.completed": {
        // Handle payout/transfer completion
        console.log("Transfer completed:", data.tx_ref);

        await supabase
          .from("billing_history")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("provider_reference", data.tx_ref)
          .eq("transaction_type", "payout");

        break;
      }

      case "refund.completed": {
        // Handle refund completion
        console.log("Refund completed:", data.tx_ref);

        // Update billing history
        await supabase
          .from("billing_history")
          .update({
            status: "refunded",
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("provider_reference", data.tx_ref);

        // Update escrow if exists
        if (data.meta?.order_id) {
          const { data: escrowData } = await supabase
            .from("escrow_payments")
            .select("id")
            .eq("order_id", data.meta.order_id)
            .single();

          if (escrowData) {
            await supabase
              .from("escrow_payments")
              .update({
                status: "refunded",
                updated_at: new Date().toISOString(),
              })
              .eq("id", escrowData.id);

            await supabase.from("escrow_events").insert({
              escrow_id: escrowData.id,
              event_type: "refund",
              amount: data.amount,
              currency: data.currency,
              metadata: { flw_ref: data.flw_ref },
            });
          }
        }

        // Notify user
        if (data.meta?.user_id) {
          await supabase.from("notifications").insert({
            user_id: data.meta.user_id,
            type: "payment_refunded",
            title: "Payment Refunded",
            message: `Your payment of ${data.currency} ${data.amount.toLocaleString()} has been refunded.`,
            metadata: {
              order_id: data.meta.order_id,
              amount: data.amount,
              currency: data.currency,
            },
          });
        }

        break;
      }

      default:
        console.log("Unhandled webhook event:", event);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
