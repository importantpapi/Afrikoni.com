import React, { useState, useEffect, useRef } from 'react';
import { Activity, Radio, RefreshCcw, Wifi, WifiOff, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * SyncMonitor - Enterprise-Tier Observability Component
 * 
 * Provides real-time visibility into the "Live Data OS" signal stream.
 * Tracks:
 * - Signal Latency (DB -> UI)
 * - Broadcast Frequency
 * - Connection Health
 * - Pending Updates (Visibility Deferral)
 */
export const SyncMonitor = ({ isSubscribed, lastUpdateAt }) => {
    const [history, setHistory] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [deferredCount, setDeferredCount] = useState(0);
    const signalCountRef = useRef(0);

    useEffect(() => {
        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const handleSignal = (e) => {
            const { table, event, timestamp } = e.detail || {};
            const latency = Date.now() - (timestamp || Date.now());

            signalCountRef.current += 1;

            if (document.visibilityState !== 'visible') {
                setDeferredCount(prev => prev + 1);
            }

            const newEntry = {
                id: Math.random().toString(36).substr(2, 9),
                table,
                type: event,
                latency,
                at: new Date(),
                status: document.visibilityState === 'visible' ? 'live' : 'deferred'
            };

            setHistory(prev => [newEntry, ...prev].slice(0, 5));
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setDeferredCount(0);
            }
        };

        window.addEventListener('dashboard-realtime-update', handleSignal);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('dashboard-realtime-update', handleSignal);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Dev-only toggle (Alt+S)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === 's') {
                setIsVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isVisible && import.meta.env.PROD) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-20 right-6 z-[2000] w-64 bg-[#08090A]/90 backdrop-blur-xl border border-white/10 rounded-os-md shadow-2xl overflow-hidden font-mono"
                >
                    {/* Header */}
                    <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-os-xs font-bold text-white uppercase tracking-widest">Sync Intelligence</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                isSubscribed ? "bg-emerald-400" : "bg-red-400"
                            )} />
                            <span className="text-os-xs text-gray-400">{isSubscribed ? 'Connected' : 'Disconnected'}</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 border-b border-white/5">
                        <div className="p-3 border-r border-white/5">
                            <div className="text-os-xs text-os-text-secondary uppercase mb-1">Signals</div>
                            <div className="text-os-sm font-bold text-white">{signalCountRef.current}</div>
                        </div>
                        <div className="p-3">
                            <div className="text-os-xs text-os-text-secondary uppercase mb-1">Deferred</div>
                            <div className="text-os-sm font-bold text-amber-400">{deferredCount}</div>
                        </div>
                    </div>

                    {/* Stream */}
                    <div className="p-3 max-h-48 overflow-y-auto">
                        <div className="text-os-xs text-os-text-secondary uppercase mb-2 flex items-center gap-1">
                            <Radio className="w-2.5 h-2.5" /> Live Signal Stream
                        </div>
                        <div className="space-y-2">
                            {history.length === 0 ? (
                                <div className="text-os-xs text-os-text-secondary italic py-4 text-center">Awaiting data signals...</div>
                            ) : (
                                history.map(entry => (
                                    <div key={entry.id} className="text-os-xs flex items-start gap-2 group">
                                        <div className={cn(
                                            "mt-1 w-1.5 h-1.5 rounded-full",
                                            entry.status === 'live' ? "bg-blue-400" : "bg-amber-400"
                                        )} />
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <span className="text-gray-300 font-bold">{entry.table}</span>
                                                <span className="text-os-text-secondary">{entry.latency}ms</span>
                                            </div>
                                            <div className="text-os-text-secondary flex justify-between">
                                                <span>{entry.type}</span>
                                                <span>{entry.at.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Footer / Network */}
                    <div className="p-2 bg-black/40 text-os-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            {isOnline ? <Wifi className="w-2.5 h-2.5 text-emerald-500" /> : <WifiOff className="w-2.5 h-2.5 text-os-red" />}
                            <span className={isOnline ? "text-emerald-500" : "text-os-red"}>
                                {isOnline ? 'Network Stable' : 'Offline'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-os-text-secondary">
                            <Clock className="w-2.5 h-2.5" /> 2026.REL
                        </div>
                    </div>

                    {/* Toggle Prompt (Dev Only) */}
                    <div className="p-1.5 text-center text-os-xs text-os-text-secondary border-t border-white/5">
                        Press Alt+S to show/hide
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
