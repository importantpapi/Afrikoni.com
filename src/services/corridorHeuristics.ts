/**
 * ============================================================================
 * CORRIDOR HEURISTICS - Phase 1 Data Generation
 * ============================================================================
 * 
 * Generates heuristic corridor data based on:
 * - Seasonal patterns (rainy season, harvest season)
 * - Historical averages
 * - Geographic factors
 * - Product-specific patterns
 * 
 * Confidence: 40-60% (heuristic tier)
 * 
 * This is Phase 1 of the data acquisition pipeline.
 * Will be enhanced with crowdsourced and partner data in later phases.
 */

import type {
    EnhancedCorridor,
    CorridorDataPoint,
    DataSource,
    CongestionLevel,
    RiskLevel,
} from '@/types/corridorIntelligence';

/**
 * Seasonal patterns for West Africa
 */
const WEST_AFRICA_SEASONS = {
    // Rainy season: May - October
    RAINY_START: 4, // May (0-indexed)
    RAINY_END: 9,   // October

    // Dry season: November - April
    DRY_START: 10,  // November
    DRY_END: 3,     // April

    // Harvest seasons by product
    COCOA_HARVEST: [9, 10, 11], // Oct, Nov, Dec
    COFFEE_HARVEST: [10, 11, 0], // Nov, Dec, Jan
};

/**
 * Check if current month is in rainy season
 */
function isRainySeason(month: number = new Date().getMonth()): boolean {
    return month >= WEST_AFRICA_SEASONS.RAINY_START &&
        month <= WEST_AFRICA_SEASONS.RAINY_END;
}

/**
 * Check if current month is harvest season for product
 */
function isHarvestSeason(product: string, month: number = new Date().getMonth()): boolean {
    const productLower = product.toLowerCase();

    if (productLower.includes('cocoa')) {
        return WEST_AFRICA_SEASONS.COCOA_HARVEST.includes(month);
    }

    if (productLower.includes('coffee')) {
        return WEST_AFRICA_SEASONS.COFFEE_HARVEST.includes(month);
    }

    return false;
}

/**
 * Generate heuristic congestion level
 */
function generateCongestionHeuristic(
    origin: string,
    product: string
): CorridorDataPoint<CongestionLevel> {
    const month = new Date().getMonth();
    const isRainy = isRainySeason(month);
    const isHarvest = isHarvestSeason(product, month);

    // Higher congestion during rainy season and harvest season
    let congestion: CongestionLevel = 'low';
    let confidence = 45;

    if (isRainy && isHarvest) {
        congestion = 'high';
        confidence = 50; // Higher confidence when both factors align
    } else if (isRainy || isHarvest) {
        congestion = 'medium';
        confidence = 48;
    }

    // Major ports have higher baseline congestion
    const majorPorts = ['Lagos', 'Abidjan', 'Tema', 'Dakar'];
    if (majorPorts.some(port => origin.includes(port))) {
        if (congestion === 'low') congestion = 'medium';
        else if (congestion === 'medium') congestion = 'high';
    }

    return {
        value: congestion,
        confidence,
        sources: [{
            type: 'heuristic',
            name: 'Seasonal Model',
            confidence,
            lastUpdated: new Date(),
            metadata: {
                isRainySeason: isRainy,
                isHarvestSeason: isHarvest,
            },
        }],
        lastUpdated: new Date(),
        trend: isRainy ? 'increasing' : 'stable',
    };
}

/**
 * Generate heuristic customs delay
 */
function generateCustomsDelayHeuristic(
    origin: string,
    destination: string
): CorridorDataPoint<number> {
    // Base delay assumptions by region
    const baseDelays: Record<string, number> = {
        'West Africa → Europe': 2,
        'West Africa → North America': 3,
        'East Africa → Middle East': 1.5,
        'Southern Africa → Europe': 2.5,
    };

    // Default to 2 days if no match
    let delay = 2;

    // Try to match region pair
    for (const [route, baseDelay] of Object.entries(baseDelays)) {
        if (route.includes('West Africa') && destination.includes('Europe')) {
            delay = baseDelay;
            break;
        }
    }

    // Add seasonal variation (rainy season adds delays)
    if (isRainySeason()) {
        delay += 0.5;
    }

    return {
        value: delay,
        confidence: 42,
        sources: [{
            type: 'heuristic',
            name: 'Historical Average',
            confidence: 42,
            lastUpdated: new Date(),
            metadata: {
                baseDelay: delay - (isRainySeason() ? 0.5 : 0),
                seasonalAdjustment: isRainySeason() ? 0.5 : 0,
            },
        }],
        lastUpdated: new Date(),
    };
}

/**
 * Generate heuristic FX volatility
 */
function generateFXVolatilityHeuristic(
    origin: string,
    destination: string
): CorridorDataPoint<number> {
    // Base volatility by currency pair
    const volatilityMap: Record<string, number> = {
        'XOF/EUR': 2.5,  // West African CFA to Euro (low volatility, pegged)
        'XOF/USD': 4.0,  // West African CFA to USD
        'NGN/USD': 8.5,  // Nigerian Naira to USD (high volatility)
        'KES/USD': 6.0,  // Kenyan Shilling to USD
        'ZAR/USD': 7.5,  // South African Rand to USD
    };

    // Default to moderate volatility
    let volatility = 5.0;

    // Try to match currency pair (simplified)
    if (origin.includes('Côte d\'Ivoire') || origin.includes('Senegal')) {
        volatility = destination.includes('Europe') ? 2.5 : 4.0;
    } else if (origin.includes('Nigeria')) {
        volatility = 8.5;
    }

    return {
        value: volatility,
        confidence: 48,
        sources: [{
            type: 'heuristic',
            name: 'Currency Model',
            confidence: 48,
            lastUpdated: new Date(),
            metadata: {
                currencyPair: 'estimated',
            },
        }],
        lastUpdated: new Date(),
    };
}

/**
 * Generate heuristic weather risk
 */
function generateWeatherRiskHeuristic(
    origin: string
): CorridorDataPoint<RiskLevel> {
    const month = new Date().getMonth();
    const isRainy = isRainySeason(month);

    // Higher risk during rainy season
    const risk: RiskLevel = isRainy ? 'medium' : 'low';
    const confidence = 50;

    return {
        value: risk,
        confidence,
        sources: [{
            type: 'heuristic',
            name: 'Seasonal Model',
            confidence,
            lastUpdated: new Date(),
            metadata: {
                season: isRainy ? 'rainy' : 'dry',
                month,
            },
        }],
        lastUpdated: new Date(),
        trend: isRainy ? 'stable' : 'stable',
    };
}

/**
 * Generate heuristic pricing data
 */
function generatePricingHeuristic(
    product: string,
    basePrice: number
): CorridorDataPoint<number> {
    const month = new Date().getMonth();
    const isHarvest = isHarvestSeason(product, month);

    // Prices typically lower during harvest season (higher supply)
    let price = basePrice;
    if (isHarvest) {
        price = basePrice * 0.95; // 5% lower during harvest
    }

    return {
        value: Math.round(price),
        confidence: 40,
        sources: [{
            type: 'heuristic',
            name: 'Market Model',
            confidence: 40,
            lastUpdated: new Date(),
            metadata: {
                basePrice,
                seasonalAdjustment: isHarvest ? -5 : 0,
            },
        }],
        lastUpdated: new Date(),
        trend: isHarvest ? 'decreasing' : 'stable',
    };
}

/**
 * Generate heuristic transit time
 */
function generateTransitTimeHeuristic(
    origin: string,
    destination: string,
    baseTransitTime: number
): CorridorDataPoint<number> {
    const isRainy = isRainySeason();

    // Add delays during rainy season
    let transitTime = baseTransitTime;
    if (isRainy) {
        transitTime += 2; // +2 days during rainy season
    }

    return {
        value: transitTime,
        confidence: 45,
        sources: [{
            type: 'heuristic',
            name: 'Route Model',
            confidence: 45,
            lastUpdated: new Date(),
            metadata: {
                baseTransitTime,
                weatherDelay: isRainy ? 2 : 0,
            },
        }],
        lastUpdated: new Date(),
    };
}

/**
 * Generate complete heuristic corridor data
 */
export function generateHeuristicCorridorData(
    corridorId: string,
    name: string,
    origin: string,
    destination: string,
    product: string,
    basePrice: number = 2800,
    baseTransitTime: number = 18
): Partial<EnhancedCorridor> {
    return {
        id: corridorId,
        name,
        origin,
        destination,
        product,

        // Generate heuristic data points
        pricing: generatePricingHeuristic(product, basePrice),
        transitTime: generateTransitTimeHeuristic(origin, destination, baseTransitTime),
        congestion: generateCongestionHeuristic(origin, product),
        customsDelay: generateCustomsDelayHeuristic(origin, destination),
        fxVolatility: generateFXVolatilityHeuristic(origin, destination),
        weatherRisk: generateWeatherRiskHeuristic(origin),

        // Historical data (would come from database in production)
        avgTransitTime: baseTransitTime,
        onTimeDelivery: 75, // 75% on-time delivery (heuristic)

        updatedAt: new Date(),
    };
}

/**
 * Get average confidence across all heuristic data points
 */
export function getHeuristicConfidence(): number {
    // Average of all heuristic confidence values
    return 45; // 40-50% range for heuristic data
}

export default {
    generateHeuristicCorridorData,
    getHeuristicConfidence,
    isRainySeason,
    isHarvestSeason,
};
