import React, { useEffect } from 'react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useTradeContext } from '@/context/TradeContext';
import { SystemPageSection } from '@/components/system/SystemPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Progress } from '@/components/shared/ui/progress';
import { Shield, Truck, DollarSign, CheckCircle2, AlertTriangle, FileText, Lock, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * THE TRACE CENTER
 * 
 * Visual Command for "The Unbroken Flow".
 * Replaces standard tables with a "Pulse Rail" and "Money Map".
 */
export default function TraceCenter() {
    const { isSystemReady } = useDashboardKernel();
    const { state, initiateTrade, verifyMilestone, assessRisk } = useTradeContext();
    const { product, financials, logistics, advice } = state;

    if (!isSystemReady) {
        return <div className="min-h-screen bg-afrikoni-offwhite flex items-center justify-center">Loading...</div>;
    }

    // Simulate Trade Initiation on Mount (for Demo)
    useEffect(() => {
        if (state.status === 'idle') {
            initiateTrade(
                {
                    name: 'Grade A Cocoa Beans via Cotonou',
                    category: 'cocoa'
                },
                {
                    amountUSD: 45000,
                    localCurrency: 'NGN'
                },
                {
                    origin: 'Lagos, Nigeria',
                    destination: 'Rotterdam, Netherlands'
                }
            );
        }
    }, []); // Run once

    // Calculate Money Map Progress
    const moneyProgress =
        financials.escrowState === 'locked' ? 25 :
            financials.escrowState === 'funded' ? 50 :
                financials.escrowState === 'verified' ? 75 : 100;

    return (
        <div className="min-h-screen bg-afrikoni-offwhite pb-20">

            {/* 1. HERO: The Griot's Guidance */}
            <div className="bg-white text-afrikoni-deep pt-8 pb-12 px-6 rounded-b-[3rem] shadow-lg relative overflow-hidden border border-afrikoni-gold/10">
                {/* Abstract Background */}
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-afrikoni-gold rounded-full blur-[100px]" />
                    <div className="absolute left-0 bottom-0 w-64 h-64 bg-emerald-500 rounded-full blur-[80px]" />
                </div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="border-afrikoni-gold/30 text-gray-600 font-mono tracking-widest text-[10px] uppercase">
                                    Trace ID: {state.tradeId || 'INITIALIZING...'}
                                </Badge>
                                {state.status === 'active' && (
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
                                        LIVE ON RAIL
                                    </Badge>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-afrikoni-deep">
                                {product.name || 'Loading Trade Context...'}
                            </h1>
                        </div>

                        {/* Risk Monitor */}
                        <div className="bg-afrikoni-cream/30 backdrop-blur-md rounded-xl p-3 border border-afrikoni-gold/20 flex items-center gap-3">
                            <div className={`p-2 rounded-full ${logistics.riskScore > 50 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-600 uppercase tracking-widest">Trust Score</p>
                                <p className={`text-lg font-bold font-mono ${logistics.riskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {100 - logistics.riskScore}/100
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* GRIOT WIDGET (The "What Now?" Box) */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-afrikoni-cream/20 backdrop-blur-lg border border-afrikoni-gold/20 rounded-2xl p-6"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${advice.tone === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-afrikoni-gold/20 text-afrikoni-gold'}`}>
                                {advice.tone === 'critical' ? <AlertTriangle className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-afrikoni-deep mb-1">Griot Insight</h3>
                                <p className="text-gray-700 leading-relaxed text-lg">
                                    {advice.message}
                                </p>
                            </div>
                            {/* Context Action Button */}
                            <Button className="bg-afrikoni-gold text-black hover:bg-afrikoni-gold/90 font-medium px-6">
                                Execute Next Step
                                <FileText className="w-4 h-4 ml-2 opacity-60" />
                            </Button>
                        </div>
                    </motion.div>

                    {/* FX Snapshot */}
                    <div className="flex items-center gap-6 mt-6 ml-2 p-3 rounded-lg bg-afrikoni-cream/20 w-fit backdrop-blur-sm border border-afrikoni-gold/10">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-xs">PIVOT CURRENCY</span>
                            <span className="text-afrikoni-deep font-mono font-bold">USD</span>
                        </div>
                        <div className="w-px h-4 bg-afrikoni-gold/20" />
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600 text-xs">{financials.localCurrency} RATE</span>
                            <span className="text-afrikoni-gold font-mono">₦{financials.exchangeRate.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20 space-y-8">

                {/* 2. THE MONEY MAP */}
                <Card className="bg-white shadow-xl border-afrikoni-gold/30 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-slate-800">
                                <Lock className="w-5 h-5 text-afrikoni-gold" />
                                Sovereign Money Map
                            </CardTitle>
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Total Value Locked</p>
                                <p className="text-2xl font-bold font-mono text-slate-900">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financials.totalValueUSD)}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="relative">
                            {/* Progress Line */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0" />
                            <motion.div
                                className="absolute top-1/2 left-0 h-1 bg-afrikoni-gold -translate-y-1/2 z-0"
                                initial={{ width: 0 }}
                                animate={{ width: `${moneyProgress}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                            />

                            {/* Nodes */}
                            <div className="relative z-10 flex justify-between">
                                {[
                                    { id: 'locked', label: 'Locked', icon: Lock },
                                    { id: 'funded', label: 'In Transit', icon: Truck },
                                    { id: 'verified', label: 'Verified', icon: Shield },
                                    { id: 'released', label: 'Settled', icon: DollarSign }
                                ].map((step, idx) => {
                                    const isActive = idx <= (moneyProgress / 25 - 1);
                                    const isCurrent = idx === (moneyProgress / 25 - 1);

                                    return (
                                        <div key={step.id} className="flex flex-col items-center gap-3">
                                            <div className={`
                               w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500
                               ${isActive
                                                    ? 'bg-afrikoni-gold border-afrikoni-gold text-white shadow-lg shadow-afrikoni-gold/30'
                                                    : 'bg-white border-slate-200 text-slate-300'}
                            `}>
                                                <step.icon className="w-5 h-5" />
                                            </div>
                                            <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-afrikoni-goldDark' : 'text-slate-300'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Fee Breakdown Footer */}
                        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-xs text-slate-400 uppercase">Platform Fee (5%)</p>
                                <p className="font-mono font-medium text-slate-700">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financials.fees.platform)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase">Service Margin (1.8%)</p>
                                <p className="font-mono font-medium text-slate-700">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(financials.fees.service)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase">One-Flow Savings</p>
                                <p className="font-mono font-bold text-emerald-500">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.compliance.savings)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. THE PULSE RAIL (Timeline) */}
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Detailed Rail */}
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-afrikoni-chestnut flex items-center gap-2">
                            <Truck className="w-6 h-6 text-afrikoni-gold" />
                            Logistics Pulse Rail
                        </h2>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative">
                            <div className="absolute top-6 bottom-6 left-9 w-0.5 bg-slate-100" />

                            <div className="space-y-8">
                                {logistics.milestones.map((milestone, idx) => (
                                    <div key={milestone.id} className="relative flex gap-6 group">
                                        {/* Node Dot */}
                                        <div className={`
                             w-6 h-6 rounded-full border-2 z-10 bg-white flex-shrink-0 mt-0.5 transition-colors duration-300
                             ${milestone.status === 'completed'
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : milestone.status === 'pending' && idx === logistics.milestones.findIndex(m => m.status === 'pending')
                                                    ? 'border-afrikoni-gold animate-pulse'
                                                    : 'border-slate-200'}
                          `}>
                                            {milestone.status === 'completed' && <div className="w-full h-full rounded-full bg-emerald-500 scale-50" />}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-semibold ${milestone.status === 'completed' ? 'text-slate-900' : 'text-slate-400'}`}>
                                                    {milestone.label}
                                                </h4>
                                                {milestone.status === 'completed' && (
                                                    <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50 text-[10px]">
                                                        Verified
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Evidence Block */}
                                            {milestone.status === 'completed' && (
                                                <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 inline-flex items-center gap-2">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                    Evidence: <span className="font-mono text-slate-700">{milestone.evidence}</span>
                                                </div>
                                            )}

                                            {/* Action Button (Simulation) */}
                                            {milestone.status === 'pending' && idx === logistics.milestones.findIndex(m => m.status === 'pending') && (
                                                <div className="mt-3">
                                                    <Button
                                                        size="sm"
                                                        className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white"
                                                        onClick={() => verifyMilestone(milestone.id, { verified: true })}
                                                    >
                                                        Verify & Proceed
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 4. FORENSIC DNA (Sidebar) */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-afrikoni-chestnut flex items-center gap-2">
                            <Shield className="w-6 h-6 text-afrikoni-gold" />
                            Forensic DNA
                        </h2>

                        <Card className="border-afrikoni-gold/30 bg-afrikoni-cream">
                            <CardContent className="p-6 text-center">
                                <div className="w-24 h-24 mx-auto bg-white rounded-lg border-2 border-afrikoni-gold/20 p-2 mb-4 relative overflow-hidden">
                                    <img src="https://placehold.co/100x100/1a1a1a/FFF?text=DNA" alt="Baseline" className="w-full h-full object-cover rounded opacity-80" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-afrikoni-gold/20 to-transparent" />
                                </div>
                                <p className="text-xs font-mono text-afrikoni-chestnut/60 mb-1">BASELINE HASH</p>
                                <p className="font-mono font-bold text-afrikoni-chestnut truncate">AFK-8F29A-X92</p>

                                <div className="my-4 border-t border-afrikoni-gold/10" />

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-afrikoni-chestnut/70">Origin:</span>
                                        <span className="font-medium text-afrikoni-chestnut">{logistics.origin.split(',')[0]}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-afrikoni-chestnut/70">HS Code:</span>
                                        <span className="font-medium text-afrikoni-chestnut">{product.hsCode || '---'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Compliance Widget */}
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <span className="font-bold text-emerald-800">One-Flow Compliant</span>
                            </div>
                            <p className="text-sm text-emerald-700/80">
                                This trade is protected by the AfCFTA Tax Shield. Duty savings active.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
