import React from 'react';
import { motion } from 'framer-motion';
import { useWorkspaceMode } from '@/contexts/WorkspaceModeContext';
import { ShoppingCart, Truck, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TradingModeToggle() {
    const { tradingMode, setTradingMode, isSourcing } = useWorkspaceMode();

    return (
        <div className="flex items-center bg-os-surface-solid border border-os-stroke p-1 rounded-full shadow-os-sm gap-1 overflow-hidden h-9">
            {/* Sourcing Mode (Buyer Perspective) */}
            <button
                onClick={() => setTradingMode('sourcing')}
                className={cn(
                    "relative flex items-center gap-2 px-3 h-full rounded-full transition-all duration-300",
                    isSourcing ? "text-os-accent font-bold" : "text-os-text-secondary hover:text-os-text-primary"
                )}
            >
                {isSourcing && (
                    <motion.div
                        layoutId="active-mode"
                        className="absolute inset-0 bg-os-accent/10 border border-os-accent/20 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <ShoppingCart className={cn("w-3.5 h-3.5 z-10", isSourcing && "fill-os-accent/10")} />
                <span className="text-[10px] uppercase tracking-wider font-bold z-10">Sourcing</span>
            </button>

            <div className="w-[1px] h-3 bg-os-stroke mx-0.5" />

            {/* Distribution Mode (Seller Perspective) */}
            <button
                onClick={() => setTradingMode('distribution')}
                className={cn(
                    "relative flex items-center gap-2 px-3 h-full rounded-full transition-all duration-300",
                    !isSourcing ? "text-os-accent font-bold" : "text-os-text-secondary hover:text-os-text-primary"
                )}
            >
                {!isSourcing && (
                    <motion.div
                        layoutId="active-mode"
                        className="absolute inset-0 bg-os-accent/10 border border-os-accent/20 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <Truck className={cn("w-3.5 h-3.5 z-10", !isSourcing && "fill-os-accent/10")} />
                <span className="text-[10px] uppercase tracking-wider font-bold z-10">Distribution</span>
            </button>
        </div>
    );
}
