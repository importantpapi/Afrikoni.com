/**
 * ============================================================================
 * CORRIDOR INTELLIGENCE - Type Definitions
 * ============================================================================
 * 
 * Defines the data structures for multi-source, confidence-scored corridor data.
 * Supports progressive data enrichment: Heuristic → Crowdsourced → Partner → Verified
 */

export type DataSourceType = 'heuristic' | 'crowdsourced' | 'partner' | 'verified';
export type RiskLevel = 'low' | 'medium' | 'high';
export type CongestionLevel = 'low' | 'medium' | 'high';
export type TrendDirection = 'increasing' | 'stable' | 'decreasing';

/**
 * Data source metadata - tracks where data comes from and how reliable it is
 */
export interface DataSource {
    type: DataSourceType;
    name: string;
    confidence: number; // 0-100
    lastUpdated: Date;
    url?: string;
    metadata?: Record<string, any>;
}

/**
 * Generic data point with confidence tracking
 * Every metric in the system should use this wrapper
 */
export interface CorridorDataPoint<T> {
    value: T;
    confidence: number; // 0-100 (average of all sources)
    sources: DataSource[];
    lastUpdated: Date;
    trend?: TrendDirection;
    historicalData?: Array<{
        timestamp: Date;
        value: T;
    }>;
}

/**
 * Corridor health breakdown by component
 */
export interface CorridorHealthBreakdown {
    congestion: number; // 0-100
    customs: number; // 0-100
    fx: number; // 0-100
    weather: number; // 0-100
    onTime: number; // 0-100
    dataQuality: number; // 0-100
}

/**
 * Complete corridor intelligence data structure
 */
export interface EnhancedCorridor {
    // Identity
    id: string;
    name: string;
    origin: string;
    destination: string;
    product: string;

    // Geographic coordinates for mapping
    originCoords: { lat: number; lon: number };
    destinationCoords: { lat: number; lon: number };

    // Enhanced metrics with confidence tracking
    pricing: CorridorDataPoint<number>; // USD per unit
    transitTime: CorridorDataPoint<number>; // days
    congestion: CorridorDataPoint<CongestionLevel>;
    customsDelay: CorridorDataPoint<number>; // days
    fxVolatility: CorridorDataPoint<number>; // percentage
    weatherRisk: CorridorDataPoint<RiskLevel>;

    // Corridor health
    healthScore: number; // 0-100 (calculated)
    healthBreakdown: CorridorHealthBreakdown;
    riskLevel: RiskLevel; // derived from healthScore

    // Historical performance
    avgTransitTime: number; // days
    onTimeDelivery: number; // percentage (0-100)
    activeTraders: number;
    monthlyVolume: number; // in product units

    // Compliance & regulations
    compliance: string[];
    requiredDocuments: string[];

    // User-specific data
    userTrades?: number;
    userAvgPrice?: number;
    lastTradeDate?: Date;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

/**
 * User-submitted corridor report
 */
export interface CorridorReport {
    id: string;
    corridorId: string;
    userId: string;
    companyId: string;
    reportType: 'delay' | 'congestion' | 'customs' | 'weather' | 'other';
    severity: RiskLevel;
    description: string;
    location?: string;
    photoUrl?: string;
    verified: boolean;
    createdAt: Date;
    verifiedAt?: Date;
    verifiedBy?: string;
}

/**
 * Corridor alert for Control Plane
 */
export interface CorridorAlert {
    id: string;
    corridorId: string;
    corridor: string; // human-readable name
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: 'congestion' | 'delay' | 'weather' | 'customs' | 'fx';
    message: string;
    description: string;
    actionRequired: boolean;
    createdAt: Date;
    resolvedAt?: Date;
}

/**
 * Corridor health calculation weights
 */
export interface CorridorHealthWeights {
    congestion: number;
    customsDelay: number;
    fxVolatility: number;
    weatherRisk: number;
    onTimeDelivery: number;
    dataQuality: number;
}

/**
 * Default health calculation weights
 * Total must equal 1.0
 */
export const DEFAULT_HEALTH_WEIGHTS: CorridorHealthWeights = {
    congestion: 0.25,      // Port/route congestion (critical)
    customsDelay: 0.20,    // Customs processing time (high impact)
    fxVolatility: 0.15,    // Currency risk (moderate impact)
    weatherRisk: 0.10,     // Weather conditions (seasonal)
    onTimeDelivery: 0.20,  // Historical reliability (critical)
    dataQuality: 0.10,     // Confidence in data (transparency)
};

/**
 * Confidence tier thresholds
 */
export const CONFIDENCE_TIERS = {
    VERIFIED: 90,      // 90-100: Verified data (IoT, ML, direct APIs)
    PARTNER: 75,       // 75-89: Partner data (port authorities, freight forwarders)
    CROWDSOURCED: 60,  // 60-74: Crowdsourced data (user reports, shipment tracking)
    HEURISTIC: 40,     // 40-59: Heuristic data (seasonal models, historical averages)
    LOW: 0,            // 0-39: Low confidence (insufficient data)
} as const;

/**
 * Health score status thresholds
 */
export const HEALTH_STATUS = {
    EXCELLENT: 80,  // 80-100: Excellent corridor health
    GOOD: 60,       // 60-79: Good corridor health
    FAIR: 40,       // 40-59: Fair corridor health (caution)
    POOR: 0,        // 0-39: Poor corridor health (high risk)
} as const;
