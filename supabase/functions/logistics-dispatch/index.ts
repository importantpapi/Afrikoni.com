// Logistics Dispatch Engine - Kernel Subsystem
// Triggered when trade reaches PICKUP_SCHEDULED state

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface DispatchRequest {
  trade_id: string;
  pickup_city: string;
  pickup_country: string;
  cargo_type: string;
  weight_kg?: number;
  volume_m3?: number;
  pickup_window_start?: string;
  pickup_window_end?: string;
  special_requirements?: string[];
}

interface LogisticsProvider {
  id: string;
  provider_name: string;
  phone: string;
  whatsapp: string | null;
  city: string;
  vehicle_types: string[];
  response_score: number;
  is_available: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "Supabase not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const dispatchRequest: DispatchRequest = await req.json();

    const {
      trade_id,
      pickup_city,
      pickup_country = "Nigeria",
      cargo_type,
      weight_kg,
      volume_m3,
      pickup_window_start,
      pickup_window_end,
    } = dispatchRequest;

    // Validate required fields
    if (!trade_id || !pickup_city || !cargo_type) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: trade_id, pickup_city, cargo_type",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log dispatch request
    await supabase.from("dispatch_events").insert({
      trade_id,
      event_type: "DISPATCH_REQUESTED",
      payload: {
        pickup_city,
        pickup_country,
        cargo_type,
        weight_kg,
        volume_m3,
      },
    });

    // ========================================================================
    // STEP 1: MATCH LOGISTICS PROVIDERS (DETERMINISTIC ALGORITHM)
    // ========================================================================

    // Determine required vehicle type based on cargo
    const requiredVehicleTypes = determineVehicleType(cargo_type, weight_kg, volume_m3);

    // Query available providers
    const { data: providers, error: providerError } = await supabase
      .from("logistics_providers")
      .select("*")
      .eq("city", pickup_city)
      .eq("is_available", true)
      .eq("is_verified", true)
      .order("response_score", { ascending: false })
      .order("last_active_at", { ascending: false })
      .limit(5);

    if (providerError) {
      console.error("[DispatchEngine] Provider query error:", providerError);
      await logDispatchEvent(supabase, trade_id, "DISPATCH_FAILED", {
        error: providerError.message,
      });
      return new Response(
        JSON.stringify({ success: false, error: "Failed to query providers" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter providers by vehicle capability
    const matchedProviders = providers?.filter((p: LogisticsProvider) => {
      const hasRequiredVehicle = requiredVehicleTypes.some((vt: string) =>
        p.vehicle_types.includes(vt)
      );
      return hasRequiredVehicle;
    }) || [];

    if (matchedProviders.length === 0) {
      await logDispatchEvent(supabase, trade_id, "DISPATCH_FAILED", {
        reason: "No providers available",
        pickup_city,
        required_vehicle_types: requiredVehicleTypes,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: "No logistics providers available in this city",
          pickup_city,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // STEP 2: SEND NOTIFICATIONS TO MATCHED PROVIDERS
    // ========================================================================

    const notificationPromises = matchedProviders.map(async (provider: LogisticsProvider) => {
      const message = buildNotificationMessage({
        provider_name: provider.provider_name,
        pickup_city,
        cargo_type,
        pickup_window_start,
        pickup_window_end,
        trade_id,
      });

      // Queue notification (prefer WhatsApp, fallback to SMS)
      const recipient = provider.whatsapp || provider.phone;
      const notificationType = provider.whatsapp ? "whatsapp" : "sms";

      await supabase.from("dispatch_notifications").insert({
        trade_id,
        provider_id: provider.id,
        notification_type: notificationType,
        recipient,
        message_body: message,
        status: "pending",
      });

      // Log notification sent
      await logDispatchEvent(supabase, trade_id, "PROVIDER_NOTIFIED", {
        provider_id: provider.id,
        provider_name: provider.provider_name,
        notification_type: notificationType,
      });

      return {
        provider_id: provider.id,
        provider_name: provider.provider_name,
        notified: true,
      };
    });

    const notificationResults = await Promise.all(notificationPromises);

    // ========================================================================
    // STEP 3: RETURN DISPATCH SUMMARY
    // ========================================================================

    return new Response(
      JSON.stringify({
        success: true,
        trade_id,
        providers_notified: notificationResults.length,
        providers: notificationResults,
        message: `Dispatched to ${notificationResults.length} logistics providers in ${pickup_city}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[DispatchEngine] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determineVehicleType(
  cargo_type: string,
  weight_kg?: number,
  volume_m3?: number
): string[] {
  // Simple deterministic logic - can be enhanced
  const cargoLower = cargo_type.toLowerCase();

  if (weight_kg && weight_kg > 5000) {
    return ["truck", "container"];
  }

  if (volume_m3 && volume_m3 > 10) {
    return ["truck", "container"];
  }

  if (cargoLower.includes("container") || cargoLower.includes("bulk")) {
    return ["container"];
  }

  if (cargoLower.includes("heavy") || cargoLower.includes("machinery")) {
    return ["truck"];
  }

  // Default: small to medium cargo
  return ["van", "truck"];
}

function buildNotificationMessage(params: {
  provider_name: string;
  pickup_city: string;
  cargo_type: string;
  pickup_window_start?: string;
  pickup_window_end?: string;
  trade_id: string;
}): string {
  const { provider_name, pickup_city, cargo_type, pickup_window_start, trade_id } = params;

  const timeWindow = pickup_window_start
    ? `⏱️ Window: ${new Date(pickup_window_start).toLocaleString()}`
    : "⏱️ ASAP";

  return `🚚 Afrikoni Pickup Request

Hello ${provider_name},

📍 Location: ${pickup_city}
📦 Cargo: ${cargo_type}
${timeWindow}

🔗 Trade ID: ${trade_id.slice(0, 8)}

Reply YES to accept this job.
First responder gets the assignment.

- Afrikoni Logistics`;
}

async function logDispatchEvent(
  supabase: any,
  trade_id: string,
  event_type: string,
  payload: Record<string, unknown>
) {
  try {
    await supabase.from("dispatch_events").insert({
      trade_id,
      event_type,
      payload,
    });
  } catch (e) {
    console.error("[DispatchEngine] Failed to log event:", e);
  }
}
