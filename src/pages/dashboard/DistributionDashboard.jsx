import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrades } from '@/hooks/queries/useTrades';
import { useRFQs } from '@/hooks/queries/useRFQs';
import {
    Box, CreditCard, ChevronRight, Package, Ship, Sparkles, ShoppingCart, FileText, Target, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/system/Surface';
import { NBA, Button } from '@/components/shared/ui';
import { useAuth } from '@/contexts/AuthProvider';
import { useLanguage } from '@/i18n/LanguageContext';

export function DistributionDashboard() {
    const { data: { activeTrades = [] } = {}, isLoading: tradesLoading } = useTrades();
    const { data: allRFQs = [] } = useRFQs();
    const { profile } = useAuth();
    const navigate = useNavigate();
    const { language, t } = useLanguage();

    const firstName = profile?.full_name?.split(' ')[0] || profile?.name?.split(' ')[0] || 'there';

    const activeDeals = activeTrades.filter(t => !['settled', 'closed'].includes(t.status));
    const completedDeals = activeTrades.filter(t => ['settled', 'closed'].includes(t.status));

    const totalEscrowValue = activeDeals.reduce((sum, trade) => sum + (Number(trade.value) || 0), 0);
    const totalCompletedValue = completedDeals.reduce((sum, trade) => sum + (Number(trade.value) || 0), 0);

    const nba = {
        title: "Find Trade Leads",
        description: "Browse open requests from buyers looking for products in your category.",
        actionLabel: "View RFQs",
        onAction: () => navigate(`/${language}/dashboard/supplier-rfqs`),
        icon: Target,
        status: "Lead Match Active"
    };

    const stats = [
        { label: "Active Orders", value: activeDeals.length.toString(), sub: "In fulfillment pipeline", color: "text-os-accent", trend: "Fulfilling" },
        { label: "Pending Payout", value: `$${totalEscrowValue.toLocaleString()}`, sub: "Funds in escrow", color: "text-os-blue", trend: "Secured" },
        { label: "Total Revenue", value: `$${totalCompletedValue.toLocaleString()}`, sub: "Total settled trades", color: "text-os-green", trend: "+2.4%" },
        { label: "Incoming RFQs", value: allRFQs.length.toString(), sub: "Qualified leads", color: "text-purple-400", trend: "New" }
    ];

    const quickActions = [
        { label: "Manage Products", sub: "Update inventory", icon: Package, link: `/${language}/dashboard/products`, color: "text-os-blue", bg: "bg-os-blue/10" },
        { label: "View RFQs", sub: "Review buyer requests", icon: FileText, link: `/${language}/dashboard/supplier-rfqs`, color: "text-os-green", bg: "bg-os-green/10" },
        { label: "Sales Analytics", sub: "Track performance", icon: BarChart3, link: `/${language}/dashboard/analytics`, color: "text-purple-500", bg: "bg-purple-500/10" },
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
                            <h2 className="text-os-xl font-bold">Orders Received</h2>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/trades')}>View All</Button>
                        </div>
                        {activeDeals.length > 0 ? (
                            <div className="divide-y divide-os-stroke">
                                {activeDeals.slice(0, 3).map((trade) => (
                                    <div key={trade.id} onClick={() => navigate(`/dashboard/trade/${trade.id}`)} className="p-6 hover:bg-os-surface cursor-pointer flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <ShoppingCart className="w-6 h-6 text-os-text-secondary" />
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
                                <p className="text-os-text-secondary">No orders to fulfill yet.</p>
                                <Button className="mt-4 bg-os-accent text-black" onClick={() => navigate('/dashboard/supplier-rfqs')}>Browse RFQs</Button>
                            </div>
                        )}
                    </Surface>
                </div>
                <div className="lg:col-span-4 space-y-6">
                    <Surface variant="glass" className="p-8 bg-os-accent/5 border-os-accent/20">
                        <h3 className="text-os-xs font-black uppercase tracking-widest text-os-accent mb-4">Payout Balance</h3>
                        <div className="text-3xl font-black font-mono mb-2 text-os-accent">${totalCompletedValue.toLocaleString()}</div>
                        <div className="text-os-xs font-bold uppercase tracking-tighter text-os-text-secondary mb-6">Total Settled</div>
                        <Button onClick={() => navigate(`/${language}/dashboard/wallet`)} variant="solid" className="w-full bg-os-accent text-black">Withdraw Funds</Button>
                    </Surface>
                    <Surface variant="panel" className="p-6">
                        <h3 className="text-os-sm font-bold flex items-center gap-2 mb-4 text-os-blue">
                            <CreditCard className="w-5 h-5" />
                            Seller Protection
                        </h3>
                        <p className="text-os-xs text-os-text-secondary">All deals are secured by Afrikoni Escrow. You are guaranteed payout upon buyer confirmation or verification of delivery.</p>
                    </Surface>
                </div>
            </div>
        </div>
    );
}
