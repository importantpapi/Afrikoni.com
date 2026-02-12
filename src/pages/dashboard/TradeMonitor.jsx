import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { supabase, withRetry } from '@/api/supabaseClient';
import { analyzeContext } from '@/services/tradeKernel';

// UI Components
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Progress } from '@/components/shared/ui/progress';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import EmptyState from '@/components/shared/ui/EmptyState';
import SystemAdvice from '@/components/intelligence/SystemAdvice';
import SimulationState from '@/components/common/SimulationState';

// Icons
import {
    ShoppingCart, ArrowRight, Truck, Wallet, Package,
    DollarSign, Filter, Search, CheckCircle2, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusLabels = {
    inquiry: { label: "Inquiry", tone: "neutral" },
    rfq_sent: { label: "RFQ Sent", tone: "info" },
    quote_received: { label: "Quote Received", tone: "info" },
    negotiating: { label: "Negotiating", tone: "info" },
    escrow_funded: { label: "Escrow Funded", tone: "success" },
    production: { label: "Production", tone: "warning" },
    quality_check: { label: "Quality Check", tone: "warning" },
    shipped: { label: "Shipped", tone: "success" },
    in_transit: { label: "In Transit", tone: "success" },
    customs_clearance: { label: "Customs", tone: "warning" },
    delivered: { label: "Delivered", tone: "success" },
    completed: { label: "Completed", tone: "success" },
    disputed: { label: "Disputed", tone: "critical" },
    cancelled: { label: "Cancelled", tone: "neutral" },
};

/**
 * TRADE MONITOR (One Flow)
 * 
 * Unified interface for managing active trades.
 * Replaces: orders.jsx (Buyer) and sales.jsx (Seller).
 * 
 * Modes:
 * - 'buy': Shows orders where company is BUYER
 * - 'sell': Shows orders where company is SELLER
 */
export default function TradeMonitor({ viewMode = 'buy' }) {
    const { profileCompanyId, userId, canLoadData, isSystemReady } = useDashboardKernel();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Default true to prevent flash
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [advice, setAdvice] = useState([]);

    // Refs & Hooks
    const { isStale, markFresh } = useDataFreshness(30000);
    const lastLoadTimeRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Kernel Gate
    useEffect(() => {
        if (!canLoadData || !profileCompanyId) {
            // If kernel isn't ready, we just wait. Spinner handles visual.
            return;
        }

        // AbortController Setup
        abortControllerRef.current = new AbortController();
        const abortSignal = abortControllerRef.current.signal;

        // Loading Function
        const loadTrades = async () => {
            try {
                // ✅ SWR: Only show full loading state if we have no data
                if (orders.length === 0) setIsLoading(true);
                setError(null);

                // ✅ ENTERPRISE RELIABILITY: Use withRetry for network resilience
                const fetchTrades = async () => {
                    let query = supabase
                        .from('orders')
                        .select('*, products(*)')
                        .order('created_at', { ascending: false });

                    // ONE FLOW LOGIC: Filter by View Mode
                    if (viewMode === 'sell') {
                        query = query.eq('seller_company_id', profileCompanyId);
                    } else {
                        // Default to buy
                        query = query.eq('buyer_company_id', profileCompanyId);
                    }

                    if (abortSignal.aborted) throw new Error('Aborted');
                    return await query;
                };

                // Execute with retry wrapper
                const { data, error: queryError } = await withRetry(fetchTrades);

                if (abortSignal.aborted) return;
                if (queryError) throw queryError;

                setOrders(data || []);

                // INTELLIGENCE: Context Analysis
                const contextAdvice = analyzeContext({
                    page: viewMode === 'sell' ? 'sales' : 'orders',
                    data: data,
                    user: profileCompanyId
                });
                setAdvice(contextAdvice);

                lastLoadTimeRef.current = Date.now();
                markFresh();
            } catch (err) {
                if (!abortSignal.aborted) {
                    console.error('[TradeMonitor] Load Error:', err);
                    // Only show full error if we have no data
                    if (orders.length === 0) {
                        setError(err.message || 'Failed to load trades');
                    } else {
                        toast.error('Connection unstable - using cached data');
                    }
                }
            } finally {
                if (!abortSignal.aborted) setIsLoading(false);
            }
        };

        // Stale Check
        const shouldRefresh = isStale || !lastLoadTimeRef.current || (Date.now() - lastLoadTimeRef.current > 30000);

        if (shouldRefresh) {
            loadTrades();
        } else {
            setIsLoading(false); // Data is fresh, just show it
        }

        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };

    }, [canLoadData, profileCompanyId, viewMode, isStale]);


    // Computed Stats
    const stats = useMemo(() => {
        const totalValue = orders.reduce((sum, o) => sum + (o.total_value || o.total_amount || 0), 0);
        const count = orders.length;

        if (viewMode === 'sell') {
            const pending = orders.filter(o => o.payment_status === 'pending')
                .reduce((sum, o) => sum + (o.total_value || o.total_amount || 0), 0);
            const toFulfill = orders.filter(o => ['pending', 'processing'].includes(o.status)).length;

            return [
                { label: "Total Sales", value: count, icon: ShoppingCart, color: "text-[var(--os-text-primary)]" },
                { label: "Total Revenue", value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
                { label: "Pending Payment", value: `$${pending.toLocaleString()}`, icon: TrendingUp, color: "text-amber-400" },
                { label: "To Fulfill", value: toFulfill, icon: Package, color: "text-blue-400" },
            ];
        } else {
            const inTransit = orders.filter(o => ["shipped", "in_transit", "customs_clearance"].includes(o.status)).length;
            const escrowHeld = totalValue * 0.4; // Estimate

            return [
                { label: "Pipeline Value", value: `$${(totalValue / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-[var(--os-text-primary)]" },
                { label: "Active Orders", value: count, icon: Package, color: "text-blue-400" },
                { label: "In Transit", value: inTransit, icon: Truck, color: "text-emerald-400" },
                { label: "Escrow Held", value: `$${(escrowHeld / 1000).toFixed(0)}K`, icon: Wallet, color: "text-amber-400" },
            ];
        }
    }, [orders, viewMode]);

    // Filtering
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = !searchQuery ||
                (order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (order.product_name || order.products?.title || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchQuery, statusFilter]);


    // RENDER
    if (!isSystemReady) return <CardSkeleton count={3} />;

    if (error) {
        return <ErrorState message={error} onRetry={() => markFresh() /* Trigger refresh */} />;
    }

    // Loading State (Initial)
    if (isLoading && orders.length === 0) {
        return (
            <div className="os-page space-y-6">
                <Surface variant="glass" className="p-6 md:p-8">
                    <div className="space-y-4 animate-pulse">
                        <div className="h-8 w-1/3 bg-white/5 rounded" />
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl" />)}
                        </div>
                    </div>
                </Surface>
            </div>
        );
    }

    return (
        <div className="os-page os-stagger space-y-6">
            <Surface variant="glass" className="p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="os-label">{viewMode === 'sell' ? 'Sales Pipeline' : 'Procurement'}</div>
                        <h1 className="os-title mt-2">{viewMode === 'sell' ? 'Sales Orders' : 'Active Orders'}</h1>
                        <p className="text-sm text-os-muted">
                            {orders.length} {viewMode === 'sell' ? 'sales' : 'orders'} in progress
                        </p>
                    </div>
                    {viewMode === 'buy' && (
                        <Button className="shadow-gold gap-2">
                            <ShoppingCart className="h-4 w-4" /> New Order
                        </Button>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-os-surface-1 border border-os-stroke">
                            <stat.icon className={cn("h-5 w-5", stat.color)} />
                            <div>
                                <p className="text-lg font-bold text-[var(--os-text-primary)] tabular-nums">{stat.value}</p>
                                <p className="text-[10px] text-os-muted">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Intelligence */}
                {advice.length > 0 && (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                        {advice.map((item, idx) => (
                            <SystemAdvice key={item.id || idx} advice={item} type={item.type} />
                        ))}
                    </div>
                )}

                {/* Filters */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-os-muted" />
                        <Input
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                </div>
            </Surface>

            {/* List */}
            {orders.length === 0 && !isLoading ? (
                viewMode === 'buy' ? (
                    <SimulationState onActivate={() => { /* No-op in prod, logic removed */ }} />
                ) : (
                    <EmptyState
                        type="products"
                        title="No sales yet"
                        description="Your sales pipeline is empty."
                        cta={viewMode === 'sell' ? "View RFQs" : "Create Order"}
                        ctaLink={viewMode === 'sell' ? "/dashboard/supplier-rfqs" : "/dashboard/quick-trade"}
                    />
                )
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
                        const status = statusLabels[order.status] || { label: order.status, tone: 'neutral' };
                        const milestones = order.milestones || [];
                        const completedMilestones = milestones.filter(m => m.status === 'completed').length;
                        const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;
                        const displayTitle = order.product_name || order.products?.title || 'Order';

                        return (
                            <Surface
                                key={order.id}
                                variant="panel"
                                className="p-6 hover:bg-os-surface-2 transition-all cursor-pointer group"
                                onClick={() => navigate(`/dashboard/orders/${order.id}`)} // TODO: Update detail route too?
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-base font-semibold text-[var(--os-text-primary)]">{displayTitle}</h3>
                                            <StatusBadge label={status.label} tone={status.tone} />
                                            {/* Risk Badge (Optional, mostly for buyer view) */}
                                            {order.corridor?.risk && (
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                                    order.corridor.risk === "low" ? "bg-emerald-500/10 text-emerald-500" :
                                                        order.corridor.risk === "high" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                                                )}>
                                                    {order.corridor.risk} risk
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-os-muted">
                                            <span className="font-mono text-xs opacity-70">{order.id}</span>
                                            {viewMode === 'sell' && (
                                                <span>· Buyer: {order.buyer_company_id?.substring(0, 8) || 'Unknown'}</span>
                                            )}
                                            <span className="hidden sm:inline">· {format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-[var(--os-text-primary)] tabular-nums">
                                            ${(order.total_value || order.total_amount || 0).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-os-muted">
                                            {(order.quantity || 0).toLocaleString()} {order.unit || 'units'}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress Rail - Visual for both sides */}
                                {milestones.length > 0 && (
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs text-os-muted">Progress</span>
                                            <span className="text-xs font-medium text-[var(--os-text-primary)] tabular-nums">{progress.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={progress} className="h-1.5" />
                                    </div>
                                )}

                                {/* Milestone Pills */}
                                <div className="flex flex-wrap gap-1.5">
                                    {milestones.map((m) => (
                                        <span key={m.id || m.name} className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
                                            m.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                m.status === 'in_progress' ? "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse-glow" :
                                                    "bg-os-surface-0 text-os-muted border-os-stroke"
                                        )}>
                                            {m.status === 'completed' && <CheckCircle2 className="h-3 w-3 inline mr-0.5" />}
                                            {m.name}
                                        </span>
                                    ))}
                                </div>
                            </Surface>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
