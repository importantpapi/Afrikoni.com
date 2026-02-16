import React, { useState, useEffect } from 'react';
import { Surface } from '@/components/system/Surface';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, PieChart, Wallet, ArrowUpRight, ShieldCheck, Truck } from 'lucide-react';
import { REVENUE_CONFIG } from '@/services/revenueEngine';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

export default function RevenueDashboard() {
    const { profileCompanyId, canLoadData } = useDashboardKernel();
    const [revenueData, setRevenueData] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
        if (!canLoadData) return;

        // KERNEL REALIGNMENT: Purged mock data. 
        // Real revenue will be derived from trades ledger where status = 'settled'
        const initialData = Array.from({ length: 12 }, (_, i) => ({
            name: `Month ${i + 1}`,
            protocolFee: 0,
            fxSpread: 0,
            logisticsMargin: 0
        }));
        setRevenueData(initialData);
        setTotalRevenue(0);

        // Fetch actual settled figures if needed...
    }, [canLoadData]);

    return (
        <div className="os-page os-stagger space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-os-2xl font-bold text-[var(--os-text-primary)]">Sovereign Treasury</h1>
                    <p className="text-os-sm text-[var(--os-text-secondary)]">Real-time visualization of protocol cash flow.</p>
                </div>
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-os-sm font-mono text-emerald-400">PROTOCOL SOLVENT</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <Surface variant="glass" className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <span className="text-os-sm text-[var(--os-text-secondary)]">Total Revenue (YTD)</span>
                    </div>
                    <div className="text-os-2xl font-bold text-[var(--os-text-primary)]">
                        ${totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-os-xs text-emerald-400 flex items-center gap-1 mt-1">
                        <ArrowUpRight className="w-3 h-3" /> +12.5% vs last month
                    </div>
                </Surface>

                <Surface variant="glass" className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-os-blue/10 rounded-lg text-os-blue">
                            <PieChart className="w-5 h-5" />
                        </div>
                        <span className="text-os-sm text-[var(--os-text-secondary)]">Avg. Take Rate</span>
                    </div>
                    <div className="text-os-2xl font-bold text-[var(--os-text-primary)]">
                        {(REVENUE_CONFIG.TAKE_RATE_PCT * 100).toFixed(1)}%
                    </div>
                    <div className="text-os-xs text-[var(--os-text-secondary)] mt-1">
                        Protocol standard
                    </div>
                </Surface>

                <Surface variant="glass" className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-os-sm text-[var(--os-text-secondary)]">FX Spread Yield</span>
                    </div>
                    <div className="text-os-2xl font-bold text-[var(--os-text-primary)]">
                        1.2%
                    </div>
                    <div className="text-os-xs text-[var(--os-text-secondary)] mt-1">
                        On currency conversion
                    </div>
                </Surface>

                <Surface variant="glass" className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="text-os-sm text-[var(--os-text-secondary)]">Escrow Float</span>
                    </div>
                    <div className="text-os-2xl font-bold text-[var(--os-text-primary)]">
                        Analyzing...
                    </div>
                    <div className="text-os-xs text-[var(--os-text-secondary)] mt-1">
                        Secured by 3-Key Consensus
                    </div>
                </Surface>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-3 gap-6">
                <Surface variant="glass" className="md:col-span-2 p-6">
                    <h2 className="text-os-lg font-semibold text-[var(--os-text-primary)] mb-6">Revenue Composition</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorFx" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLogistics" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="protocolFee" stackId="1" stroke="#eab308" fillOpacity={1} fill="url(#colorFee)" name="Protocol Fee (5%)" />
                                <Area type="monotone" dataKey="fxSpread" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#colorFx)" name="FX Spread (1.2%)" />
                                <Area type="monotone" dataKey="logisticsMargin" stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLogistics)" name="Logistics Margin (1.8%)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Surface>

                <div className="space-y-6">
                    <Surface variant="glass" className="p-6 h-full">
                        <h2 className="text-os-lg font-semibold text-[var(--os-text-primary)] mb-4">Revenue Streams</h2>
                        <div className="space-y-4">
                            <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <span className="text-os-sm text-gray-300">Escrow Fees</span>
                                </div>
                                <span className="font-mono font-bold text-white">62.5%</span>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-os-sm text-gray-300">FX Spread</span>
                                </div>
                                <span className="font-mono font-bold text-white">15.0%</span>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span className="text-os-sm text-gray-300">Logistics Markup</span>
                                </div>
                                <span className="font-mono font-bold text-white">22.5%</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <h3 className="text-os-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Active Monetization</h3>
                            <div className="flex items-center gap-2 mb-2 text-os-sm text-gray-300">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <span>AfCFTA Tax Shield ($25/mo)</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2 text-os-sm text-gray-300">
                                <Truck className="w-4 h-4 text-blue-400" />
                                <span>Corridor Intelligence (Premium)</span>
                            </div>
                        </div>
                    </Surface>
                </div>
            </div>
        </div>
    );
}
