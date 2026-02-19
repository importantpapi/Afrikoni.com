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
                "relative h-12 px-6 rounded-os-sm font-black uppercase tracking-widest text-os-xs transition-all duration-500 overflow-hidden group",
                variant === "outline" ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500" : "bg-os-accent text-black hover:scale-[1.02]",
                className
            )}
        >
            <div className="relative z-10 flex items-center gap-2">
                {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <FileText className="w-4 h-4" />
                )}
                <span>
                    {isGenerating ? 'Generating Report...' : 'Export Trade Audit'}
                </span>
                {!isGenerating && <Download className="w-3 h-3 ml-1 opacity-50 group-hover:translate-y-0.5 transition-transform" />}
            </div>
        </Button>
    );
};

export default ForensicExportButton;
