/**
 * AI & Recommendations Queries
 * Handles product_recommendations, company_ranking, intent_classifier_logs
 */

import { supabase } from '@/api/supabaseClient';

// ============ PRODUCT RECOMMENDATIONS ============

export async function getProductRecommendations(productId, limit = 10) {
  const { data, error } = await supabase
    .from('product_recommendations')
    .select(`
      *,
      recommended_product:products!product_recommendations_recommended_product_id_fkey(
        *,
        product_images(*),
        companies!company_id(*)
      )
    `)
    .eq('source_product_id', productId)
    .order('score', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data.map(rec => rec.recommended_product).filter(Boolean);
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

