import React from 'react';
import { Surface } from '@/components/system/Surface';
import TrustBadge from './TrustBadge';
import { CheckCircle2, History, Network, Shield } from 'lucide-react';

export default function TrustScoreCard({ trustData }) {
    if (!trustData) return null;

    const { total_score, level, verification_score, history_score, network_score } = trustData;

    const pillars = [
        { label: 'Identity', score: verification_score, max: 40, icon: Shield },
        { label: 'History', score: history_score, max: 35, icon: History },
        { label: 'Network', score: network_score, max: 25, icon: Network },
    ];

    return (
        <Surface variant="glass" className="p-0 overflow-hidden border border-white/10">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div>
                    <h3 className="text-os-sm font-bold text-white uppercase tracking-wider">Trust Score</h3>
                    <p className="text-os-xs text-white/50">Afrikoni Verified™</p>
                </div>
                <TrustBadge score={total_score} level={level} size="lg" />
            </div>

            {/* Pillars */}
            <div className="p-4 space-y-4">
                {pillars.map((pillar) => (
                    <div key={pillar.label} className="space-y-1">
                        <div className="flex justify-between text-os-xs">
                            <span className="flex items-center gap-1.5 text-white/80">
                                <pillar.icon className="w-3 h-3 text-[#D4A937]" />
                                {pillar.label}
                            </span>
                            <span className="font-mono text-white/60">
                                {pillar.score}/{pillar.max}
                            </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#D4A937]/50 to-[#D4A937] rounded-full"
                                style={{ width: `${(pillar.score / pillar.max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-white/5 border-t border-white/5 text-os-xs text-center text-white/40">
                Score updated dynamically based on real-time trade data.
            </div>
        </Surface>
    );
}
