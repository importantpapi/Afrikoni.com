/**
 * ============================================================================
 * CONTROL PLANE DASHBOARD - Trade System Overview
 * ============================================================================
 * 
 * This is the main Control Plane view that shows the complete system state.
 * Think of it as "Mission Control" for trade operations.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, DollarSign, Truck, Map, AlertTriangle, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ControlPlaneMetric = ({ icon: Icon, label, value, max, status, tooltip, onClick }) => {
    const percentage = max ? (value / max) * 100 : value;

    const statusColors = {
        good: 'from-emerald-500 to-emerald-600',
        warning: 'from-amber-500 to-amber-600',
        error: 'from-red-500 to-red-600',
        low: 'from-emerald-500 to-emerald-600',
        medium: 'from-amber-500 to-amber-600',
        high: 'from-red-500 to-red-600',
    };

    return (
        <button
            onClick={onClick}
            className="group relative p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl 
                 border border-gray-200 hover:border-afrikoni-gold/40 
                 transition-all hover:shadow-lg"
        >
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-afrikoni-gold/20 to-afrikoni-gold/10
                      flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-afrikoni-gold" />
            </div>

            {/* Label */}
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {label}
            </div>

            {/* Value */}
            <div className="text-2xl font-bold text-afrikoni-deep mb-3">
                {typeof value === 'number' ? value : value}
                {max && <span className="text-sm text-gray-400">/{max}</span>}
            </div>

            {/* Progress Bar */}
            {max && (
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full bg-gradient-to-r transition-all", statusColors[status])}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            )}

            {/* Status Badge */}
            {!max && (
                <Badge variant={status === 'good' || status === 'low' ? 'success' :
                    status === 'warning' || status === 'medium' ? 'warning' : 'destructive'}>
                    {status}
                </Badge>
            )}

            {/* Tooltip */}
            {tooltip && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 
                        opacity-0 group-hover:opacity-100 transition-opacity
                        pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                        {tooltip}
                    </div>
                </div>
            )}
        </button>
    );
};

const BlockerCard = ({ blocker, onResolve }) => {
    const severityColors = {
        critical: 'border-red-200 bg-red-50',
        high: 'border-amber-200 bg-amber-50',
        medium: 'border-blue-200 bg-blue-50',
        low: 'border-gray-200 bg-gray-50',
    };

    const severityIcons = {
        critical: XCircle,
        high: AlertTriangle,
        medium: AlertTriangle,
        low: AlertTriangle,
    };

    const Icon = severityIcons[blocker.severity];

    return (
        <div className={cn(
            "p-4 rounded-lg border-2 transition-all",
            severityColors[blocker.severity]
        )}>
            <div className="flex items-start gap-3">
                <Icon className={cn(
                    "w-5 h-5 mt-0.5",
                    blocker.severity === 'critical' ? 'text-red-600' :
                        blocker.severity === 'high' ? 'text-amber-600' :
                            'text-blue-600'
                )} />

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm text-gray-900">{blocker.title}</h4>
                        <Badge variant={blocker.severity === 'critical' ? 'destructive' : 'warning'}>
                            {blocker.severity}
                        </Badge>
                    </div>

                    <p className="text-xs text-gray-700 mb-2">{blocker.description}</p>

                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-600">
                            <strong>Action:</strong> {blocker.actionRequired}
                            {blocker.estimatedResolutionTime && (
                                <span className="ml-2 text-gray-500">
                                    (~{blocker.estimatedResolutionTime})
                                </span>
                            )}
                        </div>

                        {blocker.actionUrl && (
                            <Button
                                size="sm"
                                onClick={() => onResolve(blocker)}
                                className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-black"
                            >
                                Resolve
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ControlPlaneDashboard = ({ systemState }) => {
    const navigate = useNavigate();

    if (!systemState) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading system state...</div>
            </div>
        );
    }

    const { tradeReadiness, trust, financial, logistics, intelligence } = systemState;

    const handleResolveBlocker = (blocker) => {
        if (blocker.actionUrl) {
            navigate(blocker.actionUrl);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-afrikoni-deep mb-2">
                    Trade Control Plane
                </h2>
                <p className="text-sm text-gray-600">
                    Real-time system health and orchestration
                </p>
            </div>

            {/* Overall Readiness */}
            <Surface className="p-6 border border-afrikoni-gold/10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-1">
                            Overall Trade Readiness
                        </h3>
                        <p className="text-xs text-gray-500">
                            System-wide health score
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                    cx="40" cy="40" r="32"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="none"
                                    className="text-gray-200"
                                />
                                <circle
                                    cx="40" cy="40" r="32"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeDasharray={`${tradeReadiness.score * 2.01} 201`}
                                    className={cn(
                                        tradeReadiness.score >= 80 ? "text-emerald-500" :
                                            tradeReadiness.score >= 60 ? "text-amber-500" :
                                                "text-red-500"
                                    )}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-afrikoni-deep">
                                    {tradeReadiness.score}
                                </span>
                            </div>
                        </div>

                        <div>
                            <Badge variant={
                                tradeReadiness.status === 'ready' ? 'success' :
                                    tradeReadiness.status === 'warning' ? 'warning' :
                                        'destructive'
                            } className="text-sm px-3 py-1">
                                {tradeReadiness.status === 'ready' ? '✅ Ready' :
                                    tradeReadiness.status === 'warning' ? '⚠️ Warning' :
                                        '❌ Blocked'}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Component Breakdown */}
                <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Trust</div>
                        <div className="text-lg font-bold text-afrikoni-deep">
                            {tradeReadiness.components.trust}
                        </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Compliance</div>
                        <div className="text-lg font-bold text-afrikoni-deep">
                            {tradeReadiness.components.compliance}
                        </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Financial</div>
                        <div className="text-lg font-bold text-afrikoni-deep">
                            {tradeReadiness.components.financial}
                        </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Logistics</div>
                        <div className="text-lg font-bold text-afrikoni-deep">
                            {tradeReadiness.components.logistics}
                        </div>
                    </div>
                </div>
            </Surface>

            {/* Control Metrics */}
            <div className="grid grid-cols-4 gap-4">
                <ControlPlaneMetric
                    icon={Shield}
                    label="Trust Health"
                    value={trust.counterpartyScore}
                    max={100}
                    status={trust.counterpartyScore >= 80 ? 'good' : 'warning'}
                    tooltip="Based on verification, trade history, and compliance"
                    onClick={() => navigate('/dashboard/trust-center')}
                />

                <ControlPlaneMetric
                    icon={Map}
                    label="Corridor Health"
                    value={logistics.avgCorridorHealth}
                    max={100}
                    status={logistics.shipmentRisk === 'low' ? 'good' : logistics.shipmentRisk === 'medium' ? 'warning' : 'error'}
                    tooltip="Real-time corridor congestion, customs, and FX volatility"
                    onClick={() => navigate('/dashboard/corridors')}
                />

                <ControlPlaneMetric
                    icon={DollarSign}
                    label="Payment Risk"
                    value={financial.paymentRisk}
                    status={financial.paymentRisk}
                    tooltip="Escrow status, FX exposure, counterparty credit"
                    onClick={() => navigate('/dashboard/payments')}
                />

                <ControlPlaneMetric
                    icon={Truck}
                    label="Shipment Risk"
                    value={logistics.shipmentRisk}
                    status={logistics.shipmentRisk}
                    tooltip="Route safety, weather, customs delays"
                    onClick={() => navigate('/dashboard/shipments')}
                />
            </div>

            {/* Active Blockers */}
            {tradeReadiness.blockers.length > 0 && (
                <Surface className="p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4">
                        Active Blockers ({tradeReadiness.blockers.length})
                    </h3>

                    <div className="space-y-3">
                        {tradeReadiness.blockers.map(blocker => (
                            <BlockerCard
                                key={blocker.id}
                                blocker={blocker}
                                onResolve={handleResolveBlocker}
                            />
                        ))}
                    </div>
                </Surface>
            )}

            {/* AI Recommendations */}
            {intelligence.recommendations.length > 0 && (
                <Surface className="p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4">
                        AI Recommendations ({intelligence.recommendations.length})
                    </h3>

                    <div className="text-sm text-gray-600">
                        View AI insights in the{' '}
                        <button
                            onClick={() => navigate('/dashboard/ai-copilot')}
                            className="text-blue-600 hover:underline font-medium"
                        >
                            AI Copilot
                        </button>
                    </div>
                </Surface>
            )}
        </div>
    );
};
