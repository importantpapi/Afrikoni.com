/**
 * Supabase Edge Function: Smile ID Webhook Handler
 *
 * Handles verification callbacks from Smile ID for business and identity verification.
 * This function is invoked when Smile ID completes a verification job.
 *
 * Endpoint: POST /functions/v1/smile-id-webhook
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-smile-signature",
};

// Verification status mapping
const VerificationStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  REQUIRES_REVIEW: "REQUIRES_REVIEW",
};

interface SmileIDCallback {
  ResultCode: string;
  ResultText: string;
  Actions?: {
    Verify_ID_Number: string;
    Return_Personal_Info: string;
    Human_Review_Compare?: string;
    Liveness_Check?: string;
    Register_Selfie?: string;
    Selfie_To_ID_Card_Compare?: string;
    Update_Registered_Selfie_On_File?: string;
  };
  PartnerParams: {
    job_id: string;
    user_id: string;
    job_type: number;
  };
  Source: string;
  ResultType: string;
  SmileJobID?: string;
  signature?: string;
  timestamp?: string;
}

const SIGNATURE_REPLAY_WINDOW_SECONDS = 15 * 60;

function normalizeSignature(value: string): string {
  return value.trim().replace(/^sha256=/i, "");
}

function timingSafeCompare(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  const maxLength = Math.max(aBytes.length, bBytes.length);

  let mismatch = aBytes.length === bBytes.length ? 0 : 1;
  for (let i = 0; i < maxLength; i++) {
    const left = i < aBytes.length ? aBytes[i] : 0;
    const right = i < bBytes.length ? bBytes[i] : 0;
    mismatch |= left ^ right;
  }

  return mismatch === 0;
}

async function signPayload(
  secret: string,
  payload: string,
): Promise<{ hex: string; base64: string }> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  const bytes = new Uint8Array(signatureBuffer);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const base64 = btoa(String.fromCharCode(...bytes));

  return { hex, base64 };
}

function isRecentTimestamp(
  value: string,
  windowSeconds = SIGNATURE_REPLAY_WINDOW_SECONDS,
): boolean {
  const trimmed = value.trim();
  let tsMs: number | null = null;

  if (/^\d+$/.test(trimmed)) {
    const parsed = Number(trimmed);
    tsMs = parsed > 1_000_000_000_000 ? parsed : parsed * 1000;
  } else {
    const parsed = Date.parse(trimmed);
    tsMs = Number.isNaN(parsed) ? null : parsed;
  }

  if (!tsMs) return false;
  const skewMs = Math.abs(Date.now() - tsMs);
  return skewMs <= windowSeconds * 1000;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const rawBody = await req.text();
    if (!rawBody) {
      return new Response(
        JSON.stringify({ error: "Missing callback payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Parse the callback payload
    const callbackData: SmileIDCallback = JSON.parse(rawBody);
    console.log("[SmileID Webhook] Callback received", {
      job_id: callbackData?.PartnerParams?.job_id,
      result_code: callbackData?.ResultCode,
      result_type: callbackData?.ResultType,
    });

    // Validate required fields
    if (!callbackData.PartnerParams?.job_id) {
      return new Response(
        JSON.stringify({ error: "Missing job_id in callback data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Enforce webhook authenticity and replay resistance.
    const smileSignature = req.headers.get("x-smile-signature") ||
      callbackData.signature;
    const webhookSecret = Deno.env.get("SMILE_ID_WEBHOOK_SECRET") ||
      Deno.env.get("SMILE_ID_API_KEY");
    const callbackTimestamp = req.headers.get("x-smile-timestamp") ||
      callbackData.timestamp;

    if (!webhookSecret) {
      console.error(
        "[SmileID Webhook] Missing SMILE_ID_WEBHOOK_SECRET / SMILE_ID_API_KEY",
      );
      return new Response(
        JSON.stringify({ error: "Webhook misconfigured: missing secret" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!smileSignature) {
      return new Response(
        JSON.stringify({ error: "Missing webhook signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const calculatedSignature = await signPayload(webhookSecret, rawBody);
    const providedSignature = normalizeSignature(smileSignature);
    const signatureIsValid = timingSafeCompare(
      providedSignature,
      normalizeSignature(calculatedSignature.hex),
    ) ||
      timingSafeCompare(
        providedSignature,
        normalizeSignature(calculatedSignature.base64),
      );

    if (!signatureIsValid) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (callbackTimestamp && !isRecentTimestamp(callbackTimestamp)) {
      return new Response(
        JSON.stringify({ error: "Stale webhook timestamp" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { ResultCode, ResultText, Actions, PartnerParams } = callbackData;
    const jobId = PartnerParams.job_id;
    const userId = PartnerParams.user_id;

    // Determine verification status based on Smile ID result codes
    let verificationStatus: string;

    // Smile ID Result Codes:
    // 0100 - Verified
    // 0101 - Verified with pending review
    // 0102 - Verified but actions partial
    // 0200 - Rejected - ID mismatch
    // 0201 - Rejected - No match found
    // 0210 - Rejected - Document expired
    // 0220 - Rejected - Suspected fraud
    // 1000+ - Various rejection reasons

    if (
      ResultCode === "0100" || ResultCode === "0101" || ResultCode === "0102"
    ) {
      verificationStatus = VerificationStatus.VERIFIED;
    } else if (ResultCode?.startsWith("02") || ResultCode?.startsWith("1")) {
      verificationStatus = VerificationStatus.REJECTED;
    } else {
      verificationStatus = VerificationStatus.REQUIRES_REVIEW;
    }

    const verifiedAt = verificationStatus === VerificationStatus.VERIFIED
      ? new Date().toISOString()
      : null;

    // Determine if this is business or identity verification
    const isBusinessVerification = jobId.includes("_biz_");

    if (isBusinessVerification) {
      // Extract company ID from job_id format: afrikoni_biz_{companyId}_{timestamp}
      const companyId = jobId.split("_")[2];

      // Update company verification status
      const { error: companyError } = await supabase
        .from("companies")
        .update({
          verification_status: verificationStatus,
          verified_at: verifiedAt,
          verification_result_code: ResultCode,
          verification_result_text: ResultText,
          verification_actions: Actions,
        })
        .eq("smile_id_job_id", jobId);

      if (companyError) {
        console.error("[SmileID Webhook] Company update error:", companyError);
        throw companyError;
      }

      // Update verification job record
      const { error: jobError } = await supabase
        .from("verification_jobs")
        .update({
          status: verificationStatus,
          result_code: ResultCode,
          result_text: ResultText,
          response_payload: callbackData,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", jobId);

      if (jobError) {
        console.error("[SmileID Webhook] Job update error:", jobError);
        // Don't throw - main update succeeded
      }

      // Create notification for company users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("company_id", companyId);

      if (profiles && profiles.length > 0) {
        const notifications = profiles.map((profile) => ({
          user_id: profile.id,
          type: verificationStatus === VerificationStatus.VERIFIED
            ? "verification_success"
            : "verification_update",
          title: verificationStatus === VerificationStatus.VERIFIED
            ? "Business Verification Complete!"
            : "Verification Status Update",
          message: verificationStatus === VerificationStatus.VERIFIED
            ? "Congratulations! Your business has been verified. You now have access to all Afrikoni trade features and can start receiving orders."
            : `Verification update: ${
              ResultText ||
              "Please review your verification status in your dashboard."
            }`,
          read: false,
          created_at: new Date().toISOString(),
        }));

        await supabase.from("notifications").insert(notifications);
      }

      // Log verification event
      await supabase.from("activity_logs").insert({
        entity_type: "company",
        entity_id: companyId,
        action: "VERIFICATION_CALLBACK_RECEIVED",
        metadata: {
          job_id: jobId,
          status: verificationStatus,
          result_code: ResultCode,
          result_text: ResultText,
        },
        created_at: new Date().toISOString(),
      });

      console.log(
        `[SmileID Webhook] Business verification completed for company ${companyId}: ${verificationStatus}`,
      );

      return new Response(
        JSON.stringify({
          success: true,
          type: "business_verification",
          companyId,
          status: verificationStatus,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } else {
      // Identity verification
      const profileUserId = jobId.split("_")[2];

      // Update profile KYC status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          kyc_status: verificationStatus,
          kyc_verified_at: verifiedAt,
          kyc_result_code: ResultCode,
          kyc_result_text: ResultText,
        })
        .eq("smile_id_job_id", jobId);

      if (profileError) {
        console.error("[SmileID Webhook] Profile update error:", profileError);
        throw profileError;
      }

      // Update verification job record
      await supabase
        .from("verification_jobs")
        .update({
          status: verificationStatus,
          result_code: ResultCode,
          result_text: ResultText,
          response_payload: callbackData,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", jobId);

      // Create notification for user
      await supabase.from("notifications").insert({
        user_id: profileUserId,
        type: verificationStatus === VerificationStatus.VERIFIED
          ? "kyc_success"
          : "kyc_update",
        title: verificationStatus === VerificationStatus.VERIFIED
          ? "Identity Verification Complete!"
          : "KYC Status Update",
        message: verificationStatus === VerificationStatus.VERIFIED
          ? "Your identity has been verified. You can now access all platform features."
          : `KYC update: ${
            ResultText || "Please check your verification status."
          }`,
        read: false,
        created_at: new Date().toISOString(),
      });

      // Log verification event
      await supabase.from("activity_logs").insert({
        entity_type: "profile",
        entity_id: profileUserId,
        action: "KYC_CALLBACK_RECEIVED",
        metadata: {
          job_id: jobId,
          status: verificationStatus,
          result_code: ResultCode,
          result_text: ResultText,
        },
        created_at: new Date().toISOString(),
      });

      console.log(
        `[SmileID Webhook] Identity verification completed for user ${profileUserId}: ${verificationStatus}`,
      );

      return new Response(
        JSON.stringify({
          success: true,
          type: "identity_verification",
          userId: profileUserId,
          status: verificationStatus,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("[SmileID Webhook] Error:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error";

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
