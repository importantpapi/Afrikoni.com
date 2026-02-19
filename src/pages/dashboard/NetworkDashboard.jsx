import React, { useEffect, useState } from 'react';
import { Surface } from '@/components/system/Surface';
import { Globe, Network, TrendingUp, Activity, Package, Users } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

export default function NetworkDashboard() {
    const [stats, setStats] = useState({
        activeTrades: null,
        totalVolume: null,
        activeUsers: null,
        completedTrades: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const [tradesRes, usersRes, completedRes] = await Promise.all([
                    supabase.from('trades').select('id, total_amount', { count: 'exact' }).in('status', ['rfq_open', 'quoted', 'contracted', 'escrow_funded', 'in_transit']),
                    supabase.from('profiles').select('id', { count: 'exact' }),
                    supabase.from('trades').select('id, total_amount').eq('status', 'closed'),
                ]);

                const activeTrades = tradesRes.count || 0;
                const activeUsers = usersRes.count || 0;
                const completedTrades = completedRes.count || 0;
                const totalVolume = (completedRes.data || []).reduce((sum, t) => sum + (t.total_amount || 0), 0);

                setStats({ activeTrades, totalVolume, activeUsers, completedTrades });
            } catch (err) {
                console.error('[NetworkDashboard] Failed to load stats:', err);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    const statCards = [
        { label: 'Active Trades', value: loading ? '...' : stats.activeTrades?.toLocaleString() ?? '0', icon: Activity, color: 'text-os-accent' },
        { label: 'Total Members', value: loading ? '...' : stats.activeUsers?.toLocaleString() ?? '0', icon: Users, color: 'text-emerald-500' },
        { label: 'Completed Trades', value: loading ? '...' : stats.completedTrades?.toLocaleString() ?? '0', icon: Package, color: 'text-blue-400' },
        { label: 'Total Volume', value: loading ? '...' : `$${(stats.totalVolume || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-500' },
    ];

    return (
        <div className="os-page os-stagger space-y-6">
            <Surface variant="panel" className="p-8">
                <div className="flex items-center gap-3 mb-2">
                    <Network className="w-6 h-6 text-os-accent" />
                    <h1 className="text-os-2xl font-bold">Network Overview</h1>
                </div>
                <p className="text-os-muted">Live stats from the Afrikoni trade network.</p>
            </Surface>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <Surface key={i} variant="panel" className="p-6">
                        <stat.icon className={`w-8 h-8 ${stat.color} mb-4`} />
                        <div className="text-os-2xl font-bold mb-1 font-mono">{stat.value}</div>
                        <div className="text-os-xs uppercase tracking-widest text-os-muted font-bold">{stat.label}</div>
                    </Surface>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <Surface variant="panel" className="lg:col-span-2 min-h-[400px] flex items-center justify-center relative overflow-hidden">
                    <Globe className="w-64 h-64 text-os-accent opacity-5" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                        <h3 className="text-os-xl font-bold mb-4">Pan-African Trade Network</h3>
                        <div className="w-full max-w-md h-48 bg-white/5 rounded-os-md border border-white/10 flex items-center justify-center">
                            <span className="text-os-muted font-mono italic">Map visualization coming soon</span>
                        </div>
                    </div>
                </Surface>

                <Surface variant="panel" className="p-6">
                    <h3 className="text-os-sm font-bold uppercase tracking-wider mb-6">Regional Activity</h3>
                    <div className="space-y-6">
                        {[
                            { region: 'West Africa', hub: 'Lagos' },
                            { region: 'East Africa', hub: 'Nairobi' },
                            { region: 'Southern Africa', hub: 'Johannesburg' },
                            { region: 'North Africa', hub: 'Cairo' },
                            { region: 'Central Africa', hub: 'Kinshasa' },
                        ].map((node, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-os-xs font-bold mb-2">
                                    <span>{node.region}</span>
                                    <span className="text-os-muted">{node.hub}</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-os-accent/40" style={{ width: `${60 + i * 8}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Surface>
            </div>
        </div>
    );
}
