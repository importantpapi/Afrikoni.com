import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CopilotSignal = ({
    type = 'info',
    label,
    value,
    message,
    active = false
}) => {
    const tones = {
        info: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: Sparkles },
        secure: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: ShieldCheck },
        warning: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: AlertTriangle },
        market: { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: TrendingUp },
        express: { color: 'text-afrikoni-gold', bg: 'bg-afrikoni-gold/10', border: 'border-afrikoni-gold/20', icon: Zap }
    };

    const tone = tones[type];
    const Icon = tone.icon;

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ opacity: 0, x: -10, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: 10, filter: 'blur(10px)' }}
                    className={cn(
                        "p-4 rounded-2xl border flex items-start gap-4 transition-all duration-500",
                        tone.bg, tone.border
                    )}
                >
                    <div className={cn("p-2 rounded-xl bg-black/40 border shadow-inner", tone.border)}>
                        <Icon className={cn("w-5 h-5", tone.color)} />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", tone.color)}>
                                {label}
                            </span>
                            {value && (
                                <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">
                                    {value}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed italic font-medium">
                            {message}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
