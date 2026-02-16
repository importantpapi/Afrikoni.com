import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Zap, Globe, AlertTriangle, X } from 'lucide-react';
import { useTradeKernelState } from '@/hooks/useTradeKernelState';
import { Button } from '@/components/shared/ui/button';
import { cn } from '@/lib/utils';

export function SystemHealthDrawer({ isOpen, onClose }) {
    const {
        trustScore,
        kycStatus,
        escrowLockedValue,
        pipelineValue,
        shipmentsInTransit,
        afcftaReady,
        riskLevel,
        loading
    } = useTradeKernelState();

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1400] bg-black/40 backdrop-blur-sm flex justify-end"
            onClick={onClose}
        >
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-md h-screen bg-os-bg border-l border-os-stroke shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 border-b border-os-stroke flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">System Health</h2>
                        <p className="text-os-text-secondary text-sm">Layer 2 Trade Infrastructure</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {/* 1. KERNEL TELEMETRY */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-os-muted">Kernel Telemetry</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-os-surface border border-os-stroke space-y-1">
                                <p className="text-[10px] font-bold text-os-muted uppercase">Trust Score</p>
                                <p className="text-2xl font-black text-os-success">{trustScore}%</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-os-surface border border-os-stroke space-y-1">
                                <p className="text-[10px] font-bold text-os-muted uppercase">Risk Profile</p>
                                <p className={cn("text-2xl font-black uppercase",
                                    riskLevel === 'low' ? 'text-os-success' : 'text-os-accent'
                                )}>{riskLevel}</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. COMPLIANCE ENGINE */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-os-muted">Compliance Engine</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-os-surface border border-os-stroke">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-semibold">AfCFTA Alignment</span>
                                </div>
                                <span className={cn("text-xs font-black uppercase", afcftaReady ? 'text-os-success' : 'text-os-accent')}>
                                    {afcftaReady ? 'Synchronized' : 'Draft'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-os-surface border border-os-stroke">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-4 h-4 text-os-accent" />
                                    <span className="text-sm font-semibold">KYC Credential</span>
                                </div>
                                <span className={cn("text-xs font-black uppercase", kycStatus === 'verified' ? 'text-os-success' : 'text-os-accent')}>
                                    {kycStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. FINANCIAL RAILS */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-os-muted">Financial Rails</h3>
                        <div className="p-6 rounded-2xl bg-os-surface border border-os-stroke flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-os-muted uppercase">Escrow Liquidity</p>
                                <p className="text-3xl font-black tabular-nums">${(escrowLockedValue / 1000).toFixed(1)}K</p>
                            </div>
                            <Zap className="w-8 h-8 text-os-accent opacity-20" />
                        </div>
                    </div>

                    {/* 4. ACTIVITY LOG (Layer 2) */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-os-muted">Kernel Activity</h3>
                        <div className="space-y-4">
                            {[
                                { time: '2m ago', event: 'Escrow release authorized', status: 'success' },
                                { time: '15m ago', event: 'AfCFTA certificate validated', status: 'success' },
                                { time: '1h ago', event: 'Sanction screen: Cleared', status: 'success' },
                                { time: '3h ago', event: 'Smart Contract: Pulse detected', status: 'info' },
                            ].map((log, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="text-[10px] font-bold text-os-muted uppercase min-w-[50px]">{log.time}</div>
                                    <div className="text-xs font-medium border-l border-os-stroke pl-4 pb-4">
                                        {log.event}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-os-stroke bg-os-surface/50">
                    <Button variant="outline" className="w-full rounded-2xl" onClick={onClose}>
                        Close System View
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
