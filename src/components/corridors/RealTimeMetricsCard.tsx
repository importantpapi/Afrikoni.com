/**
 * ============================================================================
 * REAL-TIME METRICS CARD - Corridor Metric Display
 * ============================================================================
 * 
 * Displays individual corridor metrics with confidence, sources, and trends
 */

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/system/Surface';
import ConfidenceBadge from './ConfidenceBadge';
import DataSourceIndicator from './DataSourceIndicator';
import type { CorridorDataPoint, TrendDirection } from '@/types/corridorIntelligence';

interface RealTimeMetricsCardProps<T> {
    icon: LucideIcon;
    label: string;
    dataPoint: CorridorDataPoint<T>;
    formatValue?: (value: T) => string;
    className?: string;
}

export function RealTimeMetricsCard<T>({
    icon: Icon,
    label,
    dataPoint,
    formatValue,
    className,
}: RealTimeMetricsCardProps<T>) {
    const displayValue = formatValue
        ? formatValue(dataPoint.value)
        : String(dataPoint.value);

    const getTrendIcon = (trend?: TrendDirection) => {
        switch (trend) {
            case 'increasing':
                return <TrendingUp className="w-4 h-4 text-red-400" />;
            case 'decreasing':
                return <TrendingDown className="w-4 h-4 text-emerald-400" />;
            case 'stable':
            default:
                return <Minus className="w-4 h-4 text-blue-400" />;
        }
    };

    const lastUpdated = new Date(dataPoint.lastUpdated);
    const minutesAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
    const timeAgo = minutesAgo < 60
        ? `${minutesAgo}m ago`
        : minutesAgo < 1440
            ? `${Math.floor(minutesAgo / 60)}h ago`
            : `${Math.floor(minutesAgo / 1440)}d ago`;

    return (
        <Surface variant="glass" className={cn('p-4', className)}>
            <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-white/5">
                            <Icon className="w-5 h-5 text-white/70" />
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-white/90">{label}</h4>
                            <p className="text-xs text-white/50">{timeAgo}</p>
                        </div>
                    </div>
                    {dataPoint.trend && (
                        <div className="flex items-center gap-1">
                            {getTrendIcon(dataPoint.trend)}
                        </div>
                    )}
                </div>

                {/* Value */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-baseline gap-2"
                >
                    <span className="text-2xl font-bold text-white">{displayValue}</span>
                    <ConfidenceBadge confidence={dataPoint.confidence} showLabel={false} size="sm" />
                </motion.div>

                {/* Confidence & Sources */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50">Confidence</span>
                        <span className="text-xs font-medium text-white/70">
                            {dataPoint.confidence}%
                        </span>
                    </div>

                    <DataSourceIndicator sources={dataPoint.sources} />
                </div>
            </div>
        </Surface>
    );
}

export default RealTimeMetricsCard;
