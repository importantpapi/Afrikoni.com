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
    Truck, MapPin, CheckCircle2, TrendingUp, ChevronRight,
    AlertTriangle, Navigation, Box
} from 'lucide-react';

export default function LogisticsDashboard() {
    const { isSystemReady, profileCompanyId } = useDashboardKernel();
    const { data: kernelData, loading: kernelLoading } = useKernelState();
    const { activeTrades, loading: tradesLoading } = useTradeKernelState();
    const navigate = useNavigate();

    // Combine loading states
    const isLoading = !isSystemReady || kernelLoading || tradesLoading;

    // Derive metrics
    const activeShipments = activeTrades?.filter(t => ['pickup_scheduled', 'in_transit'].includes(t.status)).length || 0;
    const deliveredCount = activeTrades?.filter(t => ['delivered', 'accepted'].includes(t.status)).length || 0;
    const fleetCount = 5; // Placeholder
    const onTimeRate = "98%"; // Placeholder

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="os-page space-y-3 p-3 md:p-6 md:space-y-6">
            {/* 1. Header Area: Welcome + Kernel Status */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-1 md:gap-2">
                <div>
                    <h1 className="text-base md:text-xl font-light text-[var(--os-text-primary)]">
                        Command Center <span className="text-os-muted mx-1 md:mx-2">/</span> Logistics
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

            {/* 2. Trade State Panels Grid - Logistics Focus */}
            <TradeOSErrorBoundary>
                <div className="md:grid md:grid-cols-4 gap-4 flex overflow-x-auto no-scrollbar pb-4 md:pb-0 px-1 -mx-1 snap-x">
                    <div className="flex-shrink-0 w-[160px] md:w-auto snap-center mr-3 md:mr-0">
                        <TradeStatePanel
                            label="Active Shipments"
                            value={activeShipments}
                            subtext="In Transit"
                            icon={Truck}
                            tone="neutral"
                            onClick={() => navigate('/dashboard/shipments')}
                        />
                    </div>
                    <div className="flex-shrink-0 w-[160px] md:w-auto snap-center mr-3 md:mr-0">
                        <TradeStatePanel
                            label="My Fleet"
                            value={fleetCount}
                            subtext="Available"
                            icon={MapPin}
                            tone="good"
                            onClick={() => navigate('/dashboard/settings')}
                        />
                    </div>
                    <div className="flex-shrink-0 w-[160px] md:w-auto snap-center mr-3 md:mr-0">
                        <TradeStatePanel
                            label="Delivered"
                            value={deliveredCount}
                            subtext="This Month"
                            icon={CheckCircle2}
                            tone="good"
                            onClick={() => navigate('/dashboard/shipments?tab=history')}
                        />
                    </div>
                    <div className="flex-shrink-0 w-[160px] md:w-auto snap-center">
                        <TradeStatePanel
                            label="On-Time Rate"
                            value={onTimeRate}
                            subtext="Performance"
                            icon={TrendingUp}
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
                        <Surface variant="glass" className="p-5 border border-afrikoni-gold/10 relative overflow-hidden bg-gradient-to-b from-emerald-500/5 to-transparent">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                                <span className="text-sm font-bold text-emerald-600">Route Intelligence</span>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Delay Warning</div>
                                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 leading-relaxed">
                                        Traffic congestion reported on Lagos-Apapa corridor. Expect +4h delay.
                                    </div>
                                    <button className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1">
                                        View Map <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </Surface>
                    </TradeOSErrorBoundary>

                    {/* Quick Launchpad */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate('/dashboard/shipments')}
                            className="p-3 bg-[#D4A937] hover:bg-[#C09830] text-black rounded-lg flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(212,169,55,0.2)]"
                        >
                            <Truck className="w-4 h-4 stroke-[2.5px]" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Track</span>
                        </button>
                        <button
                            onClick={() => navigate('/dashboard/settings')}
                            className="p-3 bg-white/10 hover:bg-white/15 text-white rounded-lg flex flex-col items-center justify-center gap-1 transition-all border border-white/5"
                        >
                            <Box className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wide">Manage Fleet</span>
                        </button>
                    </div>
                </div>

            </div>

        </div>
    );
}
