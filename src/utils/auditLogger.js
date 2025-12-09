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
    
    // For client-side, use ipapi.co API
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) throw new Error('IP API failed');
    
    const data = await response.json();
    return {
      ip_address: data.ip || 'unknown',
      country: data.country_name || data.country_code || 'Unknown',
      country_code: data.country_code || 'XX',
      city: data.city || null,
      region: data.region || null
    };
  } catch (error) {
    console.warn('Failed to get IP/country:', error);
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
 * Determine actor type from user role
 */
function getActorType(profile) {
  if (!profile) return 'system';
  
  if (profile.role === 'admin') return 'admin';
  if (profile.role === 'buyer') return 'buyer';
  if (profile.role === 'seller') return 'supplier';
  if (profile.role === 'hybrid') return 'hybrid';
  if (profile.role === 'logistics') return 'logistics';
  
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
    const actor_type = getActorType(profile);
    
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

