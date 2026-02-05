// Supabase Edge Function to process payments via Stripe
// Handles international payments (USD, EUR, GBP)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface PaymentRequest {
  amount: number;
  currency: string;
  orderId?: string;
  orderType: "order" | "sample" | "subscription" | "verification";
  customerEmail: string;
  customerName: string;
  metadata?: Record<string, unknown>;
  successUrl?: string;
  cancelUrl?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get environment variables
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "Stripe not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "Supabase not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Initialize Stripe
  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  // Create Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get authorization header to identify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's profile and company
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, companies(*)")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(
        JSON.stringify({ success: false, error: "User must be associated with a company" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: PaymentRequest = await req.json();

    // Validate required fields
    if (!body.amount || !body.currency || !body.customerEmail || !body.orderType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: amount, currency, customerEmail, orderType",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate currency is supported by Stripe
    const supportedCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD", "CHF", "JPY"];
    const currency = body.currency.toUpperCase();

    if (!supportedCurrencies.includes(currency)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Currency ${body.currency} not supported via Stripe. Use Flutterwave for African currencies.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique transaction reference
    const txRef = `AFR-STRIPE-${body.orderType.toUpperCase()}-${Date.now()}`;

    // Determine redirect URLs
    const baseUrl = Deno.env.get("FRONTEND_URL") || "https://afrikoni.com";
    const successUrl = body.successUrl || `${baseUrl}/payment/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancelUrl || `${baseUrl}/payment/cancelled?provider=stripe`;

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(body.amount * 100);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: body.customerEmail,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Afrikoni ${body.orderType.charAt(0).toUpperCase() + body.orderType.slice(1)} Payment`,
              description: body.orderId
                ? `Payment for Order ${body.orderId}`
                : `${body.orderType} payment`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        company_id: profile.company_id,
        order_id: body.orderId || "",
        order_type: body.orderType,
        tx_ref: txRef,
        ...body.metadata,
      },
    });

    // Create billing history record
    const { error: billingError } = await supabase.from("billing_history").insert({
      user_id: user.id,
      company_id: profile.company_id,
      amount: body.amount,
      currency: currency,
      payment_method: "stripe",
      payment_provider: "stripe",
      provider_reference: session.id,
      transaction_type: body.orderType === "sample" ? "sample_payment" :
                        body.orderType === "subscription" ? "subscription" :
                        body.orderType === "verification" ? "verification_fee" : "order_payment",
      related_order_id: body.orderId || null,
      status: "pending",
      description: `Stripe payment initiated for ${body.orderType}`,
      metadata: {
        stripe_session_id: session.id,
        stripe_tx_ref: txRef,
        customer_email: body.customerEmail,
        ...body.metadata,
      },
    });

    if (billingError) {
      console.error("Billing record error:", billingError);
    }

    // If order payment, create escrow record
    if (body.orderId && body.orderType === "order") {
      const { data: order } = await supabase
        .from("orders")
        .select("buyer_company_id, seller_company_id")
        .eq("id", body.orderId)
        .single();

      if (order) {
        await supabase.from("escrow_payments").insert({
          order_id: body.orderId,
          buyer_company_id: order.buyer_company_id,
          seller_company_id: order.seller_company_id,
          amount: body.amount,
          currency: currency,
          status: "pending",
          commission_rate: 8.00,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: session.url,
        sessionId: session.id,
        transactionRef: txRef,
        message: "Payment session created successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Stripe payment error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
