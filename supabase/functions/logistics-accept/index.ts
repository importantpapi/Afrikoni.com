// @ts-nocheck
// Logistics Dispatch Acceptance Handler
// Handles provider acceptance with atomic assignment (first-responder wins)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface AcceptanceRequest {
  trade_id: string;
  provider_id: string;
  response: "accept" | "reject";
  estimated_pickup_time?: string;
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
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "Supabase not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Enforce JWT Auth Verification before escalating to service_role
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing Authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Use service_role only for backend deterministic state changes after auth confirmation
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const acceptanceRequest: AcceptanceRequest = await req.json();
    const { trade_id, provider_id, response, estimated_pickup_time } = acceptanceRequest;

    // Validate required fields
    if (!trade_id || !provider_id || !response) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: trade_id, provider_id, response",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // REJECTION HANDLING
    // ========================================================================
    if (response === "reject") {
      await supabase.from("dispatch_events").insert({
        trade_id,
        provider_id,
        event_type: "PROVIDER_REJECTED",
        payload: { rejected_at: new Date().toISOString() },
      });

      // Update provider stats
      await supabase.rpc("update_provider_stats", {
        p_provider_id: provider_id,
        p_accepted: false,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Rejection recorded",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // ACCEPTANCE HANDLING (ATOMIC FIRST-RESPONDER LOCK)
    // ========================================================================

    // Step 1: Check if shipment exists and is unassigned
    const { data: shipment, error: shipmentError } = await supabase
      .from("shipments")
      .select("id, status, logistics_provider_id")
      .eq("trade_id", trade_id)
      .maybeSingle();

    if (shipmentError) {
      console.error("[AcceptanceHandler] Shipment query error:", shipmentError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to query shipment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Check if already assigned
    if (shipment?.logistics_provider_id) {
      // Job already taken
      await supabase.from("dispatch_events").insert({
        trade_id,
        provider_id,
        event_type: "PROVIDER_ACCEPTED",
        payload: {
          result: "job_already_assigned",
          assigned_to: shipment.logistics_provider_id,
        },
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: "Job already assigned to another provider",
          message: "This pickup has already been assigned. Thank you for your response.",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: ATOMIC ASSIGNMENT (Transaction)
    // Update shipment and provider in a single transaction-like operation

    let assignmentSuccess = false;
    let shipmentId = shipment?.id;

    // If shipment doesn't exist, create it
    if (!shipmentId) {
      const { data: newShipment, error: createError } = await supabase
        .from("shipments")
        .insert({
          trade_id,
          status: "pending",
          logistics_provider_id: provider_id,
          pickup_scheduled_at: estimated_pickup_time || null,
        })
        .select("id")
        .single();

      if (createError) {
        console.error("[AcceptanceHandler] Failed to create shipment:", createError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to create shipment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      shipmentId = newShipment.id;
      assignmentSuccess = true;
    } else {
      // Update existing shipment (with optimistic locking via status check)
      const { data: updated, error: updateError } = await supabase
        .from("shipments")
        .update({
          logistics_provider_id: provider_id,
          status: "assigned",
          pickup_scheduled_at: estimated_pickup_time || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", shipmentId)
        .is("logistics_provider_id", null) // Only update if still unassigned
        .select("id");

      if (updateError || !updated || updated.length === 0) {
        // Race condition: another provider got it first
        await supabase.from("dispatch_events").insert({
          trade_id,
          provider_id,
          event_type: "PROVIDER_ACCEPTED",
          payload: { result: "race_condition_lost" },
        });

        return new Response(
          JSON.stringify({
            success: false,
            error: "Job was just assigned to another provider",
            message: "Another provider accepted this job first. Thank you for your response.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      assignmentSuccess = true;
    }

    // Step 4: Mark provider as unavailable
    if (assignmentSuccess) {
      await supabase
        .from("logistics_providers")
        .update({
          is_available: false,
          last_active_at: new Date().toISOString(),
        })
        .eq("id", provider_id);

      // Update provider stats
      await supabase.rpc("update_provider_stats", {
        p_provider_id: provider_id,
        p_accepted: true,
      });

      // Log successful assignment
      await supabase.from("dispatch_events").insert({
        trade_id,
        provider_id,
        shipment_id: shipmentId,
        event_type: "SHIPMENT_ASSIGNED",
        payload: {
          assigned_at: new Date().toISOString(),
          estimated_pickup_time,
        },
      });

      // Update trade metadata
      const { data: trade } = await supabase
        .from("trades")
        .select("metadata")
        .eq("id", trade_id)
        .single();

      const updatedMetadata = {
        ...(trade?.metadata || {}),
        logistics_provider_id: provider_id,
        shipment_assigned_at: new Date().toISOString(),
      };

      await supabase
        .from("trades")
        .update({ metadata: updatedMetadata })
        .eq("id", trade_id);

      // ====================================================================
      // SUCCESS: Provider got the job
      // ====================================================================

      return new Response(
        JSON.stringify({
          success: true,
          message: "Pickup assigned successfully",
          shipment_id: shipmentId,
          trade_id,
          provider_id,
          next_step: "Proceed to pickup location",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback (should never reach here)
    return new Response(
      JSON.stringify({ success: false, error: "Assignment failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[AcceptanceHandler] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
