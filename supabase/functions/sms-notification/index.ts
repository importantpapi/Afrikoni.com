const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type SmsPayload = {
  to: string;
  message: string;
  senderId?: string;
  eventType?: string;
  metadata?: Record<string, unknown>;
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(to: string) {
  const cleaned = to.replace(/[^\d+]/g, "");
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Method not allowed" });

  let payload: SmsPayload;
  try {
    payload = await req.json();
  } catch (_) {
    return json(400, { success: false, error: "Invalid JSON body" });
  }

  const { to, message, senderId = "AFRIKONI", eventType = "generic", metadata = {} } = payload;
  if (!to || !message) {
    return json(400, { success: false, error: "Missing required fields: to, message" });
  }

  const apiKey = Deno.env.get("AFRICASTALKING_API_KEY");
  const username = Deno.env.get("AFRICASTALKING_USERNAME") || "sandbox";
  const isProduction =
    (Deno.env.get("DENO_ENV") || "").toLowerCase() === "production" ||
    (Deno.env.get("APP_ENV") || "").toLowerCase() === "production";
  const ALLOW_SIMULATION = !isProduction && Deno.env.get("SMS_ALLOW_SIMULATION") === "true";
  const shouldUseLive = Boolean(apiKey && username);

  if (!shouldUseLive) {
    if (!ALLOW_SIMULATION) {
      return json(503, {
        success: false,
        provider: "AFRICASTALKING",
        error: "SMS provider is not configured for live messaging.",
      });
    }

    return json(200, {
      success: true,
      provider: "SIMULATION",
      status: "queued",
      recipient: normalizePhone(to),
      eventType,
      isSimulation: true,
      message: "SMS provider is not configured; simulated queue response returned.",
      metadata,
    });
  }

  try {
    const body = new URLSearchParams({
      username,
      to: normalizePhone(to),
      message,
      from: senderId,
    });

    const res = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return json(502, {
        success: false,
        provider: "AFRICASTALKING",
        error: data?.errorMessage || `SMS gateway error (${res.status})`,
      });
    }

    return json(200, {
      success: true,
      provider: "AFRICASTALKING",
      status: "queued",
      recipient: normalizePhone(to),
      eventType,
      response: data,
      isSimulation: false,
    });
  } catch (error) {
    return json(500, {
      success: false,
      provider: "AFRICASTALKING",
      error: `SMS send failed: ${(error as Error).message}`,
    });
  }
});
