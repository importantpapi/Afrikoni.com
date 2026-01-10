/**
 * AI & Recommendations Queries
 * Handles product_recommendations, company_ranking, intent_classifier_logs
 */

import { supabase } from '@/api/supabaseClient';

// ============ PRODUCT RECOMMENDATIONS ============

export async function getProductRecommendations(productId, limit = 10) {
  try {
    // Simplified query - PostgREST friendly
    const { data: recommendations, error: recError } = await supabase
      .from('product_recommendations')
      .select('recommended_product_id, score')
      .eq('source_product_id', productId)
      .order('score', { ascending: false })
      .limit(limit);
    
    if (recError) throw recError;
    
    if (!recommendations || recommendations.length === 0) {
      return [];
    }
    
    // Load products separately
    const productIds = recommendations.map(r => r.recommended_product_id).filter(Boolean);
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, title, description, price_min, price_max, currency, status, company_id, category_id, product_images(*)')
      .in('id', productIds);
    
    if (productsError) throw productsError;
    
    // Load companies separately if needed
    let companiesMap = new Map();
    if (productsData && productsData.length > 0) {
      const companyIds = [...new Set(productsData.map(p => p.company_id).filter(Boolean))];
      if (companyIds.length > 0) {
        try {
          const { data: companies } = await supabase
            .from('companies')
            .select('id, company_name, country, verification_status, verified')
            .in('id', companyIds);
          
          if (companies) {
            companies.forEach(c => companiesMap.set(c.id, c));
          }
        } catch (err) {
          console.warn('Error loading companies for recommendations:', err);
          // Continue without company data
        }
      }
    }
    
    // Merge company data with products
    const productsWithCompanies = (productsData || []).map(product => ({
      ...product,
      companies: companiesMap.get(product.company_id) || null
    }));
    
    return productsWithCompanies;
  } catch (error) {
    console.error('Error getting product recommendations:', error);
    return [];
  }
}

export async function createProductRecommendation(recommendationData) {
  const { data, error } = await supabase
    .from('product_recommendations')
    .insert(recommendationData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function bulkCreateProductRecommendations(recommendations) {
  const { data, error } = await supabase
    .from('product_recommendations')
    .insert(recommendations)
    .select();
  
  if (error) throw error;
  return data;
}

// ============ COMPANY RANKING ============

export async function getCompanyRanking(companyId) {
  const { data, error } = await supabase
    .from('company_ranking')
    .select('*')
    .eq('company_id', companyId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getAllCompanyRankings(limit = 100) {
  const { data, error } = await supabase
    .from('company_ranking')
    .select(`
      *,
      company:companies(*)
    `)
    .order('rank_score', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

export async function updateCompanyRanking(companyId, rankingData) {
  const { data, error } = await supabase
    .from('company_ranking')
    .upsert({
      company_id: companyId,
      ...rankingData,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============ INTENT CLASSIFIER LOGS ============

export async function createIntentClassifierLog(logData) {
  const { data, error } = await supabase
    .from('intent_classifier_logs')
    .insert(logData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getIntentClassifierLogs(searchEventId) {
  const { data, error } = await supabase
    .from('intent_classifier_logs')
    .select('*')
    .eq('search_event_id', searchEventId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

