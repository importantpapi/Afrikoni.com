/**
 * ============================================================================
 * TRADE SYSTEM STATE - Core Infrastructure Types
 * ============================================================================
 * 
 * This defines the System State object that powers the Trade Control Plane.
 * It represents the live state of the entire trade system at any moment.
 * 
 * This is the foundation of Afrikoni as a Trade OS, not just a dashboard.
 */

// ============================================================================
// SYSTEM STATE (Top-Level)
// ============================================================================

export interface TradeSystemState {
    // Overall Health
    tradeReadiness: TradeReadinessState;

    // Trust & Compliance
    trust: TrustState;

    // Financial State
    financial: FinancialState;

    // Logistics State
    logistics: LogisticsState;

    // AI Intelligence
    intelligence: IntelligenceState;

    // Metadata
    lastUpdated: Date;
    userId: string;
    companyId: string;
}

// ============================================================================
// TRADE READINESS
// ============================================================================

export interface TradeReadinessState {
    score: number; // 0-100
    status: 'ready' | 'warning' | 'blocked';
    blockers: SystemBlocker[];

    // Component scores
    components: {
        trust: number;
        compliance: number;
        financial: number;
        logistics: number;
    };
}

export interface SystemBlocker {
    id: string;
    type: 'trust' | 'compliance' | 'financial' | 'logistics';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionRequired: string;
    actionUrl?: string;
    estimatedResolutionTime?: string; // e.g., "2 hours", "1 day"
}

// ============================================================================
// TRUST STATE
// ============================================================================

export interface TrustState {
    counterpartyScore: number; // 0-100
    complianceStatus: 'compliant' | 'pending' | 'at_risk';
    missingDocuments: string[];
    certifications: Certification[];

    // Trust breakdown
    breakdown: TrustScoreBreakdown;
}

export interface TrustScoreBreakdown {
    overallScore: number;

    components: {
        verification: TrustComponent;
        tradeHistory: TrustComponent;
        paymentReliability: TrustComponent;
        compliance: TrustComponent;
    };

    // Transparency
    algorithm: {
        version: string;
        lastUpdated: Date;
        methodology: string; // URL to public docs
    };

    // Audit trail
    calculatedAt: Date;
    calculatedBy: 'system' | 'manual_review';
    reviewedBy?: string;
}

export interface TrustComponent {
    score: number;
    weight: number;
    factors: TrustFactor[];
}

export interface TrustFactor {
    name: string;
    points: number;
    verified?: boolean;
    value?: string | number;
}

export interface Certification {
    id: string;
    name: string;
    issuer: string;
    issuedDate: Date;
    expiryDate?: Date;
    verified: boolean;
    documentUrl?: string;
}

// ============================================================================
// FINANCIAL STATE
// ============================================================================

export interface FinancialState {
    escrowStatus: 'funded' | 'pending' | 'required' | 'not_required';
    fxExposure: number; // percentage
    paymentRisk: 'low' | 'medium' | 'high';
    availableCredit: number;

    // Detailed metrics
    metrics: {
        totalEscrowAmount?: number;
        fundedAmount?: number;
        pendingAmount?: number;
        currency: string;
    };

    // FX details
    fxDetails?: {
        baseCurrency: string;
        targetCurrency: string;
        currentRate: number;
        volatility: number; // percentage
        lastUpdated: Date;
    };
}

// ============================================================================
// LOGISTICS STATE
// ============================================================================

export interface LogisticsState {
    shipmentRisk: 'low' | 'medium' | 'high';
    corridorHealth: CorridorHealth[];
    estimatedDelay: number; // days
    customsStatus: string;

    // Active shipments
    activeShipments: {
        total: number;
        onTime: number;
        delayed: number;
        atRisk: number;
    };
}

export interface CorridorHealth {
    id: string;
    route: string; // e.g., "NG-Lagos → FR-Marseille"

    // Real-time metrics
    congestion: CorridorMetric<'low' | 'medium' | 'high'>;
    customsDelay: CorridorMetric<number>; // average days
    fxVolatility: CorridorMetric<number>; // percentage
    weatherRisk: CorridorMetric<'low' | 'medium' | 'high'>;

    // Historical performance
    avgTransitTime: number; // days
    onTimeDelivery: number; // percentage
    costTrend: 'increasing' | 'stable' | 'decreasing';

    // AI predictions
    recommendedDeparture?: Date;
    estimatedCost?: number;
    riskScore: number; // 0-100

    // Data quality
    dataQuality: 'high' | 'medium' | 'low';
}

export interface CorridorMetric<T> {
    value: T;
    confidence: number; // 0-100
    sources: CorridorDataSource[];
    lastUpdated: Date;
}

export interface CorridorDataSource {
    type: 'heuristic' | 'crowdsourced' | 'partner' | 'verified';
    confidence: number;
    lastUpdated: Date;
    source: string;
}

// ============================================================================
// INTELLIGENCE STATE (AI)
// ============================================================================

export interface IntelligenceState {
    recommendations: AIRecommendation[];
    riskAlerts: RiskAlert[];
    opportunities: TradeOpportunity[];

    // AI status
    aiStatus: {
        enabled: boolean;
        lastAnalysis: Date;
        nextAnalysis: Date;
    };
}

export interface AIRecommendation {
    id: string;
    type: 'corridor' | 'timing' | 'pricing' | 'risk' | 'opportunity';
    priority: 'critical' | 'high' | 'medium' | 'low';

    // The recommendation
    title: string;
    message: string;

    // Explainability
    reasoning: string;
    dataSources: string[];
    confidence: number; // 0-100

    // Alternatives
    alternatives?: {
        option: string;
        pros: string[];
        cons: string[];
    }[];

    // Risk disclosure
    risks?: {
        type: 'financial' | 'operational' | 'compliance';
        description: string;
        likelihood: 'low' | 'medium' | 'high';
    }[];

    // Actions
    actions: {
        label: string;
        actionType: 'accept' | 'dismiss' | 'custom';
        handler?: string;
    }[];

    // Legal
    disclaimer: string;

    // Metadata
    createdAt: Date;
    expiresAt?: Date;
    dismissed?: boolean;
}

export interface RiskAlert {
    id: string;
    type: 'payment' | 'shipment' | 'compliance' | 'fraud' | 'fx';
    severity: 'critical' | 'high' | 'medium' | 'low';

    title: string;
    message: string;
    recommendation: string;

    // Impact
    potentialImpact?: {
        financial?: number;
        timeline?: string; // e.g., "3-5 days delay"
    };

    // Actions
    actionRequired: boolean;
    actionUrl?: string;

    createdAt: Date;
    resolvedAt?: Date;
}

export interface TradeOpportunity {
    id: string;
    type: 'rfq_match' | 'price_advantage' | 'corridor_optimization' | 'supplier_recommendation';

    title: string;
    description: string;
    estimatedValue: number; // USD
    confidence: number; // 0-100

    expiresAt?: Date;
    actionUrl: string;
}

// ============================================================================
// ORCHESTRATION (Auto-execution)
// ============================================================================

export interface OrchestrationRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;

    // Trigger
    trigger: {
        type: 'readiness_score' | 'risk_threshold' | 'time_based' | 'event_based';
        condition: string; // e.g., "readiness >= 90"
    };

    // Action
    action: {
        type: 'escrow' | 'logistics' | 'document' | 'fx' | 'notification';
        handler: string;
        params: Record<string, any>;
    };

    // Safety
    requiresApproval: boolean;
    approvalThreshold?: number; // e.g., orders > $10K

    // Audit
    executionLog: OrchestrationExecution[];

    // Metadata
    createdBy: string;
    createdAt: Date;
    lastModified: Date;
}

export interface OrchestrationExecution {
    id: string;
    ruleId: string;
    executedAt: Date;
    result: 'success' | 'failure' | 'pending_approval';
    error?: string;
    approvedBy?: string;
    approvedAt?: Date;
}
