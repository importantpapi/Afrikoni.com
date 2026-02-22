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
  const FLUTTERWAVE_SECRET_KEY = Deno.env.get("FLUTTERWAVE_SECRET_KEY");

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

  if (!actorProfile?.is_admin) {
    return json(403, { success: false, error: "Admin access required" });
  }

  let payload: { transactionId?: string; action?: "approve" | "reject"; note?: string };
  try {
    payload = await req.json();
  } catch {
    return json(400, { success: false, error: "Invalid JSON body" });
  }

  const transactionId = payload.transactionId;
  const action = payload.action;
  const note = payload.note || "";

  if (!transactionId || !action) {
    return json(400, { success: false, error: "transactionId and action are required" });
  }

  const { data: tx, error: txError } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("id", transactionId)
    .eq("type", "withdrawal_request")
    .single();

  if (txError || !tx) {
    return json(404, { success: false, error: "Withdrawal request not found" });
  }

  if (action === "reject") {
    const { error } = await supabase
      .from("wallet_transactions")
      .update({
        status: "failed",
        processed_at: new Date().toISOString(),
        processed_by: authData.user.id,
        metadata: {
          ...(tx.metadata || {}),
          payout_workflow: {
            state: "rejected",
            note,
            rejected_by: authData.user.id,
            rejected_at: new Date().toISOString(),
          },
        },
      })
      .eq("id", transactionId);

    if (error) return json(500, { success: false, error: error.message });

    await supabase.from("trust_receipts").insert({
      company_id: tx.company_id,
      milestone_type: "payout_rejected",
      reference_type: "wallet_transaction",
      reference_id: tx.id,
      receipt_code: `TR-PAYOUT-REJ-${tx.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      metadata: {
        amount: tx.amount,
        currency: tx.currency || "USD",
        note,
      },
    }).then(() => {});

    return json(200, { success: true, status: "failed" });
  }

  if (!FLUTTERWAVE_SECRET_KEY) {
    return json(503, {
      success: false,
      error: "Payout provider not configured. Configure Flutterwave transfers before approving payouts.",
    });
  }

  const bankName = tx.metadata?.bank_name;
  const accountNumber = tx.metadata?.account_number;
  const accountBank = tx.metadata?.bank_code;

  if (!accountNumber || !accountBank) {
    return json(400, {
      success: false,
      error: "Missing recipient payout details (account_number/bank_code) in request metadata.",
    });
  }

  const reference = `AFR-PAYOUT-${tx.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const transferPayload = {
    account_bank: accountBank,
    account_number: accountNumber,
    amount: Number(tx.amount),
    narration: note || `Afrikoni seller payout ${tx.id.slice(0, 8)}`,
    currency: tx.currency || "USD",
    reference,
    callback_url: `${SUPABASE_URL}/functions/v1/flutterwave-webhook`,
    debit_currency: tx.currency || "USD",
    meta: {
      wallet_transaction_id: tx.id,
      company_id: tx.company_id,
      type: "seller_withdrawal_payout",
      bank_name: bankName || null,
    },
  };

  const transferRes = await fetch("https://api.flutterwave.com/v3/transfers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transferPayload),
  });
  const transferData = await transferRes.json().catch(() => ({}));

  if (!transferRes.ok || transferData?.status !== "success") {
    return json(502, {
      success: false,
      error: transferData?.message || `Transfer initiation failed (${transferRes.status})`,
    });
  }

  const transferRef = transferData?.data?.reference || reference;
  const providerTransferId = transferData?.data?.id || null;

  const { error: updateError } = await supabase
    .from("wallet_transactions")
    .update({
      status: "processing",
      processed_at: new Date().toISOString(),
      processed_by: authData.user.id,
      metadata: {
        ...(tx.metadata || {}),
        payout_workflow: {
          state: "transfer_initiated",
          transfer_reference: transferRef,
          provider_transfer_id: providerTransferId,
          approved_by: authData.user.id,
          approved_at: new Date().toISOString(),
          note,
        },
      },
    })
    .eq("id", transactionId);

  if (updateError) {
    return json(500, { success: false, error: updateError.message });
  }

  await supabase.from("trust_receipts").insert({
    company_id: tx.company_id,
    milestone_type: "payout_initiated",
    reference_type: "wallet_transaction",
    reference_id: tx.id,
    receipt_code: `TR-PAYOUT-${tx.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    metadata: {
      amount: tx.amount,
      currency: tx.currency || "USD",
      transfer_reference: transferRef,
      provider_transfer_id: providerTransferId,
    },
  }).then(() => {});

  return json(200, {
    success: true,
    status: "processing",
    transferReference: transferRef,
    providerTransferId,
  });
});
