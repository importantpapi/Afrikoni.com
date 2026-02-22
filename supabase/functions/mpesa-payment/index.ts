const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type MpesaRequest = {
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc?: string;
  callbackUrl?: string;
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatMsisdn(phoneNumber: string) {
  const cleaned = phoneNumber.replace(/\D/g, "");
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("0")) return `254${cleaned.slice(1)}`;
  return cleaned;
}

async function getAccessToken(consumerKey: string, consumerSecret: string) {
  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  const res = await fetch("https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    method: "GET",
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) throw new Error(`M-Pesa auth failed (${res.status})`);
  const data = await res.json();
  return data.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Method not allowed" });

  let payload: MpesaRequest;
  try {
    payload = await req.json();
  } catch (_) {
    return json(400, { success: false, error: "Invalid JSON body" });
  }

  const { amount, phoneNumber, accountReference, transactionDesc, callbackUrl } = payload;
  if (!amount || !phoneNumber || !accountReference) {
    return json(400, { success: false, error: "Missing required fields: amount, phoneNumber, accountReference" });
  }

  const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
  const shortCode = Deno.env.get("MPESA_SHORTCODE");
  const passkey = Deno.env.get("MPESA_PASSKEY");
  const env = (Deno.env.get("MPESA_ENV") || "sandbox").toLowerCase();
  const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://afrikoni.com";
  const isProduction =
    (Deno.env.get("DENO_ENV") || "").toLowerCase() === "production" ||
    (Deno.env.get("APP_ENV") || "").toLowerCase() === "production";
  const ALLOW_SIMULATION = !isProduction && Deno.env.get("MPESA_ALLOW_SIMULATION") === "true";

  const usesLive = Boolean(consumerKey && consumerSecret && shortCode && passkey);
  if (!usesLive) {
    if (!ALLOW_SIMULATION) {
      return json(503, {
        success: false,
        provider: "MPESA",
        error: "M-Pesa integration is not configured for live payments.",
      });
    }

    return json(200, {
      success: true,
      provider: "SIMULATION",
      checkoutRequestId: `SIM-MPESA-${crypto.randomUUID().slice(0, 12).toUpperCase()}`,
      merchantRequestId: `SIM-MPESA-MERCHANT-${Date.now()}`,
      status: "PENDING_CUSTOMER_AUTHORISATION",
      isSimulation: true,
      message: "M-Pesa credentials are not configured; simulated response returned.",
    });
  }

  try {
    const token = await getAccessToken(consumerKey!, consumerSecret!);
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const password = btoa(`${shortCode}${passkey}${timestamp}`);
    const formattedPhone = formatMsisdn(phoneNumber);
    const stkUrl = env === "production"
      ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
      : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

    const res = await fetch(stkUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl || `${frontendUrl}/api/mpesa/callback`,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc || "Afrikoni Trade Payment",
      }),
    });

    const data = await res.json();
    if (!res.ok || data?.ResponseCode !== "0") {
      return json(502, {
        success: false,
        error: data?.errorMessage || data?.ResponseDescription || "M-Pesa STK push failed",
        provider: "MPESA",
      });
    }

    return json(200, {
      success: true,
      provider: "MPESA",
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
      status: "PENDING_CUSTOMER_AUTHORISATION",
      isSimulation: false,
      message: data.CustomerMessage || data.ResponseDescription,
    });
  } catch (error) {
    return json(500, {
      success: false,
      error: `M-Pesa integration failed: ${(error as Error).message}`,
      provider: "MPESA",
    });
  }
});
