import React, { useState } from 'react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import TradeMap from '@/components/geo/TradeMap';
import { Surface } from "@/components/system/Surface";
import { Button } from "@/components/shared/ui/button";
import { StatusBadge } from "@/components/system/StatusBadge";
import { ArrowRight, Plane, Ship, TrendingUp, AlertTriangle, X } from 'lucide-react';
import SystemAdvice from '@/components/intelligence/SystemAdvice';
import EnhancedCorridorIntelligence from '@/components/dashboard/EnhancedCorridorIntelligence';

const CORRIDOR_DATA = [
    { id: 'CI-FR-COCOA', origin: 'Abidjan', dest: 'Paris', volume: '$2.4M', active: 12, risk: 'low', type: 'sea', friction: 'Low', product: 'Cocoa' },
    { id: 'c2', origin: 'Nairobi', dest: 'Dubai', volume: '$1.8M', active: 8, risk: 'low', type: 'air', friction: 'Medium' },
    { id: 'c3', origin: 'Accra', dest: 'New York', volume: '$950K', active: 5, risk: 'medium', type: 'sea', friction: 'High' },
    { id: 'c4', origin: 'Joburg', dest: 'London', volume: '$450K', active: 3, risk: 'low', type: 'air', friction: 'Low' },
];

export default function CorridorsPage() {
    const { isSystemReady } = useDashboardKernel();
    const [selectedCorridor, setSelectedCorridor] = useState(null);

    if (!isSystemReady) {
        return <div className="os-page flex items-center justify-center min-h-[400px]">Loading...</div>;
    }

    return (
        <div className="os-page os-stagger space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="os-label">Global Infrastructure</div>
                    <h1 className="os-title mt-2">Trade Corridors</h1>
                    <p className="text-os-sm text-os-muted">
                        Monitor active trade flows, congestion, and efficiency across key routes.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">Download Report</Button>
                    <Button className="shadow-gold">Add New Route</Button>
                </div>
            </div>

            {/* Main Map Visualization */}
            <Surface variant="glass" className="p-1 overflow-hidden">
                <TradeMap className="w-full" />
            </Surface>

            {/* Intelligence Insight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SystemAdvice
                    advice={{
                        message: "High congestion reported at Apapa Port (Lagos). Recommend routing urgent shipments via Air Cargo or Cotonou.",
                        action: "view_alternatives",
                        actionLabel: "View Routing Options"
                    }}
                    type="risk"
                />
                <SystemAdvice
                    advice={{
                        message: "New AfCFTA protocol activated for Nairobi-Cairo corridor. Tariffs reduced by 12%.",
                        action: "apply_benefits",
                        actionLabel: "Apply Tariff Benefit"
                    }}
                    type="opportunity"
                />
            </div>

            {/* Corridor Intelligence Panel (when selected) */}
            {selectedCorridor && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-[#0E1016] rounded-os-md border border-white/10 shadow-2xl">
                        <div className="sticky top-0 bg-[#0E1016] border-b border-white/10 p-4 flex items-center justify-between z-10">
                            <h2 className="text-os-xl font-bold text-white">Corridor Intelligence</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCorridor(null)}
                                className="hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-6">
                            <EnhancedCorridorIntelligence corridorId={selectedCorridor.id} />
                        </div>
                    </div>
                </div>
            )}

            {/* Corridor List */}
            <div className="space-y-4">
                <h3 className="text-os-sm font-medium text-os-muted uppercase tracking-wider">Active Routes</h3>

                <div className="grid grid-cols-1 gap-3">
                    {CORRIDOR_DATA.map((corridor) => (
                        <Surface
                            key={corridor.id}
                            variant="panel"
                            className="p-4 hover:bg-os-surface-2 transition-all cursor-pointer group flex items-center justify-between"
                            onClick={() => setSelectedCorridor(corridor)}
                        >
                            <div className="flex items-center gap-6">
                                {/* Route Icon */}
                                <div className="w-10 h-10 rounded-full bg-os-surface-1 flex items-center justify-center text-os-muted group-hover:text-koni-gold transition-colors">
                                    {corridor.type === 'air' ? <Plane className="w-5 h-5" /> : <Ship className="w-5 h-5" />}
                                </div>

                                {/* Route Info */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-os-base font-bold text-white">{corridor.origin}</span>
                                        <ArrowRight className="w-4 h-4 text-os-muted" />
                                        <span className="text-os-base font-bold text-white">{corridor.dest}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-os-xs text-os-muted">
                                        <span>{corridor.type === 'air' ? 'Air Freight' : 'Sea Freight'}</span>
                                        <span>•</span>
                                        <span className={corridor.friction === 'High' ? 'text-red-400' : 'text-emerald-400'}>
                                            Friction: {corridor.friction}
                                        </span>
                                        {corridor.id === 'CI-FR-COCOA' && (
                                            <>
                                                <span>•</span>
                                                <span className="text-os-accent">🎯 Featured</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="text-right flex items-center gap-8">
                                <div>
                                    <div className="text-os-sm font-bold text-white tabular-nums">{corridor.volume}</div>
                                    <div className="text-os-xs text-os-muted uppercase">Vol (30d)</div>
                                </div>
                                <div>
                                    <div className="text-os-sm font-bold text-white tabular-nums">{corridor.active}</div>
                                    <div className="text-os-xs text-os-muted uppercase">Conversions</div>
                                </div>
                                <StatusBadge
                                    label={corridor.risk === 'low' ? 'Optimal' : 'Caution'}
                                    tone={corridor.risk === 'low' ? 'success' : 'warning'}
                                />
                            </div>
                        </Surface>
                    ))}
                </div>
            </div>
        </div>
    );
}
