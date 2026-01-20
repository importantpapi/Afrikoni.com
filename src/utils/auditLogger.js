/**
 * Audit Logger Utility
 * Provides easy-to-use functions for logging critical actions with IP and country detection
 */

import { createAuditLog } from '@/lib/supabaseQueries/admin';

/**
 * Get client IP address and country
 * Uses ipapi.co free tier (1000 requests/day)
 * Falls back to Vercel headers if available
 */
export async function getClientIPAndCountry() {
  try {
    // Try to get IP from Vercel headers first (if deployed on Vercel)
    const vercelIP = typeof window !== 'undefined' 
      ? null // Client-side, can't access headers directly
      : null; // Server-side would use headers, but we're client-side
    
    // ✅ KERNEL-TO-UI ALIGNMENT: Enhanced error handling for ipapi.co failures
    // For client-side, use ipapi.co API
    let response;
    try {
      response = await fetch('https://ipapi.co/json/');
      
      // Handle 429 (Too Many Requests) and other HTTP errors gracefully
      if (!response.ok) {
        if (response.status === 429) {
          console.debug('[IP Detection] Rate limited (429) - using fallback');
          throw new Error('Rate limited');
        }
        throw new Error(`IP API failed with status ${response.status}`);
      }
    } catch (fetchError) {
      // Network errors, CORS, or HTTP errors - use fallback
      console.debug('[IP Detection] Fetch failed (non-critical):', fetchError.message || 'Network error');
      throw fetchError;
    }
    
    const data = await response.json();
    return {
      ip_address: data.ip || 'unknown',
      country: data.country_name || data.country_code || 'Unknown',
      country_code: data.country_code || 'XX',
      city: data.city || null,
      region: data.region || null
    };
  } catch (error) {
    // ✅ KERNEL-TO-UI ALIGNMENT: Silent fallback for all errors (429, network, CORS)
    // Silently fail - CORS error on localhost is expected, rate limits are expected
    // Use fallback values without logging errors to console
    // Fallback values
    return {
      ip_address: 'unknown',
      country: 'Unknown',
      country_code: 'XX',
      city: null,
      region: null
    };
  }
}

/**
 * Determine risk level based on action type
 */
function getRiskLevel(action, metadata = {}) {
  const highRiskActions = [
    'payment_processed',
    'payment_failed',
    'dispute_created',
    'dispute_resolved',
    'verification_rejected',
    'admin_action',
    'account_deleted',
    'password_changed'
  ];
  
  const mediumRiskActions = [
    'order_placed',
    'order_cancelled',
    'verification_submitted',
    'profile_updated',
    'document_uploaded'
  ];
  
  if (highRiskActions.includes(action)) {
    // Check metadata for additional risk factors
    if (metadata.amount && metadata.amount > 10000) return 'high';
    if (metadata.status === 'failed') return 'high';
    return 'medium';
  }
  
  if (mediumRiskActions.includes(action)) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * ✅ KERNEL COMPLIANCE: Determine actor type from is_admin and capabilities
 * @param {Object} profile - User profile object
 * @param {Object} capabilities - Optional capabilities object (from useCapability hook)
 * @returns {string} - Actor type: 'admin', 'buyer', 'supplier', 'logistics', 'hybrid', 'user', 'system'
 */
function getActorType(profile, capabilities = null) {
  if (!profile) return 'system';
  
  // ✅ KERNEL COMPLIANCE: Check is_admin first
  if (profile.is_admin === true) return 'admin';
  
  // ✅ GLOBAL REFACTOR: Derive from capabilities if available
  if (capabilities) {
    const isBuyer = capabilities.can_buy === true;
    const isSeller = capabilities.can_sell === true && capabilities.sell_status === 'approved';
    const isLogistics = capabilities.can_logistics === true && capabilities.logistics_status === 'approved';
    
    if (isSeller && isBuyer) return 'hybrid';
    if (isSeller) return 'supplier';
    if (isLogistics) return 'logistics';
    if (isBuyer) return 'buyer';
  }
  
  // ✅ GLOBAL REFACTOR: Removed legacy role fallback - capabilities should always be provided
  // If no capabilities provided, default to 'user'
  return 'user';
}

/**
 * Main audit logging function
 * Automatically includes IP, country, and risk assessment
 */
export async function logAuditEvent({
  action,
  entity_type = null,
  entity_id = null,
  user = null,
  profile = null,
  company_id = null,
  capabilities = null, // ✅ KERNEL COMPLIANCE: Accept capabilities parameter
  metadata = {},
  status = 'success',
  event_source = 'user'
}) {
  try {
    // Get IP and country
    const { ip_address, country, country_code, city, region } = await getClientIPAndCountry();
    
    // Determine actor information
    const actor_user_id = user?.id || profile?.id || null;
    const actor_company_id = company_id || profile?.company_id || user?.company_id || null;
    const actor_type = getActorType(profile, capabilities); // ✅ KERNEL COMPLIANCE: Pass capabilities
    
    // Determine risk level
    const risk_level = getRiskLevel(action, metadata);
    
    // Create audit log entry
    const logData = {
      actor_user_id,
      actor_company_id,
      actor_type,
      action,
      entity_type,
      entity_id,
      metadata: {
        ...metadata,
        city,
        region,
        country_code
      },
      ip_address,
      country,
      status,
      risk_level,
      event_source
    };
    
    // Create the audit log (don't await to avoid blocking)
    createAuditLog(logData).catch(error => {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should never break the main flow
    });
    
    return logData;
  } catch (error) {
    console.error('Error in audit logging:', error);
    // Silently fail - audit logging should never break the app
    return null;
  }
}

/**
 * Convenience functions for common actions
 */

export async function logPaymentEvent({
  order_id,
  amount,
  currency,
  payment_method,
  status,
  user,
  profile,
  company_id,
  metadata = {}
}) {
  return logAuditEvent({
    action: status === 'success' ? 'payment_processed' : 'payment_failed',
    entity_type: 'order',
    entity_id: order_id,
    user,
    profile,
    company_id,
    metadata: {
      amount,
      currency,
      payment_method,
      ...metadata
    },
    status
  });
}

export async function logOrderEvent({
  action,
  order_id,
  user,
  profile,
  company_id,
  metadata = {}
}) {
  return logAuditEvent({
    action: `order_${action}`, // e.g., order_placed, order_cancelled, order_updated
    entity_type: 'order',
    entity_id: order_id,
    user,
    profile,
    company_id,
    metadata
  });
}

export async function logDisputeEvent({
  action,
  dispute_id,
  order_id,
  user,
  profile,
  company_id,
  metadata = {}
}) {
  return logAuditEvent({
    action: `dispute_${action}`, // e.g., dispute_created, dispute_resolved
    entity_type: 'dispute',
    entity_id: dispute_id,
    user,
    profile,
    company_id,
    metadata: {
      order_id,
      ...metadata
    }
  });
}

export async function logVerificationEvent({
  action,
  verification_id,
  company_id,
  user,
  profile,
  metadata = {}
}) {
  return logAuditEvent({
    action: `verification_${action}`, // e.g., verification_submitted, verification_approved, verification_rejected
    entity_type: 'verification',
    entity_id: verification_id,
    user,
    profile,
    company_id,
    metadata
  });
}

export async function logAdminEvent({
  action,
  entity_type,
  entity_id,
  user,
  profile,
  metadata = {}
}) {
  return logAuditEvent({
    action: `admin_${action}`,
    entity_type,
    entity_id,
    user,
    profile,
    metadata: {
      ...metadata,
      admin_action: true
    },
    event_source: 'admin'
  });
}

export async function logLoginEvent({
  user,
  profile,
  success = true
}) {
  return logAuditEvent({
    action: success ? 'login_success' : 'login_failed',
    entity_type: 'user',
    entity_id: user?.id,
    user,
    profile,
    status: success ? 'success' : 'failed',
    metadata: {
      login_method: 'email' // Could be 'oauth', 'magic_link', etc.
    }
  });
}

export async function logLogoutEvent({
  user,
  profile
}) {
  return logAuditEvent({
    action: 'logout',
    entity_type: 'user',
    entity_id: user?.id,
    user,
    profile,
    metadata: {}
  });
}

