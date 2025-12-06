/**
 * Reviews & Trust Score Queries
 * Handles company_reviews, company_trust_history
 */

import { supabase } from '@/api/supabaseClient';

export async function getCompanyReviews(companyId, filters = {}) {
  let query = supabase
    .from('company_reviews')
    .select(`
      *,
      reviewer_company:companies!company_reviews_reviewer_company_id_fkey(*),
      reviewed_company:companies!company_reviews_reviewed_company_id_fkey(*),
      orders(*)
    `)
    .eq('reviewed_company_id', companyId)
    .order('created_at', { ascending: false });
  
  if (filters.verified_only) query = query.eq('verified_purchase', true);
  if (filters.min_rating) query = query.gte('rating_overall', filters.min_rating);
  if (filters.limit) query = query.limit(filters.limit);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createCompanyReview(reviewData) {
  const { data, error } = await supabase
    .from('company_reviews')
    .insert(reviewData)
    .select()
    .single();
  
  if (error) throw error;
  
  // Update company trust score
  await updateCompanyTrustScore(reviewData.reviewed_company_id);
  
  return data;
}

export async function updateCompanyTrustScore(companyId) {
  // Get all reviews for company
  const reviews = await getCompanyReviews(companyId);
  
  if (reviews.length === 0) return;
  
  // Calculate average ratings
  const avgOverall = reviews.reduce((sum, r) => sum + (r.rating_overall || 0), 0) / reviews.length;
  const avgQuality = reviews.filter(r => r.rating_quality).reduce((sum, r) => sum + r.rating_quality, 0) / reviews.filter(r => r.rating_quality).length || 0;
  const avgCommunication = reviews.filter(r => r.rating_communication).reduce((sum, r) => sum + r.rating_communication, 0) / reviews.filter(r => r.rating_communication).length || 0;
  const avgShipping = reviews.filter(r => r.rating_shipping).reduce((sum, r) => sum + r.rating_shipping, 0) / reviews.filter(r => r.rating_shipping).length || 0;
  
  // Calculate trust score (0-100)
  const trustScore = Math.round(
    (avgOverall * 20) + // Overall rating (0-100)
    (avgQuality * 10) + // Quality (0-50)
    (avgCommunication * 10) + // Communication (0-50)
    (avgShipping * 10) // Shipping (0-50)
  ) / 4;
  
  // Get current trust score
  const { data: company } = await supabase
    .from('companies')
    .select('trust_score')
    .eq('id', companyId)
    .single();
  
  const oldScore = company?.trust_score || 0;
  
  // Update company trust score
  await supabase
    .from('companies')
    .update({ trust_score: trustScore })
    .eq('id', companyId);
  
  // Log trust history
  await supabase
    .from('company_trust_history')
    .insert({
      company_id: companyId,
      old_score: oldScore,
      new_score: trustScore,
      reason: 'Review update'
    });
  
  return trustScore;
}

export async function getCompanyTrustHistory(companyId) {
  const { data, error } = await supabase
    .from('company_trust_history')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getCompanyRanking(companyId) {
  const { data, error } = await supabase
    .from('company_ranking')
    .select('*')
    .eq('company_id', companyId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

