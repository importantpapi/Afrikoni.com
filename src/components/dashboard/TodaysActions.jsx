/**
 * ============================================================================
 * TODAY'S ACTIONS - AI Co-Pilot Dashboard
 * ============================================================================
 * 
 * Transforms static insights into actionable commands.
 * Shows users exactly what to do next, prioritized by urgency and impact.
 * 
 * Priority Levels:
 * 🔴 URGENT - Action required (time-sensitive)
 * 🟡 RECOMMENDED - High impact actions
 * 🟢 OPPORTUNITIES - Growth and optimization
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import {
    AlertTriangle, TrendingUp, Sparkles, ChevronRight,
    Clock, DollarSign, FileText, Package, MessageSquare,
    Shield, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAIActions } from '@/hooks/useAIActions';

const PRIORITY_CONFIG = {
    urgent: {
        label: 'Urgent',
        icon: AlertTriangle,
        color: 'red',
        bgClass: 'bg-red-500/10',
        borderClass: 'border-red-500/20',
        textClass: 'text-red-400',
    },
    recommended: {
        label: 'Recommended',
        icon: TrendingUp,
        color: 'amber',
        bgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-500/20',
        textClass: 'text-amber-400',
    },
    opportunity: {
        label: 'Opportunities',
        icon: Sparkles,
        color: 'emerald',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/20',
        textClass: 'text-emerald-400',
    },
};

export default function TodaysActions({ compact = false }) {
    const navigate = useNavigate();
    const { actions, loading, markAsCompleted } = useAIActions();

    const groupedActions = useMemo(() => {
        if (!actions) return { urgent: [], recommended: [], opportunity: [] };

        return {
            urgent: (actions || []).filter(a => a.priority === 'urgent'),
            recommended: (actions || []).filter(a => a.priority === 'recommended'),
            opportunity: (actions || []).filter(a => a.priority === 'opportunity'),
        };
    }, [actions]);

    const totalActions = actions?.length || 0;

    if (loading) {
        return (
            <Surface variant="glass" className="p-6 border border-white/10">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-white/10 rounded w-1/3" />
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                </div>
            </Surface>
        );
    }

    if (totalActions === 0) {
        return (
            <Surface variant="glass" className="p-6 border border-white/10">
                <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">All Caught Up!</h3>
                    <p className="text-sm text-white/60">
                        No urgent actions right now. Check back later for new opportunities.
                    </p>
                </div>
            </Surface>
        );
    }

    const handleActionClick = (action) => {
        if (action.path) {
            navigate(action.path);
        }
        if (action.id) {
            markAsCompleted(action.id);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#D4A937]" />
                        Today's Actions
                    </h2>
                    <p className="text-sm text-white/60 mt-1">
                        {totalActions} action{totalActions !== 1 ? 's' : ''} recommended
                    </p>
                </div>
                {!compact && totalActions > 3 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/dashboard/today')}
                    >
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                )}
            </div>

            {/* Urgent Actions */}
            {groupedActions.urgent.length > 0 && (
                <ActionSection
                    priority="urgent"
                    actions={compact ? groupedActions.urgent.slice(0, 2) : groupedActions.urgent}
                    onActionClick={handleActionClick}
                />
            )}

            {/* Recommended Actions */}
            {groupedActions.recommended.length > 0 && (
                <ActionSection
                    priority="recommended"
                    actions={compact ? groupedActions.recommended.slice(0, 3) : groupedActions.recommended}
                    onActionClick={handleActionClick}
                />
            )}

            {/* Opportunities */}
            {!compact && groupedActions.opportunity.length > 0 && (
                <ActionSection
                    priority="opportunity"
                    actions={groupedActions.opportunity}
                    onActionClick={handleActionClick}
                />
            )}
        </div>
    );
}

function ActionSection({ priority, actions, onActionClick }) {
    const config = PRIORITY_CONFIG[priority];
    const Icon = config.icon;

    return (
        <Surface
            variant="panel"
            className={cn(
                "p-5 border",
                config.bgClass,
                config.borderClass
            )}
        >
            <div className="flex items-center gap-2 mb-4">
                <Icon className={cn("w-4 h-4", config.textClass)} />
                <h3 className={cn("text-sm font-bold uppercase tracking-wider", config.textClass)}>
                    {config.label} ({actions.length})
                </h3>
            </div>

            <div className="space-y-3">
                {(actions || []).map((action) => (
                    <ActionItem
                        key={action.id}
                        action={action}
                        onClick={() => onActionClick(action)}
                        config={config}
                    />
                ))}
            </div>
        </Surface>
    );
}

function ActionItem({ action, onClick, config }) {
    const ActionIcon = getActionIcon(action.type);

    return (
        <div
            className="group p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        config.bgClass
                    )}>
                        <ActionIcon className={cn("w-4 h-4", config.textClass)} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white mb-1">
                            {action.title}
                        </h4>
                        <p className="text-xs text-white/60 line-clamp-2">
                            {action.description}
                        </p>

                        {action.metadata && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                                {action.metadata.timeLeft && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {action.metadata.timeLeft}
                                    </span>
                                )}
                                {action.metadata.value && (
                                    <span className="flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        {action.metadata.value}
                                    </span>
                                )}
                                {action.metadata.count && (
                                    <span>{action.metadata.count}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                    {action.actionLabel || 'View'}
                    <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
            </div>
        </div>
    );
}

function getActionIcon(type) {
    const icons = {
        rfq: MessageSquare,
        quote: FileText,
        shipment: Package,
        payment: DollarSign,
        compliance: Shield,
        pricing: TrendingUp,
        opportunity: Sparkles,
        default: ArrowUpRight,
    };
    return icons[type] || icons.default;
}
