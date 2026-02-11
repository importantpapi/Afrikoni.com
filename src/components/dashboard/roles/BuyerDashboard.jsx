import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useKernelState } from '@/hooks/useKernelState';
import { useTradeKernelState } from '@/hooks/useTradeKernelState';
import { Surface } from '@/components/system/Surface';
import { LiveTradeFlow } from '@/components/kernel/LiveTradeFlow';
import KernelControlPlane from '@/components/kernel/KernelControlPlane';
import { OSStatusBar } from '@/components/system/OSStatusBar';
import TodaysActions from '@/components/dashboard/TodaysActions';
import TradeOSErrorBoundary from '@/components/shared/TradeOSErrorBoundary';
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import { TradeStatePanel } from '@/components/dashboard/widgets/TradeStatePanel';
import { TradeFlowTimeline } from '@/components/dashboard/widgets/TradeFlowTimeline';

import {
    Activity, Wallet, Truck, AlertTriangle, ChevronRight,
    TrendingUp, ArrowUpRight, Anchor
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyConverter';

export default function BuyerDashboard() {
    const { isSystemReady, profileCompanyId } = useDashboardKernel();
    const { data: kernelData, loading: kernelLoading } = useKernelState();
    const { activeTrades, loading: tradesLoading } = useTradeKernelState();
    const navigate = useNavigate();

    // Combine loading states
    const isLoading = !isSystemReady || kernelLoading || tradesLoading;

    // Derive metrics
    const activeCount = activeTrades?.length || 0;
    const capitalInMotion = kernelData?.capitalInMotion || 0;
    const activeCorridors = kernelData?.activeCorridors || 0;

    // Mock shipments for UI demo if no data
    const shipmentCount = activeTrades?.filter(t => ['in_transit', 'pickup_scheduled'].includes(t.status)).length || 0;
    const riskCount = activeTrades?.filter(t => t.riskLevel === 'high' || t.status === 'disputed').length || 0;

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="os-page space-y-3 p-3 md:p-6 md:space-y-6">
            {/* 1. Header Area: Welcome + Kernel Status */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-1 md:gap-2">
                <div>
                    <h1 className="text-base md:text-xl font-light text-[var(--os-text-primary)]">
                        Command Center <span className="text-os-muted mx-1 md:mx-2">/</span> Overview
                    </h1>
                    <p className="text-[10px] md:text-xs text-os-muted mt-0.5 font-mono">
                        Operational • {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                </div>
            </div>

            <Surface variant="glass" className="p-2 md:p-4">
                <TradeOSErrorBoundary>
                    <OSStatusBar />
                </TradeOSErrorBoundary>
            </Surface>

            {/* Today's Actions - AI Co-Pilot */}
            <TradeOSErrorBoundary>
                <TodaysActions compact={true} />
            </TradeOSErrorBoundary>

            {/* 2. Trade State Panels Grid - Swappable on mobile */}
            <TradeOSErrorBoundary>
                <div className="md:grid md:grid-cols-4 gap-4 flex overflow-x-auto no-scrollbar pb-4 md:pb-0 px-1 -mx-1 snap-x">
                    <div className="flex-shrink-0 w-[160px] md:w-auto snap-center mr-3 md:mr-0">
                        <TradeStatePanel
                            label="Active Trades"
                            value={activeCount}
                            subtext={`${activeCorridors} Corridors`}
                            icon={Activity}
                            tone="neutral"
                            onClick={() => navigate('/dashboard/trade-pipeline')}
                        />
                    </div>
                    <div className="flex-shrink-0 w-[160px] md:w-auto snap-center mr-3 md:mr-0">
                        <TradeStatePanel
                            label="Capital Flow"
                            value={formatCurrency(capitalInMotion)}
                            subtext="In Escrow"
                            icon={Wallet}
                            tone="good"
                            onClick={() => navigate('/dashboard/payments')}
                        />
                    </div>
                    <div className="flex-shrink-0 w-[160px] md:w-auto snap-center mr-3 md:mr-0">
                        <TradeStatePanel
                            label="Shipments"
                            value={shipmentCount}
                            subtext="In Transit"
                            icon={Truck}
                            tone="neutral"
                            onClick={() => navigate('/dashboard/shipments')}
                        />
                    </div>
                    <div className="flex-shrink-0 w-[160px] md:w-auto snap-center">
                        <TradeStatePanel
                            label="System Risk"
                            value={riskCount > 0 ? `${riskCount} Alerts` : "Stable"}
                            subtext="Monitoring"
                            icon={AlertTriangle}
                            tone={riskCount > 0 ? "bad" : "good"}
                            onClick={() => navigate('/dashboard/compliance')}
                        />
                    </div>
                </div>
            </TradeOSErrorBoundary>

            {/* 3. Main Surface: Timeline + Live Flow OR Empty State */}
            {activeCount === 0 ? (
                <TradeOSErrorBoundary>
                    <DashboardEmptyState />
                </TradeOSErrorBoundary>
            ) : (
                <div className="grid lg:grid-cols-3 gap-6 h-auto min-h-[400px]">

                    {/* Left: Trade Flow Timeline (Spans 2 cols) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <TradeOSErrorBoundary>
                            <TradeFlowTimeline trades={activeTrades || []} />
                        </TradeOSErrorBoundary>

                        {/* Recent Activity / System Log Surface */}
                        <div className="flex-1 overflow-hidden h-[400px]">
                            <TradeOSErrorBoundary>
                                <LiveTradeFlow />
                            </TradeOSErrorBoundary>
                        </div>

                        <TradeOSErrorBoundary>
                            <KernelControlPlane companyId={profileCompanyId} />
                        </TradeOSErrorBoundary>
                    </div>

                    {/* Right: AI Intelligence & Rapid Actions */}
                    <div className="flex flex-col gap-4 md:gap-6">
                        <TradeOSErrorBoundary>
                            <Surface variant="glass" className="p-4 md:p-5 border border-afrikoni-gold/10 relative overflow-hidden bg-gradient-to-b from-blue-500/5 to-transparent">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    <span className="text-sm font-bold text-blue-600">Kernel Insights</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Market Opportunity</div>
                                        <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 leading-relaxed">
                                            Cocoa demand in FR-MRS corridor up 15%. You have 2 matching products.
                                        </div>
                                        <button className="mt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
                                            View RFQs <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="p-3 bg-afrikoni-cream/20 border border-afrikoni-gold/20 rounded-lg">
                                        <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">Compliance Alert</div>
                                        <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                            AfCFTA certificate missing for pending draft. Upload to unlock lower tariffs.
                                        </div>
                                    </div>
                                </div>
                            </Surface>
                        </TradeOSErrorBoundary>

                        {/* Quick Launchpad */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/dashboard/quick-trade')}
                                className="p-3 bg-[#D4A937] hover:bg-[#C09830] text-black rounded-lg flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(212,169,55,0.2)]"
                            >
                                <ArrowUpRight className="w-4 h-4 stroke-[2.5px]" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">Quick Trade</span>
                            </button>
                            <button
                                onClick={() => navigate('/dashboard/products/new')}
                                className="p-3 bg-white/10 hover:bg-white/15 text-white rounded-lg flex flex-col items-center justify-center gap-1 transition-all border border-white/5"
                            >
                                <Anchor className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wide">Add Product</span>
                            </button>
                        </div>
                    </div>

                </div>
            )}

            {/* 4. Secondary Surface: Detailed Metric Flow (Optional expansion area) */}
            <div className="grid grid-cols-1">
                {/* Could add specific corridor map here later */}
            </div>

        </div>
    );
}
