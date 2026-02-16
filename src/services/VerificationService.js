/**
 * VerificationService - Smile ID Integration for Supplier Verification
 *
 * ⚠️ DISABLED FOR MVP - KYC/Identity verification will be added later
 * 
 * This service provides automated KYC/KYB verification for African businesses using Smile ID.
 * Currently disabled to avoid API key exposure. Will be migrated to Edge Function when needed.
 *
 * VERIFICATION FLOW (when enabled):
 * 1. Business submits verification request → initiateBusinessVerification()
 * 2. Smile ID processes documents → webhook callback
 * 3. Update company verification status → handleVerificationCallback()
 *
 * SUPPORTED VERIFICATION TYPES:
 * - Business Registration: CAC (Nigeria), CIPC (South Africa), etc.
 * - Identity Verification: NIN, BVN, Passport, Driver's License
 * - Enhanced Due Diligence: UBO verification, sanctions screening
 * 
 * TODO: Create Edge Function for Smile ID when KYC is needed
 */

import { supabase } from '@/api/supabaseClient';

// ✅ VERIFICATION ENABLED - Requires Production Keys / Edge Function
const VERIFICATION_ENABLED = true;

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
 * Generate Smile ID signature for API authentication
 * ⚠️ DISABLED - Will be moved to Edge Function
 * @param {string} timestamp - Current timestamp
 * @returns {string} - HMAC signature
 */
async function generateSignature(timestamp) {
  throw new Error('Smile ID verification is disabled. Use manual review for MVP.');
}

/**
 * Initiate business verification with Smile ID
 * ⚠️ CURRENTLY DISABLED - Returns mock pending status for MVP
 * 
 * @param {Object} params - Verification parameters
 * @param {string} params.companyId - Afrikoni company UUID
 * @param {string} params.registrationNumber - Business registration number (e.g., CAC number)
 * @param {string} params.countryCode - ISO 3166-1 alpha-2 country code (e.g., 'NG', 'ZA', 'KE')
 * @param {string} params.companyName - Registered company name
 * @param {Object} params.documents - Supporting documents { registration_cert, tax_clearance, etc. }
 * @returns {Promise<{success: boolean, jobId: string, message: string}>}
 */
export async function verifyBusiness({
  companyId,
  registrationNumber,
  countryCode,
  companyName,
  documents = {}
}) {
  // Return mock response for MVP - verification disabled
  if (!VERIFICATION_ENABLED) {
    console.warn('[VerificationService] Verification disabled for MVP. KYC will be added later.');

    // Update company status to pending (manual review)
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        verification_status: VerificationStatus.PENDING,
        verification_notes: 'Manual verification required - automated KYC not yet enabled',
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('[VerificationService] Database update error:', updateError);
    }

    return {
      success: true,
      jobId: `manual_review_${companyId}`,
      message: 'Verification request submitted for manual review',
      status: VerificationStatus.PENDING
    };
  }

  try {
    // Validate required fields
    if (!companyId || !registrationNumber || !countryCode) {
      throw new Error('Missing required verification fields: companyId, registrationNumber, countryCode');
    }

    const timestamp = new Date().toISOString();
    const signature = await generateSignature(timestamp);

    // Prepare Smile ID business verification request
    const verificationPayload = {
      partner_id: SMILE_ID_PARTNER_ID,
      timestamp,
      signature,
      partner_params: {
        job_id: `afrikoni_biz_${companyId}_${Date.now()}`,
        user_id: companyId,
        job_type: 7 // Business Verification job type
      },
      country: countryCode,
      id_type: getBusinessIdType(countryCode),
      id_number: registrationNumber,
      company_name: companyName,
      callback_url: SMILE_ID_CALLBACK_URL,
      source_sdk: 'afrikoni_web',
      source_sdk_version: '1.0.0'
    };

    // Add document URLs if provided
    if (documents.registration_cert) {
      verificationPayload.documents = {
        registration_certificate: documents.registration_cert
      };
    }

    // Make API call to Smile ID
    const response = await fetch(`${SMILE_ID_API_URL}/business_verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SMILE_ID_API_KEY}`
      },
      body: JSON.stringify(verificationPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[VerificationService] Smile ID API error:', result);
      throw new Error(result.message || 'Business verification request failed');
    }

    // Update company verification status in database
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
      // Don't throw - verification was initiated successfully
    }

    // Log verification attempt
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

    // Log failure
    await logVerificationEvent(companyId, 'VERIFICATION_FAILED', {
      error: error.message
    });

    throw error;
  }
}

/**
 * Initiate identity verification for a company representative
 * @param {Object} params - Verification parameters
 * @param {string} params.companyId - Afrikoni company UUID
 * @param {string} params.userId - User's profile UUID
 * @param {string} params.idType - ID type (e.g., 'NIN', 'BVN', 'PASSPORT')
 * @param {string} params.idNumber - ID number
 * @param {string} params.countryCode - ISO country code
 * @param {Object} params.personalInfo - { first_name, last_name, dob }
 * @param {string} params.selfieImage - Base64 encoded selfie image
 * @returns {Promise<{success: boolean, jobId: string, message: string}>}
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
    // Validate required fields
    if (!companyId || !userId || !idType || !idNumber) {
      throw new Error('Missing required identity verification fields');
    }

    const timestamp = new Date().toISOString();
    const signature = await generateSignature(timestamp);

    // Prepare Smile ID identity verification request
    const verificationPayload = {
      partner_id: SMILE_ID_PARTNER_ID,
      timestamp,
      signature,
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
      dob: personalInfo.dob, // Format: YYYY-MM-DD
      callback_url: SMILE_ID_CALLBACK_URL,
      source_sdk: 'afrikoni_web',
      source_sdk_version: '1.0.0'
    };

    // Add selfie if provided (for biometric verification)
    if (selfieImage) {
      verificationPayload.images = [{
        image_type_id: 2, // Selfie
        image: selfieImage.replace(/^data:image\/\w+;base64,/, '')
      }];
    }

    // Make API call to Smile ID
    const response = await fetch(`${SMILE_ID_API_URL}/id_verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SMILE_ID_API_KEY}`
      },
      body: JSON.stringify(verificationPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[VerificationService] Smile ID API error:', result);
      throw new Error(result.message || 'Identity verification request failed');
    }

    // Update profile with verification job ID
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

    // Log verification attempt
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
 * Handle Smile ID webhook callback
 * @param {Object} callbackData - Webhook payload from Smile ID
 * @returns {Promise<{success: boolean, companyId: string, status: string}>}
 */
export async function handleVerificationCallback(callbackData) {
  try {
    const {
      ResultCode,
      ResultText,
      Actions,
      PartnerParams,
      Source,
      ResultType
    } = callbackData;

    const jobId = PartnerParams?.job_id;
    const userId = PartnerParams?.user_id;

    if (!jobId) {
      throw new Error('Missing job_id in callback data');
    }

    // Determine verification status based on Smile ID result codes
    let verificationStatus;
    let verifiedAt = null;

    // Smile ID Result Codes:
    // 0100 - Verified
    // 0101 - Verified with pending review
    // 0200 - Rejected - ID mismatch
    // 0201 - Rejected - No match found
    // 0210 - Rejected - Document expired
    // 1000+ - Various rejection reasons
    if (ResultCode === '0100' || ResultCode === '0101') {
      verificationStatus = VerificationStatus.VERIFIED;
      verifiedAt = new Date().toISOString();
    } else if (ResultCode?.startsWith('02') || ResultCode?.startsWith('1')) {
      verificationStatus = VerificationStatus.REJECTED;
    } else {
      verificationStatus = VerificationStatus.REQUIRES_REVIEW;
    }

    // Determine if this is a business or identity verification
    const isBusinessVerification = jobId.includes('_biz_');

    if (isBusinessVerification) {
      // Extract company ID from job_id format: afrikoni_biz_{companyId}_{timestamp}
      const companyId = jobId.split('_')[2];

      // Update company verification status
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

      if (updateError) {
        console.error('[VerificationService] Company update error:', updateError);
        throw updateError;
      }

      // Log verification result
      await logVerificationEvent(companyId, 'VERIFICATION_COMPLETED', {
        job_id: jobId,
        status: verificationStatus,
        result_code: ResultCode,
        result_text: ResultText
      });

      // Create notification for company owner
      await createVerificationNotification(companyId, verificationStatus, ResultText);

      return {
        success: true,
        companyId,
        status: verificationStatus
      };

    } else {
      // Identity verification - extract user ID
      const profileUserId = jobId.split('_')[2];

      // Update profile verification status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          kyc_status: verificationStatus,
          kyc_verified_at: verifiedAt,
          kyc_result_code: ResultCode,
          kyc_result_text: ResultText
        })
        .eq('smile_id_job_id', jobId);

      if (updateError) {
        console.error('[VerificationService] Profile update error:', updateError);
        throw updateError;
      }

      return {
        success: true,
        userId: profileUserId,
        status: verificationStatus
      };
    }

  } catch (error) {
    console.error('[VerificationService] handleVerificationCallback error:', error);
    throw error;
  }
}

/**
 * Check verification status for a company
 * @param {string} companyId - Company UUID
 * @returns {Promise<{status: string, verifiedAt: string|null, details: Object}>}
 */
export async function getVerificationStatus(companyId) {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('verification_status, verified_at, verification_result_text, smile_id_job_id')
      .eq('id', companyId)
      .single();

    if (error) {
      throw error;
    }

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

/**
 * Get appropriate business ID type based on country
 * @param {string} countryCode - ISO country code
 * @returns {string} - Smile ID business verification type
 */
function getBusinessIdType(countryCode) {
  const businessIdTypes = {
    'NG': 'CAC', // Corporate Affairs Commission (Nigeria)
    'ZA': 'CIPC', // Companies and Intellectual Property Commission (South Africa)
    'KE': 'BRS', // Business Registration Service (Kenya)
    'GH': 'RGD', // Registrar General's Department (Ghana)
    'EG': 'GAFI', // General Authority for Investment (Egypt)
    'MA': 'RC', // Registre du Commerce (Morocco)
    'TZ': 'BRELA', // Business Registrations and Licensing Agency (Tanzania)
    'UG': 'URSB', // Uganda Registration Services Bureau
    'RW': 'RDB', // Rwanda Development Board
    'ET': 'MoTI', // Ministry of Trade and Industry (Ethiopia)
    'CI': 'RC', // Registre du Commerce (Ivory Coast)
    'SN': 'NINEA', // Numéro d'Identification Nationale des Entreprises (Senegal)
    'CM': 'RC', // Registre du Commerce (Cameroon)
    'ZM': 'PACRA', // Patents and Companies Registration Agency (Zambia)
    'ZW': 'ZIA', // Zimbabwe Investment Authority
    'MW': 'RG', // Registrar General (Malawi)
    'BW': 'CIPA', // Companies and Intellectual Property Authority (Botswana)
    'NA': 'BIPA', // Business and Intellectual Property Authority (Namibia)
    'MU': 'CBRD', // Corporate and Business Registration Department (Mauritius)
    'AO': 'IRSEA' // Instituto de Registo de Sociedades Comerciais (Angola)
  };

  return businessIdTypes[countryCode] || 'BUSINESS_REGISTRATION';
}

/**
 * Log verification event for audit trail
 * @param {string} companyId - Company UUID
 * @param {string} eventType - Event type
 * @param {Object} eventData - Event details
 */
async function logVerificationEvent(companyId, eventType, eventData) {
  try {
    await supabase
      .from('activity_logs')
      .insert({
        entity_type: 'company',
        entity_id: companyId,
        action: eventType,
        metadata: eventData,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('[VerificationService] Failed to log verification event:', error);
    // Don't throw - logging should not break the main flow
  }
}

/**
 * Create notification for verification result
 * @param {string} companyId - Company UUID
 * @param {string} status - Verification status
 * @param {string} message - Result message
 */
async function createVerificationNotification(companyId, status, message) {
  try {
    // Get company owner's profile ID
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single();

    if (!company) return;

    // Get profiles associated with this company
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('company_id', companyId);

    if (!profiles?.length) return;

    // Create notification for each profile
    const notifications = profiles.map(profile => ({
      user_id: profile.id,
      type: status === VerificationStatus.VERIFIED ? 'verification_success' : 'verification_update',
      title: status === VerificationStatus.VERIFIED
        ? 'Business Verification Complete'
        : 'Verification Status Update',
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
 * @param {string} companyId - Company UUID
 * @returns {Promise<{success: boolean}>}
 */
export async function triggerReVerification(companyId) {
  try {
    // Reset verification status
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

    await logVerificationEvent(companyId, 'VERIFICATION_RESET', {
      reason: 'Admin triggered re-verification'
    });

    /**
     * Utility to check if a company is fully verified for trading
     * @param {string} companyId - Company UUID
     * @returns {Promise<boolean>}
     */
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
