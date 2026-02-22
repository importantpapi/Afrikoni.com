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
        const reasons: string[] = [];
        let riskScore = 8;

        if (!documentUrl || !/^https?:\/\//i.test(documentUrl)) {
            return {
                flagged: true,
                riskScore: 95,
                reasons: ['Document URL is invalid or missing'],
                confidence: 0.99
            };
        }

        const suspiciousExt = /\.(exe|js|bat|cmd|php)$/i.test(documentUrl);
        if (suspiciousExt) {
            reasons.push('Unsupported or executable file extension');
            riskScore += 55;
        }

        const lowTrustHosts = ['bit.ly', 'tinyurl.com', 'drive.google.com'];
        if (lowTrustHosts.some(host => documentUrl.includes(host))) {
            reasons.push('Document hosted on low-trust or redirect domain');
            riskScore += 20;
        }

        const expectedByType: Record<string, RegExp> = {
            id: /\.(jpg|jpeg|png|pdf)$/i,
            business_license: /\.(pdf|jpg|jpeg|png)$/i,
            invoice: /\.(pdf|jpg|jpeg|png)$/i,
        };
        if (docType && expectedByType[docType] && !expectedByType[docType].test(documentUrl)) {
            reasons.push(`Unexpected file format for ${docType}`);
            riskScore += 25;
        }

        // Optional OCR/forgery signal (if edge function is deployed).
        try {
            const { data, error } = await supabase.functions.invoke('document-risk-scan', {
                body: { documentUrl, docType }
            });
            if (!error && data) {
                if (Array.isArray(data.reasons) && data.reasons.length > 0) {
                    reasons.push(...data.reasons);
                }
                if (typeof data.riskScore === 'number') {
                    riskScore = Math.max(riskScore, Math.min(100, data.riskScore));
                }
            }
        } catch (_) {
            // Non-blocking: deterministic heuristics above remain the baseline.
        }

        const flagged = riskScore >= 60 || reasons.length > 0;
        return {
            flagged,
            riskScore: Math.min(100, Math.max(0, riskScore)),
            reasons,
            confidence: flagged ? 0.82 : 0.9
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
