import { supabase } from '@/api/supabaseClient';

/**
 * fraudDetectionService.ts
 * 
 * "The immune system of Afrikoni Trade OS"
 * 
 * Handles real-time risk assessment, anomaly detection, and fraud pattern matching.
 * In a real production environment, this would call external ML models (e.g., AWS Fraud Detector).
 * Here, we use heuristic algorithms to simulate enterprise-grade protection.
 */

export const FraudDetectionService = {

    /**
     * Analyze a document for forgery or anomalies
     * @param documentUrl - URL of the uploaded document
     * @param docType - 'id', 'business_license', 'invoice'
     */
    analyzeDocument: async (documentUrl: string, docType: string) => {
        console.log(`[FraudEngine] Analyzing document: ${docType}`);

        // SIMULATION: In real life, this calls an OCR/ML service
        // Here we simulate varying confidence levels
        const isSuspicious = Math.random() > 0.85; // 15% chance of being flagged in demo

        if (isSuspicious) {
            return {
                flagged: true,
                riskScore: 85,
                reasons: ['MetaData inconsistency detected', 'Potential image manipulation'],
                confidence: 0.92
            };
        }

        return {
            flagged: false,
            riskScore: 12,
            reasons: [],
            confidence: 0.98
        };
    },

    /**
     * Check for identity mismatches between User profile and Company profile
     */
    checkIdentityConsistency: async (userId: string, companyId: string) => {
        const { data: user } = await supabase.from('profiles').select('full_name, email').eq('id', userId).single();
        const { data: company } = await supabase.from('companies').select('company_name, email').eq('id', companyId).single();

        if (!user || !company) return { riskLevel: 'unknown' };

        const emailDomainUser = user.email?.split('@')[1];
        const emailDomainCompany = company.email?.split('@')[1];

        // Check if user email domain matches company email domain (if not generic gmail/yahoo)
        const isGeneric = ['gmail.com', 'yahoo.com', 'outlook.com'].includes(emailDomainUser || '');
        const domainMismatch = !isGeneric && emailDomainUser !== emailDomainCompany;

        if (domainMismatch) {
            return {
                flagged: true,
                riskLevel: 'medium',
                reason: `Email domain mismatch: ${emailDomainUser} vs ${emailDomainCompany}`
            };
        }

        return { flagged: false, riskLevel: 'low' };
    },

    /**
     * Detect velocity attacks (e.g. creating 10 orders in 1 minute)
     */
    checkVelocity: async (userId: string, actionType: string) => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const { count } = await supabase
            .from('audit_log')
            .select('*', { count: 'exact', head: true })
            .eq('actor_id', userId)
            .eq('action', actionType)
            .gte('created_at', fiveMinutesAgo);

        if ((count || 0) > 10) {
            return {
                flagged: true,
                riskLevel: 'high',
                reason: `Velocity limit exceeded: ${count} ${actionType} actions in 5m`
            };
        }

        return { flagged: false, count };
    },

    /**
     * Log a detected threat to the Audit Log (The "Black Box")
     */
    logThreat: async (threat: any) => {
        console.warn('[FraudEngine] Threat Detected:', threat);

        await supabase.from('audit_log').insert({
            action: `FRAUD_ALERT:${threat.type}`,
            entity_type: threat.entityType,
            entity_id: threat.entityId,
            actor_id: threat.userId,
            risk_level: threat.severity, // 'high', 'critical'
            metadata: {
                reason: threat.reason,
                score: threat.score,
                details: threat.details,
                ai_flagged: true
            },
            status: 'warning'
        });
    }
};
