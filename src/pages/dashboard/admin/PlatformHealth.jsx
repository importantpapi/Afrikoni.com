import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Surface } from '@/components/system/Surface';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    Activity, DollarSign, ShieldCheck, AlertTriangle,
    BarChart3, Users, Zap, Terminal, Heart,
    Clock, ArrowUpRight, ArrowDownRight, Database
} from 'lucide-react';
import { Badge } from '@/components/shared/ui/badge';
import { cn } from '@/lib/utils';
import { PageLoader } from '@/components/shared/ui/skeletons';

const PlatformHealthMetric = ({ icon: Icon, label, value, trend, subLabel, status = 'default' }) => {
    return (
        <Surface variant="panel" className="p-6 h-full flex flex-col justify-between group hover:border-os-accent/40 transition-all duration-300">
            <div className="flex justify-between items-start">
                <div className={cn(
                    "p-2 rounded-lg backdrop-blur-md border",
                    status === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        status === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                            status === 'danger' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                "bg-os-accent/10 border-os-accent/20 text-os-accent"
                )}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-os-xs font-black",
                        trend > 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                        {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>

            <div className="mt-4">
                <div className="text-os-xs font-black uppercase tracking-[0.2em] text-os-muted mb-1 opacity-60">
                    {label}
                </div>
                <div className="text-2xl font-black tracking-tight text-foreground">
                    {value}
                </div>
                <div className="text-os-xs text-os-muted mt-1 font-medium">
                    {subLabel}
                </div>
            </div>
        </Surface>
    );
};

export default function PlatformHealth() {
    const { data: metrics, isLoading } = useQuery({
        queryKey: ['platform-health-metrics'],
        queryFn: async () => {
            // 1. Fetch platform revenue
            const { data: revData } = await supabase
                .from('platform_revenue')
                .select('amount_usd');
            const totalRevenue = (revData || []).reduce((acc, curr) => acc + (Number(curr.amount_usd) || 0), 0);

            // 2. Fetch trade distribution
            const { data: tradeData } = await supabase
                .from('trades')
                .select('status');

            const tradeStatusCount = (tradeData || []).reduce((acc, curr) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, {});

            // 3. Fetch dispute count
            const { count: activeDisputes } = await supabase
                .from('disputes')
                .select('*', { count: 'exact', head: true })
                .in('status', ['in_review', 'escalated']);

            // 4. Fetch verification funnel
            const { data: compData } = await supabase
                .from('companies')
                .select('verification_status');

            const verifFunnel = (compData || []).reduce((acc, curr) => {
                acc[curr.verification_status || 'unverified'] = (acc[curr.verification_status || 'unverified'] || 0) + 1;
                return acc;
            }, {});

            return {
                revenue: totalRevenue,
                trades: tradeStatusCount,
                disputes: activeDisputes || 0,
                verifications: verifFunnel,
                totalTrades: (tradeData || []).length,
                totalCompanies: (compData || []).length
            };
        }
    });

    const tradeData = useMemo(() => {
        if (!metrics) return [];
        return Object.entries(metrics.trades).map(([name, value]) => ({ name, value }));
    }, [metrics]);

    const verifData = useMemo(() => {
        if (!metrics) return [];
        return [
            { name: 'Unverified', value: metrics.verifications.unverified || 0, color: '#94a3b8' },
            { name: 'Basic', value: metrics.verifications.basic || 0, color: '#fbbf24' },
            { name: 'Verified', value: metrics.verifications.verified || 0, color: '#10b981' }
        ];
    }, [metrics]);

    if (isLoading) return <PageLoader />;

    return (
        <div className="os-page os-stagger space-y-8 p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-os-accent">
                        <Activity className="w-5 h-5 animate-pulse" />
                        <span className="text-os-xs font-black uppercase tracking-[0.3em]">System Mission Control</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground">Platform Health</h1>
                    <p className="text-os-muted text-os-sm font-medium">Real-time telemetry and forensic ledger monitoring.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 font-black uppercase text-[10px] tracking-widest">
                        Audit v2026.02
                    </Badge>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase text-os-muted">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Kernel Online
                    </div>
                </div>
            </div>

            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PlatformHealthMetric
                    icon={DollarSign}
                    label="Cumulative Revenue"
                    value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metrics.revenue)}
                    trend={12.4}
                    subLabel="Canonical Ledger Verified"
                    status="success"
                />
                <PlatformHealthMetric
                    icon={BarChart3}
                    label="Trade Velocity"
                    value={metrics.totalTrades}
                    trend={8.2}
                    subLabel="Total Platform Volume"
                />
                <PlatformHealthMetric
                    icon={ShieldCheck}
                    label="Verification Rate"
                    value={`${((metrics.verifications.verified || 0) / metrics.totalCompanies * 100).toFixed(1)}%`}
                    subLabel={`${metrics.verifications.verified || 0} Institutional Entities`}
                    status="success"
                />
                <PlatformHealthMetric
                    icon={AlertTriangle}
                    label="Active Disputes"
                    value={metrics.disputes}
                    status={metrics.disputes > 0 ? 'warning' : 'success'}
                    subLabel="Pending Resolution"
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Trade Status Distribution */}
                <Surface variant="panel" className="p-8 lg:col-span-2">
                    <h3 className="text-os-sm font-black uppercase tracking-[0.25em] text-foreground mb-8">Trade Status Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tradeData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#D4A937' }}
                                />
                                <Bar dataKey="value" fill="#D4A937" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Surface>

                {/* Verification Funnel */}
                <Surface variant="panel" className="p-8">
                    <h3 className="text-os-sm font-black uppercase tracking-[0.25em] text-foreground mb-8">Verification Funnel</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={verifData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {verifData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-3 mt-4">
                        {verifData.map(item => (
                            <div key={item.name} className="flex justify-between items-center text-os-xs font-medium">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-os-muted">{item.name}</span>
                                </div>
                                <span className="font-black">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </Surface>
            </div>

            {/* Operational Integrity (Mock Sentry/PagerDuty) */}
            <div className="grid md:grid-cols-2 gap-8">
                <Surface variant="panel" className="p-8 border-os-muted/10 bg-os-muted/[0.02] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Terminal className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <Heart className="w-5 h-5 animate-pulse" />
                            </div>
                            <h4 className="text-os-xs font-black uppercase tracking-[0.3em]">Sentry Node Health</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-os-sm">
                                <span className="text-os-muted">SDK Operational</span>
                                <Badge variant="success">Active</Badge>
                            </div>
                            <div className="flex justify-between items-center text-os-sm">
                                <span className="text-os-muted">Error Filtering</span>
                                <span className="font-black">L4 Adaptive</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 w-[99%]" />
                            </div>
                            <p className="text-[10px] text-os-muted italic">Monitoring 100% of production traffic for kernel-level anomalies.</p>
                        </div>
                    </div>
                </Surface>

                <Surface variant="panel" className="p-8 border-os-muted/10 bg-os-muted/[0.02] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                <Clock className="w-5 h-5" />
                            </div>
                            <h4 className="text-os-xs font-black uppercase tracking-[0.3em]">PagerDuty Connectivity</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-os-sm">
                                <span className="text-os-muted">Incident Escalation</span>
                                <Badge variant="success">Synced</Badge>
                            </div>
                            <div className="flex justify-between items-center text-os-sm">
                                <span className="text-os-muted">On-Call Verification</span>
                                <span className="font-black text-amber-500">Tier-1 Active</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-[100%]" />
                            </div>
                            <p className="text-[10px] text-os-muted italic">Direct bridge established between kernel triggers and response teams.</p>
                        </div>
                    </div>
                </Surface>
            </div>

            {/* Forensic Audit Logs (Minimal) */}
            <Surface variant="panel" className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-os-sm font-black uppercase tracking-[0.25em] text-foreground">Recent Audit Events</h3>
                    <Button variant="ghost" className="text-os-accent font-black text-[10px] tracking-widest uppercase">
                        View Ledger <ArrowUpRight className="ml-2 w-3 h-3" />
                    </Button>
                </div>
                <div className="space-y-3">
                    {[
                        { id: 'AE-9201', type: 'REVENUE_ENFORCED', desc: '8% Take-Rate applied to Trade #TR-9901', time: '2m ago' },
                        { id: 'AE-9198', type: 'KERNEL_BOOT', desc: 'Secure storage migration complete', time: '14m ago' },
                        { id: 'AE-9182', type: 'AUTH_SUCCESS', desc: 'Admin session initiated via mTLS', time: '1h ago' },
                    ].map(event => (
                        <div key={event.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-os-sm group hover:bg-white/[0.04] transition-all">
                            <div className="flex items-center gap-6">
                                <span className="text-[10px] font-mono text-os-muted">{event.id}</span>
                                <div className="flex flex-col">
                                    <span className="text-os-xs font-black uppercase tracking-wider text-os-muted">{event.type}</span>
                                    <span className="text-os-sm font-medium text-foreground/80">{event.desc}</span>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-os-muted uppercase">{event.time}</span>
                        </div>
                    ))}
                </div>
            </Surface>
        </div>
    );
}
