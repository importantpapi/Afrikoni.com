/**
 * ============================================================================
 * CORRIDOR INTELLIGENCE - Market-Specific Insights
 * ============================================================================
 * 
 * Provides deep insights for specific trade corridors:
 * - Pricing benchmarks
 * - Transit times
 * - Risk indicators
 * - Compliance requirements
 * - Active traders
 * 
 * Initial Focus: Cocoa (Côte d'Ivoire → France)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import {
    TrendingUp, TrendingDown, Clock, DollarSign, Shield,
    AlertTriangle, Users, Package, ArrowRight, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Corridor definitions
const CORRIDORS = {
    'CI-FR-COCOA': {
        id: 'CI-FR-COCOA',
        name: 'Cocoa: Côte d\'Ivoire → France',
        origin: 'Côte d\'Ivoire',
        destination: 'France',
        product: 'Cocoa',
        avgPrice: 2800, // USD per MT
        avgTransitDays: 18,
        riskLevel: 'low',
        activeTraders: 47,
        monthlyVolume: 12500, // MT
        compliance: ['AfCFTA', 'EU Organic', 'Fair Trade'],
    },
    // Add more corridors as needed
};

export default function CorridorIntelligence({ corridorId = 'CI-FR-COCOA' }) {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [corridor, setCorridor] = useState(CORRIDORS[corridorId]);
    const [userActivity, setUserActivity] = useState({
        trades: 0,
        avgPrice: 0,
        lastTrade: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && profile?.company_id) {
            loadUserActivity();
        }
    }, [user, profile?.company_id, corridorId]);

    const loadUserActivity = async () => {
        setLoading(true);
        try {
            // Fetch user's trades in this corridor
            const { data: trades, error } = await supabase
                .from('trades')
                .select('*')
                .or(`buyer_id.eq.${profile.company_id},seller_id.eq.${profile.company_id}`)
                .eq('product_category', corridor.product)
                .order('created_at', { ascending: false });

            if (!error && trades) {
                const currentTrades = trades || [];
                const relevantTrades = currentTrades.filter(t =>
                    (t.origin_country === corridor.origin && t.destination_country === corridor.destination) ||
                    (t.origin_country === corridor.destination && t.destination_country === corridor.origin)
                );

                const avgPrice = relevantTrades.length > 0
                    ? relevantTrades.reduce((sum, t) => sum + (t.price_per_unit || 0), 0) / relevantTrades.length
                    : 0;

                setUserActivity({
                    trades: relevantTrades.length,
                    avgPrice: Math.round(avgPrice),
                    lastTrade: relevantTrades[0]?.created_at || null,
                });
            }
        } catch (err) {
            console.error('Failed to load user activity:', err);
        } finally {
            setLoading(false);
        }
    };

    const priceDiff = userActivity.avgPrice - corridor.avgPrice;
    const priceDiffPercent = corridor.avgPrice > 0 ? (priceDiff / corridor.avgPrice) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Corridor Header */}
            <Surface variant="panel" className="p-6 border border-white/10">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-os-xs text-white/50 uppercase tracking-wider mb-2">Corridor Intelligence</div>
                        <h2 className="text-os-2xl font-bold text-white mb-2">{corridor.name}</h2>
                        <div className="flex items-center gap-4 text-os-sm text-white/70">
                            <span>{corridor.origin} → {corridor.destination}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Shield className={cn(
                                    "w-3 h-3",
                                    corridor.riskLevel === 'low' ? 'text-emerald-400' :
                                        corridor.riskLevel === 'medium' ? 'text-amber-400' : 'text-red-400'
                                )} />
                                {corridor.riskLevel.toUpperCase()} RISK
                            </span>
                        </div>
                    </div>
                    <Button
                        onClick={() => navigate('/dashboard/quick-trade')}
                        className="bg-os-accent hover:bg-os-accent-dark text-black"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Trade
                    </Button>
                </div>
            </Surface>

            {/* Market Benchmarks */}
            <div className="grid md:grid-cols-4 gap-4">
                <Surface variant="panel" className="p-5 border border-white/10">
                    <div className="flex items-center gap-2 text-os-sm text-white/60 mb-2">
                        <DollarSign className="w-4 h-4" />
                        Market Price
                    </div>
                    <div className="text-os-2xl font-bold text-white">${corridor.avgPrice}/MT</div>
                    {userActivity.trades > 0 && (
                        <div className={cn(
                            "text-os-xs mt-2 flex items-center gap-1",
                            priceDiff > 0 ? "text-emerald-400" : priceDiff < 0 ? "text-red-400" : "text-white/60"
                        )}>
                            {priceDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            Your avg: ${userActivity.avgPrice}/MT ({priceDiffPercent > 0 ? '+' : ''}{priceDiffPercent.toFixed(1)}%)
                        </div>
                    )}
                </Surface>

                <Surface variant="panel" className="p-5 border border-white/10">
                    <div className="flex items-center gap-2 text-os-sm text-white/60 mb-2">
                        <Clock className="w-4 h-4" />
                        Transit Time
                    </div>
                    <div className="text-os-2xl font-bold text-white">{corridor.avgTransitDays} days</div>
                    <div className="text-os-xs text-white/60 mt-2">Sea freight average</div>
                </Surface>

                <Surface variant="panel" className="p-5 border border-white/10">
                    <div className="flex items-center gap-2 text-os-sm text-white/60 mb-2">
                        <Users className="w-4 h-4" />
                        Active Traders
                    </div>
                    <div className="text-os-2xl font-bold text-white">{corridor.activeTraders}</div>
                    <div className="text-os-xs text-white/60 mt-2">Verified suppliers</div>
                </Surface>

                <Surface variant="panel" className="p-5 border border-white/10">
                    <div className="flex items-center gap-2 text-os-sm text-white/60 mb-2">
                        <Package className="w-4 h-4" />
                        Monthly Volume
                    </div>
                    <div className="text-os-2xl font-bold text-white">{(corridor.monthlyVolume / 1000).toFixed(1)}K MT</div>
                    <div className="text-os-xs text-white/60 mt-2">Network total</div>
                </Surface>
            </div>

            {/* Your Activity */}
            {userActivity.trades > 0 && (
                <Surface variant="panel" className="p-6 border border-white/10">
                    <h3 className="text-os-lg font-semibold text-white mb-4">Your Activity in This Corridor</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-os-sm text-white/60 mb-1">Total Trades</div>
                            <div className="text-os-2xl font-bold text-white">{userActivity.trades}</div>
                        </div>
                        <div>
                            <div className="text-os-sm text-white/60 mb-1">Your Avg Price</div>
                            <div className="text-os-2xl font-bold text-white">${userActivity.avgPrice}/MT</div>
                        </div>
                        <div>
                            <div className="text-os-sm text-white/60 mb-1">Last Trade</div>
                            <div className="text-os-lg font-medium text-white">
                                {userActivity.lastTrade ? new Date(userActivity.lastTrade).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                    </div>
                </Surface>
            )}

            {/* Compliance Requirements */}
            <Surface variant="panel" className="p-6 border border-white/10">
                <h3 className="text-os-lg font-semibold text-white mb-4">Compliance Requirements</h3>
                <div className="flex flex-wrap gap-2">
                    {(corridor.compliance || []).map((req) => (
                        <div
                            key={req}
                            className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-os-sm text-emerald-400"
                        >
                            <Shield className="w-3 h-3 inline mr-1" />
                            {req}
                        </div>
                    ))}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/dashboard/compliance')}
                    className="mt-4"
                >
                    View Compliance Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </Surface>

            {/* Actionable Insights */}
            <Surface variant="panel" className="p-6 border border-os-accent/20 bg-os-accent/5">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-os-accent mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-os-lg font-semibold text-white mb-2">AI Recommendation</h3>
                        {userActivity.trades === 0 ? (
                            <p className="text-os-sm text-white/70 mb-4">
                                This corridor has <strong>low risk</strong> and <strong>high liquidity</strong>.
                                Perfect for your first trade. Start with a small order to build trust.
                            </p>
                        ) : priceDiff < 0 ? (
                            <p className="text-os-sm text-white/70 mb-4">
                                You're paying <strong>{Math.abs(priceDiffPercent).toFixed(1)}% above market average</strong>.
                                Consider negotiating better rates or exploring alternative suppliers.
                            </p>
                        ) : (
                            <p className="text-os-sm text-white/70 mb-4">
                                Great pricing! You're <strong>{priceDiffPercent.toFixed(1)}% below market average</strong>.
                                Consider increasing volume to maximize savings.
                            </p>
                        )}
                        <Button
                            onClick={() => navigate('/dashboard/quick-trade')}
                            className="bg-os-accent hover:bg-os-accent-dark text-black"
                        >
                            Create Trade in This Corridor
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </Surface>
        </div>
    );
}
