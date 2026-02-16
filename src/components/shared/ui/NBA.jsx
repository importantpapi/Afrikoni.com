import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Surface } from '@/components/system/Surface';

/**
 * NBA - Next Best Action Hero Component
 * 
 * The emotional heart of every primary OS screen.
 * Guides users toward the most critical human outcome in the trade journey.
 */
export function NBA({
    title,
    description,
    actionLabel,
    onAction,
    status = 'Active Duty',
    icon: Icon = Sparkles,
    className
}) {
    return (
        <Surface
            variant="glass"
            className={cn(
                "relative overflow-hidden p-8 md:p-12 mb-8 border-none group",
                "bg-gradient-to-br from-white/40 to-transparent dark:from-white/5",
                className
            )}
        >
            {/* Background Ambient Depth */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-os-accent/10 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-700 group-hover:bg-os-accent/20" />

            <div className="relative z-10 max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mb-6"
                >
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-os-accent/10 border border-os-accent/20 text-os-accent">
                        <Icon className="w-3 h-3" />
                        <span className="text-os-xs font-bold uppercase tracking-widest">{status}</span>
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="os-title-large mb-4 text-os-text-primary"
                >
                    {title}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-os-lg md:text-os-xl text-os-text-secondary mb-8 leading-relaxed max-w-xl"
                >
                    {description}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Button
                        size="lg"
                        onClick={onAction}
                        className="h-14 px-8 rounded-full bg-os-accent text-white hover:bg-os-accent/90 shadow-os-md group/btn"
                    >
                        <span className="text-os-sm font-bold tracking-tight">{actionLabel}</span>
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                </motion.div>
            </div>

            {/* Decorative OS Glyph */}
            <div className="absolute bottom-12 right-12 opacity-[0.03] dark:opacity-[0.07] pointer-events-none select-none">
                <svg width="240" height="240" viewBox="0 0 40 40" fill="currentColor">
                    <path d="M20 4 L32 12 L28 12 L20 7 L12 12 L8 12 Z" />
                    <circle cx="15" cy="22" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="25" cy="22" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
            </div>
        </Surface>
    );
}
