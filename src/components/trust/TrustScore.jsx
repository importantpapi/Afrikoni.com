import React from 'react';
import { ShieldCheck, Award, Activity } from 'lucide-react';

export default function TrustScore({ score = 85, entityName = "Supplier" }) {
    // Determine color based on score
    let color = 'text-red-500';
    let stroke = '#ef4444';
    let label = 'High Risk';

    if (score >= 90) {
        color = 'text-koni-gold';
        stroke = '#D4AF37';
        label = 'Elite Tier';
    } else if (score >= 70) {
        color = 'text-emerald-500';
        stroke = '#10b981';
        label = 'Verified';
    } else if (score >= 50) {
        color = 'text-amber-500';
        stroke = '#f59e0b';
        label = 'Moderate';
    }

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex items-center gap-6 p-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md">
            {/* Radial Gauge */}
            <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full rotate-[-90deg]">
                    <circle
                        cx="48" cy="48" r={radius}
                        stroke="currentColor" strokeWidth="6" fill="transparent"
                        className="text-white/10"
                    />
                    <circle
                        cx="48" cy="48" r={radius}
                        stroke={stroke} strokeWidth="6" fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-black ${color}`}>{score}</span>
                    <span className="text-[8px] font-mono text-white/40 uppercase">Trust Score</span>
                </div>
            </div>

            {/* Metrics */}
            <div className="flex-1 space-y-3">
                <div>
                    <h4 className="text-sm font-bold text-white mb-0.5">{entityName}</h4>
                    <div className={`text-xs font-medium uppercase tracking-wider ${color}`}>{label}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 p-1.5 rounded">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>KYC Verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 p-1.5 rounded">
                        <Activity className="w-3 h-3 text-koni-gold" />
                        <span>98% Fulfillment</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
