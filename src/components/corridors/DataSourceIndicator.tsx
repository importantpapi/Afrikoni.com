/**
 * ============================================================================
 * DATA SOURCE INDICATOR - Multi-Source Data Tracking
 * ============================================================================
 * 
 * Displays data sources for corridor metrics with icons and confidence levels
 * Supports: heuristic, crowdsourced, partner, verified
 */

import React from 'react';
import { Database, Users, GitBranch, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DataSource } from '@/types/corridorIntelligence';

interface DataSourceIndicatorProps {
    sources: DataSource[];
    showConfidence?: boolean;
    className?: string;
}

export function DataSourceIndicator({
    sources,
    showConfidence = false,
    className
}: DataSourceIndicatorProps) {
    if (!sources || sources.length === 0) {
        return null;
    }

    const getSourceIcon = (type: string) => {
        switch (type) {
            case 'verified':
                return <CheckCircle className="w-3 h-3" />;
            case 'partner':
                return <GitBranch className="w-3 h-3" />;
            case 'crowdsourced':
                return <Users className="w-3 h-3" />;
            case 'heuristic':
            default:
                return <Database className="w-3 h-3" />;
        }
    };

    const getSourceColor = (type: string) => {
        switch (type) {
            case 'verified':
                return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'partner':
                return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'crowdsourced':
                return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'heuristic':
            default:
                return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
        }
    };

    return (
        <div className={cn('flex items-center gap-2 flex-wrap', className)}>
            <span className="text-xs text-white/50">Sources:</span>
            {sources.map((source, index) => (
                <div
                    key={index}
                    className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs',
                        getSourceColor(source.type)
                    )}
                    title={`${source.name} - ${source.confidence}% confidence - Updated ${new Date(source.lastUpdated).toLocaleDateString()}`}
                >
                    {getSourceIcon(source.type)}
                    <span className="font-medium">{source.name}</span>
                    {showConfidence && (
                        <span className="opacity-70">({source.confidence}%)</span>
                    )}
                </div>
            ))}
        </div>
    );
}

export default DataSourceIndicator;
