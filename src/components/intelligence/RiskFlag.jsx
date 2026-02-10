import React from 'react';
import { AlertTriangle, ShieldAlert, TrendingDown, Info } from 'lucide-react';

export const RISK_LEVEL = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    SAFE: 'safe'
};

const LEVEL_CONFIG = {
    [RISK_LEVEL.CRITICAL]: {
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        icon: ShieldAlert,
        label: 'Critical Risk'
    },
    [RISK_LEVEL.HIGH]: {
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        icon: AlertTriangle,
        label: 'High Risk'
    },
    [RISK_LEVEL.MEDIUM]: {
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        icon: TrendingDown,
        label: 'Medium Risk'
    },
    [RISK_LEVEL.LOW]: {
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        icon: Info,
        label: 'Low Risk'
    },
    [RISK_LEVEL.SAFE]: {
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        icon: Info,
        label: 'Safe'
    }
};

export default function RiskFlag({ level = RISK_LEVEL.MEDIUM, label, children, className = '' }) {
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[RISK_LEVEL.MEDIUM];
    const Icon = config.icon;

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border} ${className}`}>
            <Icon className={`w-5 h-5 mt-0.5 ${config.color}`} />
            <div className="flex-1">
                <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${config.color}`}>
                    {label || config.label}
                </div>
                <div className="text-sm text-white/90 leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
}
