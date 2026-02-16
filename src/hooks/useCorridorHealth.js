/**
 * ============================================================================
 * CORRIDOR HEALTH - Scoring Algorithm
 * ============================================================================
 * 
 * Calculates corridor health scores (0-100) based on multiple factors:
 * - Congestion levels
 * - Customs delays
 * - FX volatility
 * - Weather risk
 * - On-time delivery performance
 * - Data quality/confidence
 * 
 * Higher score = healthier corridor
 */

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_HEALTH_WEIGHTS, HEALTH_STATUS } from '@/types/corridorIntelligence';

/**
 * Calculate corridor health score and breakdown
 */
export function calculateCorridorHealth(
    corridor,
    weights = DEFAULT_HEALTH_WEIGHTS
) {

    // 1. Congestion Score (0-100, lower congestion = higher score)
    const congestionScore = corridor?.congestion?.value === 'low' ? 100 :
        corridor?.congestion?.value === 'medium' ? 50 : 0;

    // 2. Customs Delay Score (0-100, lower delay = higher score)
    // Assume 0 days = 100, 10+ days = 0
    const delayVal = corridor?.customsDelay?.value || 0;
    const customsScore = Math.max(0, Math.min(100, 100 - (delayVal * 10)));

    // 3. FX Volatility Score (0-100, lower volatility = higher score)
    // Assume 0% = 100, 20%+ = 0
    const fxVal = corridor?.fxVolatility?.value || 0;
    const fxScore = Math.max(0, Math.min(100, 100 - (fxVal * 5)));

    // 4. Weather Risk Score (0-100, lower risk = higher score)
    const weatherScore = corridor?.weatherRisk?.value === 'low' ? 100 :
        corridor?.weatherRisk?.value === 'medium' ? 50 : 0;

    // 5. On-Time Delivery Score (already 0-100 percentage)
    const onTimeScore = corridor?.onTimeDelivery || 0;

    // 6. Data Quality Score (average confidence across all metrics)
    const avgConfidence = [
        corridor?.congestion?.confidence || 0,
        corridor?.customsDelay?.confidence || 0,
        corridor?.fxVolatility?.confidence || 0,
        corridor?.weatherRisk?.confidence || 0,
    ].reduce((sum, c) => sum + c, 0) / 4;

    const dataQualityScore = avgConfidence;

    // Calculate weighted health score
    const healthScore = Math.round(
        congestionScore * weights.congestion +
        customsScore * weights.customsDelay +
        fxScore * weights.fxVolatility +
        weatherScore * weights.weatherRisk +
        onTimeScore * weights.onTimeDelivery +
        dataQualityScore * weights.dataQuality
    );

    // Determine risk level based on health score
    const riskLevel =
        healthScore >= HEALTH_STATUS.EXCELLENT ? 'low' :
            healthScore >= HEALTH_STATUS.GOOD ? 'medium' : 'high';

    return {
        score: healthScore,
        breakdown: {
            congestion: congestionScore,
            customs: customsScore,
            fx: fxScore,
            weather: weatherScore,
            onTime: onTimeScore,
            dataQuality: dataQualityScore,
        },
        riskLevel,
    };
}

/**
 * React hook for corridor health calculation
 */
export function useCorridorHealth(corridor) {
    const [health, setHealth] = useState(null);

    const [isCalculating, setIsCalculating] = useState(false);

    const calculate = useCallback(() => {
        if (!corridor) {
            setHealth(null);
            return;
        }

        setIsCalculating(true);

        try {
            const result = calculateCorridorHealth(corridor);
            setHealth(result);
        } catch (error) {
            console.error('Error calculating corridor health:', error);
            setHealth(null);
        } finally {
            setIsCalculating(false);
        }
    }, [corridor]);

    useEffect(() => {
        calculate();
    }, [calculate]);

    return {
        health,
        isCalculating,
        recalculate: calculate,
    };
}

/**
 * Get health status label
 */
export function getHealthStatusLabel(score) {
    if (score >= HEALTH_STATUS.EXCELLENT) return 'Excellent';
    if (score >= HEALTH_STATUS.GOOD) return 'Good';
    if (score >= HEALTH_STATUS.FAIR) return 'Fair';
    return 'Poor';
}

/**
 * Get health status color
 */
export function getHealthStatusColor(score) {
    if (score >= HEALTH_STATUS.EXCELLENT) {
        return {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            text: 'text-emerald-400',
            gradient: 'from-emerald-500 to-emerald-600',
        };
    }

    if (score >= HEALTH_STATUS.GOOD) {
        return {
            bg: 'bg-os-blue/10',
            border: 'border-os-blue/20',
            text: 'text-blue-400',
            gradient: 'from-blue-500 to-blue-600',
        };
    }

    if (score >= HEALTH_STATUS.FAIR) {
        return {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            text: 'text-amber-400',
            gradient: 'from-amber-500 to-amber-600',
        };
    }

    return {
        bg: 'bg-os-red/10',
        border: 'border-os-red/20',
        text: 'text-red-400',
        gradient: 'from-red-500 to-red-600',
    };
}

/**
 * Get risk level color
 */
export function getRiskLevelColor(risk) {
    switch (risk) {
        case 'low':
            return {
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
                text: 'text-emerald-400',
            };
        case 'medium':
            return {
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20',
                text: 'text-amber-400',
            };
        case 'high':
            return {
                bg: 'bg-os-red/10',
                border: 'border-os-red/20',
                text: 'text-red-400',
            };
    }
}

export default useCorridorHealth;
