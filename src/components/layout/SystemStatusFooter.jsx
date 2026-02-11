import React, { useState, useEffect } from 'react';
import { Surface } from '@/components/system/Surface';
import {
    Activity,
    Wifi,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    Globe,
    Lock
} from 'lucide-react';

const MOCK_SIGNALS = [
    { type: 'risk', message: 'Port congestion in Lagos (Apapa): Expect +2 days delay', level: 'medium' },
    { type: 'compliance', message: 'New AfCFTA Rules of Origin for Cocoa active', level: 'info' },
    { type: 'market', message: 'KES/USD volatility detected: Hedging recommended', level: 'low' },
    { type: 'system', message: 'Kernel v2.4 stable. All systems operational.', level: 'success' },
];

export default function SystemStatusFooter() {
    const [currentSignalIndex, setCurrentSignalIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSignalIndex((prev) => (prev + 1) % MOCK_SIGNALS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const signal = MOCK_SIGNALS[currentSignalIndex];

    return (
        <div className="fixed bottom-[80px] md:bottom-0 left-0 md:left-[72px] right-0 z-50 pointer-events-none flex justify-center pb-2 px-4 md:px-0 transition-all duration-300">
            <Surface
                variant="glass"
                className="pointer-events-auto flex items-center gap-4 px-4 py-2 rounded-full border border-afrikoni-gold/10 backdrop-blur-xl shadow-lg overflow-hidden max-w-[90vw] md:max-w-2xl"
            >
                {/* System Health */}
                <div className="flex items-center gap-2 pr-4 border-r border-afrikoni-gold/10 shrink-0">
                    <div className="relative flex items-center justify-center w-2 h-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 hidden md:block">
                        Afrikoni Network Active
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 hidden md:block">v2.4.0</span>
                </div>

                {/* Global Signal Stream (Ticker) */}
                <div className="flex-1 flex items-center justify-center min-w-0 overflow-hidden h-5">
                    <div
                        key={currentSignalIndex}
                        className="flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300"
                    >
                        {signal.type === 'risk' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        {signal.type === 'compliance' && <ShieldCheck className="w-3 h-3 text-blue-500" />}
                        {signal.type === 'market' && <Activity className="w-3 h-3 text-purple-500" />}
                        {signal.type === 'system' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}

                        <span className={`text-xs font-medium truncate ${signal.level === 'medium' ? 'text-amber-600' :
                            signal.level === 'success' ? 'text-emerald-600' :
                                'text-gray-700'
                            }`}>
                            {signal.message}
                        </span>
                    </div>
                </div>

                {/* Security / Connection */}
                <div className="hidden md:flex items-center gap-3 pl-4 border-l border-afrikoni-gold/10 shrink-0">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Lock className="w-3 h-3" />
                        <span>TLS 1.3</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Globe className="w-3 h-3" />
                        <span>AF-SOUTH-1</span>
                    </div>
                </div>
            </Surface>
        </div>
    );
}
