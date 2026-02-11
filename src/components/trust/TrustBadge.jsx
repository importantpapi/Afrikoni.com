import React from 'react';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming standard utility exists

const LEVEL_CONFIG = {
    platinum: { label: 'Platinum', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: ShieldCheck },
    gold: { label: 'Gold', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: ShieldCheck },
    silver: { label: 'Silver', color: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Shield },
    unrated: { label: 'Unrated', color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: ShieldAlert },
};

export default function TrustBadge({ score, level = 'unrated', size = 'sm', className }) {
    const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.unrated;
    const Icon = config.icon;

    if (size === 'xs') {
        return (
            <div className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border", config.bg, config.text, config.border, className)}>
                <Icon className="w-3 h-3" />
                <span>{score}</span>
            </div>
        );
    }

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 rounded-full border transition-all hover:scale-105 cursor-help",
            size === 'lg' ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs",
            config.bg,
            config.border,
            className
        )}>
            <Icon className={cn("flex-shrink-0", size === 'lg' ? "w-4 h-4" : "w-3 h-3", config.color)} />

            <div className="flex flex-col leading-none">
                <span className={cn("font-bold font-mono", config.color)}>
                    {score}
                </span>
            </div>
            <span className={cn("opacity-70 font-medium ml-1", config.color)}>
                {config.label}
            </span>
        </div>
    );
}
