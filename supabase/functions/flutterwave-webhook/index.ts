/**
 * FLUTTERWAVE WEBHOOK — Afrikoni Trade OS
 * =========================================
 * Server-side payment confirmation handler.
 * This is the ONLY source of truth for payment status.
 * Client-side callbacks are a UX convenience only — this webhook
 * is what actually updates the database, even if the browser closes.
 *
 * Handles:
 *  - charge.completed  → Fund escrow, advance trade state
 *  - transfer.completed → Mark payout complete
 *  - refund.completed  → Mark refund complete
 *  - subscription.cancelled → Downgrade plan
 *
 * Supports both:
 *  - Trade OS flow (trade_id → trades table)
 *  - Legacy order flow (order_id → orders table)
 */

// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface FlutterwaveWebhookPayload {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    reference?: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    meta?: {
      user_id?: string;
      company_id?: string;
      trade_id?: string; // Trade OS
      order_id?: string; // Legacy
      order_type?: string;
      subscription_plan?: string;
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

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  // @ts-ignore
  const FLUTTERWAVE_SECRET_HASH = Deno.env.get("FLUTTERWAVE_SECRET_HASH");
  // @ts-ignore
  const FLUTTERWAVE_SECRET_KEY = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
  // @ts-ignore
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  // @ts-ignore
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[webhook] Missing Supabase configuration");
    return new Response(
      JSON.stringify({ success: false, error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // ✅ SECURITY: Verify Flutterwave signature (verif-hash header)
  const signature = req.headers.get("verif-hash");
  if (FLUTTERWAVE_SECRET_HASH && signature !== FLUTTERWAVE_SECRET_HASH) {
    console.error("[webhook] Invalid signature — possible spoofed request");
    return new Response(
      JSON.stringify({ success: false, error: "Invalid signature" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let payload: FlutterwaveWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { event, data } = payload;
  console.log(`[webhook] Event: ${event} | tx_ref: ${data?.tx_ref}`);

  try {
    switch (event) {
      // ─────────────────────────────────────────────────────────────
      case "charge.completed": {
        if (!FLUTTERWAVE_SECRET_KEY) {
          console.error("[webhook] No secret key — cannot verify transaction");
          break;
        }

        // Idempotency guard: skip duplicate verified charge events for same tx_ref.
        const { data: existingVerified } = await supabase
          .from("payment_webhook_log")
          .select("id")
          .eq("tx_ref", data.tx_ref)
          .eq("event", event)
          .eq("status", "verified")
          .limit(1)
          .maybeSingle();

        if (existingVerified) {
          console.log(
            `[webhook] Duplicate event ignored: ${event} | tx_ref: ${data.tx_ref}`,
          );
          return new Response(
            JSON.stringify({
              success: true,
              message: "Duplicate webhook ignored",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        // ✅ SECURITY: Always re-verify with Flutterwave API (never trust payload alone)
        const verifyRes = await fetch(
          `https://api.flutterwave.com/v3/transactions/${data.id}/verify`,
          { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` } },
        );
        const verifyJson = await verifyRes.json();

        if (
          verifyJson.status !== "success" ||
          verifyJson.data?.status !== "successful"
        ) {
          console.error(
            "[webhook] Transaction verification FAILED:",
            verifyJson.message,
          );

          // Log failed attempt
          await supabase.from("payment_webhook_log").insert({
            tx_ref: data.tx_ref,
            event,
            status: "verification_failed",
            payload: data,
            created_at: new Date().toISOString(),
          }).then(() => {}); // fire-and-forget

          return new Response(
            JSON.stringify({
              success: false,
              error: "Transaction verification failed",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const verified = verifyJson.data;
        const meta = verified.meta || data.meta || {};

        // Keep billing history aligned with webhook source-of-truth.
        await supabase
          .from("billing_history")
          .update({
            status: "completed",
            provider_reference: verified.tx_ref || data.tx_ref,
          })
          .eq("provider_reference", verified.tx_ref || data.tx_ref)
          .in("status", ["pending", "processing", "initiated"])
          .then(() => {});

        // ── Log the verified webhook ──────────────────────────────
        await supabase.from("payment_webhook_log").insert({
          tx_ref: data.tx_ref,
          flw_ref: data.flw_ref,
          event,
          status: "verified",
          amount: verified.amount,
          currency: verified.currency,
          payload: verified,
          created_at: new Date().toISOString(),
        }).then(() => {});

        await supabase.from("trust_receipts").insert({
          company_id: meta.company_id || null,
          trade_id: meta.trade_id || null,
          milestone_type: "payment_confirmed",
          reference_type: "payment",
          reference_id: String(verified.tx_ref || data.tx_ref || verified.flw_ref),
          receipt_code: `TR-PAY-${String(verified.tx_ref || data.tx_ref || verified.flw_ref).replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)}-${Date.now().toString(36).toUpperCase()}`,
          metadata: {
            provider: "flutterwave",
            tx_ref: verified.tx_ref || data.tx_ref,
            flw_ref: verified.flw_ref,
            amount: verified.amount,
            currency: verified.currency,
            order_type: meta.order_type || null,
          },
        }).then(() => {});

        // ── TRADE OS FLOW: trade_id present ───────────────────────
        if (meta.trade_id) {
          console.log(
            `[webhook] Trade OS payment confirmed for trade: ${meta.trade_id}`,
          );

          // Update trade status to escrow_funded (canonical lowercase)
          // ── BANK ESCROW: Store the Flutterwave transaction reference.
          // The bank holds the seller's portion (96%) in the escrow sub-account.
          // When the trade reaches ACCEPTED, the trade-transition function calls
          // the bank release API using `bank_escrow_reference` to pay out the seller.
          // Afrikoni's platform fee (4%) is split to our account at
          // collection time via Flutterwave subaccounts — we are always cash positive.
          const bankEscrowReference = verified.flw_ref; // Flutterwave transaction ref = release key
          const sellerAmount = verified.amount - (verified.app_fee || 0) -
            (verified.merchant_fee || 0);

          const { error: tradeErr } = await supabase
            .from("trades")
            .update({
              status: "escrow_funded",
              escrow_funded_at: new Date().toISOString(),
              payment_reference: verified.flw_ref,
              payment_data: {
                flw_ref: verified.flw_ref,
                tx_ref: verified.tx_ref,
                amount: verified.amount,
                currency: verified.currency,
                payment_type: verified.payment_type,
                confirmed_at: new Date().toISOString(),
                // Bank escrow fields — used for release on ACCEPTED
                bank_escrow_reference: bankEscrowReference,
                bank_escrow_subaccount_id: Deno.env.get(
                  "FLW_BANK_ESCROW_SUBACCOUNT_ID",
                ),
                seller_release_amount: sellerAmount,
                escrow_type: meta.escrow_type || "bank_held",
              },
            })
            .eq("id", meta.trade_id)
            .in("status", ["escrow_required", "ESCROW_REQUIRED"]); // Backward-compatible guard

          if (tradeErr) {
            console.error("[webhook] Trade update error:", tradeErr.message);
          } else {
            console.log(`[webhook] Trade ${meta.trade_id} → escrow_funded`);
          }

          // Log trade event
          await supabase.from("trade_events").insert({
            trade_id: meta.trade_id,
            event_type: "payment_confirmed",
            actor_user_id: meta.user_id || null,
            payload: {
              amount: verified.amount,
              currency: verified.currency,
              flw_ref: verified.flw_ref,
              payment_type: verified.payment_type,
            },
            created_at: new Date().toISOString(),
          }).then(() => {});

          // Notify buyer
          if (meta.user_id) {
            await supabase.from("notifications").insert({
              user_id: meta.user_id,
              type: "payment_confirmed",
              title: "Escrow Funded ✅",
              message:
                `Your payment of ${verified.currency} ${verified.amount.toLocaleString()} is secured in escrow. The supplier has been notified.`,
              metadata: {
                trade_id: meta.trade_id,
                amount: verified.amount,
                currency: verified.currency,
              },
              created_at: new Date().toISOString(),
            }).then(() => {});
          }
        }

        // ── SUBSCRIPTION FLOW: subscription_plan present ──────────
        if (meta.subscription_plan && meta.company_id) {
          console.log(
            `[webhook] Subscription payment confirmed: ${meta.subscription_plan} for company ${meta.company_id}`,
          );

          const plan = meta.subscription_plan as string;
          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          // Cancel existing active subscription
          await supabase
            .from("subscriptions")
            .update({ status: "cancelled", updated_at: now.toISOString() })
            .eq("company_id", meta.company_id)
            .eq("status", "active");

          // Create new subscription
          const { error: subErr } = await supabase.from("subscriptions").insert(
            {
              company_id: meta.company_id,
              plan_type: plan,
              monthly_price: verified.amount,
              status: "active",
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              payment_method: "flutterwave",
              payment_id: verified.flw_ref,
            },
          );

          if (subErr) {
            console.error(
              "[webhook] Subscription insert error:",
              subErr.message,
            );
          } else {
            console.log(`[webhook] Subscription activated: ${plan}`);
          }

          // Log revenue transaction
          await supabase.from("revenue_transactions").insert({
            transaction_type: "subscription",
            amount: verified.amount,
            currency: verified.currency,
            company_id: meta.company_id,
            description: `${plan} subscription - Monthly (Flutterwave)`,
            status: "completed",
            processed_at: now.toISOString(),
          }).then(() => {});

          // Notify user
          if (meta.user_id) {
            await supabase.from("notifications").insert({
              user_id: meta.user_id,
              type: "subscription_activated",
              title: `${
                plan.charAt(0).toUpperCase() + plan.slice(1)
              } Plan Activated 🎉`,
              message:
                `Your ${plan} subscription is now active. Enjoy enhanced visibility and features.`,
              metadata: { plan, amount: verified.amount },
              created_at: new Date().toISOString(),
            }).then(() => {});
          }
        }

        // ── VERIFICATION PURCHASE FLOW ─────────────────────────────
        if (meta.order_type === "verification" && meta.company_id) {
          const purchaseId = meta.verification_purchase_id || null;

          let purchaseQuery = supabase
            .from("verification_purchases")
            .update({
              status: "completed",
              lifecycle_state: "payment_confirmed",
              payment_method: "flutterwave",
              payment_id: verified.tx_ref || data.tx_ref,
              processed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              metadata: {
                tx_ref: verified.tx_ref || data.tx_ref,
                flw_ref: verified.flw_ref,
                amount: verified.amount,
                currency: verified.currency,
                payment_type: verified.payment_type,
              },
            });

          if (purchaseId) {
            purchaseQuery = purchaseQuery.eq("id", purchaseId);
          } else {
            purchaseQuery = purchaseQuery
              .eq("company_id", meta.company_id)
              .eq("purchase_type", "fast_track")
              .in("status", ["pending", "initiated"])
              .order("created_at", { ascending: false })
              .limit(1);
          }

          await purchaseQuery.then(() => {});

          await supabase
            .from("companies")
            .update({
              verification_status: "pending",
              verified: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", meta.company_id)
            .then(() => {});

          const { data: existingVerification } = await supabase
            .from("verifications")
            .select("id")
            .eq("company_id", meta.company_id)
            .limit(1)
            .maybeSingle();

          if (existingVerification?.id) {
            await supabase
              .from("verifications")
              .update({
                status: "pending",
                updated_at: new Date().toISOString(),
                metadata: {
                  payment_tx_ref: verified.tx_ref || data.tx_ref,
                  payment_amount: verified.amount,
                  payment_currency: verified.currency,
                },
              })
              .eq("id", existingVerification.id)
              .then(() => {});
          } else {
            await supabase
              .from("verifications")
              .insert({
                company_id: meta.company_id,
                status: "pending",
                verification_type: "business",
                metadata: {
                  payment_tx_ref: verified.tx_ref || data.tx_ref,
                  payment_amount: verified.amount,
                  payment_currency: verified.currency,
                },
              })
              .then(() => {});
          }

          await supabase.from("revenue_transactions").insert({
            transaction_type: "verification_fee",
            amount: verified.amount,
            currency: verified.currency,
            company_id: meta.company_id,
            description: "Fast-track verification fee (Flutterwave)",
            status: "completed",
            processed_at: new Date().toISOString(),
            metadata: {
              tx_ref: verified.tx_ref || data.tx_ref,
              flw_ref: verified.flw_ref,
            },
          }).then(() => {});

          await supabase.from("trust_receipts").insert({
            company_id: meta.company_id,
            milestone_type: "payment_confirmed",
            reference_type: "verification_purchase",
            reference_id: String(purchaseId || verified.tx_ref || data.tx_ref),
            receipt_code: `TR-PAY-${String(verified.tx_ref || data.tx_ref).replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)}-${Date.now().toString(36).toUpperCase()}`,
            metadata: {
              provider: "flutterwave",
              tx_ref: verified.tx_ref || data.tx_ref,
              flw_ref: verified.flw_ref,
              amount: verified.amount,
              currency: verified.currency,
              order_type: "verification",
            },
          }).then(() => {});
        }

        // ── LEGACY ORDER FLOW: order_id present ───────────────────
        if (meta.order_id && !meta.trade_id) {
          console.log(
            `[webhook] Legacy order payment confirmed: ${meta.order_id}`,
          );

          await supabase
            .from("escrow_payments")
            .update({ status: "held", updated_at: new Date().toISOString() })
            .eq("order_id", meta.order_id)
            .eq("status", "pending");

          await supabase.rpc("advance_order_workflow", {
            p_order_id: meta.order_id,
            p_notes: "Payment confirmed via Flutterwave webhook",
            p_metadata: {
              payment_ref: verified.flw_ref,
              payment_amount: verified.amount,
              payment_currency: verified.currency,
            },
          }).then(() => {});
        }

        break;
      }

      // ─────────────────────────────────────────────────────────────
      case "transfer.completed": {
        const transferRef = data.tx_ref || data.reference || data.flw_ref;
        const meta = data.meta || {};
        console.log(`[webhook] Transfer completed: ${transferRef}`);

        // Idempotency guard for transfer completion.
        const { data: existingTransferEvent } = await supabase
          .from("payment_webhook_log")
          .select("id")
          .eq("tx_ref", transferRef)
          .eq("event", event)
          .eq("status", "transfer_completed")
          .limit(1)
          .maybeSingle();

        if (existingTransferEvent) {
          return new Response(
            JSON.stringify({
              success: true,
              message: "Duplicate transfer webhook ignored",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        await supabase
          .from("payment_webhook_log")
          .insert({
            tx_ref: transferRef,
            event,
            status: "transfer_completed",
            payload: data,
            created_at: new Date().toISOString(),
          }).then(() => {});

        if (meta.trade_id) {
          // Mark final payout completion in trade state.
          await supabase
            .from("trades")
            .update({
              status: "settled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", meta.trade_id)
            .in("status", ["accepted", "ACCEPTED"]);

          await supabase
            .from("trade_events")
            .insert({
              trade_id: meta.trade_id,
              event_type: "payment_released",
              metadata: {
                transfer_ref: transferRef,
                amount: data.amount,
                currency: data.currency,
                flw_ref: data.flw_ref,
              },
              created_at: new Date().toISOString(),
            }).then(() => {});
        }

        break;
      }

      // ─────────────────────────────────────────────────────────────
      case "refund.completed": {
        console.log(`[webhook] Refund completed: ${data.tx_ref}`);
        const meta = data.meta || {};

        await supabase
          .from("payment_webhook_log")
          .insert({
            tx_ref: data.tx_ref,
            event,
            status: "refunded",
            payload: data,
            created_at: new Date().toISOString(),
          }).then(() => {});

        // Update trade if applicable
        if (meta.trade_id) {
          await supabase
            .from("trade_events")
            .insert({
              trade_id: meta.trade_id,
              event_type: "payment_refunded",
              metadata: {
                amount: data.amount,
                currency: data.currency,
                flw_ref: data.flw_ref,
              },
              created_at: new Date().toISOString(),
            }).then(() => {});
        }

        // Notify user
        if (meta.user_id) {
          await supabase.from("notifications").insert({
            user_id: meta.user_id,
            type: "payment_refunded",
            title: "Refund Processed",
            message:
              `Your refund of ${data.currency} ${data.amount.toLocaleString()} has been processed.`,
            metadata: { amount: data.amount, currency: data.currency },
            created_at: new Date().toISOString(),
          }).then(() => {});
        }

        break;
      }

      default:
        console.log(`[webhook] Unhandled event: ${event}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[webhook] Processing error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
