/**
 * Supplier Matching Service - 2026 AI Engine
 * Intelligently matches suppliers to RFQs using multi-factor scoring
 */

import { supabase } from '@/api/supabaseClient';

/**
 * Match suppliers to RFQ requirements
 * Uses PostgreSQL AI matching function for server-side intelligence
 * 
 * @param {Object} rfqData - RFQ requirements
 * @param {string} rfqData.product - Product name/category
 * @param {string} rfqData.country - Target country
 * @param {number} rfqData.quantity - Quantity needed
 * @param {number} rfqData.budget - Budget (optional)
 * @param {number} limit - Max suppliers to return
 * @returns {Promise<Array>} Matched suppliers with scores
 */
export async function matchSuppliersToRFQ(rfqData, limit = 10) {
  try {
    const { data, error } = await supabase.rpc('match_suppliers_v4', {
      rfq_data: rfqData,
      match_limit: limit
    });

    if (error) {
      console.error('[matchSuppliersToRFQ] Error:', error);
      return { success: false, error: error.message, suppliers: [] };
    }

    return {
      success: true,
      suppliers: data || [],
      count: data?.length || 0
    };
  } catch (err) {
    console.error('[matchSuppliersToRFQ] Unexpected error:', err);
    return { success: false, error: err.message, suppliers: [] };
  }
}

/**
 * Get match explanation for a supplier
 * @param {Object} match - Match result from matchSuppliersToRFQ
 * @returns {string} Human-readable match explanation
 */
export function explainMatch(match) {
  if (!match) return '';
  
  const { match_score, match_reasons = [] } = match;
  
  if (match_score >= 80) {
    return `🎯 Perfect Match (${match_score}/100) - ${match_reasons.join(', ')}`;
  } else if (match_score >= 60) {
    return `✅ Good Match (${match_score}/100) - ${match_reasons.join(', ')}`;
  } else if (match_score >= 40) {
    return `⚡ Potential Match (${match_score}/100) - ${match_reasons.join(', ')}`;
  } else {
    return `➕ Available (${match_score}/100)`;
  }
}

/**
 * Filter suppliers by minimum criteria
 * @param {Array} suppliers - Array of matched suppliers
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered suppliers
 */
export function filterSuppliers(suppliers, filters = {}) {
  let filtered = suppliers;

  if (filters.minMatchScore) {
    filtered = filtered.filter(s => s.match_score >= filters.minMatchScore);
  }

  if (filters.verifiedOnly) {
    filtered = filtered.filter(s => s.verified === true);
  }

  if (filters.minTrustScore) {
    filtered = filtered.filter(s => s.trust_score >= filters.minTrustScore);
  }

  if (filters.country) {
    filtered = filtered.filter(s => s.country === filters.country);
  }

  if (filters.minTrackRecord) {
    filtered = filtered.filter(s => s.accepted_quote_count >= filters.minTrackRecord);
  }

  return filtered;
}

/**
 * Notify matched suppliers about new RFQ
 * @param {string} rfqId - RFQ ID
 * @param {Array} suppliers - Matched suppliers
 * @returns {Promise<void>}
 */
export async function notifyMatchedSuppliers(rfqId, suppliers) {
  try {
    const notifications = suppliers.map(supplier => ({
      recipient_id: supplier.supplier_id,
      type: 'rfq_match',
      title: 'New RFQ Match',
      message: `You have a new RFQ that matches your profile`,
      metadata: {
        rfq_id: rfqId,
        match_score: supplier.match_score,
        match_reasons: supplier.match_reasons
      }
    }));

    // Batch insert notifications
    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) {
      console.error('[notifyMatchedSuppliers] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notified: notifications.length };
  } catch (err) {
    console.error('[notifyMatchedSuppliers] Unexpected error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Store matched supplier IDs in RFQ metadata
 * Allows tracking which suppliers were notified
 * @param {string} rfqId - RFQ ID
 * @param {Array} supplierIds - Array of matched supplier IDs
 * @returns {Promise<void>}
 */
export async function storeMatchedSuppliers(rfqId, supplierIds) {
  try {
    const { error } = await supabase
      .from('trades')
      .update({
        matched_supplier_ids: supplierIds,
        metadata: supabase.rpc('jsonb_set', {
          target: supabase.rpc('COALESCE', ['metadata', '{}']),
          path: '{matched_at}',
          value: JSON.stringify(new Date().toISOString())
        })
      })
      .eq('id', rfqId);

    if (error) {
      console.error('[storeMatchedSuppliers] Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[storeMatchedSuppliers] Unexpected error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get matching statistics for analytics
 * @param {string} rfqId - RFQ ID
 * @returns {Promise<Object>} Match statistics
 */
export async function getMatchStatistics(rfqId) {
  try {
    const { data: rfq, error: rfqError } = await supabase
      .from('trades')
      .select('matched_supplier_ids, created_at')
      .eq('id', rfqId)
      .single();

    if (rfqError) throw rfqError;

    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('supplier_company_id, created_at')
      .eq('trade_id', rfqId);

    if (quotesError) throw quotesError;

    const matchedCount = rfq.matched_supplier_ids?.length || 0;
    const quotedCount = quotes?.length || 0;
    const conversionRate = matchedCount > 0 ? (quotedCount / matchedCount) * 100 : 0;

    return {
      success: true,
      stats: {
        matched: matchedCount,
        quoted: quotedCount,
        conversionRate: conversionRate.toFixed(1) + '%',
        avgResponseTime: calculateAvgResponseTime(rfq.created_at, quotes)
      }
    };
  } catch (err) {
    console.error('[getMatchStatistics] Error:', err);
    return { success: false, error: err.message };
  }
}

function calculateAvgResponseTime(rfqCreated, quotes) {
  if (!quotes || quotes.length === 0) return 'N/A';
  
  const responseTimes = quotes.map(q => {
    const rfqTime = new Date(rfqCreated);
    const quoteTime = new Date(q.created_at);
    return (quoteTime - rfqTime) / (1000 * 60 * 60); // hours
  });

  const avgHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  if (avgHours < 24) {
    return `${Math.round(avgHours)}h`;
  } else {
    return `${Math.round(avgHours / 24)}d`;
  }
}

export default {
  matchSuppliersToRFQ,
  explainMatch,
  filterSuppliers,
  notifyMatchedSuppliers,
  storeMatchedSuppliers,
  getMatchStatistics
};
