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

export default function TradeMonitor({ viewMode = 'buy' }) {
    const { profileCompanyId, isSystemReady } = useDashboardKernel();
    const navigate = useNavigate();

    // \u2705 REACT QUERY: Unified data flow
    const { data: tradesData = {}, isLoading, error: queryError } = useTrades();
    const allTrades = tradesData.trades || [];
    
    // Filter by viewMode (buy/sell)
    const trades = useMemo(() => {
        if (viewMode === 'buy') {
            return allTrades.filter(t => t.buyer_id === profileCompanyId);
        } else if (viewMode === 'sell') {
            return allTrades.filter(t => t.seller_id === profileCompanyId);
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
                { label: "Revenue", value: `$${(totalValue / 1000).toFixed(1)}k`, icon: DollarSign, color: "text-emerald-400" },
                { label: "Pending", value: `$${(pending / 1000).toFixed(1)}k`, icon: TrendingUp, color: "text-amber-400" },
                { label: "Active", value: toFulfill, icon: Package, color: "text-blue-400" },
            ];
        } else {
            const inTransit = trades.filter(t => ["shipped", "in_transit"].includes(t.status)).length;
            const pipelineValue = tradesData.pipelineValue || 0;

            return [
                { label: "Pipeline", value: `$${(pipelineValue / 1000).toFixed(1)}k`, icon: DollarSign, color: "text-os-gold" },
                { label: "Active", value: trades.filter(t => !['closed', 'settled'].includes(t.status)).length, icon: Package, color: "text-blue-400" },
                { label: "In Transit", value: inTransit, icon: Truck, color: "text-emerald-400" },
                { label: "Resolved", value: trades.filter(t => ['closed', 'settled'].includes(t.status)).length, icon: CheckCircle2, color: "text-os-muted" },
            ];
        }
    }, [trades, viewMode, tradesData.pipelineValue]);

    const filteredTrades = useMemo(() => {
        return trades.filter(order => {
            const matchesSearch = !searchQuery ||
                (order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (order.product_name || order.productName || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [trades, searchQuery, statusFilter]);

    if (!isSystemReady || isLoading) return <CardSkeleton count={3} />;

    if (queryError) {
        return <ErrorState message={queryError.message} />;
    }

    return (
        <div className="os-page os-stagger space-y-6">
            <Surface variant="glass" className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="os-label">{viewMode === 'sell' ? 'Sales Pipeline' : 'Procurement'}</div>
                        <h1 className="os-title mt-2">{viewMode === 'sell' ? 'Sales Ledger' : 'Active Orders'}</h1>
                        <p className="text-sm text-os-muted">
                            {trades.length} {viewMode === 'sell' ? 'sales' : 'orders'} registered in kernel.
                        </p>
                    </div>
                    {viewMode === 'buy' && (
                        <Button className="shadow-gold gap-2" onClick={() => navigate('/dashboard/rfqs/new')}>
                            <ShoppingCart className="h-4 w-4" /> New Order
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-os-surface-1 border border-os-stroke">
                            <stat.icon className={cn("h-5 w-5", stat.color)} />
                            <div>
                                <p className="text-lg font-bold text-[var(--os-text-primary)] tabular-nums">{stat.value}</p>
                                <p className="text-[10px] text-os-muted uppercase tracking-tighter">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {advice.length > 0 && (
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {advice.map((item, idx) => (
                            <SystemAdvice key={item.id || idx} advice={item} type={item.type} />
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-os-muted" />
                        <Input
                            placeholder="Search ledger..."
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

            <div className="space-y-4">
                {filteredTrades.length === 0 ? (
                    <EmptyState
                        icon={Package}
                        title="No trades found"
                        description="Your trade ledger is currently empty."
                    />
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
                                className="p-6 hover:bg-os-surface-2 transition-all cursor-pointer group"
                                onClick={() => navigate(`/dashboard/trade/${order.id}`)}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-base font-semibold text-[var(--os-text-primary)]">{displayTitle}</h3>
                                            <StatusBadge label={status.label} tone={status.tone} />
                                            {order.corridor?.risk && order.corridor.risk !== 'low' && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500 uppercase">
                                                    {order.corridor.risk} risk
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-os-muted">
                                            <span className="font-mono text-[10px] opacity-70">ID: {order.id.substring(0,8)}</span>
                                            <span className="hidden sm:inline">· {format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-[var(--os-text-primary)] tabular-nums">
                                            ${(order.total_value || order.total_amount || 0).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-os-muted uppercase">
                                            {(order.quantity || 0).toLocaleString()} {order.quantity_unit || 'units'}
                                        </p>
                                    </div>
                                </div>

                                {milestones.length > 0 && (
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] uppercase text-os-muted">Chain Progress</span>
                                            <span className="text-xs font-medium text-os-gold tabular-nums">{progress.toFixed(0)}%</span>
                                        </div>
                                        <Progress value={progress} className="h-1.5" />
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-1.5">
                                    {milestones.slice(0, 4).map((m, idx) => (
                                        <span key={idx} className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
                                            m.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                m.status === 'in_progress' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                    "bg-os-surface-0 text-os-muted border-os-stroke"
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
