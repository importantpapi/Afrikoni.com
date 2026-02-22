import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Method not allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { success: false, error: "Supabase configuration missing" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json(401, { success: false, error: "Authorization required" });
  const token = authHeader.replace("Bearer ", "");
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return json(401, { success: false, error: "Invalid authorization" });

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("id, is_admin")
    .eq("id", authData.user.id)
    .single();
  if (!actorProfile?.is_admin) return json(403, { success: false, error: "Admin access required" });

  let payload: {
    disputeId?: string;
    action?: "resolve" | "escalate" | "reject";
    resolutionNote?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json(400, { success: false, error: "Invalid JSON body" });
  }

  if (!payload.disputeId || !payload.action || !payload.resolutionNote) {
    return json(400, { success: false, error: "disputeId, action and resolutionNote are required" });
  }

  const { data: dispute, error: disputeError } = await supabase
    .from("disputes")
    .select("*")
    .eq("id", payload.disputeId)
    .single();

  if (disputeError || !dispute) return json(404, { success: false, error: "Dispute not found" });

  let newStatus = "in_review";
  if (payload.action === "resolve") newStatus = "resolved";
  if (payload.action === "escalate") newStatus = "escalated";
  if (payload.action === "reject") newStatus = "resolved";

  const resolvedAt = newStatus === "resolved" ? new Date().toISOString() : null;

  const { error: updateError } = await supabase
    .from("disputes")
    .update({
      status: newStatus,
      resolution_notes: payload.resolutionNote,
      resolved_at: resolvedAt,
      resolved_by: authData.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.disputeId);

  if (updateError) return json(500, { success: false, error: updateError.message });

  if (dispute.trade_id) {
    await supabase.from("trade_events").insert({
      trade_id: dispute.trade_id,
      event_type: "dispute_workflow_updated",
      payload: {
        dispute_id: dispute.id,
        action: payload.action,
        status: newStatus,
        resolution_note: payload.resolutionNote,
      },
      actor_user_id: authData.user.id,
      actor_role: "admin",
      created_at: new Date().toISOString(),
    }).then(() => {});
  }

  await supabase.from("trust_receipts").insert({
    company_id: dispute.raised_by_company_id || dispute.buyer_company_id || null,
    trade_id: dispute.trade_id || null,
    dispute_id: dispute.id,
    milestone_type: `dispute_${newStatus}`,
    reference_type: "dispute",
    reference_id: dispute.id,
    receipt_code: `TR-DISPUTE-${dispute.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    metadata: {
      action: payload.action,
      status: newStatus,
      resolution_note: payload.resolutionNote,
      resolved_by: authData.user.id,
      resolved_at: resolvedAt,
    },
  }).then(() => {});

  const notifications = [
    dispute.raised_by_user_id
      ? {
          user_id: dispute.raised_by_user_id,
          type: "dispute_update",
          title: "Dispute status updated",
          message: `Your dispute is now ${newStatus.replace("_", " ")}.`,
          metadata: { dispute_id: dispute.id, trade_id: dispute.trade_id, status: newStatus },
        }
      : null,
    dispute.against_user_id
      ? {
          user_id: dispute.against_user_id,
          type: "dispute_update",
          title: "Dispute status updated",
          message: `A dispute involving your trade is now ${newStatus.replace("_", " ")}.`,
          metadata: { dispute_id: dispute.id, trade_id: dispute.trade_id, status: newStatus },
        }
      : null,
  ].filter(Boolean);

  if (notifications.length > 0) {
    await supabase.from("notifications").insert(
      notifications.map((n) => ({ ...n, created_at: new Date().toISOString() })),
    ).then(() => {});
  }

  return json(200, {
    success: true,
    disputeId: dispute.id,
    status: newStatus,
    resolvedAt,
  });
});
