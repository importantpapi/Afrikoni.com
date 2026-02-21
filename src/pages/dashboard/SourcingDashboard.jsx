import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrades } from '@/hooks/queries/useTrades';
import { useRFQs } from '@/hooks/queries/useRFQs';
import {
    Box, Globe, ShieldCheck, ChevronRight, Package, Ship, Sparkles, CreditCard, Lock as LockIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/system/Surface';
import { motion } from 'framer-motion';
import { NBA, Button } from '@/components/shared/ui';
import { useAuth } from '@/contexts/AuthProvider';
import { useLanguage } from '@/i18n/LanguageContext';

export function SourcingDashboard() {
    const { data: { activeTrades = [] } = {}, isLoading: tradesLoading } = useTrades();
    const { data: allRFQs = [], isLoading: rfqsLoading } = useRFQs();
    const { profile } = useAuth();
    const navigate = useNavigate();
    const { language, t } = useLanguage();

    const firstName = profile?.full_name?.split(' ')[0] || profile?.name?.split(' ')[0] || 'there';

    // Filter open RFQs
    const openRFQs = allRFQs.filter(r => r.status === 'open' || r.status === 'active');
    const activeDeals = activeTrades.filter(t => !['settled', 'closed'].includes(t.status));
    const completedDeals = activeTrades.filter(t => ['settled', 'closed'].includes(t.status));

    const totalEscrowValue = activeDeals.reduce((sum, trade) => sum + (Number(trade.value) || 0), 0);
    const totalCompletedValue = completedDeals.reduce((sum, trade) => sum + (Number(trade.value) || 0), 0);

    const nba = {
        title: t('dashboard.find_what_need_title'),
        description: t('dashboard.find_what_need_desc'),
        actionLabel: t('dashboard.browse_suppliers'),
        onAction: () => navigate(`/${language}/suppliers`),
        icon: Sparkles,
        status: t('dashboard.ready_to_trade_status')
    };

    const stats = [
        { label: t('dashboard.active_deals'), value: activeDeals.length.toString(), sub: t('dashboard.active_deals_sub'), color: "text-os-accent", trend: "Active" },
        { label: t('dashboard.in_escrow'), value: `$${totalEscrowValue.toLocaleString()}`, sub: "Protected by Secure Escrow", color: "text-os-blue", trend: "Secure" },
        { label: "RFQs Sent", value: openRFQs.length.toString(), sub: "Awaiting Supplier Quotes", color: "text-purple-400", trend: "Live" },
        { label: "Items Saved", value: "0", sub: "Price Watch Active", color: "text-os-green", trend: "Monitored" }
    ];

    const quickActions = [
        { label: t('dashboard.create_rfq_label'), sub: t('dashboard.create_rfq_sub'), icon: Globe, link: `/${language}/dashboard/rfqs/new`, color: "text-os-blue", bg: "bg-os-blue/10" },
        { label: t('dashboard.browse_suppliers_label'), sub: t('dashboard.browse_suppliers_sub'), icon: Package, link: `/${language}/suppliers`, color: "text-os-green", bg: "bg-os-green/10" },
        { label: t('dashboard.my_orders_label'), sub: t('dashboard.my_orders_sub'), icon: Ship, link: `/${language}/dashboard/trades`, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <NBA {...nba} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {stats.map((stat, i) => (
                        <Surface key={i} variant="glass" className="p-4 border-os-stroke/40">
                            <div className="flex justify-between items-start mb-2">
                                <span className="os-label">{stat.label}</span>
                                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/5", stat.color)}>{stat.trend}</span>
                            </div>
                            <div>
                                <div className="text-2xl font-black font-mono">{stat.value}</div>
                                <div className="text-[10px] text-os-text-secondary/40 uppercase mt-1">{stat.sub}</div>
                            </div>
                        </Surface>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map((item, i) => (
                    <Surface key={i} variant="panel" hover onClick={() => navigate(item.link)} className="p-6 border-2 border-transparent hover:border-os-accent/30">
                        <div className={cn("w-12 h-12 rounded-os-sm mb-4 flex items-center justify-center", item.bg)}>
                            <item.icon className={cn("w-6 h-6", item.color)} />
                        </div>
                        <h3 className="font-bold text-os-lg mb-1">{item.label}</h3>
                        <p className="text-os-sm text-os-text-secondary">{item.sub}</p>
                    </Surface>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <Surface variant="panel" className="p-2">
                        <div className="p-6 border-b border-os-stroke flex justify-between items-center">
                            <h2 className="text-os-xl font-bold">My Active Purchases</h2>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/trades')}>View All</Button>
                        </div>
                        {activeDeals.length > 0 ? (
                            <div className="divide-y divide-os-stroke">
                                {activeDeals.slice(0, 3).map((trade) => (
                                    <div key={trade.id} onClick={() => navigate(`/dashboard/trade/${trade.id}`)} className="p-6 hover:bg-os-surface cursor-pointer flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <Box className="w-6 h-6 text-os-text-secondary" />
                                            <div>
                                                <h4 className="font-bold">{trade.productName}</h4>
                                                <p className="text-os-xs text-os-text-secondary">{trade.status}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-os-text-secondary">No active sourcing projects yet.</p>
                                <Button className="mt-4 bg-os-accent text-black" onClick={() => navigate('/suppliers')}>Find Suppliers</Button>
                            </div>
                        )}
                    </Surface>
                </div>
                <div className="lg:col-span-4 space-y-6">
                    <Surface variant="glass" className="p-8 bg-emerald-500/[0.02]">
                        <h3 className="text-os-xs font-black uppercase tracking-widest text-os-muted mb-4">Escrow Protection</h3>
                        <div className="text-3xl font-black font-mono mb-6">${totalEscrowValue.toLocaleString()}</div>
                        <p className="text-os-xs text-os-text-secondary mb-6">These funds are held in secure escrow until you confirm delivery.</p>
                        <Button onClick={() => navigate(`/${language}/dashboard/payments`)} variant="outline" className="w-full">Manage Wallet</Button>
                    </Surface>
                    <Surface variant="panel" className="p-6">
                        <h3 className="text-os-sm font-bold flex items-center gap-2 mb-4">
                            <ShieldCheck className="w-5 h-5 text-os-green" />
                            You're Protected
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <LockIcon className="w-4 h-4 text-os-green shrink-0 mt-1" />
                                <p className="text-os-xs text-os-text-secondary">All trade funds are protected by the Afrikoni Secure Escrow system.</p>
                            </div>
                        </div>
                    </Surface>
                </div>
            </div>
        </div>
    );
}
