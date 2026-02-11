/**
 * Trust Score Calculation Service
 * Calculates and maintains trust scores for buyers and suppliers
 * Based on: completion rate, delivery reliability, buyer ratings, dispute history
 */

import { supabase } from '@/api/supabaseClient';

const TRUST_SCORE_WEIGHTS = {
  completionRate: 0.30,      // 30% - On-time completion
  deliveryReliability: 0.25, // 25% - Meets delivery dates
  ratingScore: 0.25,         // 25% - Buyer/seller ratings
  disputeHistory: 0.20       // 20% - Inverse of disputes (fewer = higher score)
};

const INITIAL_TRUST_SCORE = 70; // New companies start at 70
const MAX_TRUST_SCORE = 100;
const MIN_TRUST_SCORE = 0;

/**
 * Calculate completion rate (% of trades successfully completed)
 */
export async function calculateCompletionRate(companyId) {
  try {
    // Count total trades where company is buyer or seller
    const { count: totalTrades } = await supabase
      .from('trades')
      .select('id', { count: 'exact' })
      .or(`buyer_id.eq.${companyId},seller_id.eq.${companyId}`);

    // Count completed trades (status = 'settled' or 'closed')
    const { data: completedTrades } = await supabase
      .from('trades')
      .select('id')
      .or(`buyer_id.eq.${companyId},seller_id.eq.${companyId}`)
      .in('status', ['settled', 'closed']);

    const completionRate = totalTrades > 0
      ? (completedTrades?.length || 0) / totalTrades
      : 0;

    return Math.round(completionRate * 100);
  } catch (err) {
    console.error('[trustService] Calculate completion rate failed:', err);
    return 0;
  }
}

/**
 * Calculate delivery reliability (% of on-time deliveries)
 */
export async function calculateDeliveryReliability(companyId) {
  try {
    // Get all completed trades for this company
    const { data: trades } = await supabase
      .from('trades')
      .select(`id, status, seller_id, buyer_id`)
      .or(`buyer_id.eq.${companyId},seller_id.eq.${companyId}`)
      .in('status', ['settled', 'closed']);

    if (!trades?.length) return 100; // Perfect score if no history

    let onTimeCount = 0;
    let totalDelivered = 0;

    for (const trade of trades) {
      // Get shipment for this trade
      const { data: shipment } = await supabase
        .from('shipments')
        .select('estimated_delivery_date, status')
        .eq('trade_id', trade.id)
        .single();

      if (shipment && shipment.status === 'delivered') {
        totalDelivered++;

        // Get actual delivery date from milestones
        // For now, assume delivered shipments were on time
        // In production, check last milestone timestamp vs estimated_delivery_date
        onTimeCount++;
      }
    }

    const reliability = totalDelivered > 0
      ? (onTimeCount / totalDelivered) * 100
      : 100;

    return Math.round(reliability);
  } catch (err) {
    console.error('[trustService] Calculate delivery reliability failed:', err);
    return 100;
  }
}

/**
 * Calculate average rating score
 */
export async function calculateAverageRating(companyId) {
  try {
    // Get all ratings for this company (as supplier)
    const { data: ratings } = await supabase
      .from('trade_ratings')
      .select('rating')
      .eq('supplier_company_id', companyId);

    if (!ratings?.length) return 100; // Perfect if no ratings yet

    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    // Convert 1-5 star rating to 0-100 scale
    return Math.round((averageRating / 5) * 100);
  } catch (err) {
    console.error('[trustService] Calculate average rating failed:', err);
    return 100;
  }
}

/**
 * Calculate dispute history score (inverse)
 * Higher disputes = lower score
 */
export async function calculateDisputeScore(companyId) {
  try {
    // Count disputes where company is involved
    const { count: totalDisputes } = await supabase
      .from('disputes')
      .select('id', { count: 'exact' })
      .or(`raised_by_company_id.eq.${companyId},against_company_id.eq.${companyId}`);

    // Count resolved disputes in company's favor
    const { count: wonDisputes } = await supabase
      .from('disputes')
      .select('id', { count: 'exact' })
      .eq('resolved_company_id', companyId);

    // Penalty per dispute (each reduces score by 5 points)
    const disputePenalty = (totalDisputes || 0) * 5;

    // Bonus for winning disputes (each adds 2 points)
    const winBonus = (wonDisputes || 0) * 2;

    // Base score 100, minus penalties, plus bonuses
    let score = 100 - disputePenalty + winBonus;

    return Math.max(MIN_TRUST_SCORE, Math.min(MAX_TRUST_SCORE, score));
  } catch (err) {
    console.error('[trustService] Calculate dispute score failed:', err);
    return 100;
  }
}

/**
 * Calculate overall trust score
 */
export async function calculateTrustScore(companyId) {
  try {
    const [
      completionRate,
      deliveryReliability,
      averageRating,
      disputeScore
    ] = await Promise.all([
      calculateCompletionRate(companyId),
      calculateDeliveryReliability(companyId),
      calculateAverageRating(companyId),
      calculateDisputeScore(companyId)
    ]);

    // Weighted average
    const trustScore = Math.round(
      (completionRate * TRUST_SCORE_WEIGHTS.completionRate) +
      (deliveryReliability * TRUST_SCORE_WEIGHTS.deliveryReliability) +
      (averageRating * TRUST_SCORE_WEIGHTS.ratingScore) +
      (disputeScore * TRUST_SCORE_WEIGHTS.disputeHistory)
    );

    // Update company record
    await supabase
      .from('companies')
      .update({
        trust_score: trustScore,
        completion_rate: completionRate,
        delivery_reliability: deliveryReliability,
        average_rating: averageRating,
        dispute_score: disputeScore,
        trust_score_updated_at: new Date()
      })
      .eq('id', companyId);

    return {
      trustScore: Math.max(MIN_TRUST_SCORE, Math.min(MAX_TRUST_SCORE, trustScore)),
      factors: {
        completionRate,
        deliveryReliability,
        averageRating,
        disputeScore
      }
    };
  } catch (err) {
    console.error('[trustService] Calculate trust score failed:', err);
    return { error: err.message };
  }
}

/**
 * Get trust score tier (Bronze, Silver, Gold, Platinum)
 */
export function getTrustScoreTier(score) {
  if (score >= 90) return { tier: 'Platinum', color: '#a78bfa', icon: '★★★★★' };
  if (score >= 80) return { tier: 'Gold', color: '#fbbf24', icon: '★★★★☆' };
  if (score >= 70) return { tier: 'Silver', color: '#d1d5db', icon: '★★★☆☆' };
  if (score >= 60) return { tier: 'Bronze', color: '#92400e', icon: '★★☆☆☆' };
  return { tier: 'Unrated', color: '#6b7280', icon: '★☆☆☆☆' };
}

/**
 * Get trust score recommendations
 */
export function getTrustScoreRecommendations(trustScore, factors) {
  const recommendations = [];

  if (factors.completionRate < 80) {
    recommendations.push('Improve on-time trade completion rate');
  }

  if (factors.deliveryReliability < 85) {
    recommendations.push('Focus on meeting agreed delivery dates');
  }

  if (factors.averageRating < 70) {
    recommendations.push('Enhance quality and customer service to improve ratings');
  }

  if (factors.disputeScore < 80) {
    recommendations.push('Work to resolve outstanding disputes');
  }

  if (trustScore < 70 && recommendations.length === 0) {
    recommendations.push('Build more trading history to establish trust');
  }

  return recommendations;
}

/**
 * Record trade rating after successful completion
 */
export async function recordTradeRating({
  tradeId,
  buyerCompanyId,
  supplierCompanyId,
  rating, // 1-5 stars
  comment = '',
  recommendToOthers = true
}) {
  try {
    const { data, error } = await supabase
      .from('trade_ratings')
      .insert({
        trade_id: tradeId,
        buyer_company_id: buyerCompanyId,
        supplier_company_id: supplierCompanyId,
        rating: Math.min(5, Math.max(1, rating)),
        comment,
        recommend_to_others: recommendToOthers,
        created_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    // Recalculate supplier's trust score after new rating
    await calculateTrustScore(supplierCompanyId);

    return { success: true, rating: data };
  } catch (err) {
    console.error('[trustService] Record trade rating failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get company trust profile
 */
export async function getTrustProfile(companyId) {
  try {
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (!company) {
      return { error: 'Company not found' };
    }

    const tier = getTrustScoreTier(company.trust_score || 0);
    const recommendations = getTrustScoreRecommendations(
      company.trust_score || 0,
      {
        completionRate: company.completion_rate || 0,
        deliveryReliability: company.delivery_reliability || 0,
        averageRating: company.average_rating || 0,
        disputeScore: company.dispute_score || 0
      }
    );

    // Get recent ratings
    const { data: recentRatings } = await supabase
      .from('trade_ratings')
      .select('*')
      .eq('supplier_company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      company: {
        id: company.id,
        name: company.name,
        trustScore: company.trust_score || 0,
        tier,
        completionRate: company.completion_rate || 0,
        deliveryReliability: company.delivery_reliability || 0,
        averageRating: company.average_rating || 0,
        disputeScore: company.dispute_score || 0
      },
      recommendations,
      recentRatings
    };
  } catch (err) {
    console.error('[trustService] Get trust profile failed:', err);
    return { error: err.message };
  }
}

export default {
  calculateTrustScore,
  calculateCompletionRate,
  calculateDeliveryReliability,
  calculateAverageRating,
  calculateDisputeScore,
  getTrustScoreTier,
  getTrustScoreRecommendations,
  recordTradeRating,
  getTrustProfile
};
