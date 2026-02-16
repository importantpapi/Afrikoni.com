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

import React, { useMemo, memo } from 'react';
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

function TodaysActions({ compact = false }) {
    const navigate = useNavigate();
    const { actions, loading, markAsCompleted } = useAIActions();

    // ✅ MOBILE GUARD: Safely group actions with null protection
    const groupedActions = useMemo(() => {
        if (!actions || !Array.isArray(actions)) {
            return { urgent: [], recommended: [], opportunity: [] };
        }

        return {
            urgent: actions.filter(a => a?.priority === 'urgent'),
            recommended: actions.filter(a => a?.priority === 'recommended'),
            opportunity: actions.filter(a => a?.priority === 'opportunity'),
        };
    }, [actions]);

    const totalActions = actions?.length || 0;

    if (loading) {
        return (
            <Surface variant="glass" className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-os-stroke rounded w-1/3" />
                    <div className="h-4 bg-os-stroke rounded w-2/3" />
                    <div className="h-4 bg-os-stroke rounded w-1/2" />
                </div>
            </Surface>
        );
    }

    if (totalActions === 0) {
        return (
            <Surface variant="glass" className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-os-accent/10 flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-os-accent" />
                </div>
                <h3 className="text-xl font-bold text-os-text-primary mb-2">All Clear</h3>
                <p className="text-os-text-secondary max-w-xs mx-auto">
                    Your trade flow is optimized. No pending focus items for today.
                </p>
            </Surface>
        );
    }

    const handleActionClick = (action) => {
        if (!action) return;
        if (action.path) navigate(action.path);
        if (action.id) markAsCompleted(action.id);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-xl font-bold text-os-text-primary flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-os-accent" />
                        Today's Focus
                    </h2>
                    <p className="text-sm text-os-text-secondary mt-1">
                        {totalActions} item{totalActions !== 1 ? 's' : ''} awaiting your coordination
                    </p>
                </div>
                {!compact && totalActions > 3 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/dashboard/today')}
                        className="text-os-accent hover:bg-os-accent/5 font-bold"
                    >
                        Review All
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                )}
            </div>

            {/* Orchestrated Actions */}
            <div className="space-y-4">
                {groupedActions.urgent.length > 0 && (
                    <ActionSection
                        priority="urgent"
                        actions={compact ? groupedActions.urgent.slice(0, 2) : groupedActions.urgent}
                        onActionClick={handleActionClick}
                    />
                )}

                {groupedActions.recommended.length > 0 && (
                    <ActionSection
                        priority="recommended"
                        actions={compact ? groupedActions.recommended.slice(0, 3) : groupedActions.recommended}
                        onActionClick={handleActionClick}
                    />
                )}

                {!compact && groupedActions.opportunity.length > 0 && (
                    <ActionSection
                        priority="opportunity"
                        actions={groupedActions.opportunity}
                        onActionClick={handleActionClick}
                    />
                )}
            </div>
        </div>
    );
}

export default memo(TodaysActions);

function ActionSection({ priority, actions, onActionClick }) {
    const config = PRIORITY_CONFIG[priority];
    if (!config || !Array.isArray(actions)) return null;

    const Icon = config.icon;

    return (
        <Surface
            variant="glass"
            className={cn(
                "p-6 border-l-2",
                priority === 'urgent' ? 'border-l-os-error' :
                    priority === 'recommended' ? 'border-l-os-accent' :
                        'border-l-os-success'
            )}
        >
            <div className="flex items-center gap-3 mb-6">
                <div className={cn("p-1.5 rounded-lg", config.bgClass)}>
                    <Icon className={cn("w-4 h-4", config.textClass)} />
                </div>
                <h3 className={cn("text-xs font-bold uppercase tracking-[0.2em]", config.textClass)}>
                    {config.label} <span className="opacity-50 ml-1">({actions.length})</span>
                </h3>
            </div>

            <div className="space-y-4">
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
    if (!action || !config) return null;

    const ActionIcon = getActionIcon(action?.type);

    return (
        <div
            className="group p-5 bg-os-surface-solid/50 hover:bg-os-surface-solid border border-os-stroke hover:border-os-accent/30 rounded-2xl transition-all duration-300 cursor-pointer shadow-subtle hover:shadow-premium"
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
                        config.bgClass
                    )}>
                        <ActionIcon className={cn("w-5 h-5", config.textClass)} />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                        <h4 className="text-sm font-bold text-os-text-primary mb-1 group-hover:text-os-accent transition-colors">
                            {action.title}
                        </h4>
                        <p className="text-xs text-os-text-secondary leading-relaxed line-clamp-2">
                            {action?.description || 'No coordination details available.'}
                        </p>

                        {action?.metadata && (
                            <div className="flex items-center gap-4 mt-3 text-[10px] font-bold uppercase tracking-wider text-os-text-secondary/60">
                                {action.metadata.timeLeft && (
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        {action.metadata.timeLeft}
                                    </span>
                                )}
                                {action.metadata.value && (
                                    <span className="flex items-center gap-1.5">
                                        <DollarSign className="w-3 h-3" />
                                        {action.metadata.value}
                                    </span>
                                )}
                                {action.metadata.count && (
                                    <span className="flex items-center gap-1.5">
                                        <Layers className="w-3 h-3" />
                                        {action.metadata.count} units
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 pt-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 bg-os-accent/10 text-os-accent hover:bg-os-accent hover:text-white rounded-full px-4"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-tighter">{action.actionLabel || 'Proceed'}</span>
                        <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>
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
