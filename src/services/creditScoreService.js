/**
 * CREDIT SCORE SERVICE (FICO-STYLE)
 * 
 * Transforms trade history into "Bankable" digital credit scores.
 * Scale: 300 - 850
 */

import { supabase } from '@/api/supabaseClient';

const SCORE_WEIGHTS = {
    paymentHistory: 0.40,      // 40% - On-time funding of escrow
    tradeVolume: 0.25,         // 25% - Total GMV moved
    verificationDepth: 0.20,   // 20% - KYC/KYB tier
    disputeRate: 0.15          // 15% - Inverse of disputes
};

const MIN_SCORE = 300;
const MAX_SCORE = 850;
const BASE_NEW_SCORE = 550;

/**
 * Calculate the authoritative credit score for a company
 */
export async function calculateCreditScore(companyId) {
    try {
        const [
            payments,
            volume,
            verification,
            disputes
        ] = await Promise.all([
            getPaymentPerformance(companyId),
            getTradeVolumeScore(companyId),
            getVerificationScore(companyId),
            getDisputePerformance(companyId)
        ]);

        const weightedScore = (
            (payments * SCORE_WEIGHTS.paymentHistory) +
            (volume * SCORE_WEIGHTS.tradeVolume) +
            (verification * SCORE_WEIGHTS.verificationDepth) +
            (disputes * SCORE_WEIGHTS.disputeRate)
        );

        // Map normalized 0-100 to 300-850 range
        const finalScore = Math.round(MIN_SCORE + (weightedScore / 100) * (MAX_SCORE - MIN_SCORE));

        return {
            score: Math.max(MIN_SCORE, Math.min(MAX_SCORE, finalScore)),
            grade: getGrade(finalScore),
            factors: {
                payments,
                volume,
                verification,
                disputes
            }
        };
    } catch (err) {
        console.error('[CreditScore] Calculation failed:', err);
        return { score: BASE_NEW_SCORE, grade: 'C', error: err.message };
    }
}

/**
 * 1. Payment Performance (40%)
 * Logic: Days between Contract signing and Escrow funding.
 */
async function getPaymentPerformance(companyId) {
    const { data: trades } = await supabase
        .from('trades')
        .select('metadata')
        .eq('buyer_id', companyId)
        .not('metadata->funding_delay_hours', 'is', null);

    if (!trades?.length) return 70; // Default buffer for new users

    const avgDelay = trades.reduce((acc, t) => acc + (t.metadata.funding_delay_hours || 0), 0) / trades.length;

    // 0-24h = 100 pts, 24-72h = 70 pts, 72h+ = 40 pts
    if (avgDelay <= 24) return 100;
    if (avgDelay <= 72) return 75;
    return 40;
}

/**
 * 2. Trade Volume Score (25%)
 * Logic: Exponential scoring based on GMV.
 */
async function getTradeVolumeScore(companyId) {
    const { data: stats } = await supabase
        .from('trades')
        .select('total_value')
        .or(`buyer_id.eq.${companyId},seller_id.eq.${companyId}`)
        .in('status', ['settled', 'closed']);

    const totalGMV = stats?.reduce((acc, t) => acc + (t.total_value || 0), 0) || 0;

    if (totalGMV >= 1000000) return 100; // $1M+
    if (totalGMV >= 100000) return 85;   // $100k+
    if (totalGMV >= 10000) return 60;    // $10k+
    return 30; // Standard small-scale
}

/**
 * 3. Verification Score (20%)
 * Logic: Reward depth of identity commitment.
 */
async function getVerificationScore(companyId) {
    const { data: company } = await supabase
        .from('companies')
        .select('verification_status, metadata')
        .eq('id', companyId)
        .single();

    if (company?.verification_status === 'verified') {
        const tier = company.metadata?.requested_tier || 1;
        return 60 + (tier * 10); // Verified Tier 4 = 100 pts
    }

    return 20; // Unverified
}

/**
 * 4. Dispute Performance (15%)
 */
async function getDisputePerformance(companyId) {
    const { count: totalTrades } = await supabase
        .from('trades')
        .select('id', { count: 'exact' })
        .or(`buyer_id.eq.${companyId},seller_id.eq.${companyId}`);

    const { count: disputes } = await supabase
        .from('disputes')
        .select('id', { count: 'exact' })
        .eq('against_company_id', companyId);

    if (!totalTrades) return 100;

    const rate = (disputes || 0) / totalTrades;
    if (rate === 0) return 100;
    if (rate <= 0.05) return 80; // 5% dispute rate is high but manageable
    return 20;
}

function getGrade(score) {
    if (score >= 800) return 'A+';
    if (score >= 740) return 'A';
    if (score >= 670) return 'B';
    if (score >= 580) return 'C';
    return 'D';
}

export default {
    calculateCreditScore
};
