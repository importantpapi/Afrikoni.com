import React from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

export const ForensicExportButton = ({
    onClick,
    isGenerating,
    className,
    variant = "outline"
}) => {
    return (
        <Button
            onClick={onClick}
            disabled={isGenerating}
            variant={variant}
            className={cn(
                "relative h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all duration-500 overflow-hidden group",
                variant === "outline" ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500" : "bg-afrikoni-gold text-black hover:scale-[1.02]",
                className
            )}
        >
            {/* DNA Pulse Background */}
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="flex gap-0.5 items-center justify-center h-full">
                    {[1, 2, 3, 4, 5].map(i => (
                        <motion.div
                            key={i}
                            animate={{
                                height: [4, 16, 4],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.15
                            }}
                            className={cn(
                                "w-0.5 rounded-full",
                                variant === "outline" ? "bg-emerald-500" : "bg-black"
                            )}
                        />
                    ))}
                </div>
            </div>

            <div className="relative z-10 flex items-center gap-2">
                {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Fingerprint className="w-4 h-4 animate-pulse" />
                )}
                <span>
                    {isGenerating ? 'Synthesizing DNA...' : 'Export Forensic Audit'}
                </span>
                {!isGenerating && <Download className="w-3 h-3 ml-1 opacity-50 group-hover:translate-y-0.5 transition-transform" />}
            </div>
        </Button>
    );
};

export default ForensicExportButton;
