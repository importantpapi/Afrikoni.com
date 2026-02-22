import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type PapssRequest = {
  tradeId: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  corridor?: string;
  metadata?: Record<string, unknown>;
};

type PapssResponse = {
  success: boolean;
  settlementId?: string;
  clearedAt?: string;
  rate?: number;
  netAmount?: number;
  provider?: "PAPSS" | "SIMULATION";
  isSimulation?: boolean;
  error?: string;
};

const AFRICAN_CURRENCIES = new Set([
  "NGN", "GHS", "KES", "ZAR", "EGP", "XOF", "XAF", "TZS", "UGX", "RWF", "ETB", "MAD", "TND", "ZMW"
]);

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSimulationSettlementId(tradeId: string) {
  const suffix = crypto.randomUUID().split("-")[0].toUpperCase();
  return `SIM-PAPSS-${tradeId.slice(0, 8).toUpperCase()}-${suffix}`;
}

async function getFxRate(
  supabase: ReturnType<typeof createClient>,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return 1;

  try {
    const { data, error } = await supabase.functions.invoke("sync-fx-rates", {
      body: { base: fromCurrency, target: toCurrency },
    });
    if (!error && typeof data?.rate === "number" && data.rate > 0) {
      return data.rate;
    }
  } catch (_) {
    // Use deterministic fallback below.
  }

  const fallback: Record<string, number> = {
    NGN_GHS: 0.0097,
    GHS_NGN: 103,
    NGN_KES: 0.085,
    KES_NGN: 11.7,
    USD_NGN: 1550,
  };
  return fallback[`${fromCurrency}_${toCurrency}`] || 1;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Method not allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const PAPSS_API_URL = Deno.env.get("PAPSS_API_URL");
  const PAPSS_CLIENT_ID = Deno.env.get("PAPSS_CLIENT_ID");
  const PAPSS_CLIENT_SECRET = Deno.env.get("PAPSS_CLIENT_SECRET");
  const isProduction =
    (Deno.env.get("DENO_ENV") || "").toLowerCase() === "production" ||
    (Deno.env.get("APP_ENV") || "").toLowerCase() === "production";
  const ALLOW_SIMULATION = !isProduction && Deno.env.get("PAPSS_ALLOW_SIMULATION") === "true";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { success: false, error: "Supabase not configured" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json(401, { success: false, error: "Authorization required" });

  const token = authHeader.replace("Bearer ", "");
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return json(401, { success: false, error: "Invalid authorization" });

  let payload: PapssRequest;
  try {
    payload = await req.json();
  } catch (_) {
    return json(400, { success: false, error: "Invalid JSON body" });
  }

  const { tradeId, amount, fromCurrency, toCurrency, metadata = {} } = payload;
  if (!tradeId || !amount || !fromCurrency || !toCurrency) {
    return json(400, { success: false, error: "Missing required fields: tradeId, amount, fromCurrency, toCurrency" });
  }

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (!AFRICAN_CURRENCIES.has(from) || !AFRICAN_CURRENCIES.has(to)) {
    return json(400, { success: false, error: "PAPSS only supports intra-African currency corridors" });
  }

  const fxRate = await getFxRate(supabase, from, to);
  const feeRate = 0.005; // 0.5%
  const netAmount = Number((amount * (1 - feeRate)).toFixed(2));

  // Live PAPSS path only when credentials are configured.
  if (PAPSS_API_URL && PAPSS_CLIENT_ID && PAPSS_CLIENT_SECRET) {
    try {
      const liveRes = await fetch(`${PAPSS_API_URL.replace(/\/$/, "")}/v1/settlements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Id": PAPSS_CLIENT_ID,
          "X-Client-Secret": PAPSS_CLIENT_SECRET,
        },
        body: JSON.stringify({
          trade_id: tradeId,
          amount,
          from_currency: from,
          to_currency: to,
          fx_rate: fxRate,
          metadata: {
            ...metadata,
            source: "afrikoni_trade_os",
            initiated_by: authData.user.id,
          },
        }),
      });

      const liveData = await liveRes.json().catch(() => ({}));
      if (!liveRes.ok) {
        return json(502, {
          success: false,
          error: liveData?.message || `PAPSS gateway error (${liveRes.status})`,
        });
      }

      const response: PapssResponse = {
        success: true,
        settlementId: liveData.settlement_id || liveData.id || buildSimulationSettlementId(tradeId),
        clearedAt: liveData.cleared_at || new Date().toISOString(),
        rate: fxRate,
        netAmount,
        provider: "PAPSS",
        isSimulation: false,
      };
      return json(200, response);
    } catch (error) {
      return json(502, {
        success: false,
        error: `PAPSS live settlement failed: ${(error as Error).message}`,
      });
    }
  }

  if (!ALLOW_SIMULATION) {
    return json(503, {
      success: false,
      error: "PAPSS integration is not configured for live settlement.",
    });
  }

  // Deterministic simulation fallback for explicitly enabled non-live environments.
  const simulated: PapssResponse = {
    success: true,
    settlementId: buildSimulationSettlementId(tradeId),
    clearedAt: new Date().toISOString(),
    rate: fxRate,
    netAmount,
    provider: "SIMULATION",
    isSimulation: true,
  };
  return json(200, simulated);
});
