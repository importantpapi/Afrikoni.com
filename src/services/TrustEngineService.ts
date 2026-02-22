import { supabase } from '@/api/supabaseClient';

/**
 * TrustEngineService (Phase 5)
 * 
 * The central brain for calculating and managing:
 * 1. Company Trust Scores (Counterparty Risk)
 * 2. Corridor Reliability Indices (Route Risk)
 */

export const TrustEngineService = {

    /**
     * Calculate Trust Score for a company based on raw data
     */
    calculateTrustScore: async (companyId) => {
        try {
            // 1. Fetch data points
            const { data: company } = await supabase
                .from('companies')
                .select('*, company_kyc(*)')
                .eq('id', companyId)
                .single();

            if (!company) {
                console.warn(`[TrustEngine] Company ${companyId} not found, returning fallback score.`);
                return {
                    total_score: 0,
                    verification_score: 0,
                    history_score: 0,
                    network_score: 0,
                    level: 'unrated',
                    factors: {}
                };
            }

            // count completed trades
            const { count: completedTrades } = await supabase
                .from('trades')
                .select('*', { count: 'exact', head: true })
                .eq('seller_company_id', companyId)
                .eq('status', 'settled');

            // Check for disputes
            const { count: disputeCount } = await supabase
                .from('disputes')
                .select('*', { count: 'exact', head: true })
                .or(`company_id.eq.${companyId},raised_by_company_id.eq.${companyId},against_company_id.eq.${companyId}`);

            // --- ALGORITHM START ---
            let score = 0;
            interface Factors {
                verification?: number;
                history?: number;
                network?: number;
                penalty?: number;
            }
            let factors: Factors = {};

            // A. Verification (Max 40)
            let verificationScore = 0;
            const isVerified =
                company.verified === true ||
                company.is_verified === true ||
                company.verification_status === 'verified';
            if (isVerified) verificationScore += 20;
            if (company.metadata?.banking_verified) verificationScore += 10;
            if (company.company_kyc?.status === 'approved') verificationScore += 10;

            score += verificationScore;
            factors.verification = verificationScore;

            // Calculate transaction history score safely
            let historyScore = 0;
            const safeTrades = completedTrades || 0;

            // Mathematical bounds: 2 points per trade, cap at 20
            historyScore += Math.min(safeTrades * 2, 20);

            // Volume bonus: Requires more than 5 settled trades for max allocation
            if (safeTrades >= 15) historyScore += 15;
            else if (safeTrades >= 5) historyScore += 5;

            score += historyScore;
            factors.history = historyScore;

            // C. Network (Max 25)
            let networkScore = 0;
            // Tenure bonus
            const createdDate = new Date(company.created_at);
            const monthsActive = (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
            networkScore += Math.min(Math.floor(monthsActive), 10);

            // Default baseline for registered users
            networkScore += 5;

            score += networkScore;
            factors.network = networkScore;

            // Penalty: Disputes
            if (disputeCount > 0) {
                const penalty = disputeCount * 15;
                score = Math.max(0, score - penalty);
                factors.penalty = -penalty;
            }

            // Cap at 100
            score = Math.min(100, score);

            // Determine Level
            let level = 'unrated';
            if (score >= 90) level = 'platinum';
            else if (score >= 80) level = 'gold';
            else if (score >= 60) level = 'silver';

            return {
                total_score: score,
                verification_score: verificationScore,
                history_score: historyScore,
                network_score: networkScore,
                level,
                factors
            };

        } catch (error) {
            console.error('Trust calc error:', error);
            return null;
        }
    },

    /**
     * Save/Update Trust Score to Database
     */
    updateCompanyTrustScore: async (companyId) => {
        const result = await TrustEngineService.calculateTrustScore(companyId);
        if (!result) return null;

        const { error } = await supabase
            .from('trust_scores')
            .upsert({
                company_id: companyId,
                total_score: result.total_score,
                verification_score: result.verification_score,
                history_score: result.history_score,
                network_score: result.network_score,
                level: result.level,
                factors: result.factors,
                last_calculated_at: new Date().toISOString()
            });

        if (error) throw error;
        return result;
    },

    /**
     * Get Trust Profile (Read-only)
     */
    getCompanyTrustProfile: async (companyId) => {
        const { data, error } = await supabase
            .from('trust_scores')
            .select('*')
            .eq('company_id', companyId)
            .single();

        if (error) return null;
        return data;
    }
};
