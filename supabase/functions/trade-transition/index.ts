import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type TradeState =
  | "draft"
  | "rfq_open"
  | "quoted"
  | "contracted"
  | "escrow_required"
  | "escrow_funded"
  | "production"
  | "pickup_scheduled"
  | "in_transit"
  | "delivered"
  | "accepted"
  | "settled"
  | "disputed"
  | "closed";

type KernelDecision = {
  success: boolean;
  decision: "ALLOW" | "BLOCK";
  reason?: string;
  reason_code?: string;
  required_actions?: string[];
  consequences?: {
    unlock_amount?: number;
    eta_risk_delta?: string;
    compliance_delta?: string;
  };
  next_state?: TradeState;
  trade?: Record<string, unknown> | null;
  settlement?: Record<string, unknown> | null;
};

const TRADE_TRANSITIONS: Record<TradeState, TradeState[]> = {
  draft: ["rfq_open", "closed"],
  rfq_open: ["quoted", "closed"],
  quoted: ["contracted", "closed"],
  contracted: ["escrow_required", "closed"],
  escrow_required: ["escrow_funded", "closed"],
  escrow_funded: ["production", "disputed"],
  production: ["pickup_scheduled", "disputed"],
  pickup_scheduled: ["in_transit", "disputed"],
  in_transit: ["delivered", "disputed"],
  delivered: ["accepted", "disputed"],
  accepted: ["settled", "disputed"],
  settled: ["closed"],
  disputed: ["settled", "closed"],
  closed: [],
};

const TRADE_STATE_ORDER: TradeState[] = [
  "draft",
  "rfq_open",
  "quoted",
  "contracted",
  "escrow_required",
  "escrow_funded",
  "production",
  "pickup_scheduled",
  "in_transit",
  "delivered",
  "accepted",
  "settled",
  "disputed",
  "closed",
];

function isValidTransition(fromState: TradeState, toState: TradeState) {
  const valid = TRADE_TRANSITIONS[fromState] || [];
  return valid.includes(toState);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, decision: "BLOCK", reason: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ success: false, decision: "BLOCK", reason: "Supabase not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, decision: "BLOCK", reason: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, decision: "BLOCK", reason: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { tradeId, nextState, metadata = {}, dry_run = false } = await req.json();

    // Dry Run: If no nextState is provided, infer it from current state
    let desiredState = nextState as TradeState;

    if (!tradeId) {
      return new Response(
        JSON.stringify({ success: false, decision: "BLOCK", reason: "Missing tradeId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, company_id, is_admin")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, decision: "BLOCK", reason: "Profile not found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .select("*")
      .eq("id", tradeId)
      .single();

    if (tradeError || !trade) {
      return new Response(
        JSON.stringify({ success: false, decision: "BLOCK", reason: "Trade not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tradeStatus = (trade.status || "draft") as TradeState;
    const tradeIdValue = trade.id as string;

    // Auto-infer next state if not allowed
    if (!desiredState && dry_run) {
      const potentialNext = TRADE_TRANSITIONS[tradeStatus]?.[0];
      if (potentialNext) desiredState = potentialNext;
      else {
        return new Response(
          JSON.stringify({
            success: false,
            decision: "BLOCK",
            reason: "No further transitions allowed",
            reason_code: "terminal_state"
          } as KernelDecision),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (!desiredState) {
      return new Response(
        JSON.stringify({ success: false, decision: "BLOCK", reason: "Missing nextState" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const actorRole = resolveActorRole({
      profile,
      trade,
    });

    if (actorRole === "unknown") {
      const decision: KernelDecision = {
        success: false,
        decision: "BLOCK",
        reason: "Actor not authorized for this trade",
        reason_code: "actor_not_authorized",
      };
      // Log failed attempt even if blocked
      if (!dry_run) await logTradeEvent(supabase, tradeIdValue, "transition_attempt", tradeStatus, desiredState, user.id, actorRole, decision);

      return new Response(
        JSON.stringify(decision),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Role Check
    const roleDecision = enforceRoleGuard(actorRole, desiredState);
    if (!roleDecision.success) {
      if (!dry_run) await logTradeEvent(supabase, tradeIdValue, "transition_attempt", tradeStatus, desiredState, user.id, actorRole, roleDecision);
      return new Response(
        JSON.stringify(roleDecision),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } } // Return 200 for logic blocks 
      );
    }

    // 2. Transition Validity Check
    if (!isValidTransition(tradeStatus, desiredState)) {
      const decision: KernelDecision = {
        success: false,
        decision: "BLOCK",
        reason: `Illegal state transition from ${tradeStatus} to ${desiredState}`,
        reason_code: "illegal_transition",
      };
      if (!dry_run) await logTradeEvent(supabase, tradeIdValue, "transition_attempt", tradeStatus, desiredState, user.id, actorRole, decision);

      return new Response(
        JSON.stringify(decision),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Condition Check (Gates)
    const validation = await validateStateEntryConditions({
      supabase,
      trade,
      nextState: desiredState,
      metadata,
    });

    if (!validation.valid) {
      const decision: KernelDecision = {
        success: false,
        decision: "BLOCK",
        reason: validation.reason,
        reason_code: validation.reasonCode,
        required_actions: validation.requiredActions,
        next_state: desiredState
      };
      if (!dry_run) await logTradeEvent(supabase, tradeIdValue, "transition_attempt", tradeStatus, desiredState, user.id, actorRole, decision);

      return new Response(
        JSON.stringify(decision),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DRY RUN ENDS HERE
    if (dry_run) {
      return new Response(
        JSON.stringify({
          success: true,
          decision: "ALLOW",
          next_state: desiredState,
          consequences: calculateConsequences(desiredState, trade),
          reason: "Transition allowed"
        } as KernelDecision),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==========================================
    // EXECUTION PHASE (Write to DB)
    // ==========================================

    // Special Case: Settlement uses atomic function
    if (desiredState === "settled") {
      const { data: settlementResult, error: settlementError } = await supabase.rpc(
        "kernel_settle_trade",
        {
          p_trade_id: tradeIdValue,
          p_user_id: user.id,
          p_metadata: metadata,
        }
      );

      if (settlementError) {
        const decision: KernelDecision = {
          success: false,
          decision: "BLOCK",
          reason: settlementError.message,
          reason_code: "settlement_failed",
        };
        await logTradeEvent(supabase, tradeIdValue, "settlement_attempt", tradeStatus, desiredState, user.id, actorRole, decision);

        return new Response(
          JSON.stringify(decision),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: settledTrade } = await supabase
        .from("trades")
        .select("*")
        .eq("id", tradeIdValue)
        .single();

      const successDecision: KernelDecision = {
        success: true,
        decision: "ALLOW",
        trade: settledTrade,
        settlement: settlementResult,
      };

      await logTradeEvent(supabase, tradeIdValue, "state_transition", tradeStatus, desiredState, user.id, actorRole, successDecision);

      return new Response(
        JSON.stringify(successDecision),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normal State Transition Side Effects
    const sideEffects = await executeStateSideEffects({
      supabase,
      trade,
      nextState: desiredState,
      metadata,
    });

    if (!sideEffects.success) {
      const decision: KernelDecision = {
        success: false,
        decision: "BLOCK",
        reason: sideEffects.error || "Side effect failed",
        reason_code: "side_effect_failed",
      };
      await logTradeEvent(supabase, tradeIdValue, "transition_attempt", tradeStatus, desiredState, user.id, actorRole, decision);

      return new Response(
        JSON.stringify(decision),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const existingMetadata = (trade.metadata as Record<string, unknown>) || {};
    const mergedMetadata = {
      ...existingMetadata,
      ...(metadata || {}),
    };

    const updatePayload: Record<string, unknown> = {
      status: desiredState,
      updated_at: new Date().toISOString(),
      metadata: {
        ...mergedMetadata,
        previous_state: tradeStatus,
      },
    };

    if (metadata?.buyerAccepted === true) {
      updatePayload.metadata = {
        ...updatePayload.metadata,
        buyer_accepted: true,
      };
    }

    if (desiredState === "rfq_open") {
      updatePayload.published_at = new Date().toISOString();
    }

    if (desiredState === "contracted" && metadata?.supplierId) {
      updatePayload.seller_id = metadata.supplierId;
      updatePayload.trade_type = "order";
    }

    if (desiredState === "closed" || desiredState === "settled") {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data: updatedTrade, error: updateError } = await supabase
      .from("trades")
      .update(updatePayload)
      .eq("id", tradeIdValue)
      .select()
      .single();

    if (updateError) {
      const decision: KernelDecision = {
        success: false,
        decision: "BLOCK",
        reason: updateError.message,
        reason_code: "update_failed",
      };
      await logTradeEvent(supabase, tradeIdValue, "update_attempt", tradeStatus, desiredState, user.id, actorRole, decision);

      return new Response(
        JSON.stringify(decision),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const successDecision: KernelDecision = {
      success: true,
      decision: "ALLOW",
      trade: updatedTrade,
    };

    await logTradeEvent(supabase, tradeIdValue, "state_transition", tradeStatus, desiredState, user.id, actorRole, successDecision, metadata);

    // Old Audit Log (Deprecated but kept for compatibility if needed, or we can just rely on trade_events)
    // await auditTradeTransition(supabase, tradeIdValue, tradeStatus, desiredState, metadata, user.id);

    return new Response(
      JSON.stringify(successDecision),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        decision: "BLOCK",
        reason: err.message || "Kernel transition failed",
        reason_code: "kernel_error",
      } as KernelDecision),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function resolveActorRole({ profile, trade }: { profile: Record<string, unknown>; trade: Record<string, unknown> }) {
  if (profile?.is_admin === true) return "admin";
  const companyId = profile?.company_id as string | null;
  if (!companyId) return "unknown";
  if (companyId === trade.buyer_id) return "buyer";
  if (companyId === trade.seller_id) return "seller";
  const tradeMetadata = (trade?.metadata as Record<string, unknown>) || {};
  if (companyId === (tradeMetadata.logistics_company_id as string | undefined)) return "logistics";
  return "unknown";
}

function enforceRoleGuard(actorRole: string, nextState: TradeState): KernelDecision {
  const allowedRoles: Record<TradeState, string[]> = {
    draft: ["buyer", "admin"],
    rfq_open: ["buyer", "admin"],
    quoted: ["buyer", "seller", "admin"],
    contracted: ["buyer", "admin"],
    escrow_required: ["buyer", "admin"],
    escrow_funded: ["buyer", "admin"],
    production: ["seller", "admin"],
    pickup_scheduled: ["seller", "admin", "logistics"],
    in_transit: ["logistics", "seller", "admin"],
    delivered: ["logistics", "admin"],
    accepted: ["buyer", "admin"],
    settled: ["admin"], // Only admin/system trigger settlement usually, or buyer releases
    disputed: ["buyer", "seller", "admin"],
    closed: ["admin"],
  };

  const roles = allowedRoles[nextState] || [];
  if (!roles.includes(actorRole)) {
    return {
      success: false,
      decision: "BLOCK",
      reason: `Role ${actorRole} not authorized for ${nextState}`,
      reason_code: "role_not_authorized",
    };
  }

  return { success: true, decision: "ALLOW" };
}

async function validateStateEntryConditions({
  supabase,
  trade,
  nextState,
  metadata,
}: {
  supabase: ReturnType<typeof createClient>;
  trade: Record<string, unknown>;
  nextState: TradeState;
  metadata: Record<string, unknown>;
}) {
  const tradeIdValue = trade.id as string;
  switch (nextState) {
    case "rfq_open": {
      if (!trade.title || !trade.description || !trade.quantity) {
        return {
          valid: false,
          reason: "RFQ must have title, description, and quantity",
          reasonCode: "rfq_missing_fields",
          requiredActions: ["add_title", "add_description", "add_quantity"],
        };
      }
      return { valid: true };
    }
    case "quoted": {
      const { data: quotes } = await supabase
        .from("quotes")
        .select("id")
        .eq("trade_id", tradeIdValue);
      if (!quotes || quotes.length === 0) {
        return {
          valid: false,
          reason: "No quotes received yet",
          reasonCode: "no_quotes",
          requiredActions: ["await_supplier_quotes"],
        };
      }
      return { valid: true };
    }
    case "contracted": {
      if (!metadata?.selectedQuoteId) {
        // Check if already has accepted quote
        const { data: acceptedQuote } = await supabase.from('quotes').select('id').eq('trade_id', tradeIdValue).eq('status', 'accepted').maybeSingle();
        if (!acceptedQuote) {
          return {
            valid: false,
            reason: "Must select a quote",
            reasonCode: "quote_not_selected",
            requiredActions: ["select_quote"],
          };
        }
      }
      // Check for contract
      const { data: contract } = await supabase
        .from("contracts")
        .select("id")
        .eq("trade_id", tradeIdValue)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!contract?.id) {
        return {
          valid: false,
          reason: "Contract not generated",
          reasonCode: "contract_missing",
          requiredActions: ["generate_contract"],
        };
      }
      return { valid: true };
    }
    case "escrow_required": {
      const { data: contract } = await supabase
        .from("contracts")
        .select("status")
        .eq("trade_id", tradeIdValue)
        .order("version", { ascending: false })
        .limit(1)
        .single();
      if (!contract || contract.status !== "signed") {
        return {
          valid: false,
          reason: "Contract must be signed before escrow funding",
          reasonCode: "contract_not_signed",
          requiredActions: ["sign_contract"],
        };
      }
      const tradeMetadata = (trade?.metadata as Record<string, unknown>) || {};
      const hsCode = tradeMetadata.hs_code || tradeMetadata.hsCode || null;
      if (!hsCode) {
        return {
          valid: false,
          reason: "HS code required for compliance verification",
          reasonCode: "hs_code_missing",
          requiredActions: ["add_hs_code"],
        };
      }
      const compliance = await validateTradeCompliance(supabase, tradeIdValue, hsCode as string);
      if (!compliance?.compliant) {
        return {
          valid: false,
          reason: "Compliance documents incomplete",
          reasonCode: "compliance_incomplete",
          requiredActions: compliance?.missingDocuments || ["upload_compliance_docs"],
        };
      }
      return { valid: true };
    }
    case "escrow_funded": {
      const { data: escrow } = await supabase
        .from("escrows")
        .select("status")
        .eq("trade_id", tradeIdValue)
        .single();
      if (!escrow || escrow.status !== "funded") {
        return {
          valid: false,
          reason: "Escrow not funded",
          reasonCode: "escrow_unfunded",
          requiredActions: ["fund_escrow"],
        };
      }
      return { valid: true };
    }
    case "delivered": {
      const { data: shipment } = await supabase
        .from("shipments")
        .select("status")
        .eq("trade_id", tradeIdValue)
        .single();
      if (!shipment || shipment.status !== "delivered") {
        return {
          valid: false,
          reason: "Shipment not marked delivered",
          reasonCode: "shipment_not_delivered",
          requiredActions: ["confirm_delivery"],
        };
      }
      return { valid: true };
    }
    case "accepted": {
      if (!metadata?.buyerAccepted) {
        return {
          valid: false,
          reason: "Buyer has not accepted delivery",
          reasonCode: "buyer_not_accepted",
          requiredActions: ["accept_delivery"],
        };
      }
      return { valid: true };
    }
    case "settled": {
      const { data: escrow } = await supabase
        .from("escrows")
        .select("status")
        .eq("trade_id", tradeIdValue)
        .single();
      if (!escrow || escrow.status !== "funded") {
        // Logic might vary slightly: status could be 'released' if just happened, but typically we are entering settled
        // and causing release. If entering settled, escrow SHOULD be funded.
        return {
          valid: false,
          reason: "Escrow not ready for release",
          reasonCode: "escrow_not_ready",
          requiredActions: ["resolve_escrow"],
        };
      }
      return { valid: true };
    }
    default:
      return { valid: true };
  }
}

async function executeStateSideEffects({
  supabase,
  trade,
  nextState,
  metadata,
}: {
  supabase: ReturnType<typeof createClient>;
  trade: Record<string, unknown>;
  nextState: TradeState;
  metadata: Record<string, unknown>;
}) {
  try {
    const tradeIdValue = trade.id as string;
    if (nextState === "contracted" && metadata?.selectedQuoteId) {
      await supabase
        .from("quotes")
        .update({ status: "accepted" })
        .eq("id", metadata.selectedQuoteId);
    }

    if (nextState === "escrow_required") {
      const { data: escrow } = await supabase
        .from("escrows")
        .select("id")
        .eq("trade_id", tradeIdValue)
        .single();

      if (!escrow) {
        const amount = metadata?.escrowAmount || trade?.price_max || trade?.price_min || 0;
        if (!amount || Number(amount) <= 0) {
          // Allow creation but warn? Or hard block? For now log error but continue if possible or block?
          // If we block here, we can't proceed.
          return { success: false, error: "Escrow amount must be greater than 0" };
        }

        await supabase
          .from("escrows")
          .insert({
            trade_id: tradeIdValue,
            buyer_id: trade.buyer_id,
            seller_id: trade.seller_id,
            amount,
            currency: metadata?.currency || trade?.currency || "USD",
            payment_method: metadata?.paymentMethod || "bank_transfer",
            status: "pending",
            balance: amount,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
      }
    }

    if (nextState === "contracted" && trade?.rfq_id) {
      await supabase
        .from("rfqs")
        .update({ status: "awarded", awarded_to: metadata?.supplierId || null })
        .eq("id", trade.rfq_id);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function validateTradeCompliance(
  supabase: ReturnType<typeof createClient>,
  tradeId: string,
  hsCode: string
) {
  try {
    const { data: complianceCase } = await supabase
      .from("compliance_cases")
      .select("id, state")
      .eq("trade_id", tradeId)
      .single();

    if (!complianceCase || complianceCase.state !== "approved") {
      return { compliant: false, missingDocuments: ["compliance_case_pending"] };
    }

    return { compliant: true };
  } catch (_err) {
    return { compliant: false, missingDocuments: ["compliance_case_error"] };
  }
}

async function logTradeEvent(
  supabase: ReturnType<typeof createClient>,
  tradeId: string,
  eventType: string,
  fromState: string,
  toState: string,
  actorUserId: string,
  actorRole: string,
  decision: KernelDecision,
  payload: Record<string, unknown> = {}
) {
  try {
    await supabase.from("trade_events").insert({
      trade_id: tradeId,
      event_type: eventType,
      status_from: fromState,
      status_to: toState,
      actor_user_id: actorUserId,
      actor_role: actorRole,
      decision: decision.decision,
      reason_code: decision.reason_code,
      required_actions: decision.required_actions ? JSON.stringify(decision.required_actions) : null,
      payload: payload,
      created_at: new Date().toISOString()
    });
  } catch (e) {
    console.error("Failed to log event:", e);
  }
}

function calculateConsequences(nextState: TradeState, trade: Record<string, unknown>) {
  // Mock consequence calculation for now
  if (nextState === 'escrow_funded') {
    return { unlock_amount: Number(trade.price) || 0 };
  }
  return {};
}
