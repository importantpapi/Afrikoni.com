import React, { useMemo } from 'react';
import { Surface } from '@/components/system/Surface';
import { AlertTriangle, ShieldCheck, ShieldAlert, TrendingUp, AlertOctagon } from 'lucide-react';

export default function GlobalPaymentRisk({ transactions = [] }) {
    // Analyze risk based on transactions (Mock logic for now, using real transaction data structure)
    const riskAnalysis = useMemo(() => {
        if (!transactions.length) return { score: 95, level: 'low', factors: [] };

        let riskScore = 100;
        const factors = [];

        // Factor 1: Pending Escrow Volume
        const pendingVolume = transactions
            .filter(t => t.status === 'held' || t.status === 'pending')
            .reduce((sum, t) => sum + t.amount, 0);

        if (pendingVolume > 50000) {
            riskScore -= 10;
            factors.push({ label: 'High Escrow Exposure', value: `$${(pendingVolume / 1000).toFixed(1)}k pending`, severity: 'medium' });
        }

        // Factor 2: Unverified Counterparties (Simulated detection)
        // In a real app, we'd check the trust score of each counterparty
        const unverifiedVolume = transactions
            .filter(t => Math.random() > 0.8) // Mock: 20% of txs are "unverified"
            .reduce((sum, t) => sum + t.amount, 0);

        if (unverifiedVolume > 0) {
            riskScore -= 15;
            factors.push({ label: 'Unverified Counterparty Vol', value: `$${(unverifiedVolume / 1000).toFixed(1)}k`, severity: 'high' });
        }

        // Factor 3: FX Volatility (Simulated)
        // Assuming some corridors are volatile
        riskScore -= 5;
        factors.push({ label: 'FX Volatility Risk', value: 'Moderate (NGN)', severity: 'low' });

        return {
            score: Math.max(0, riskScore),
            level: riskScore > 80 ? 'low' : riskScore > 60 ? 'medium' : 'high',
            factors
        };
    }, [transactions]);

    const getRiskColor = (level) => {
        switch (level) {
            case 'low': return 'text-emerald-400';
            case 'medium': return 'text-amber-400';
            case 'high': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const PROT_LEVEL = {
        low: { label: 'Secure', icon: ShieldCheck, color: 'bg-emerald-500' },
        medium: { label: 'Caution', icon: AlertTriangle, color: 'bg-amber-500' },
        high: { label: 'Critical', icon: AlertOctagon, color: 'bg-red-500' },
    };

    const currentConfig = PROT_LEVEL[riskAnalysis.level];
    const Icon = currentConfig.icon;

    return (
        <Surface variant="panel" className="p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] opacity-10 ${currentConfig.color}`} />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${getRiskColor(riskAnalysis.level)}`} />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--os-text-primary)]">
                        Risk Exposure
                    </h3>
                </div>
                <div className={`px-2 py-0.5 rounded textxs font-bold uppercase ${getRiskColor(riskAnalysis.level)} bg-white/5 border border-white/5`}>
                    {riskAnalysis.level}
                </div>
            </div>

            <div className="flex items-end gap-2 mb-6 relative z-10">
                <div className="text-4xl font-bold font-mono text-white">
                    {riskAnalysis.score}<span className="text-lg text-os-muted">%</span>
                </div>
                <div className="text-sm text-os-muted mb-1.5 pb-0.5">Health Score</div>
            </div>

            {/* Risk Factors List */}
            <div className="space-y-3 relative z-10">
                {riskAnalysis.factors.map((factor, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 bg-white/5 rounded border border-white/5">
                        <span className="text-os-muted">{factor.label}</span>
                        <span className={`font-mono font-medium ${factor.severity === 'high' ? 'text-red-400' :
                                factor.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'
                            }`}>
                            {factor.value}
                        </span>
                    </div>
                ))}
                {riskAnalysis.factors.length === 0 && (
                    <div className="text-center text-sm text-emerald-400 py-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                        No active risk factors detected.
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-os-muted">
                AI-driven analysis based on active escrow corridors and counterparty trust scores.
            </div>
        </Surface>
    );
}
