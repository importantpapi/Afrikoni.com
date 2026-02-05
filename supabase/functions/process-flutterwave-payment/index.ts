// Supabase Edge Function to process payments via Flutterwave
// Handles African currencies (NGN, KES, GHS, ZAR, etc.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  customerPhone?: string;
  metadata?: Record<string, unknown>;
  redirectUrl?: string;
}

interface FlutterwaveResponse {
  status: string;
  message: string;
  data?: {
    link: string;
    tx_ref: string;
    id?: number;
  };
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
  const FLUTTERWAVE_SECRET_KEY = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!FLUTTERWAVE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "Flutterwave not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "Supabase not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

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

    // Validate currency is supported by Flutterwave
    const supportedCurrencies = [
      "NGN", "KES", "GHS", "ZAR", "TZS", "UGX", "RWF",
      "ZMW", "XOF", "XAF", "USD", "EUR", "GBP"
    ];

    if (!supportedCurrencies.includes(body.currency.toUpperCase())) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Currency ${body.currency} not supported. Supported: ${supportedCurrencies.join(", ")}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique transaction reference
    const txRef = `AFR-${body.orderType.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Determine redirect URL
    const baseUrl = body.redirectUrl || Deno.env.get("FRONTEND_URL") || "https://afrikoni.com";
    const redirectUrl = `${baseUrl}/payment/callback?provider=flutterwave&tx_ref=${txRef}`;

    // Prepare Flutterwave payment request
    const flutterwavePayload = {
      tx_ref: txRef,
      amount: body.amount,
      currency: body.currency.toUpperCase(),
      redirect_url: redirectUrl,
      payment_options: "card,banktransfer,ussd,mobilemoney,mpesa",
      customer: {
        email: body.customerEmail,
        name: body.customerName,
        phonenumber: body.customerPhone || "",
      },
      customizations: {
        title: "Afrikoni Payment",
        description: `Payment for ${body.orderType}${body.orderId ? ` - Order ${body.orderId}` : ""}`,
        logo: "https://afrikoni.com/logo.png",
      },
      meta: {
        user_id: user.id,
        company_id: profile.company_id,
        order_id: body.orderId || null,
        order_type: body.orderType,
        ...body.metadata,
      },
    };

    // Call Flutterwave API
    const flwResponse = await fetch(
      "https://api.flutterwave.com/v3/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        },
        body: JSON.stringify(flutterwavePayload),
      }
    );

    const flwData: FlutterwaveResponse = await flwResponse.json();

    if (flwData.status !== "success" || !flwData.data?.link) {
      console.error("Flutterwave error:", flwData);
      return new Response(
        JSON.stringify({
          success: false,
          error: flwData.message || "Failed to initialize payment",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create billing history record
    const { error: billingError } = await supabase.from("billing_history").insert({
      user_id: user.id,
      company_id: profile.company_id,
      amount: body.amount,
      currency: body.currency.toUpperCase(),
      payment_method: "flutterwave",
      payment_provider: "flutterwave",
      provider_reference: txRef,
      transaction_type: body.orderType === "sample" ? "sample_payment" :
                        body.orderType === "subscription" ? "subscription" :
                        body.orderType === "verification" ? "verification_fee" : "order_payment",
      related_order_id: body.orderId || null,
      status: "pending",
      description: `Flutterwave payment initiated for ${body.orderType}`,
      metadata: {
        flutterwave_tx_ref: txRef,
        flutterwave_id: flwData.data.id,
        customer_email: body.customerEmail,
        ...body.metadata,
      },
    });

    if (billingError) {
      console.error("Billing record error:", billingError);
      // Don't fail the payment, just log
    }

    // If order payment, create escrow record
    if (body.orderId && body.orderType === "order") {
      // Get order details
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
          currency: body.currency.toUpperCase(),
          status: "pending",
          commission_rate: 8.00, // 8% platform commission
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: flwData.data.link,
        transactionRef: txRef,
        message: "Payment initialized successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Payment processing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
