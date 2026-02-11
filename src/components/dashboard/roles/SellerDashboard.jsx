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
    Activity, Wallet, Package, Star, ChevronRight,
    TrendingUp, ArrowUpRight, Plus, FileText
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyConverter';

export default function SellerDashboard() {
    const { isSystemReady, profileCompanyId } = useDashboardKernel();
    const { data: kernelData, loading: kernelLoading } = useKernelState();
    const { activeTrades, loading: tradesLoading } = useTradeKernelState();
    const navigate = useNavigate();

    // Combine loading states
    const isLoading = !isSystemReady || kernelLoading || tradesLoading;

    // Derive metrics (Mocked for now or derived from activeTrades where applicable)
    const activeQuotes = activeTrades?.filter(t => t.status === 'quoted' || t.status === 'rfq_open').length || 0;
    const salesVolume = kernelData?.capitalInMotion || 0; // Placeholder for actual sales
    const productCount = 12; // Placeholder
    const sellerRating = 4.8; // Placeholder

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="os-page space-y-2">
            {/* 1. Header Area: Welcome + Kernel Status */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-1 md:gap-2">
                <div>
                    <h1 className="text-lg md:text-xl font-light text-[var(--os-text-primary)]">
                        Command Center <span className="text-os-muted mx-1 md:mx-2">/</span> Sales
                    </h1>
                    <p className="text-[10px] md:text-xs text-os-muted mt-0.5 font-mono">
                        Operational • {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                </div>
            </div>

            <Surface variant="glass" className="p-3">
                <TradeOSErrorBoundary>
                    <OSStatusBar />
                </TradeOSErrorBoundary>
            </Surface>

            {/* Today's Actions - AI Co-Pilot */}
            <TradeOSErrorBoundary>
                <TodaysActions compact={true} />
            </TradeOSErrorBoundary>

            {/* 2. Trade State Panels Grid - Seller Focus */}
            <TradeOSErrorBoundary>
                <div className="md:grid md:grid-cols-4 gap-4 flex overflow-x-auto no-scrollbar pb-4 md:pb-0 px-1 -mx-1 snap-x">
                    <div className="flex-shrink-0 w-[160px] md:w-auto snap-center mr-3 md:mr-0">
                        <TradeStatePanel
                            label="Active Quotes"
                            value={activeQuotes}
                            subtext="Pending Review"
                            icon={FileText}
                            tone="neutral"
                            onClick={() => navigate('/dashboard/supplier-rfqs')}
                        />
                    </div>
                    <div className="flex-shrink-0 w-[160px] md:w-auto snap-center mr-3 md:mr-0">
                        <TradeStatePanel
                            label="Sales Volume"
                            value={formatCurrency(salesVolume)}
                            subtext="This Month"
                            icon={Wallet}
                            tone="good"
                            onClick={() => navigate('/dashboard/payments')}
                        />
                    </div>
                    <div className="flex-shrink-0 w-[160px] md:w-auto snap-center mr-3 md:mr-0">
                        <TradeStatePanel
                            label="My Products"
                            value={productCount}
                            subtext="Active Listings"
                            icon={Package}
                            tone="neutral"
                            onClick={() => navigate('/dashboard/products')}
                        />
                    </div>
                    <div className="flex-shrink-0 w-[160px] md:w-auto snap-center">
                        <TradeStatePanel
                            label="Seller Rating"
                            value={sellerRating}
                            subtext="Top Rated"
                            icon={Star}
                            tone="good"
                            onClick={() => navigate('/dashboard/settings')}
                        />
                    </div>
                </div>
            </TradeOSErrorBoundary>

            {/* 3. Main Surface: Timeline + Live Flow OR Empty State */}
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
                <div className="flex flex-col gap-6">
                    <TradeOSErrorBoundary>
                        <Surface variant="glass" className="p-5 border border-afrikoni-gold/10 relative overflow-hidden bg-gradient-to-b from-purple-500/5 to-transparent">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                    <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                                </div>
                                <span className="text-sm font-bold text-purple-600">Sales Insights</span>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                    <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">High Demand Alert</div>
                                    <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1 leading-relaxed">
                                        3 new RFQs for "Raw Cashew Nuts" match your inventory. Quote now to win.
                                    </div>
                                    <button className="mt-2 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1">
                                        View RFQs <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </Surface>
                    </TradeOSErrorBoundary>

                    {/* Quick Launchpad */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate('/dashboard/products/new')}
                            className="p-3 bg-[#D4A937] hover:bg-[#C09830] text-black rounded-lg flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(212,169,55,0.2)]"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5px]" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">New Product</span>
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/supplier-rfqs')}
                            className="p-3 bg-white/10 hover:bg-white/15 text-white rounded-lg flex flex-col items-center justify-center gap-1 transition-all border border-white/5"
                        >
                            <FileText className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">View RFQs</span>
                        </button>
                    </div>
                </div>

            </div>

        </div>
    );
}
