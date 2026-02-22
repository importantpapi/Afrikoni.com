import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useTrades } from '@/hooks/queries/useTrades';
import { analyzeContext } from '@/services/tradeKernel';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Progress } from '@/components/shared/ui/progress';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import EmptyState from '@/components/shared/ui/EmptyState';
import SystemAdvice from '@/components/intelligence/SystemAdvice';
import SimulationState from '@/components/common/SimulationState';
import {
    ShoppingCart, Truck, Wallet, Package,
    DollarSign, Filter, Search, CheckCircle2, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useOSSettings } from '@/hooks/useOSSettings';

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

import { useViewPermissions } from '@/hooks/useViewPermissions';

export default function TradeMonitor({ viewMode = 'buy' }) {
    const { profileCompanyId, isSystemReady } = useDashboardKernel();
    const { interfaceMode } = useOSSettings();
    const { isSourcing, isDistribution } = useViewPermissions();
    const navigate = useNavigate();

    // 🛡️ UNIFIED TRADER GUARD: Prevent Mode Drift
    useEffect(() => {
        const isSourcingRoute = ['buy', 'rfqs'].includes(viewMode);
        const isDistributionRoute = ['sell', 'rfqs-received'].includes(viewMode);

        if (isSourcing && isDistributionRoute) {
            navigate('/dashboard');
        } else if (isDistribution && isSourcingRoute) {
            navigate('/dashboard');
        }
    }, [isSourcing, isDistribution, viewMode, navigate]);

    const isSimple = interfaceMode === 'simple';

    // ✅ REACT QUERY: Unified data flow
    const { data: tradesData = {}, isLoading, isRefetching, error: queryError } = useTrades();
    const allTrades = tradesData.trades || [];

    // Filter by viewMode (buy/sell)
    const trades = useMemo(() => {
        if (viewMode === 'buy') {
            return allTrades.filter(t => t.buyer_company_id === profileCompanyId);
        } else if (viewMode === 'sell') {
            return allTrades.filter(t => t.seller_company_id === profileCompanyId);
        }
        return allTrades;
    }, [allTrades, viewMode, profileCompanyId]);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [advice, setAdvice] = useState([]);

    useEffect(() => {
        if (trades.length > 0) {
            const contextAdvice = analyzeContext({
                page: viewMode === 'sell' ? 'sales' : 'orders',
                data: trades,
                user: profileCompanyId
            });
            setAdvice(contextAdvice);
        }
    }, [trades, viewMode, profileCompanyId]);

    const stats = useMemo(() => {
        const totalValue = trades.reduce((sum, t) => sum + (t.total_value || t.total_amount || 0), 0);
        const count = trades.length;

        if (viewMode === 'sell') {
            const pending = trades.filter(t => t.payment_status === 'pending')
                .reduce((sum, t) => sum + (t.total_value || t.total_amount || 0), 0);
            const toFulfill = trades.filter(t => !['settled', 'closed'].includes(t.status)).length;

            return [
                { label: "Total Sales", value: count, icon: ShoppingCart, color: "text-os-gold" },
                { label: "Revenue", value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
                { label: "Pending", value: `$${pending.toLocaleString()}`, icon: TrendingUp, color: "text-amber-400" },
                { label: "Active", value: toFulfill, icon: Package, color: "text-blue-400" },
            ];
        } else {
            const inTransit = trades.filter(t => ["shipped", "in_transit"].includes(t.status)).length;
            const totalOpen = trades.filter(t => !['closed', 'settled'].includes(t.status)).length;
            const totalPending = trades.filter(t => t.payment_status === 'pending').length;

            const dashboardStats = [
                { label: "Total Orders", value: count, icon: ShoppingCart, color: "text-os-gold" },
                { label: "Active Orders", value: totalOpen, icon: Package, color: "text-blue-400" },
                { label: "In Transit", value: inTransit, icon: Truck, color: "text-emerald-400" },
                { label: "Completed", value: trades.filter(t => ['closed', 'settled'].includes(t.status)).length, icon: CheckCircle2, color: "text-os-muted" },
            ];

            return isSimple ? dashboardStats.slice(1, 3) : dashboardStats;
        }
    }, [trades, viewMode, tradesData.pipelineValue, isSimple]);

    const filteredTrades = useMemo(() => {
        return trades.filter(order => {
            const matchesSearch = !searchQuery ||
                (order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (order.product_name || order.productName || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [trades, searchQuery, statusFilter]);

    if (!isSystemReady || isLoading || (isRefetching && trades.length === 0)) return <CardSkeleton count={3} />;

    if (queryError) {
        return <ErrorState message={queryError.message} />;
    }

    return (
        <div className="os-page-layout os-stagger">
            <div className="os-header-group flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="tracking-tight">
                        {viewMode === 'sell' ? 'Distribution Ledger' : 'Active Trade Rails'}
                    </h1>
                    <p className="os-label opacity-60">
                        {trades.length} Institutional DNA sessions active on the Afrikoni Rail.
                    </p>
                </div>
                {viewMode === 'buy' && (
                    <Button
                        className="bg-os-text-primary text-os-bg rounded-full px-8 py-6 h-auto font-semibold shadow-os-md hover:opacity-90 transition-all"
                        onClick={() => navigate('/dashboard/rfqs/new')}
                    >
                        New Order
                    </Button>
                )}
            </div>

            <div className="os-stat-grid">
                {stats.map((stat) => (
                    <Surface key={stat.label} variant="glass" className="p-6 flex flex-col gap-2 border-os-stroke/40">
                        <stat.icon className={cn("h-5 w-5 opacity-60", stat.color)} />
                        <div>
                            <div className="os-label">{stat.label}</div>
                            <div className="text-os-2xl font-bold tracking-tight">{stat.value}</div>
                        </div>
                    </Surface>
                ))}
            </div>

            {advice.length > 0 && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {advice.map((item, idx) => (
                        <SystemAdvice key={item.id || idx} advice={item} type={item.type} />
                    ))}
                </div>
            )}

            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-os-text-secondary group-focus-within:text-os-accent transition-colors" />
                    <Input
                        placeholder="Find an order or product..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 h-12 bg-white/5 border-os-stroke rounded-os-md focus:bg-white/10 transition-all text-os-base"
                    />
                </div>
                <Button variant="ghost" className="h-12 px-6 rounded-os-md border border-os-stroke text-os-text-secondary hover:text-os-text-primary gap-2">
                    <Filter className="h-4 w-4" /> Filter
                </Button>
            </div>

            <div className="space-y-4">
                {filteredTrades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                        <div className="mb-6 p-6 bg-gradient-to-br from-[#B8922F]/10 to-[#B8922F]/5 rounded-3xl">
                            <Package className="h-16 w-16 text-[#B8922F]" />
                        </div>
                        <h3 className="text-2xl font-semibold text-stone-900 mb-3">
                            Your First Trade Awaits
                        </h3>
                        <p className="text-stone-500 mb-8 max-w-md">
                            Source products, negotiate terms, and track your orders in one unified workspace
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={() => navigate('/dashboard/rfqs/new')}
                                className="h-12 px-8 bg-[#B8922F] hover:bg-[#A68A2E] text-white rounded-full font-medium shadow-lg shadow-[#B8922F]/20"
                            >
                                Create Trade Request →
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/suppliers')}
                                className="h-12 px-8 border-stone-200 text-stone-700 hover:bg-stone-50 rounded-full font-medium"
                            >
                                Browse Suppliers
                            </Button>
                        </div>
                        <p className="text-xs text-stone-400 mt-6">
                            Over 1,200+ verified suppliers ready to quote
                        </p>
                    </div>
                ) : (
                    filteredTrades.map((order) => {
                        const status = statusLabels[order.status] || { label: order.status, tone: 'neutral' };
                        const milestones = order.milestones || [];
                        const completedMilestones = milestones.filter(m => m.status === 'completed').length;
                        const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;
                        const displayTitle = order.productName || order.product_name || 'Order';

                        return (
                            <Surface
                                key={order.id}
                                variant="panel"
                                hover
                                className="p-6 hover:bg-os-surface transition-all group"
                                onClick={() => navigate(`/dashboard/trades/${order.id}`)}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-os-base font-semibold text-[var(--os-text-primary)]">{displayTitle}</h3>
                                            <StatusBadge label={status.label} tone={status.tone} />
                                            {order.corridor?.risk && order.corridor.risk !== 'low' && (
                                                <span className="px-1.5 py-0.5 rounded text-os-xs font-medium bg-amber-500/10 text-amber-500 uppercase">
                                                    {order.corridor.risk} risk
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-os-sm text-os-text-secondary">
                                            {!isSimple && <span className="font-mono text-os-xs opacity-70">ID: {order.id.substring(0, 8)}</span>}
                                            <span className={cn(isSimple ? "" : "hidden sm:inline")}>{isSimple ? "" : "· "}{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-os-xl font-bold text-[var(--os-text-primary)] tabular-nums">
                                            ${(order.total_value || order.total_amount || 0).toLocaleString()}
                                        </p>
                                        <p className="text-os-xs text-os-muted uppercase">
                                            {(order.quantity || 0).toLocaleString()}{' '}
                                            {String(order.quantity_unit || 'units')
                                                .replace(/pieces.*|tons.*/i, (match) => match.toLowerCase().startsWith('pi') ? 'pieces' : match.toLowerCase().startsWith('to') ? 'tons' : match)}
                                        </p>
                                    </div>
                                </div>

                                {milestones.length > 0 && (
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="os-label">Chain Progress</span>
                                            <span className="text-os-xs font-medium text-os-accent tabular-nums">{progress.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={progress} className="h-1.5" />
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-1.5">
                                    {milestones.slice(0, 4).map((m, idx) => (
                                        <span key={idx} className={cn(
                                            "px-2 py-0.5 rounded-full text-os-xs font-medium border transition-colors",
                                            m.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                m.status === 'in_progress' ? "bg-os-blue/10 text-os-blue border-os-blue/20" :
                                                    "bg-os-bg text-os-text-secondary border-os-stroke"
                                        )}>
                                            {m.name || 'Step'}
                                        </span>
                                    ))}
                                </div>
                            </Surface>
                        );
                    })
                )}
            </div>
        </div>
    );
}
