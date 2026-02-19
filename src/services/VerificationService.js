/**
 * VerificationService - Smile ID Integration for Supplier Verification
 *
 * This service provides automated KYC/KYB verification for African businesses using Smile ID.
 * It connects to the `smile-id-verify` Edge Function for secure proxying.
 *
 * VERIFICATION FLOW:
 * 1. Business submits verification request → initiateBusinessVerification()
 * 2. Edge Function handles signature and contacts Smile ID.
 * 3. Smile ID processes documents → webhook callback (`smile-id-webhook`)
 * 4. Update company verification status.
 */

import { supabase } from '@/api/supabaseClient';

// Verification Status Enum
export const VerificationStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  REQUIRES_REVIEW: 'REQUIRES_REVIEW'
};

// Verification Types
export const VerificationType = {
  BUSINESS: 'business_verification',
  IDENTITY: 'identity_verification',
  ENHANCED_KYC: 'enhanced_kyc'
};

/**
 * Initiate business verification with Smile ID
 */
export async function verifyBusiness({
  companyId,
  registrationNumber,
  countryCode,
  companyName,
  documents = {}
}) {
  try {
    if (!companyId || !registrationNumber || !countryCode) {
      throw new Error('Missing required verification fields: companyId, registrationNumber, countryCode');
    }

    const verificationPayload = {
      partner_params: {
        job_id: `afrikoni_biz_${companyId}_${Date.now()}`,
        user_id: companyId,
        job_type: 7 // Business Verification job type
      },
      country: countryCode,
      id_type: getBusinessIdType(countryCode),
      id_number: registrationNumber,
      company_name: companyName,
      callback_url: 'https://afrikoni.com/api/webhooks/smile-id', // Replaced in production via env
      source_sdk: 'afrikoni_web',
      source_sdk_version: '1.0.0'
    };

    if (documents.registration_cert) {
      verificationPayload.documents = {
        registration_certificate: documents.registration_cert
      };
    }

    // Call Edge Function
    const { data: result, error: fetchError } = await supabase.functions.invoke('smile-id-verify', {
      body: {
        verificationPayload,
        endpoint: 'business_verification'
      }
    });

    if (fetchError || !result) {
      throw new Error(fetchError?.message || 'Business verification request failed');
    }

    // Update company verification status
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        verification_status: VerificationStatus.IN_PROGRESS,
        smile_id_job_id: verificationPayload.partner_params.job_id,
        verification_initiated_at: new Date().toISOString(),
        verification_type: VerificationType.BUSINESS
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('[VerificationService] Database update error:', updateError);
    }

    await logVerificationEvent(companyId, 'VERIFICATION_INITIATED', {
      job_id: verificationPayload.partner_params.job_id,
      country: countryCode,
      verification_type: VerificationType.BUSINESS
    });

    return {
      success: true,
      jobId: verificationPayload.partner_params.job_id,
      message: 'Business verification initiated successfully'
    };

  } catch (error) {
    console.error('[VerificationService] verifyBusiness error:', error);
    await logVerificationEvent(companyId, 'VERIFICATION_FAILED', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Initiate identity verification for a company representative
 */
export async function verifyIdentity({
  companyId,
  userId,
  idType,
  idNumber,
  countryCode,
  personalInfo = {},
  selfieImage
}) {
  try {
    if (!companyId || !userId || !idType || !idNumber) {
      throw new Error('Missing required identity verification fields');
    }

    const verificationPayload = {
      partner_params: {
        job_id: `afrikoni_kyc_${userId}_${Date.now()}`,
        user_id: userId,
        job_type: 5 // Enhanced KYC job type
      },
      country: countryCode,
      id_type: idType,
      id_number: idNumber,
      first_name: personalInfo.first_name,
      last_name: personalInfo.last_name,
      dob: personalInfo.dob,
      callback_url: 'https://afrikoni.com/api/webhooks/smile-id',
      source_sdk: 'afrikoni_web',
      source_sdk_version: '1.0.0'
    };

    if (selfieImage) {
      verificationPayload.images = [{
        image_type_id: 2, // Selfie
        image: selfieImage.replace(/^data:image\/\w+;base64,/, '')
      }];
    }

    // Call Edge Function
    const { data: result, error: fetchError } = await supabase.functions.invoke('smile-id-verify', {
      body: {
        verificationPayload,
        endpoint: 'id_verification'
      }
    });

    if (fetchError || !result) {
      throw new Error(fetchError?.message || 'Identity verification request failed');
    }

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        kyc_status: VerificationStatus.IN_PROGRESS,
        smile_id_job_id: verificationPayload.partner_params.job_id,
        kyc_initiated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[VerificationService] Profile update error:', updateError);
    }

    await logVerificationEvent(companyId, 'IDENTITY_VERIFICATION_INITIATED', {
      job_id: verificationPayload.partner_params.job_id,
      user_id: userId,
      id_type: idType
    });

    return {
      success: true,
      jobId: verificationPayload.partner_params.job_id,
      message: 'Identity verification initiated successfully'
    };

  } catch (error) {
    console.error('[VerificationService] verifyIdentity error:', error);
    await logVerificationEvent(companyId, 'IDENTITY_VERIFICATION_FAILED', {
      user_id: userId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Handle Smile ID webhook callback manually if needed, otherwise Edge function handles it
 */
export async function handleVerificationCallback(callbackData) {
  try {
    const { ResultCode, ResultText, Actions, PartnerParams, Source, ResultType } = callbackData;
    const jobId = PartnerParams?.job_id;
    const userId = PartnerParams?.user_id;

    if (!jobId) throw new Error('Missing job_id in callback data');

    let verificationStatus;
    let verifiedAt = null;

    if (ResultCode === '0100' || ResultCode === '0101') {
      verificationStatus = VerificationStatus.VERIFIED;
      verifiedAt = new Date().toISOString();
    } else if (ResultCode?.startsWith('02') || ResultCode?.startsWith('1')) {
      verificationStatus = VerificationStatus.REJECTED;
    } else {
      verificationStatus = VerificationStatus.REQUIRES_REVIEW;
    }

    const isBusinessVerification = jobId.includes('_biz_');

    if (isBusinessVerification) {
      const companyId = jobId.split('_')[2];
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          verification_status: verificationStatus,
          verified_at: verifiedAt,
          verification_result_code: ResultCode,
          verification_result_text: ResultText,
          verification_actions: Actions
        })
        .eq('smile_id_job_id', jobId);

      if (updateError) throw updateError;

      await logVerificationEvent(companyId, 'VERIFICATION_COMPLETED', {
        job_id: jobId,
        status: verificationStatus,
        result_code: ResultCode,
        result_text: ResultText
      });

      await createVerificationNotification(companyId, verificationStatus, ResultText);

      return { success: true, companyId, status: verificationStatus };
    } else {
      const profileUserId = jobId.split('_')[2];
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          kyc_status: verificationStatus,
          kyc_verified_at: verifiedAt,
          kyc_result_code: ResultCode,
          kyc_result_text: ResultText
        })
        .eq('smile_id_job_id', jobId);

      if (updateError) throw updateError;
      return { success: true, userId: profileUserId, status: verificationStatus };
    }
  } catch (error) {
    console.error('[VerificationService] handleVerificationCallback error:', error);
    throw error;
  }
}

/**
 * Check verification status
 */
export async function getVerificationStatus(companyId) {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('verification_status, verified_at, verification_result_text, smile_id_job_id')
      .eq('id', companyId)
      .single();

    if (error) throw error;

    return {
      status: data?.verification_status || VerificationStatus.PENDING,
      verifiedAt: data?.verified_at,
      jobId: data?.smile_id_job_id,
      details: {
        resultText: data?.verification_result_text
      }
    };
  } catch (error) {
    console.error('[VerificationService] getVerificationStatus error:', error);
    throw error;
  }
}

function getBusinessIdType(countryCode) {
  const businessIdTypes = {
    'NG': 'CAC', 'ZA': 'CIPC', 'KE': 'BRS', 'GH': 'RGD', 'EG': 'GAFI',
    'MA': 'RC', 'TZ': 'BRELA', 'UG': 'URSB', 'RW': 'RDB', 'ET': 'MoTI',
    'CI': 'RC', 'SN': 'NINEA', 'CM': 'RC', 'ZM': 'PACRA', 'ZW': 'ZIA',
    'MW': 'RG', 'BW': 'CIPA', 'NA': 'BIPA', 'MU': 'CBRD', 'AO': 'IRSEA'
  };
  return businessIdTypes[countryCode] || 'BUSINESS_REGISTRATION';
}

async function logVerificationEvent(companyId, eventType, eventData) {
  try {
    await supabase.from('activity_logs').insert({
      entity_type: 'company',
      entity_id: companyId,
      action: eventType,
      metadata: eventData,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[VerificationService] Failed to log event:', error);
  }
}

async function createVerificationNotification(companyId, status, message) {
  try {
    const { data: company } = await supabase.from('companies').select('id').eq('id', companyId).single();
    if (!company) return;

    const { data: profiles } = await supabase.from('profiles').select('id').eq('company_id', companyId);
    if (!profiles?.length) return;

    const notifications = profiles.map(profile => ({
      user_id: profile.id,
      type: status === VerificationStatus.VERIFIED ? 'verification_success' : 'verification_update',
      title: status === VerificationStatus.VERIFIED ? 'Business Verification Complete' : 'Verification Status Update',
      message: status === VerificationStatus.VERIFIED
        ? 'Congratulations! Your business has been verified. You now have access to all Afrikoni features.'
        : `Verification update: ${message || 'Please check your verification status.'}`,
      read: false,
      created_at: new Date().toISOString()
    }));

    await supabase.from('notifications').insert(notifications);
  } catch (error) {
    console.error('[VerificationService] Failed to create notification:', error);
  }
}

/**
 * Manually trigger re-verification (admin only)
 */
export async function triggerReVerification(companyId) {
  try {
    const { error } = await supabase
      .from('companies')
      .update({
        verification_status: VerificationStatus.PENDING,
        smile_id_job_id: null,
        verified_at: null,
        verification_result_code: null,
        verification_result_text: null
      })
      .eq('id', companyId);

    if (error) throw error;
    await logVerificationEvent(companyId, 'VERIFICATION_RESET', { reason: 'Admin triggered re-verification' });
    return { success: true };
  } catch (error) {
    console.error('triggerReVerification error:', error);
    throw error;
  }
}

export async function isCompanyVerified(companyId) {
  if (!companyId) return false;
  const { status } = await getVerificationStatus(companyId);
  return status === VerificationStatus.VERIFIED;
}

export default {
  verifyBusiness,
  verifyIdentity,
  handleVerificationCallback,
  getVerificationStatus,
  isCompanyVerified,
  triggerReVerification,
  VerificationStatus,
  VerificationType
};
