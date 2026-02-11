/**
 * ============================================================================
 * USE TRADE SYSTEM STATE - Core Control Plane Hook
 * ============================================================================
 * 
 * This hook provides real-time access to the Trade System State.
 * It's the single source of truth for the entire Trade OS.
 * 
 * Usage:
 * const { systemState, isLoading, refresh } = useTradeSystemState();
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { generateRecommendations } from '@/services/aiRecommendationService';

/**
 * Calculate Trade Readiness Score
 * This is the core algorithm that determines if a trade is ready to execute
 */
const calculateTradeReadiness = (data) => {
    const {
        trustScore = 0,
        complianceStatus = 'pending',
        escrowStatus = 'required',
        documentsComplete = false,
        shipmentsReady = false,
    } = data;

    const components = {
        trust: trustScore, // 0-100
        compliance: complianceStatus === 'compliant' ? 100 : complianceStatus === 'pending' ? 50 : 0,
        financial: escrowStatus === 'funded' ? 100 : escrowStatus === 'pending' ? 50 : 0,
        logistics: shipmentsReady ? 100 : 50,
    };

    // Weighted average
    const weights = {
        trust: 0.30,
        compliance: 0.25,
        financial: 0.25,
        logistics: 0.20,
    };

    const score = Math.round(
        components.trust * weights.trust +
        components.compliance * weights.compliance +
        components.financial * weights.financial +
        components.logistics * weights.logistics
    );

    // Determine status
    let status = 'ready';
    const blockers = [];

    if (score < 60) {
        status = 'blocked';
    } else if (score < 80) {
        status = 'warning';
    }

    // Identify blockers
    if (components.trust < 60) {
        blockers.push({
            id: 'trust-low',
            type: 'trust',
            severity: 'high',
            title: 'Low Trust Score',
            description: 'Counterparty trust score is below recommended threshold',
            actionRequired: 'Complete verification or request additional documentation',
            actionUrl: '/dashboard/trust-center',
            estimatedResolutionTime: '1-2 days',
        });
    }

    if (complianceStatus !== 'compliant') {
        blockers.push({
            id: 'compliance-pending',
            type: 'compliance',
            severity: complianceStatus === 'at_risk' ? 'critical' : 'high',
            title: 'Compliance Pending',
            description: 'Required compliance documents are missing or pending review',
            actionRequired: 'Upload missing documents',
            actionUrl: '/dashboard/compliance',
            estimatedResolutionTime: '2-3 days',
        });
    }

    if (escrowStatus !== 'funded' && escrowStatus !== 'not_required') {
        blockers.push({
            id: 'escrow-not-funded',
            type: 'financial',
            severity: 'critical',
            title: 'Escrow Not Funded',
            description: 'Trade requires escrow funding before proceeding',
            actionRequired: 'Fund escrow account',
            actionUrl: '/dashboard/payments',
            estimatedResolutionTime: '1 hour',
        });
    }

    return {
        score,
        status,
        blockers,
        components,
    };
};

/**
 * Calculate Trust Score Breakdown
 */
const calculateTrustScore = (profile, tradeHistory, paymentHistory, certifications) => {
    const components = {
        verification: {
            score: 0,
            weight: 0.30,
            factors: [
                { name: 'KYC verified', points: 30, verified: profile?.kyc_verified || false },
                { name: 'Business license', points: 20, verified: profile?.business_verified || false },
                { name: 'Tax ID', points: 10, verified: profile?.tax_id_verified || false },
            ],
        },
        tradeHistory: {
            score: 0,
            weight: 0.30,
            factors: [
                { name: 'Completed trades', points: 20, value: tradeHistory?.completed || 0 },
                { name: 'On-time delivery', points: 15, value: `${tradeHistory?.onTimeRate || 0}%` },
                { name: 'Dispute rate', points: -5, value: `${tradeHistory?.disputeRate || 0}%` },
            ],
        },
        paymentReliability: {
            score: 0,
            weight: 0.25,
            factors: [
                { name: 'Payment success rate', points: 25, value: `${paymentHistory?.successRate || 0}%` },
                { name: 'Avg payment time', points: 5, value: paymentHistory?.avgDays || 0 },
            ],
        },
        compliance: {
            score: 0,
            weight: 0.15,
            factors: certifications?.map(cert => ({
                name: cert.name,
                points: 10,
                verified: cert.verified,
            })) || [],
        },
    };

    // Calculate component scores
    components.verification.score = components.verification.factors
        .filter(f => f.verified)
        .reduce((sum, f) => sum + f.points, 0);

    components.tradeHistory.score = Math.min(100,
        (tradeHistory?.completed || 0) * 2 +
        (tradeHistory?.onTimeRate || 0) * 0.5
    );

    components.paymentReliability.score = Math.min(100,
        (paymentHistory?.successRate || 0) * 0.8 +
        Math.max(0, 20 - (paymentHistory?.avgDays || 0))
    );

    components.compliance.score = components.compliance.factors
        .filter(f => f.verified)
        .reduce((sum, f) => sum + f.points, 0);

    // Overall score (weighted average)
    const overallScore = Math.round(
        components.verification.score * components.verification.weight +
        components.tradeHistory.score * components.tradeHistory.weight +
        components.paymentReliability.score * components.paymentReliability.weight +
        components.compliance.score * components.compliance.weight
    );

    return {
        overallScore,
        components,
        algorithm: {
            version: '1.0.0',
            lastUpdated: new Date(),
            methodology: 'https://afrikoni.com/trust-methodology',
        },
        calculatedAt: new Date(),
        calculatedBy: 'system',
    };
};

/**
 * Main Hook
 */
export const useTradeSystemState = () => {
    const { user, profile } = useAuth();
    const [systemState, setSystemState] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSystemState = useCallback(async () => {
        if (!user || !profile?.company_id) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            // Fetch all required data in parallel
            const [
                { data: companyProfile },
                { data: trades },
                { data: payments },
                { data: certifications },
                { data: shipments },
                { data: escrowAccounts },
                { data: corridors },
            ] = await Promise.all([
                supabase.from('companies').select('*').eq('id', profile.company_id).single(),
                supabase.from('trades').select('*').eq('company_id', profile.company_id),
                supabase.from('payments').select('*').eq('company_id', profile.company_id),
                supabase.from('certifications').select('*').eq('company_id', profile.company_id),
                supabase.from('shipments').select('*').eq('company_id', profile.company_id),
                supabase.from('escrow_accounts').select('*').eq('company_id', profile.company_id),
                supabase.from('trade_corridors').select('*'),
            ]);

            // Calculate trade history metrics
            const tradeHistory = {
                completed: trades?.filter(t => t.status === 'completed').length || 0,
                onTimeRate: trades?.length > 0
                    ? (trades.filter(t => t.delivered_on_time).length / trades.length) * 100
                    : 0,
                disputeRate: trades?.length > 0
                    ? (trades.filter(t => t.has_dispute).length / trades.length) * 100
                    : 0,
            };

            // Calculate payment history metrics
            const paymentHistory = {
                successRate: payments?.length > 0
                    ? (payments.filter(p => p.status === 'completed').length / payments.length) * 100
                    : 0,
                avgDays: payments?.length > 0
                    ? payments.reduce((sum, p) => sum + (p.days_to_complete || 0), 0) / payments.length
                    : 0,
            };

            // Calculate trust score
            const trustBreakdown = calculateTrustScore(
                companyProfile,
                tradeHistory,
                paymentHistory,
                certifications
            );

            // Calculate escrow status
            const activeEscrow = escrowAccounts?.find(e => e.status === 'active');
            const escrowStatus = activeEscrow?.funded ? 'funded' :
                activeEscrow ? 'pending' : 'required';

            // Calculate compliance status
            const requiredCerts = ['AfCFTA', 'Business License'];
            const hasCerts = certifications?.filter(c =>
                requiredCerts.includes(c.name) && c.verified
            ).length || 0;
            const complianceStatus = hasCerts === requiredCerts.length ? 'compliant' :
                hasCerts > 0 ? 'pending' : 'at_risk';

            // Calculate corridor health
            const avgCorridorHealth = corridors?.length > 0
                ? Math.round(corridors.reduce((sum, c) => sum + (c.health_score || 0), 0) / corridors.length)
                : 0;

            const shipmentRisk = avgCorridorHealth >= 80 ? 'low' :
                avgCorridorHealth >= 60 ? 'medium' : 'high';

            // Calculate readiness
            const tradeReadiness = calculateTradeReadiness({
                trustScore: trustBreakdown.overallScore,
                complianceStatus,
                escrowStatus,
                documentsComplete: hasCerts === requiredCerts.length,
                shipmentsReady: shipments?.some(s => s.status === 'ready'),
            });

            // Preliminary state for recommendation engine (circular dependency avoidance)
            const tempState = {
                tradeReadiness,
                trust: {
                    counterpartyScore: trustBreakdown.overallScore,
                    complianceStatus,
                    missingDocuments: requiredCerts.filter(cert =>
                        !certifications?.some(c => c.name === cert && c.verified)
                    ),
                    certifications: certifications || [],
                    breakdown: trustBreakdown,
                },
                financial: {
                    escrowStatus,
                    paymentRisk: paymentHistory.successRate > 90 ? 'low' :
                        paymentHistory.successRate > 70 ? 'medium' : 'high',
                },
                logistics: {
                    shipmentRisk,
                    avgCorridorHealth,
                    activeShipments: {
                        total: shipments?.length || 0,
                    }
                }
            };

            // Generate AI Recommendations
            const recommendations = generateRecommendations(tempState);

            // Build complete system state
            const state = {
                tradeReadiness,

                trust: {
                    counterpartyScore: trustBreakdown.overallScore,
                    complianceStatus,
                    missingDocuments: requiredCerts.filter(cert =>
                        !certifications?.some(c => c.name === cert && c.verified)
                    ),
                    certifications: certifications || [],
                    breakdown: trustBreakdown,
                },

                financial: {
                    escrowStatus,
                    fxExposure: 0, // TODO: Calculate from active trades
                    paymentRisk: paymentHistory.successRate > 90 ? 'low' :
                        paymentHistory.successRate > 70 ? 'medium' : 'high',
                    availableCredit: companyProfile?.credit_limit || 0,
                    metrics: {
                        totalEscrowAmount: activeEscrow?.amount || 0,
                        fundedAmount: activeEscrow?.funded_amount || 0,
                        pendingAmount: (activeEscrow?.amount || 0) - (activeEscrow?.funded_amount || 0),
                        currency: 'USD',
                    },
                },

                logistics: {
                    shipmentRisk,
                    corridorHealth: corridors || [],
                    avgCorridorHealth,
                    estimatedDelay: 0,
                    customsStatus: 'clear',
                    activeShipments: {
                        total: shipments?.length || 0,
                        onTime: shipments?.filter(s => !s.delayed).length || 0,
                        delayed: shipments?.filter(s => s.delayed).length || 0,
                        atRisk: shipments?.filter(s => s.risk_level === 'high').length || 0,
                    },
                },

                intelligence: {
                    recommendations, // Live AI Recommendations
                    riskAlerts: [], // TODO: Generate risk alerts
                    opportunities: [], // TODO: Identify opportunities
                    aiStatus: {
                        enabled: true,
                        lastAnalysis: new Date(),
                        nextAnalysis: new Date(Date.now() + 3600000), // 1 hour
                    },
                },

                lastUpdated: new Date(),
                userId: user.id,
                companyId: profile.company_id,
            };

            setSystemState(state);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch system state:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [user, profile]);

    // Fetch on mount and when user/profile changes
    useEffect(() => {
        fetchSystemState();
    }, [fetchSystemState]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            fetchSystemState();
        }, 300000); // 5 minutes

        return () => clearInterval(interval);
    }, [fetchSystemState]);

    return {
        systemState,
        isLoading,
        error,
        refresh: fetchSystemState,
    };
};
