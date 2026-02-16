import React from 'react';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';

export default function SystemAdvice({ advice, type = 'opportunity', onAction }) {
    if (!advice) return null;

    const isOpportunity = type === 'opportunity';
    const isRisk = type === 'risk';

    return (
        <div className="relative group overflow-hidden rounded-os-sm border border-white/10 bg-black/40 backdrop-blur-md p-4 transition-all hover:border-koni-gold/30">
            {/* Glow Effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${isOpportunity ? 'bg-gradient-to-r from-koni-gold/20 via-transparent to-transparent' : 'bg-gradient-to-r from-red-500/20 via-transparent to-transparent'
                }`} />

            <div className="relative flex gap-4">
                {/* Icon Column */}
                <div className="shrink-0 pt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOpportunity ? 'bg-koni-gold/10 text-koni-gold' : 'bg-os-red/10 text-red-400'
                        }`}>
                        {isOpportunity ? <Sparkles className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                        <h4 className={`text-os-sm font-medium ${isOpportunity ? 'text-koni-gold' : 'text-red-400'
                            }`}>
                            {isOpportunity ? 'System Opportunity' : 'Risk Detected'}
                        </h4>
                        <span className="text-os-xs uppercase tracking-wider text-white/40 font-mono">
                            AI-KERNEL
                        </span>
                    </div>

                    <p className="text-os-sm text-white/90 leading-relaxed">
                        {advice.message}
                    </p>

                    {advice.action && (
                        <button
                            onClick={() => onAction && onAction(advice.action)}
                            className="mt-2 flex items-center gap-2 text-os-xs font-medium text-white/60 hover:text-white transition-colors group/btn"
                        >
                            {advice.actionLabel || 'View Details'}
                            <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
