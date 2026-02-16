import React, { useState, useEffect, useMemo } from 'react';
import { Surface } from '@/components/system/Surface';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import {
    Activity,
    Wifi,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    Globe,
    Lock
} from 'lucide-react';

export default function SystemStatusFooter() {
    const { isSystemReady, capabilities, isPreWarming } = useDashboardKernel();
    const [currentSignalIndex, setCurrentSignalIndex] = useState(0);

    const signals = useMemo(() => [
        { type: 'risk', message: 'Port congestion in Lagos (Apapa): Expect +2 days delay', level: 'medium' },
        { type: 'compliance', message: 'New AfCFTA Rules of Origin for Cocoa active', level: 'info' },
        { type: 'system', message: isSystemReady ? 'Kernel v2.4 stable. All systems operational.' : isPreWarming ? 'Kernel pre-warming...' : 'Kernel synchronizing...', level: isSystemReady ? 'success' : 'medium' },
    ], [isSystemReady, isPreWarming]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSignalIndex((prev) => (prev + 1) % signals.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [signals.length]);

    const signal = signals[currentSignalIndex] || signals[0];

    return (
        <div className="fixed bottom-[80px] md:bottom-0 left-0 md:left-[72px] right-0 z-50 pointer-events-none flex justify-center pb-2 px-4 md:px-0 transition-all duration-300">
            <Surface
                variant="glass"
                className="pointer-events-auto flex items-center gap-4 px-4 py-2 rounded-full border border-os-accent/10 backdrop-blur-xl shadow-os-md overflow-hidden max-w-[90vw] md:max-w-2xl"
            >
                {/* System Health */}
                <div className="flex items-center gap-2 pr-4 border-r border-os-accent/10 shrink-0">
                    <div className="relative flex items-center justify-center w-2 h-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSystemReady ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isSystemReady ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    </div>
                    <span className={`text-os-xs uppercase font-bold tracking-widest ${isSystemReady ? 'text-emerald-600' : 'text-amber-600'} hidden md:block`}>
                        {isSystemReady ? 'Afrikoni Network Active' : 'Kernel Handshake'}
                    </span>
                    <span className="text-os-xs font-mono text-gray-500 hidden md:block">v2.4.0</span>
                </div>

                {/* Global Signal Stream (Ticker) */}
                <div className="flex-1 flex items-center justify-center min-w-0 overflow-hidden h-5">
                    <div
                        key={currentSignalIndex}
                        className="flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300"
                    >
                        {signal.type === 'risk' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        {signal.type === 'compliance' && <ShieldCheck className="w-3 h-3 text-os-blue" />}
                        {signal.type === 'market' && <Activity className="w-3 h-3 text-purple-500" />}
                        {signal.type === 'system' && <CheckCircle2 className={`w-3 h-3 ${isSystemReady ? 'text-emerald-500' : 'text-amber-500'}`} />}

                        <span className={`text-os-xs font-medium truncate ${signal.level === 'medium' ? 'text-amber-600' :
                            signal.level === 'success' ? 'text-emerald-600' :
                                'text-gray-700'
                            }`}>
                            {signal.message}
                        </span>
                    </div>
                </div>

                {/* Security / Connection */}
                <div className="hidden md:flex items-center gap-3 pl-4 border-l border-os-accent/10 shrink-0">
                    <div className="flex items-center gap-1 text-os-xs text-gray-500">
                        <Lock className="w-3 h-3" />
                        <span>TLS 1.3</span>
                    </div>
                    <div className="flex items-center gap-1 text-os-xs text-gray-500">
                        <Globe className="w-3 h-3" />
                        <span>AF-SOUTH-1</span>
                    </div>
                </div>
            </Surface>
        </div>
    );
}
