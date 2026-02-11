/**
 * ============================================================================
 * CONFIDENCE BADGE - Data Quality Indicator
 * ============================================================================
 * 
 * Displays confidence level for corridor metrics with color-coded indicators
 * 
 * Confidence Tiers:
 * - 90-100%: Verified (green) - IoT, ML, direct APIs
 * - 75-89%: Partner (blue) - Port authorities, freight forwarders
 * - 60-74%: Crowdsourced (amber) - User reports, shipment tracking
 * - 40-59%: Heuristic (orange) - Seasonal models, historical averages
 * - 0-39%: Low (red) - Insufficient data
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CONFIDENCE_TIERS } from '@/types/corridorIntelligence';

interface ConfidenceBadgeProps {
    confidence: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function ConfidenceBadge({
    confidence,
    showLabel = true,
    size = 'md',
    className
}: ConfidenceBadgeProps) {
    // Determine tier and color
    const tier = confidence >= CONFIDENCE_TIERS.VERIFIED ? 'verified' :
        confidence >= CONFIDENCE_TIERS.PARTNER ? 'partner' :
            confidence >= CONFIDENCE_TIERS.CROWDSOURCED ? 'crowdsourced' :
                confidence >= CONFIDENCE_TIERS.HEURISTIC ? 'heuristic' : 'low';

    const colors = {
        verified: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            text: 'text-emerald-400',
            dot: 'bg-emerald-500',
        },
        partner: {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            text: 'text-blue-400',
            dot: 'bg-blue-500',
        },
        crowdsourced: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            text: 'text-amber-400',
            dot: 'bg-amber-500',
        },
        heuristic: {
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20',
            text: 'text-orange-400',
            dot: 'bg-orange-500',
        },
        low: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            text: 'text-red-400',
            dot: 'bg-red-500',
        },
    };

    const color = colors[tier];

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
    };

    const dotSizes = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5',
    };

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border',
                color.bg,
                color.border,
                sizeClasses[size],
                className
            )}
            title={`${tier.charAt(0).toUpperCase() + tier.slice(1)} data quality`}
        >
            <div className={cn('rounded-full', color.dot, dotSizes[size])} />
            {showLabel && (
                <span className={cn('font-medium', color.text)}>
                    {confidence}% confidence
                </span>
            )}
        </div>
    );
}

export default ConfidenceBadge;
