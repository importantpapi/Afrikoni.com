import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentLinkRequest {
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

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body: PaymentLinkRequest = await req.json();

        const FLUTTERWAVE_SECRET_KEY = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        if (!FLUTTERWAVE_SECRET_KEY) throw new Error("Flutterwave not configured");

        // 1. Validate currency
        const supportedCurrencies = ["NGN", "KES", "GHS", "ZAR", "TZS", "UGX", "RWF", "ZMW", "XOF", "XAF", "USD", "EUR", "GBP"];
        if (!supportedCurrencies.includes(body.currency.toUpperCase())) {
            throw new Error(`Currency ${body.currency} not supported`);
        }

        const txRef = `AFR-WA-${body.orderType.toUpperCase()}-${Date.now()}`;
        const baseUrl = body.redirectUrl || Deno.env.get("FRONTEND_URL") || "https://afrikoni.com";
        const redirectUrl = `${baseUrl}/payment/callback?provider=flutterwave&tx_ref=${txRef}`;

        // 2. Call Flutterwave
        const flwResponse = await fetch("https://api.flutterwave.com/v3/payments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
            },
            body: JSON.stringify({
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
                    title: "Afrikoni WhatsApp Payment",
                    description: `Payment for ${body.orderType}${body.orderId ? ` - Order ${body.orderId}` : ""}`,
                    logo: "https://afrikoni.com/logo.png",
                },
                meta: {
                    source: "whatsapp",
                    order_id: body.orderId || null,
                    order_type: body.orderType,
                    ...body.metadata,
                },
            }),
        });

        const flwData = await flwResponse.json();

        if (flwData.status !== "success" || !flwData.data?.link) {
            throw new Error(flwData.message || "Failed to initialize Flutterwave payment");
        }

        // 3. Record in revenue_transactions
        await supabase.from("revenue_transactions").insert({
            transaction_type: body.orderType === "subscription" ? "subscription" : "order_payment",
            amount: body.amount,
            currency: body.currency.toUpperCase(),
            order_id: body.orderId || null,
            status: "pending",
            description: `WhatsApp initiated payment: ${body.orderType}`,
            metadata: {
                tx_ref: txRef,
                payment_url: flwData.data.link,
                source: "whatsapp"
            }
        });

        return new Response(JSON.stringify({
            paymentLink: flwData.data.link,
            txRef: txRef
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
