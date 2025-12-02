/**
 * Marketplace intelligence helpers
 */

import { supabase } from '@/api/supabaseClient';

/**
 * Get RFQs in user's product categories
 */
export async function getRFQsInUserCategories(companyId, limit = 5) {
  if (!companyId) return [];
  
  try {
    // Get user's product categories
    const { data: userProducts } = await supabase
      .from('products')
      .select('category_id')
      .eq('company_id', companyId)
      .not('category_id', 'is', null);
    
    if (!Array.isArray(userProducts) || userProducts.length === 0) return [];
    
    const categoryIds = [...new Set(userProducts.map(p => p.category_id).filter(Boolean))];
    
    if (categoryIds.length === 0) return [];
    
    // Get RFQs in those categories
    const { data: rfqs } = await supabase
      .from('rfqs')
      .select('*, categories(*), companies(*)')
      .in('category_id', categoryIds)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return Array.isArray(rfqs) ? rfqs : [];
  } catch (error) {
    return [];
  }
}

/**
 * Get RFQs expiring soon (within specified days)
 */
export async function getRFQsExpiringSoon(companyId, days = 7, limit = 5) {
  if (!companyId) return [];
  
  try {
    const now = new Date().toISOString();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateISO = futureDate.toISOString();

    // Get RFQs where either:
    // - delivery_deadline is between now and futureDate, OR
    // - expires_at is between now and futureDate
    const { data: rfqs } = await supabase
      .from('rfqs')
      .select('*, categories(*), companies(*)')
      .eq('status', 'open')
      .or(
        `and(delivery_deadline.gte.${now},delivery_deadline.lte.${futureDateISO}),and(expires_at.gte.${now},expires_at.lte.${futureDateISO})`
      )
      .order('delivery_deadline', { ascending: true })
      .limit(limit);

    return Array.isArray(rfqs) ? rfqs : [];
  } catch (error) {
    return [];
  }
}

/**
 * Get new suppliers in a specific country (registered within specified days)
 */
export async function getNewSuppliersInCountry(country, days = 30, limit = 5) {
  if (!country || typeof country !== 'string') return [];
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .eq('country', country)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return Array.isArray(companies) ? companies : [];
  } catch (error) {
    return [];
  }
}

/**
 * Get top categories by RFQ count this week
 */
export async function getTopCategoriesThisWeek(limit = 5) {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: rfqs } = await supabase
      .from('rfqs')
      .select('category_id, categories(*)')
      .gte('created_at', weekAgo.toISOString())
      .not('category_id', 'is', null);
    
    if (!Array.isArray(rfqs) || rfqs.length === 0) return [];
    
    const categoryCounts = {};
    rfqs.forEach(rfq => {
      const catId = rfq?.category_id;
      if (catId) {
        categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
      }
    });
    
    const sorted = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([catId, count]) => ({
        category_id: catId,
        category: rfqs.find(r => r?.category_id === catId)?.categories || null,
        count
      }));
    
    return sorted;
  } catch (error) {
    return [];
  }
}

