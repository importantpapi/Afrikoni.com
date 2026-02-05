/**
 * Supabase Edge Function: Smile ID Webhook Handler
 *
 * Handles verification callbacks from Smile ID for business and identity verification.
 * This function is invoked when Smile ID completes a verification job.
 *
 * Endpoint: POST /functions/v1/smile-id-webhook
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-smile-signature',
}

// Verification status mapping
const VerificationStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  REQUIRES_REVIEW: 'REQUIRES_REVIEW'
}

interface SmileIDCallback {
  ResultCode: string
  ResultText: string
  Actions?: {
    Verify_ID_Number: string
    Return_Personal_Info: string
    Human_Review_Compare?: string
    Liveness_Check?: string
    Register_Selfie?: string
    Selfie_To_ID_Card_Compare?: string
    Update_Registered_Selfie_On_File?: string
  }
  PartnerParams: {
    job_id: string
    user_id: string
    job_type: number
  }
  Source: string
  ResultType: string
  SmileJobID?: string
  signature?: string
  timestamp?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the callback payload
    const callbackData: SmileIDCallback = await req.json()
    console.log('[SmileID Webhook] Received callback:', JSON.stringify(callbackData, null, 2))

    // Validate required fields
    if (!callbackData.PartnerParams?.job_id) {
      return new Response(
        JSON.stringify({ error: 'Missing job_id in callback data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify signature if provided (recommended for production)
    const smileSignature = req.headers.get('x-smile-signature')
    const smileApiKey = Deno.env.get('SMILE_ID_API_KEY')

    // Note: In production, implement signature verification here
    // using the Smile ID signature validation algorithm

    // Create Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { ResultCode, ResultText, Actions, PartnerParams } = callbackData
    const jobId = PartnerParams.job_id
    const userId = PartnerParams.user_id

    // Determine verification status based on Smile ID result codes
    let verificationStatus: string

    // Smile ID Result Codes:
    // 0100 - Verified
    // 0101 - Verified with pending review
    // 0102 - Verified but actions partial
    // 0200 - Rejected - ID mismatch
    // 0201 - Rejected - No match found
    // 0210 - Rejected - Document expired
    // 0220 - Rejected - Suspected fraud
    // 1000+ - Various rejection reasons

    if (ResultCode === '0100' || ResultCode === '0101' || ResultCode === '0102') {
      verificationStatus = VerificationStatus.VERIFIED
    } else if (ResultCode?.startsWith('02') || ResultCode?.startsWith('1')) {
      verificationStatus = VerificationStatus.REJECTED
    } else {
      verificationStatus = VerificationStatus.REQUIRES_REVIEW
    }

    const verifiedAt = verificationStatus === VerificationStatus.VERIFIED
      ? new Date().toISOString()
      : null

    // Determine if this is business or identity verification
    const isBusinessVerification = jobId.includes('_biz_')

    if (isBusinessVerification) {
      // Extract company ID from job_id format: afrikoni_biz_{companyId}_{timestamp}
      const companyId = jobId.split('_')[2]

      // Update company verification status
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          verification_status: verificationStatus,
          verified_at: verifiedAt,
          verification_result_code: ResultCode,
          verification_result_text: ResultText,
          verification_actions: Actions
        })
        .eq('smile_id_job_id', jobId)

      if (companyError) {
        console.error('[SmileID Webhook] Company update error:', companyError)
        throw companyError
      }

      // Update verification job record
      const { error: jobError } = await supabase
        .from('verification_jobs')
        .update({
          status: verificationStatus,
          result_code: ResultCode,
          result_text: ResultText,
          response_payload: callbackData,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('job_id', jobId)

      if (jobError) {
        console.error('[SmileID Webhook] Job update error:', jobError)
        // Don't throw - main update succeeded
      }

      // Create notification for company users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', companyId)

      if (profiles && profiles.length > 0) {
        const notifications = profiles.map(profile => ({
          user_id: profile.id,
          type: verificationStatus === VerificationStatus.VERIFIED
            ? 'verification_success'
            : 'verification_update',
          title: verificationStatus === VerificationStatus.VERIFIED
            ? 'Business Verification Complete!'
            : 'Verification Status Update',
          message: verificationStatus === VerificationStatus.VERIFIED
            ? 'Congratulations! Your business has been verified. You now have access to all Afrikoni trade features and can start receiving orders.'
            : `Verification update: ${ResultText || 'Please review your verification status in your dashboard.'}`,
          read: false,
          created_at: new Date().toISOString()
        }))

        await supabase.from('notifications').insert(notifications)
      }

      // Log verification event
      await supabase.from('activity_logs').insert({
        entity_type: 'company',
        entity_id: companyId,
        action: 'VERIFICATION_CALLBACK_RECEIVED',
        metadata: {
          job_id: jobId,
          status: verificationStatus,
          result_code: ResultCode,
          result_text: ResultText
        },
        created_at: new Date().toISOString()
      })

      console.log(`[SmileID Webhook] Business verification completed for company ${companyId}: ${verificationStatus}`)

      return new Response(
        JSON.stringify({
          success: true,
          type: 'business_verification',
          companyId,
          status: verificationStatus
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      // Identity verification
      const profileUserId = jobId.split('_')[2]

      // Update profile KYC status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          kyc_status: verificationStatus,
          kyc_verified_at: verifiedAt,
          kyc_result_code: ResultCode,
          kyc_result_text: ResultText
        })
        .eq('smile_id_job_id', jobId)

      if (profileError) {
        console.error('[SmileID Webhook] Profile update error:', profileError)
        throw profileError
      }

      // Update verification job record
      await supabase
        .from('verification_jobs')
        .update({
          status: verificationStatus,
          result_code: ResultCode,
          result_text: ResultText,
          response_payload: callbackData,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('job_id', jobId)

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: profileUserId,
        type: verificationStatus === VerificationStatus.VERIFIED
          ? 'kyc_success'
          : 'kyc_update',
        title: verificationStatus === VerificationStatus.VERIFIED
          ? 'Identity Verification Complete!'
          : 'KYC Status Update',
        message: verificationStatus === VerificationStatus.VERIFIED
          ? 'Your identity has been verified. You can now access all platform features.'
          : `KYC update: ${ResultText || 'Please check your verification status.'}`,
        read: false,
        created_at: new Date().toISOString()
      })

      // Log verification event
      await supabase.from('activity_logs').insert({
        entity_type: 'profile',
        entity_id: profileUserId,
        action: 'KYC_CALLBACK_RECEIVED',
        metadata: {
          job_id: jobId,
          status: verificationStatus,
          result_code: ResultCode,
          result_text: ResultText
        },
        created_at: new Date().toISOString()
      })

      console.log(`[SmileID Webhook] Identity verification completed for user ${profileUserId}: ${verificationStatus}`)

      return new Response(
        JSON.stringify({
          success: true,
          type: 'identity_verification',
          userId: profileUserId,
          status: verificationStatus
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('[SmileID Webhook] Error:', error)

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
