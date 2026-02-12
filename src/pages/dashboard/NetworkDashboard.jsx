import React from 'react';
import { Surface } from '@/components/system/Surface';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { Globe, Zap, Network, Server, Database, TrendingUp, Activity } from 'lucide-react';

export default function NetworkDashboard() {
    const stats = [
        { label: 'Active Nodes', value: '1,248', icon: Server, color: 'text-blue-500' },
        { label: 'Latency (ms)', value: '42', icon: Activity, color: 'text-emerald-500' },
        { label: 'Security Level', value: 'v2.4 Kernel', icon: Zap, color: 'text-afrikoni-gold' },
        { label: 'Daily Volume', value: '$2.4M', icon: TrendingUp, color: 'text-purple-500' },
    ];

    return (
        <div className="os-page os-stagger space-y-6">
            <Surface variant="glass" className="p-8">
                <div className="flex items-center gap-3 mb-2">
                    <Network className="w-6 h-6 text-afrikoni-gold" />
                    <h1 className="text-2xl font-bold">Network Infrastructure</h1>
                </div>
                <p className="text-os-muted">Real-time status of the Afrikoni Trade Grid.</p>
            </Surface>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Surface key={i} variant="panel" className="p-6">
                        <stat.icon className={`w-8 h-8 ${stat.color} mb-4`} />
                        <div className="text-2xl font-bold mb-1 font-mono">{stat.value}</div>
                        <div className="text-xs uppercase tracking-widest text-os-muted font-bold">{stat.label}</div>
                    </Surface>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <Surface variant="glass" className="lg:col-span-2 min-h-[400px] flex items-center justify-center relative overflow-hidden">
                    <Globe className="w-64 h-64 text-afrikoni-gold opacity-5 animate-pulse" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                        <h3 className="text-xl font-bold mb-4">Pan-African Distribution</h3>
                        <div className="w-full max-w-md h-48 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                            <span className="text-os-muted font-mono italic">Rendering Trade Grid Visualization...</span>
                        </div>
                    </div>
                </Surface>

                <Surface variant="panel" className="p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-6">Regional Node Health</h3>
                    <div className="space-y-6">
                        {[
                            { region: 'West Africa (Lagos)', health: 98 },
                            { region: 'East Africa (Nairobi)', health: 99 },
                            { region: 'Southern Africa (Johannesburg)', health: 100 },
                            { region: 'North Africa (Cairo)', health: 97 },
                            { region: 'Central Africa (Kinshasa)', health: 94 },
                        ].map((node, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span>{node.region}</span>
                                    <span className={node.health >= 98 ? 'text-emerald-500' : 'text-amber-500'}>{node.health}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className={`h-full ${node.health >= 98 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                        style={{ width: `${node.health}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Surface>
            </div>

            <Surface variant="panel" className="p-8 bg-gradient-to-r from-blue-500/5 to-transparent">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <Database className="w-12 h-12 text-blue-500 shrink-0" />
                    <div>
                        <h3 className="font-bold text-lg">Resilient Data Persistence</h3>
                        <p className="text-sm text-os-muted">Every transaction is validated across 14 sovereign nodes to ensure immutable trade documentation.</p>
                    </div>
                </div>
            </Surface>
        </div>
    );
}
