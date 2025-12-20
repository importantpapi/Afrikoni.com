/**
 * Trade Intelligence & Execution System
 * Supabase queries for intelligence layers
 */

import { supabase } from '@/api/supabaseClient';

// ============================================================================
// 1. BUYER & SUPPLIER INTELLIGENCE
// ============================================================================

/**
 * Get buyer intelligence data
 * @param {string} companyId - Optional company ID to filter
 * @returns {Promise<Array>} Buyer intelligence data
 */
export async function getBuyerIntelligence(companyId = null) {
  try {
    let query = supabase
      .from('buyer_intelligence')
      .select('*')
      .order('total_deal_value', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching buyer intelligence:', error);
    throw error;
  }
}

/**
 * Get supplier intelligence data
 * @param {string} companyId - Optional company ID to filter
 * @returns {Promise<Array>} Supplier intelligence data
 */
export async function getSupplierIntelligence(companyId = null) {
  try {
    let query = supabase
      .from('supplier_intelligence')
      .select('*')
      .order('reliability_score', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching supplier intelligence:', error);
    throw error;
  }
}

/**
 * Get supplier reliability score for RFQ matching
 * @param {string} supplierCompanyId - Supplier company ID
 * @returns {Promise<Object>} Reliability score and flags
 */
export async function getSupplierReliability(supplierCompanyId) {
  try {
    const { data, error } = await supabase
      .from('supplier_intelligence')
      .select('reliability_score, slow_response_flag, high_dispute_flag, inactive_flag, avg_response_hours, completion_rate, dispute_rate')
      .eq('company_id', supplierCompanyId)
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching supplier reliability:', error);
    return null;
  }
}

// ============================================================================
// 2. TRADE & REVENUE PERFORMANCE
// ============================================================================

/**
 * Get trade performance data
 * @param {string} period - 'day', 'week', or 'month'
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Trade performance data
 */
export async function getTradePerformance(period = 'day', startDate = null, endDate = null) {
  try {
    let query = supabase
      .from('trade_performance')
      .select('*')
      .order('trade_date', { ascending: true });

    if (startDate) {
      query = query.gte('trade_date', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('trade_date', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter by period if needed
    if (period === 'week') {
      return data.filter((d, i, arr) => {
        const week = new Date(d.trade_week).getTime();
        return i === 0 || new Date(arr[i - 1].trade_week).getTime() !== week;
      });
    } else if (period === 'month') {
      return data.filter((d, i, arr) => {
        const month = new Date(d.trade_month).getTime();
        return i === 0 || new Date(arr[i - 1].trade_month).getTime() !== month;
      });
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching trade performance:', error);
    throw error;
  }
}

/**
 * Get category performance data
 * @returns {Promise<Array>} Category performance data
 */
export async function getCategoryPerformance() {
  try {
    const { data, error } = await supabase
      .from('category_performance')
      .select('*')
      .order('gmv', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching category performance:', error);
    throw error;
  }
}

/**
 * Get conversion funnel metrics
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Funnel metrics
 */
export async function getConversionFunnel(startDate = null, endDate = null) {
  try {
    const performance = await getTradePerformance('day', startDate, endDate);

    const funnel = {
      rfqs: performance.reduce((sum, p) => sum + (p.rfqs_created || 0), 0),
      conversations: performance.reduce((sum, p) => sum + (p.conversations_started || 0), 0),
      deals: performance.reduce((sum, p) => sum + (p.deals_created || 0), 0),
      completed: performance.reduce((sum, p) => sum + (p.deals_completed || 0), 0),
    };

    funnel.rfqToConversationRate = funnel.rfqs > 0 
      ? (funnel.conversations / funnel.rfqs) * 100 
      : 0;
    funnel.conversationToDealRate = funnel.conversations > 0 
      ? (funnel.deals / funnel.conversations) * 100 
      : 0;
    funnel.dealCompletionRate = funnel.deals > 0 
      ? (funnel.completed / funnel.deals) * 100 
      : 0;

    return funnel;
  } catch (error) {
    console.error('Error fetching conversion funnel:', error);
    throw error;
  }
}

// ============================================================================
// 3. MARKET DEMAND INTELLIGENCE
// ============================================================================

/**
 * Get demand intelligence data
 * @param {string} categoryId - Optional category ID to filter
 * @param {boolean} showGapsOnly - Only show supply gaps
 * @returns {Promise<Array>} Demand intelligence data
 */
export async function getDemandIntelligence(categoryId = null, showGapsOnly = false) {
  try {
    let query = supabase
      .from('demand_intelligence')
      .select('*')
      .order('rfq_created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (showGapsOnly) {
      query = query.eq('supply_gap_flag', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching demand intelligence:', error);
    throw error;
  }
}

/**
 * Get demand trends
 * @param {string} categoryId - Optional category ID to filter
 * @param {string} country - Optional country to filter
 * @returns {Promise<Array>} Demand trends data
 */
export async function getDemandTrends(categoryId = null, country = null) {
  try {
    let query = supabase
      .from('demand_trends')
      .select('*')
      .order('demand_month', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (country) {
      query = query.eq('buyer_country', country);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching demand trends:', error);
    throw error;
  }
}

/**
 * Get supply gap insights for supplier onboarding
 * @returns {Promise<Array>} Supply gap insights
 */
export async function getSupplyGapInsights() {
  try {
    const { data, error } = await supabase
      .from('demand_intelligence')
      .select('category_id, category_name, buyer_country, COUNT(*) as gap_count')
      .eq('supply_gap_flag', true)
      .eq('recent_demand', true)
      .group('category_id, category_name, buyer_country')
      .order('gap_count', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching supply gap insights:', error);
    // Fallback: manual aggregation
    const allDemand = await getDemandIntelligence(null, true);
    const gaps = {};
    
    allDemand.forEach(demand => {
      const key = `${demand.category_id}-${demand.buyer_country}`;
      if (!gaps[key]) {
        gaps[key] = {
          category_id: demand.category_id,
          category_name: demand.category_name,
          buyer_country: demand.buyer_country,
          gap_count: 0
        };
      }
      gaps[key].gap_count++;
    });

    return Object.values(gaps).sort((a, b) => b.gap_count - a.gap_count);
  }
}

// ============================================================================
// 4. OPERATIONS, RISK & TRUST CONTROL
// ============================================================================

/**
 * Get risk signals for companies
 * @param {string} riskLevel - Optional risk level filter ('Low', 'Medium', 'High')
 * @returns {Promise<Array>} Risk signals data
 */
export async function getRiskSignals(riskLevel = null) {
  try {
    let query = supabase
      .from('risk_signals')
      .select('*')
      .order('overall_risk_level', { ascending: false });

    if (riskLevel) {
      query = query.eq('overall_risk_level', riskLevel);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching risk signals:', error);
    throw error;
  }
}

/**
 * Get trust evolution data
 * @param {string} companyId - Optional company ID to filter
 * @returns {Promise<Array>} Trust evolution data
 */
export async function getTrustEvolution(companyId = null) {
  try {
    let query = supabase
      .from('trust_evolution')
      .select('*')
      .order('current_trust_score', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching trust evolution:', error);
    throw error;
  }
}

/**
 * Get high-risk companies requiring attention
 * @returns {Promise<Array>} High-risk companies
 */
export async function getHighRiskCompanies() {
  try {
    const { data, error } = await supabase
      .from('risk_signals')
      .select('*')
      .eq('overall_risk_level', 'High')
      .order('total_disputes', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching high-risk companies:', error);
    throw error;
  }
}

/**
 * Get high-value deals needing attention
 * @returns {Promise<Array>} High-value deals with risk signals
 */
export async function getHighValueDealsNeedingAttention() {
  try {
    const { data, error } = await supabase
      .from('risk_signals')
      .select('*')
      .gt('high_value_deals', 0)
      .in('overall_risk_level', ['Medium', 'High'])
      .order('high_value_deals', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching high-value deals:', error);
    throw error;
  }
}

