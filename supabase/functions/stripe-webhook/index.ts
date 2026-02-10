// Supabase Edge Function to handle Stripe webhooks
// Processes payment confirmations, refunds, and subscription events

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

Deno.serve(async (req) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get environment variables
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error("Missing Stripe configuration");
    return new Response(
      JSON.stringify({ success: false, error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase configuration");
    return new Response(
      JSON.stringify({ success: false, error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing signature" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid signature" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Stripe webhook received:", event.type);

    // ------------------------------------------------------------------------
    // IDEMPOTENCY CHECK (P1 HARDENING)
    // ------------------------------------------------------------------------
    const { error: idempotencyError } = await supabase
      .from('processed_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        status: 'processing'
      });

    // Postgres Error 23505 = Unique Violation (Already processed)
    if (idempotencyError && idempotencyError.code === '23505') {
      console.log(`[Idempotency] Event ${event.id} already processed. Skipping.`);
      return new Response(
        JSON.stringify({ success: true, message: 'Event already processed' }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (idempotencyError) {
      console.error('[Idempotency] Error recording event:', idempotencyError);
      // Proceed with caution, or fail? Failing ensures we don't process without recording.
      // But we might block valid webhooks if DB is glitchy.
      // Decision: Fail safe. If we can't record it, don't process it (to prevent double-spend bugs).
      return new Response(
        JSON.stringify({ success: false, error: 'Idempotency check failed' }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    // ------------------------------------------------------------------------
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        console.log("Checkout completed:", session.id);

        // Update billing history
        const { error: billingError } = await supabase
          .from("billing_history")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
            provider_response: {
              payment_intent: session.payment_intent,
              payment_status: session.payment_status,
              customer_email: session.customer_email,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("provider_reference", session.id);

        if (billingError) {
          console.error("Billing update error:", billingError);
        }

        // Handle order payment
        if (metadata.order_id && metadata.order_type === "order") {
          // Update escrow to held
          const { error: escrowError } = await supabase
            .from("escrow_payments")
            .update({
              status: "held",
              updated_at: new Date().toISOString(),
            })
            .eq("order_id", metadata.order_id)
            .eq("status", "pending");

          if (escrowError) {
            console.error("Escrow update error:", escrowError);
          }

          // Create escrow event
          const { data: escrowData } = await supabase
            .from("escrow_payments")
            .select("id")
            .eq("order_id", metadata.order_id)
            .single();

          if (escrowData) {
            await supabase.from("escrow_events").insert({
              escrow_id: escrowData.id,
              event_type: "hold",
              amount: (session.amount_total || 0) / 100,
              currency: session.currency?.toUpperCase() || "USD",
              metadata: {
                stripe_session_id: session.id,
                payment_intent: session.payment_intent,
              },
            });
          }

          // Advance order workflow
          await supabase.rpc("advance_order_workflow", {
            p_order_id: metadata.order_id,
            p_notes: "Payment confirmed via Stripe",
            p_metadata: {
              payment_ref: session.payment_intent,
              payment_amount: (session.amount_total || 0) / 100,
              payment_currency: session.currency?.toUpperCase(),
            },
          });
        }

        // Handle subscription payment
        if (metadata.order_type === "subscription" && metadata.company_id) {
          // Update company subscription
          await supabase
            .from("companies")
            .update({
              subscription_plan: "growth", // Default to growth, adjust based on amount
              subscription_expires_at: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", metadata.company_id);
        }

        // Create notification
        if (metadata.user_id) {
          await supabase.from("notifications").insert({
            user_id: metadata.user_id,
            type: "payment_received",
            title: "Payment Confirmed",
            message: `Your payment of ${session.currency?.toUpperCase()} ${((session.amount_total || 0) / 100).toLocaleString()} has been confirmed.`,
            metadata: {
              order_id: metadata.order_id,
              amount: (session.amount_total || 0) / 100,
              currency: session.currency?.toUpperCase(),
              reference: session.payment_intent,
            },
          });
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment intent succeeded:", paymentIntent.id);
        // Most handling done in checkout.session.completed
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);

        // Update billing history
        await supabase
          .from("billing_history")
          .update({
            status: "failed",
            error_message: paymentIntent.last_payment_error?.message || "Payment failed",
            updated_at: new Date().toISOString(),
          })
          .eq("provider_reference", paymentIntent.id);

        // Notify user
        const metadata = paymentIntent.metadata || {};
        if (metadata.user_id) {
          await supabase.from("notifications").insert({
            user_id: metadata.user_id,
            type: "payment_received",
            title: "Payment Failed",
            message: `Your payment could not be processed. Please try again or use a different payment method.`,
            metadata: {
              error: paymentIntent.last_payment_error?.message,
              reference: paymentIntent.id,
            },
          });
        }

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("Charge refunded:", charge.id);

        const metadata = charge.metadata || {};

        // Update billing history - find by payment intent
        await supabase
          .from("billing_history")
          .update({
            status: "refunded",
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("provider_reference", charge.payment_intent as string);

        // Update escrow if exists
        if (metadata.order_id) {
          const { data: escrowData } = await supabase
            .from("escrow_payments")
            .select("id")
            .eq("order_id", metadata.order_id)
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
              amount: (charge.amount_refunded || 0) / 100,
              currency: charge.currency.toUpperCase(),
              metadata: { charge_id: charge.id },
            });
          }
        }

        // Notify user
        if (metadata.user_id) {
          await supabase.from("notifications").insert({
            user_id: metadata.user_id,
            type: "payment_refunded",
            title: "Payment Refunded",
            message: `Your payment of ${charge.currency.toUpperCase()} ${((charge.amount_refunded || 0) / 100).toLocaleString()} has been refunded.`,
            metadata: {
              order_id: metadata.order_id,
              amount: (charge.amount_refunded || 0) / 100,
              currency: charge.currency.toUpperCase(),
            },
          });
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription event:", event.type, subscription.id);

        const metadata = subscription.metadata || {};
        if (metadata.company_id) {
          const status = subscription.status === "active" ? "active" : "cancelled";
          const plan = subscription.items.data[0]?.price?.lookup_key || "growth";

          await supabase
            .from("subscriptions")
            .upsert({
              company_id: metadata.company_id,
              plan_type: plan,
              status: status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              payment_method: "stripe",
              payment_id: subscription.id,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "company_id",
            });
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription cancelled:", subscription.id);

        const metadata = subscription.metadata || {};
        if (metadata.company_id) {
          await supabase
            .from("subscriptions")
            .update({
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("payment_id", subscription.id);

          // Revert company to free plan
          await supabase
            .from("companies")
            .update({
              subscription_plan: "free",
              updated_at: new Date().toISOString(),
            })
            .eq("id", metadata.company_id);
        }

        break;
      }

      default:
        console.log("Unhandled Stripe event:", event.type);
    }

    // Mark as completed
    await supabase
      .from('processed_events')
      .update({ status: 'completed', processed_at: new Date().toISOString() })
      .eq('event_id', event.id);

    return new Response(
      JSON.stringify({ success: true, received: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Stripe webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
