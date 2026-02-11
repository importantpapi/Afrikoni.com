import { Shield, Wallet, Clock, TrendingUp, FileText, AlertTriangle, Map, Zap } from 'lucide-react';

/**
 * AI Recommendation Service
 * 
 * Analyzes the Trade System State and generates prioritized recommendations
 * based on Afrikoni's core goals:
 * 1. Velocity (Speed) - 40% Weight
 * 2. Trust (Risk Reduction) - 35% Weight
 * 3. Efficiency (Cost/Optimization) - 25% Weight
 */

export interface Recommendation {
    id: string;
    type: 'action' | 'insight' | 'warning';
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    icon: any; // LucideIcon
    actionLabel: string;
    actionPath: string;
    score: number; // 0-100
    tags: ('velocity' | 'trust' | 'efficiency')[];
}

// Weights for the scoring algorithm
const WEIGHTS = {
    VELOCITY: 0.40,
    TRUST: 0.35,
    EFFICIENCY: 0.25
};

/**
 * Main generation function
 */
export const generateRecommendations = (systemState: any): Recommendation[] => {
    if (!systemState) return [];

    const recommendations: Recommendation[] = [];
    const { trust, financial, logistics, tradeReadiness } = systemState;

    // --- 1. TRUST & COMPLIANCE CHECKS ---

    // Missing Compliance Documents
    if (trust.complianceStatus !== 'compliant') {
        const missingCount = trust.missingDocuments?.length || 0;
        recommendations.push({
            id: 'rec-compliance-01',
            type: 'action',
            priority: 'critical',
            title: 'Compliance Action Required',
            description: `Upload ${missingCount} missing document${missingCount > 1 ? 's' : ''} to unlock full trading capabilities.`,
            icon: Shield,
            actionLabel: 'Upload Documents',
            actionPath: '/dashboard/compliance',
            score: calculateScore(90, 100, 50), // High Velocity (unblock), High Trust, Med Efficiency
            tags: ['trust', 'velocity']
        });
    }

    // Low Trust Score
    if (trust.counterpartyScore < 70) {
        recommendations.push({
            id: 'rec-trust-01',
            type: 'warning',
            priority: 'high',
            title: 'Improve Trust Score',
            description: 'Your trust score is below 70. Verify your business to access better financing rates.',
            icon: Shield,
            actionLabel: 'Boost Score',
            actionPath: '/dashboard/trust-center',
            score: calculateScore(60, 100, 80), // Med Velocity, High Trust, High Efficiency (financing)
            tags: ['trust', 'efficiency']
        });
    }

    // --- 2. FINANCIAL CHECKS ---

    // Escrow Not Funded
    if (financial.escrowStatus === 'required' || financial.escrowStatus === 'pending') {
        recommendations.push({
            id: 'rec-finance-01',
            type: 'action',
            priority: 'critical',
            title: 'Fund Escrow Account',
            description: 'Active trade #1234 is waiting for escrow funding. Fund now to avoid delays.',
            icon: Wallet,
            actionLabel: 'Fund Now',
            actionPath: '/dashboard/payments',
            score: calculateScore(100, 90, 60), // Max Velocity (unblock trade), High Trust, Med Efficiency
            tags: ['velocity', 'trust']
        });
    }

    // High FX Exposure
    // (Simulated check as we don't have real live FX data yet)
    if (financial.paymentRisk === 'medium' || financial.paymentRisk === 'high') {
        recommendations.push({
            id: 'rec-fx-01',
            type: 'insight',
            priority: 'medium',
            title: 'FX Volatility Alert',
            description: 'Currency volatility is high. Consider locking in a rate for your pending USD payments.',
            icon: TrendingUp,
            actionLabel: 'View FX Options',
            actionPath: '/dashboard/fx',
            score: calculateScore(40, 60, 95), // Low Velocity, Med Trust, Max Efficiency (save money)
            tags: ['efficiency']
        });
    }

    // --- 3. LOGISTICS CHECKS ---

    // Shipment Risk / Corridor Health
    if (logistics.avgCorridorHealth < 60 && logistics.activeShipments?.total > 0) {
        recommendations.push({
            id: 'rec-logistics-01',
            type: 'warning',
            priority: 'high',
            title: 'High Congestion Alert',
            description: 'Your active corridor is experiencing delays. Consider re-routing via Dakar.',
            icon: Map,
            actionLabel: 'View Routes',
            actionPath: '/dashboard/corridors',
            score: calculateScore(85, 50, 90), // High Velocity (avoid delay), Med Trust, High Efficiency
            tags: ['velocity', 'efficiency']
        });
    }

    // Documents ready to sign (Mock based on 'documentsComplete' flag)
    if (!tradeReadiness.documentsComplete) {
        recommendations.push({
            id: 'rec-docs-01',
            type: 'action',
            priority: 'high',
            title: 'Sign Trade Documents',
            description: '3 documents are ready for your digital signature.',
            icon: FileText,
            actionLabel: 'Sign Now',
            actionPath: '/dashboard/documents',
            score: calculateScore(95, 80, 70), // High Velocity, High Trust
            tags: ['velocity']
        });
    }

    // --- 4. OPPORTUNITIES (Low priority unless urgent) ---

    // Quick Trade Opportunity
    if (tradeReadiness.status === 'ready') {
        recommendations.push({
            id: 'rec-opp-01',
            type: 'insight',
            priority: 'low',
            title: 'New Trade Opportunity',
            description: 'Demand for Cocoa in France matches your supply profile.',
            icon: Zap,
            actionLabel: 'View RFQ',
            actionPath: '/dashboard/quick-trade',
            score: calculateScore(50, 40, 85), // Med Velocity, Low Trust, High Efficiency
            tags: ['efficiency']
        });
    }

    // Sort by Score (Desc) and return Top 3
    return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
};

/**
 * Helper: Calculate weighted score
 */
const calculateScore = (velocity: number, trust: number, efficiency: number): number => {
    return Math.round(
        (velocity * WEIGHTS.VELOCITY) +
        (trust * WEIGHTS.TRUST) +
        (efficiency * WEIGHTS.EFFICIENCY)
    );
};
