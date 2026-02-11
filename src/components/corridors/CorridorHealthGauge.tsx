/**
 * ============================================================================
 * CORRIDOR HEALTH GAUGE - Visual Health Score Display
 * ============================================================================
 * 
 * Displays corridor health score with circular gauge and component breakdown
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { CorridorHealthBreakdown } from '@/types/corridorIntelligence';
import { getHealthStatusLabel, getHealthStatusColor } from '@/hooks/useCorridorHealth';

interface CorridorHealthGaugeProps {
    score: number;
    breakdown: CorridorHealthBreakdown;
    size?: 'sm' | 'md' | 'lg';
    showBreakdown?: boolean;
    className?: string;
}

export function CorridorHealthGauge({
    score,
    breakdown,
    size = 'md',
    showBreakdown = true,
    className,
}: CorridorHealthGaugeProps) {
    const statusLabel = getHealthStatusLabel(score);
    const colors = getHealthStatusColor(score);

    const sizes = {
        sm: { gauge: 80, stroke: 6, text: 'text-2xl' },
        md: { gauge: 128, stroke: 8, text: 'text-3xl' },
        lg: { gauge: 160, stroke: 10, text: 'text-4xl' },
    };

    const { gauge: gaugeSize, stroke: strokeWidth, text: textSize } = sizes[size];
    const radius = (gaugeSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const breakdownItems = [
        { key: 'congestion', label: 'Congestion', score: breakdown.congestion },
        { key: 'customs', label: 'Customs', score: breakdown.customs },
        { key: 'fx', label: 'FX', score: breakdown.fx },
        { key: 'weather', label: 'Weather', score: breakdown.weather },
        { key: 'onTime', label: 'On-Time', score: breakdown.onTime },
        { key: 'dataQuality', label: 'Data Quality', score: breakdown.dataQuality },
    ];

    return (
        <div className={cn('space-y-4', className)}>
            {/* Circular Gauge */}
            <div className="flex items-center justify-center">
                <div className="relative" style={{ width: gaugeSize, height: gaugeSize }}>
                    {/* Background circle */}
                    <svg className="transform -rotate-90" width={gaugeSize} height={gaugeSize}>
                        <circle
                            cx={gaugeSize / 2}
                            cy={gaugeSize / 2}
                            r={radius}
                            stroke="currentColor"
                            strokeWidth={strokeWidth}
                            fill="none"
                            className="text-white/10"
                        />
                        {/* Progress circle */}
                        <motion.circle
                            cx={gaugeSize / 2}
                            cy={gaugeSize / 2}
                            r={radius}
                            stroke="currentColor"
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className={cn('transition-all duration-1000', colors.text)}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </svg>

                    {/* Score text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={cn('font-bold text-white', textSize)}>{score}</span>
                        <span className="text-xs text-white/60 uppercase tracking-wider mt-1">
                            {statusLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Component Breakdown */}
            {showBreakdown && (
                <div className="space-y-2">
                    {breakdownItems.map(({ key, label, score: itemScore }) => (
                        <div key={key} className="flex items-center gap-3">
                            <span className="text-sm text-white/70 w-24 flex-shrink-0">{label}</span>
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className={cn('h-full bg-gradient-to-r', colors.gradient)}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${itemScore}%` }}
                                    transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                                />
                            </div>
                            <span className="text-sm font-medium text-white w-12 text-right">
                                {itemScore}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CorridorHealthGauge;
