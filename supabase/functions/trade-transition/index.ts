import createClient from 'https://esm.sh/@supabase/supabase-js@2';

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

async function generateTradeDNA(
  tradeId: string,
  fromState: TradeState,
  toState: TradeState,
  actorId: string,
  payload: Record<string, unknown>
): Promise<string> {
  const data = JSON.stringify({
    tradeId,
    fromState,
    toState,
    actorId,
    payload,
    salt: Deno.env.get("HASH_SALT") || "sovereign_rail_2026",
    timestamp: new Date().toISOString()
  });

  const msgUint8 = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `AFK-DNA-${hashHex.substring(0, 16).toUpperCase()}`;
}

function validateConsensus(trade: Record<string, unknown>, metadata: Record<string, unknown>) {
  const tradeMetadata = (trade.metadata as Record<string, unknown>) || {};
  const currentSigs = (tradeMetadata.signatures as string[]) || [];
  const newSigs = (metadata.signatures as string[]) || [];

  const allSigs = [...new Set([...currentSigs, ...newSigs])];

  const hasAI = allSigs.some(s => s.startsWith("AI_SENTINEL_"));
  const hasLogistics = allSigs.some(s => s.startsWith("LOGISTICS_ORACLE_"));
  const hasBuyer = allSigs.some(s => s.startsWith("BUYER_SIG_"));

  return {
    compliant: hasAI && hasLogistics && hasBuyer,
    missing: [
      !hasAI && "AI_SENTINEL_SIG",
      !hasLogistics && "LOGISTICS_ORACLE_SIG",
      !hasBuyer && "BUYER_SIG"
    ].filter(Boolean) as string[],
    allSigs
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization required");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid authorization");

    const { tradeId, nextState, metadata = {}, dry_run = false, expectedSequenceId } = await req.json();
    if (!tradeId) throw new Error("Missing tradeId");

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    const { data: trade } = await supabase.from("trades").select("*").eq("id", tradeId).single();

    if (!trade) throw new Error("Trade not found");

    // ✅ SEQUENCE ID VALIDATION (Institutional Rail Hardening)
    if (!dry_run && expectedSequenceId !== undefined) {
      if (Number(trade.sequence_id) !== Number(expectedSequenceId)) {
        return new Response(JSON.stringify({
          success: false,
          decision: "BLOCK",
          reason: "State Desync: The trade has been updated by another party. Please refresh.",
          reason_code: "SEQUENCE_MISMATCH",
          current_sequence_id: trade.sequence_id
        }), { headers: corsHeaders });
      }
    }

    const tradeStatus = (trade.status || "draft") as TradeState;
    let desiredState = nextState as TradeState;

    if (!desiredState && dry_run) {
      desiredState = TRADE_TRANSITIONS[tradeStatus]?.[0];
    }

    const actorRole = resolveActorRole({ profile, trade });
    if (actorRole === "unknown") throw new Error("Actor not authorized");

    // Role Guard
    const roleDecision = enforceRoleGuard(actorRole, desiredState);
    if (!roleDecision.success) return new Response(JSON.stringify(roleDecision), { headers: corsHeaders });

    // Transition Guard
    if (!isValidTransition(tradeStatus, desiredState)) throw new Error(`Illegal transition from ${tradeStatus} to ${desiredState}`);

    // Entry Conditions
    const validation = await validateStateEntryConditions({ supabase, trade, nextState: desiredState, metadata });
    if (!validation.valid) {
      return new Response(JSON.stringify({
        success: false, decision: "BLOCK", reason: validation.reason, reason_code: validation.reasonCode
      }), { headers: corsHeaders });
    }

    if (dry_run) return new Response(JSON.stringify({ success: true, decision: "ALLOW", next_state: desiredState }), { headers: corsHeaders });

    // EXECUTION
    if (desiredState === "settled") {
      const consensus = validateConsensus(trade, metadata);
      if (!consensus.compliant) throw new Error("3-Key Consensus Required");

      const { data: settledTrade, error: sErr } = await supabase.rpc("kernel_settle_trade", { p_trade_id: tradeId, p_user_id: user.id, p_metadata: metadata });
      if (sErr) throw sErr;

      return new Response(JSON.stringify({ success: true, decision: "ALLOW", trade: settledTrade }), { headers: corsHeaders });
    }

    const sideEffects = await executeStateSideEffects({ supabase, trade, nextState: desiredState, metadata });
    if (!sideEffects.success) throw new Error(sideEffects.error || "Kernel side-effect failed");

    const dnaHash = await generateTradeDNA(tradeId, tradeStatus, desiredState, user.id, metadata);
    const existingMetadata = (trade.metadata as any) || {};
    const newSignatures = metadata.signatures || [];
    const mergedSignatures = [...new Set([...(existingMetadata.signatures || []), ...newSignatures])];

    const updatePayload = {
      status: desiredState,
      updated_at: new Date().toISOString(),
      sequence_id: (Number(trade.sequence_id) || 0) + 1,
      metadata: {
        ...existingMetadata,
        ...metadata,
        signatures: mergedSignatures,
        trade_dna: dnaHash,
        previous_state: tradeStatus
      }
    };

    const { data: updatedTrade, error: uErr } = await supabase
      .from("trades")
      .update(updatePayload)
      .eq("id", tradeId)
      .eq("sequence_id", trade.sequence_id) // Extra safety check at UPDATE time
      .select()
      .single();
    if (uErr) throw uErr;

    await logTradeEvent(supabase, tradeId, "state_transition", tradeStatus, desiredState, user.id, actorRole, { success: true, decision: "ALLOW" }, metadata);

    return new Response(JSON.stringify({ success: true, decision: "ALLOW", trade: updatedTrade }), { headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, decision: "BLOCK", reason: err.message }), { status: 200, headers: corsHeaders });
  }
});

function isValidTransition(from: TradeState, to: TradeState) {
  return (TRADE_TRANSITIONS[from] || []).includes(to);
}

function getBuyerCompanyId(trade: any) {
  return trade?.buyer_company_id ?? trade?.buyer_id ?? null;
}

function getSellerCompanyId(trade: any) {
  return trade?.seller_company_id ?? trade?.seller_id ?? null;
}

function resolveActorRole({ profile, trade }: any) {
  const buyerCompanyId = getBuyerCompanyId(trade);
  const sellerCompanyId = getSellerCompanyId(trade);
  if (profile?.is_admin) return "admin";
  if (profile?.company_id && profile.company_id === buyerCompanyId) return "buyer";
  if (profile?.company_id && profile.company_id === sellerCompanyId) return "seller";
  return "unknown";
}

function enforceRoleGuard(role: string, next: TradeState): any {
  const guards: Record<string, string[]> = {
    rfq_open: ["buyer", "admin"],
    quoted: ["buyer", "seller", "admin"],
    contracted: ["buyer", "admin"],
    escrow_funded: ["buyer", "admin"],
    production: ["seller", "admin"],
    pickup_scheduled: ["seller", "admin"],
    in_transit: ["seller", "admin"],
    delivered: ["seller", "admin"],
    accepted: ["buyer", "admin"],
    settled: ["buyer", "admin"]
  };
  if (guards[next] && !guards[next].includes(role)) return { success: false, decision: "BLOCK", reason: "Unauthorized role" };
  return { success: true };
}

async function validateStateEntryConditions({ supabase, trade, nextState, metadata }: any) {
  // ✅ HANDSHAKE GATE: Enforce Verification for Contracts
  if (nextState === "contracted") {
    const buyerCompanyId = getBuyerCompanyId(trade);
    const sellerCompanyId = getSellerCompanyId(trade);

    const { data: buyer } = await supabase.from("companies").select("verification_status").eq("id", buyerCompanyId).single();
    const { data: seller } = await supabase.from("companies").select("verification_status").eq("id", sellerCompanyId).single();

    const buyerVerified = String(buyer?.verification_status || "").toUpperCase() === "VERIFIED";
    const sellerVerified = String(seller?.verification_status || "").toUpperCase() === "VERIFIED";

    if (!buyerVerified || !sellerVerified) {
      return {
        valid: false,
        reason: "Both parties must be VERIFIED before signing a contract. Please complete your profile verification.",
        reasonCode: "KYC_REQUIRED"
      };
    }
  }

  // Simple validation for other states
  return { valid: true, reason: null, reasonCode: null };
}

async function executeStateSideEffects({ supabase, trade, nextState, metadata }: any) {
  const tradeId = trade.id;

  // ========================================================================
  // PICKUP_SCHEDULED → Trigger Logistics Dispatch Engine
  // ========================================================================
  if (nextState === "pickup_scheduled") {
    // Create shipment record if it doesn't exist
    const { data: existingShipment } = await supabase
      .from("shipments")
      .select("id")
      .eq("trade_id", tradeId)
      .maybeSingle();

    if (!existingShipment) {
      await supabase.from("shipments").insert({
        trade_id: tradeId,
        status: "pending",
        tracking_number: `AFK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      });
    }

    // Invoke dispatch engine (Uber-style matching)
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const dispatchResponse = await fetch(`${SUPABASE_URL}/functions/v1/logistics-dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ trade_id: tradeId }),
      });

      const dispatchResult = await dispatchResponse.json();

      if (!dispatchResult.success) {
        console.error("[Kernel] Dispatch engine failed:", dispatchResult.error);
        // Log failure event but don't block state transition
        await supabase.from("trade_events").insert({
          trade_id: tradeId,
          event_type: "dispatch_failed",
          payload: { error: dispatchResult.error },
        });
      } else {
        console.log(`[Kernel] Dispatch triggered: ${dispatchResult.providers_notified} providers notified`);
      }
    } catch (error) {
      console.error("[Kernel] Failed to invoke dispatch engine:", error);
      // Log but don't block the state transition
    }
  }

  // ========================================================================
  // IN_TRANSIT → Update Shipment Status
  // ========================================================================
  if (nextState === "in_transit") {
    await supabase.from("shipments").update({ status: "in_transit" }).eq("trade_id", tradeId);
  }

  // ========================================================================
  // ACCEPTED → Release bank escrow to seller
  // ========================================================================
  // The buyer has confirmed delivery. The bank-held escrow (96% of trade
  // value) is now released to the seller via Flutterwave Transfer API.
  // Afrikoni's 4% fee is collected at payment time (split payment)
  // so we are cash-positive regardless of when the seller is paid.
  if (nextState === "accepted") {
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const INTERNAL_FUNCTION_SECRET = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";

      const releaseResponse = await fetch(`${SUPABASE_URL}/functions/v1/bank-escrow-release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          ...(INTERNAL_FUNCTION_SECRET ? { "x-internal-function-secret": INTERNAL_FUNCTION_SECRET } : {}),
        },
        body: JSON.stringify({ trade_id: tradeId }),
      });

      const releaseResult = await releaseResponse.json();

      if (!releaseResult.success && !releaseResult.queued) {
        console.error("[Kernel] Bank escrow release failed:", releaseResult.error);
        // Log failure but don't block state transition — admin can manually trigger
        await supabase.from("trade_events").insert({
          trade_id: tradeId,
          event_type: "escrow_release_failed",
          metadata: { error: releaseResult.error },
        });
      } else if (releaseResult.queued) {
        console.log(`[Kernel] Escrow release queued — seller missing bank details: ${tradeId}`);
      } else {
        console.log(`[Kernel] Escrow released to seller: ${releaseResult.transfer_ref}`);
      }
    } catch (error) {
      console.error("[Kernel] Failed to invoke bank-escrow-release:", error);
      // Log but don't block the state transition
    }
  }

  return { success: true, error: null };
}

async function logTradeEvent(supabase: any, tradeId: string, type: string, from: string, to: string, userId: string, role: string, decision: any, payload: any) {
  const primaryInsert = {
    trade_id: tradeId,
    event_type: type,
    status_from: from,
    status_to: to,
    actor_user_id: userId,
    actor_role: role,
    decision: decision.decision,
    payload
  };

  const { error: primaryError } = await supabase.from("trade_events").insert(primaryInsert);
  if (!primaryError) return;

  // Backward-compatible fallback for environments using the older trade_events schema.
  await supabase.from("trade_events").insert({
    trade_id: tradeId,
    event_type: type,
    triggered_by: userId,
    metadata: {
      status_from: from,
      status_to: to,
      actor_role: role,
      decision: decision.decision,
      ...payload,
    }
  });
}
