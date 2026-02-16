/**
 * System Layer Component
 * 
 * Renders the top-level system status bar (Trade Readiness Bar).
 * This layer is always visible and has the highest z-index (1000).
 * 
 * Reserved Height: 56px
 * Z-Index: 1000
 */

import React from 'react';
import { TradeReadinessBar } from '@/components/trade-os/TradeReadinessBar';

export function SystemLayer({ systemState }) {
    if (!systemState) {
        return null;
    }

    return (
        <div className="w-full h-full bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-os-accent/20">
            <TradeReadinessBar systemState={systemState} />
        </div>
    );
}
