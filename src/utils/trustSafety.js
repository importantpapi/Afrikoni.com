/**
 * Trust Engine Safety Utilities
 * 
 * Ensures trust scores degrade gracefully when data is missing
 * Prevents system errors from blocking users
 * 
 * PHILOSOPHY:
 * - Missing data = low trust, not broken system
 * - New suppliers always visible (just ranked lower)
 * - No user ever blocked by trust engine
 */

/**
 * Safely get trust score with fallback
 * @param {Object} supplier - Supplier object
 * @returns {number} Trust score (0-100)
 */
export function safeTrustScore(supplier) {
  if (!supplier) return 0;
  
  // Handle null/undefined trust_score
  if (typeof supplier.trust_score !== 'number') {
    return 0;
  }
  
  // Clamp between 0-100
  return Math.max(0, Math.min(100, supplier.trust_score));
}

/**
 * Safely get rank score with fallback
 * @param {Object} supplier - Supplier object
 * @returns {number} Rank score (0-100)
 */
export function safeRankScore(supplier) {
  if (!supplier) return 0;
  
  // Handle null/undefined rank_score
  if (typeof supplier.rank_score !== 'number') {
    return 0;
  }
  
  // Clamp between 0-100
  return Math.max(0, Math.min(100, supplier.rank_score));
}

/**
 * Safely get average rating with fallback
 * @param {Object} supplier - Supplier object
 * @returns {number} Average rating (0-5)
 */
export function safeAverageRating(supplier) {
  if (!supplier) return 0;
  
  // Handle null/undefined average_rating
  if (typeof supplier.average_rating !== 'number') {
    return 0;
  }
  
  // Clamp between 0-5
  return Math.max(0, Math.min(5, supplier.average_rating));
}

/**
 * Safely get approved reviews count
 * @param {Object} supplier - Supplier object
 * @returns {number} Count of approved reviews
 */
export function safeReviewCount(supplier) {
  if (!supplier) return 0;
  
  // Handle null/undefined approved_reviews_count
  if (typeof supplier.approved_reviews_count !== 'number') {
    return 0;
  }
  
  return Math.max(0, supplier.approved_reviews_count);
}

/**
 * Determine if supplier should show "Recommended" badge
 * @param {Object} supplier - Supplier object
 * @param {number} index - Position in sorted list
 * @returns {boolean} Whether to show badge
 */
export function isRecommended(supplier, index) {
  if (!supplier) return false;
  
  // Only top 6 suppliers
  if (index >= 6) return false;
  
  // Must have minimum trust signals
  const trust = safeTrustScore(supplier);
  const reviews = safeReviewCount(supplier);
  
  // Recommended if:
  // - Trust score >= 60 OR
  // - Has 3+ approved reviews
  return trust >= 60 || reviews >= 3;
}

/**
 * Get supplier tier safely (for admin view only)
 * @param {Object} supplier - Supplier object
 * @returns {string} Tier ('A', 'B', or 'C')
 */
export function safeSupplierTier(supplier) {
  if (!supplier) return 'C';
  
  // If tier is explicitly set, use it
  if (supplier.tier && ['A', 'B', 'C'].includes(supplier.tier)) {
    return supplier.tier;
  }
  
  // Otherwise compute from trust score
  const trust = safeTrustScore(supplier);
  
  if (trust >= 80) return 'A';
  if (trust >= 60) return 'B';
  return 'C';
}

/**
 * Ensure supplier has all required fields for ranking
 * Fills in safe defaults for missing data
 * @param {Object} supplier - Supplier object
 * @returns {Object} Supplier with safe defaults
 */
export function ensureTrustFields(supplier) {
  if (!supplier) return null;
  
  return {
    ...supplier,
    trust_score: safeTrustScore(supplier),
    rank_score: safeRankScore(supplier),
    average_rating: safeAverageRating(supplier),
    approved_reviews_count: safeReviewCount(supplier),
    verified: Boolean(supplier.verified),
    is_recommended: false // Will be computed by ranking
  };
}

/**
 * Check if trust engine is ready (all required DB functions exist)
 * This is a health check for Phase A activation
 * @returns {Promise<boolean>}
 */
export async function isTrustEngineReady(supabase) {
  try {
    // Test if required RPC functions exist by calling with dummy data
    const tests = [
      supabase.rpc('calculate_supplier_rank_score', { company_id_param: '00000000-0000-0000-0000-000000000000' }),
      supabase.rpc('get_supplier_tier', { company_id_param: '00000000-0000-0000-0000-000000000000' })
    ];
    
    const results = await Promise.allSettled(tests);
    
    // All functions should exist (even if they return null for fake ID)
    // We're checking for "function does not exist" errors
    return results.every(r => {
      if (r.status === 'rejected') {
        return !r.reason?.message?.includes('does not exist');
      }
      return true;
    });
  } catch (error) {
    console.warn('Trust engine health check failed:', error);
    return false;
  }
}

/**
 * Log trust decision to audit trail (for governance)
 * @param {Object} decision - Decision details
 */
export async function logTrustDecision(supabase, decision) {
  try {
    await supabase
      .from('decision_audit_log')
      .insert({
        decision_type: decision.type, // 'ranking', 'matching', 'prioritization'
        entity_id: decision.entityId,
        entity_type: decision.entityType, // 'supplier', 'rfq', 'order'
        score: decision.score,
        factors: decision.factors,
        outcome: decision.outcome,
        admin_override: decision.adminOverride || null,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    // Silent fail - don't break user experience for audit logging
    console.warn('Failed to log trust decision:', error);
  }
}

