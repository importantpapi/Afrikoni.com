import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, ShieldCheck, Download } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';
import { cn } from '@/lib/utils';

export default function SuccessScreen({
    title = "Success!",
    message = "Operation completed successfully.",
    primaryAction,
    primaryActionLabel = "Continue",
    secondaryAction,
    secondaryActionLabel = "Close",
    icon: Icon = CheckCircle,
    nextSteps = [], // Array of { label, icon }
    theme = "emerald", // emerald, amber, blue, vault, gold
    ctaIcon: CTAIcon = ArrowRight
}) {
    const themeClasses = {
        emerald: "text-emerald-500 bg-emerald-500/20 border-emerald-500/30",
        amber: "text-amber-500 bg-amber-500/20 border-amber-500/30",
        blue: "text-blue-500 bg-blue-500/20 border-blue-500/30",
        vault: "text-os-accent bg-os-accent/20 border-os-accent/30",
        gold: "text-[#D4A937] bg-[#D4A937]/20 border-[#D4A937]/30"
    }[theme] || themeClasses.emerald;

    const buttonClasses = {
        emerald: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20",
        amber: "bg-amber-600 hover:bg-amber-700 shadow-amber-900/20",
        blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-900/20",
        vault: "bg-os-accent text-black hover:bg-os-accent/90 shadow-os-accent/20",
        gold: "bg-[#D4A937] text-black hover:bg-[#D4A937]/90 shadow-[#D4A937]/20"
    }[theme] || buttonClasses.emerald;

    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center h-full min-h-[400px]">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="relative mb-6"
            >
                <div className={cn("absolute inset-0 blur-2xl rounded-full", theme === 'emerald' ? 'bg-emerald-500/20' : theme === 'amber' ? 'bg-amber-500/20' : 'bg-blue-500/20')} />
                <div className={cn("relative w-24 h-24 rounded-full bg-os-surface-1 border flex items-center justify-center", themeClasses)}>
                    <Icon className="w-12 h-12" />
                </div>
                {/* Decoration rings */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn("absolute inset-0 rounded-full border", theme === 'emerald' ? 'border-emerald-500/20' : theme === 'amber' ? 'border-amber-500/20' : 'border-blue-500/20')}
                />
            </motion.div>

            <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-3xl font-bold text-os-text-primary mb-3"
            >
                {title}
            </motion.h2>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-os-text-secondary max-w-md mb-8 leading-relaxed"
            >
                {message}
            </motion.p>

            {/* Next Steps Section */}
            {nextSteps.length > 0 && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="w-full max-w-md mb-8 text-left space-y-3 bg-os-surface-1/50 border border-os-stroke p-4 rounded-os-md"
                >
                    <p className="text-os-xs font-bold uppercase tracking-widest text-os-text-secondary/60 mb-2 px-1">What Happens Next</p>
                    {nextSteps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-os-sm hover:bg-os-surface-2 transition-colors">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-white/5", theme === 'emerald' ? 'text-emerald-500' : theme === 'amber' ? 'text-amber-500' : 'text-blue-500')}>
                                {step.icon || <CheckCircle className="w-4 h-4" />}
                            </div>
                            <span className="text-os-sm text-os-text-primary">{step.label}</span>
                        </div>
                    ))}
                </motion.div>
            )}

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
            >
                {primaryAction && (
                    <Button
                        onClick={primaryAction}
                        className={cn("text-white min-w-[200px] h-12 text-base shadow-lg font-black uppercase tracking-widest", buttonClasses)}
                    >
                        {primaryActionLabel} <CTAIcon className="w-4 h-4 ml-2" />
                    </Button>
                )}
                {secondaryAction && (
                    <Button
                        variant="outline"
                        onClick={secondaryAction}
                        className="min-w-[140px] h-12 text-base border-os-stroke hover:bg-os-surface-2"
                    >
                        {secondaryActionLabel}
                    </Button>
                )}
            </motion.div>
        </div>
    );
}
