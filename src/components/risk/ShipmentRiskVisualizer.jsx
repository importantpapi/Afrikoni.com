import React, { useMemo } from 'react';
import { Surface } from '@/components/system/Surface';
import { AlertCircle, Clock, MapPin, CheckCircle, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ShipmentRiskVisualizer({ shipments = [] }) {
    const riskAnalysis = useMemo(() => {
        if (!shipments.length) return { score: 100, level: 'low', alerts: [] };

        let score = 100;
        const alerts = [];

        // Categorize
        const active = shipments.filter(s => ['in_transit', 'picked_up', 'out_for_delivery', 'delayed'].includes((s.status || '').toLowerCase()));
        if (!active.length) return { score: 100, level: 'low', alerts: [] };

        // 1. Delay Risk
        const delayed = active.filter(s => (s.status || '').toLowerCase() === 'delayed');
        const delayPenalty = (delayed.length / active.length) * 40; // Max 40 pts penalty for delays
        score -= delayPenalty;

        if (delayed.length > 0) {
            alerts.push({
                type: 'delay',
                label: `${delayed.length} shipment(s) delayed`,
                severity: delayed.length > 2 ? 'high' : 'medium'
            });
        }

        // 2. Route Deviation (Simulated for Demo)
        // In production, compare current coords with expected route path
        const deviatedCount = active.filter(s => Math.random() > 0.9).length; // 10% chance mock deviation
        if (deviatedCount > 0) {
            score -= deviatedCount * 15;
            alerts.push({
                type: 'route',
                label: `${deviatedCount} route deviation(s) detected`,
                severity: 'high'
            });
        }

        // 3. ETA Slippage (Simulated)
        // Check if updated_at is significantly past expected checkpoints
        const slippageCount = active.filter(s => Math.random() > 0.85).length;
        if (slippageCount > 0) {
            score -= slippageCount * 5;
            alerts.push({
                type: 'eta',
                label: `${slippageCount} ETA slippage risks`,
                severity: 'low'
            });
        }

        return {
            score: Math.max(0, Math.round(score)),
            level: score > 80 ? 'low' : score > 60 ? 'medium' : 'high',
            alerts: alerts.sort((a, b) => (a.severity === 'high' ? -1 : 1)),
            stats: {
                total: active.length,
                delayed: delayed.length,
                deviated: deviatedCount
            }
        };
    }, [shipments]);

    const getRiskColor = (level) => {
        switch (level) {
            case 'low': return 'text-emerald-400';
            case 'medium': return 'text-amber-400';
            case 'high': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getSeverityBg = (severity) => {
        switch (severity) {
            case 'high': return 'bg-os-red/10 border-os-red/20 text-red-400';
            case 'medium': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
            case 'low': return 'bg-os-blue/10 border-os-blue/20 text-blue-400';
            default: return 'bg-white/5 border-white/10 text-os-muted';
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'delay': return Clock;
            case 'route': return Navigation;
            case 'eta': return AlertCircle;
            default: return AlertCircle;
        }
    };

    return (
        <Surface variant="panel" className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-os-sm font-semibold uppercase tracking-wider text-[var(--os-text-primary)] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-os-muted" />
                    Shipment Integrity
                </h3>
                <span className={cn("text-os-xs font-bold px-2 py-0.5 rounded border bg-white/5 border-white/5 uppercase", getRiskColor(riskAnalysis.level))}>
                    {riskAnalysis.level} Risk
                </span>
            </div>

            <div className="flex items-center gap-6 mb-6">
                {/* Circular Gauge Placeholder (CSS-only for speed) */}
                <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 * (1 - riskAnalysis.score / 100)}
                            className={cn("transition-all duration-1000 ease-out", getRiskColor(riskAnalysis.level))}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-os-2xl font-bold text-white">{riskAnalysis.score}</span>
                        <span className="text-os-xs text-os-muted uppercase">Health</span>
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-os-xs">
                        <span className="text-os-muted">Total Active</span>
                        <span className="text-white font-mono">{riskAnalysis.stats?.total || 0}</span>
                    </div>
                    <div className="flex justify-between text-os-xs">
                        <span className="text-os-muted">Delays</span>
                        <span className={cn("font-mono", riskAnalysis.stats?.delayed > 0 ? "text-amber-400" : "text-emerald-400")}>
                            {riskAnalysis.stats?.delayed || 0}
                        </span>
                    </div>
                    <div className="flex justify-between text-os-xs">
                        <span className="text-os-muted">Route Deviations</span>
                        <span className={cn("font-mono", riskAnalysis.stats?.deviated > 0 ? "text-red-400" : "text-emerald-400")}>
                            {riskAnalysis.stats?.deviated || 0}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-2 flex-grow overflow-y-auto pr-1 custom-scrollbar">
                {riskAnalysis.alerts.map((alert, i) => {
                    const Icon = getIcon(alert.type);
                    return (
                        <div key={i} className={cn("p-2 rounded border flex items-center gap-3 text-os-xs transition-colors", getSeverityBg(alert.severity))}>
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium">{alert.label}</span>
                        </div>
                    );
                })}
                {riskAnalysis.alerts.length === 0 && (
                    <div className="text-center py-4 text-emerald-400/60 text-os-xs italic">
                        Network optimal. No risk factors detected.
                    </div>
                )}
            </div>
        </Surface>
    );
}
