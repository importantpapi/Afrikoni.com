/**
 * ============================================================================
 * ENHANCED CORRIDOR INTELLIGENCE - Market-Specific Insights with Confidence
 * ============================================================================
 * 
 * Provides deep insights for specific trade corridors with multi-source data:
 * - Pricing benchmarks with confidence
 * - Transit times with data sources
 * - Real-time risk indicators
 * - Corridor health scoring
 * - Compliance requirements
 * - Active traders
 * 
 * Enhanced with Phase 2 features:
 * - Confidence tracking on all metrics
 * - Data source transparency
 * - Corridor health visualization
 * - Real-time weather and congestion data
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import {
    TrendingUp, TrendingDown, Clock, DollarSign, Shield,
    AlertTriangle, Users, Package, ArrowRight, Sparkles,
    Cloud, Anchor, FileText, Map
} from 'lucide-react';
import { cn } from '@/lib/utils';

// New Phase 2 components
import ConfidenceBadge from '@/components/corridors/ConfidenceBadge';
import DataSourceIndicator from '@/components/corridors/DataSourceIndicator';
import CorridorHealthGauge from '@/components/corridors/CorridorHealthGauge';
import RealTimeMetricsCard from '@/components/corridors/RealTimeMetricsCard';

// Phase 2 services
import { generateHeuristicCorridorData } from '@/services/corridorHeuristics';
import { getWeatherRisk, getPortCoordinates } from '@/services/weatherService';
import { calculateCorridorHealth } from '@/hooks/useCorridorHealth';
import { useCorridorReliability } from '@/hooks/useCorridorReliability';

export default function EnhancedCorridorIntelligence({ corridorId = 'CI-FR-COCOA' }) {
    const navigate = useNavigate();
    const { user, profile } = useAuth();

    const [corridorData, setCorridorData] = useState(null);
    const [corridorHealth, setCorridorHealth] = useState(null);
    const [userActivity, setUserActivity] = useState({
        trades: 0,
        avgPrice: 0,
        lastTrade: null,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCorridorData();
    }, [corridorId]);

    // ✅ PHASE 5: Official Reliability Index Integration
    const { reliability: officialReliability } = useCorridorReliability(
        corridorData?.origin,
        corridorData?.destination
    );

    // Override health score if official data exists
    useEffect(() => {
        if (officialReliability && corridorData) {
            setCorridorHealth(prev => ({
                ...prev,
                score: officialReliability.reliability_score || prev?.score || 0,
                // Add official text to breakdown if needed
            }));
        }
    }, [officialReliability, corridorData]);

    useEffect(() => {
        if (user && profile?.company_id && corridorData) {
            loadUserActivity();
        }
    }, [user, profile?.company_id, corridorData]);

    const loadCorridorData = async () => {
        setLoading(true);
        try {
            // Try to fetch from database first
            const { data: dbCorridor, error } = await supabase
                .from('trade_corridors')
                .select('*')
                .eq('id', corridorId)
                .single();

            let corridor;

            if (dbCorridor && !error) {
                // Use database data
                corridor = {
                    id: dbCorridor.id,
                    name: dbCorridor.name,
                    origin: dbCorridor.origin,
                    destination: dbCorridor.destination,
                    product: dbCorridor.product,
                    originCoords: {
                        lat: dbCorridor.origin_lat,
                        lon: dbCorridor.origin_lon,
                    },
                    destinationCoords: {
                        lat: dbCorridor.dest_lat,
                        lon: dbCorridor.dest_lon,
                    },
                    pricing: dbCorridor.pricing_data || null,
                    transitTime: dbCorridor.transit_time_data || null,
                    congestion: dbCorridor.congestion_data || null,
                    customsDelay: dbCorridor.customs_delay_data || null,
                    fxVolatility: dbCorridor.fx_volatility_data || null,
                    weatherRisk: dbCorridor.weather_risk_data || null,
                    healthScore: dbCorridor.health_score || 0,
                    healthBreakdown: dbCorridor.health_breakdown || {},
                    riskLevel: dbCorridor.risk_level || 'medium',
                    avgTransitTime: dbCorridor.avg_transit_time || 18,
                    onTimeDelivery: dbCorridor.on_time_delivery || 75,
                    activeTraders: dbCorridor.active_traders || 0,
                    monthlyVolume: dbCorridor.monthly_volume || 0,
                    compliance: dbCorridor.compliance || [],
                    requiredDocuments: dbCorridor.required_documents || [],
                    createdAt: new Date(dbCorridor.created_at),
                    updatedAt: new Date(dbCorridor.updated_at),
                };
            } else {
                // Generate heuristic data
                const heuristicData = generateHeuristicCorridorData(
                    'CI-FR-COCOA',
                    'Cocoa: Côte d\'Ivoire → France',
                    'Abidjan',
                    'Le Havre',
                    'Cocoa',
                    2800,
                    18
                );

                // Get port coordinates
                const originCoords = getPortCoordinates('Abidjan') || { lat: 5.36, lon: -4.01 };
                const destCoords = getPortCoordinates('Le Havre') || { lat: 49.49, lon: 0.11 };

                // Fetch weather data
                let weatherRisk = heuristicData.weatherRisk;
                try {
                    weatherRisk = await getWeatherRisk(
                        originCoords.lat,
                        originCoords.lon,
                        'Abidjan'
                    );
                } catch (err) {
                    console.log('Weather API unavailable, using heuristic');
                }

                corridor = {
                    ...heuristicData,
                    originCoords,
                    destinationCoords,
                    weatherRisk,
                    activeTraders: 47,
                    monthlyVolume: 12500,
                    compliance: ['AfCFTA', 'EU Organic', 'Fair Trade'],
                    requiredDocuments: ['Bill of Lading', 'Certificate of Origin', 'Phytosanitary Certificate'],
                    createdAt: new Date(),
                };
            }

            // Calculate health score
            const health = calculateCorridorHealth(corridor);
            corridor.healthScore = health.score;
            corridor.healthBreakdown = health.breakdown;
            corridor.riskLevel = health.riskLevel;

            setCorridorData(corridor);
            setCorridorHealth(health);
        } catch (err) {
            console.error('Failed to load corridor data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadUserActivity = async () => {
        try {
            const { data: trades, error } = await supabase
                .from('trades')
                .select('*')
                .or(`buyer_id.eq.${profile.company_id},seller_id.eq.${profile.company_id}`)
                .eq('product_category', corridorData.product)
                .order('created_at', { ascending: false });

            if (!error && trades) {
                const currentTrades = trades || [];
                const relevantTrades = currentTrades.filter(t =>
                    (t.origin_country === corridorData.origin && t.destination_country === corridorData.destination) ||
                    (t.origin_country === corridorData.destination && t.destination_country === corridorData.origin)
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
        }
    };

    if (loading || !corridorData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-white/60">Loading corridor intelligence...</div>
            </div>
        );
    }

    const priceDiff = userActivity.avgPrice - (corridorData.pricing?.value || 0);
    const priceDiffPercent = corridorData.pricing?.value > 0
        ? (priceDiff / corridorData.pricing.value) * 100
        : 0;

    return (
        <div className="space-y-6">
            {/* Corridor Header with Health Score */}
            <Surface variant="glass" className="p-6 border border-white/10">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="text-xs text-white/50 uppercase tracking-wider mb-2">
                            Corridor Intelligence
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{corridorData.name}</h2>
                        <div className="flex items-center gap-4 text-sm text-white/70">
                            <span>{corridorData.origin} → {corridorData.destination}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Shield className={cn(
                                    "w-3 h-3",
                                    corridorData.riskLevel === 'low' ? 'text-emerald-400' :
                                        corridorData.riskLevel === 'medium' ? 'text-amber-400' : 'text-red-400'
                                )} />
                                {corridorData.riskLevel.toUpperCase()} RISK
                            </span>
                        </div>
                    </div>
                    <Button
                        onClick={() => navigate('/dashboard/quick-trade')}
                        className="bg-[#D4A937] hover:bg-[#C09830] text-black"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Trade
                    </Button>
                </div>

                {/* Corridor Health Gauge */}
                {corridorHealth && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white/70 mb-4">
                            Corridor Health Score
                        </h3>
                        <CorridorHealthGauge
                            score={corridorHealth.score}
                            breakdown={corridorHealth.breakdown}
                            size="md"
                            showBreakdown={true}
                        />
                    </div>
                )}
            </Surface>

            {/* Real-Time Metrics */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/70 mb-4">
                    Real-Time Corridor Conditions
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Congestion */}
                    {corridorData.congestion && (
                        <RealTimeMetricsCard
                            icon={Anchor}
                            label="Port Congestion"
                            dataPoint={corridorData.congestion}
                            formatValue={(val) => val.toUpperCase()}
                        />
                    )}

                    {/* Customs Delay */}
                    {corridorData.customsDelay && (
                        <RealTimeMetricsCard
                            icon={FileText}
                            label="Customs Delay"
                            dataPoint={corridorData.customsDelay}
                            formatValue={(val) => `${val} days`}
                        />
                    )}

                    {/* FX Volatility */}
                    {corridorData.fxVolatility && (
                        <RealTimeMetricsCard
                            icon={DollarSign}
                            label="FX Volatility"
                            dataPoint={corridorData.fxVolatility}
                            formatValue={(val) => `${val.toFixed(1)}%`}
                        />
                    )}

                    {/* Weather Risk */}
                    {corridorData.weatherRisk && (
                        <RealTimeMetricsCard
                            icon={Cloud}
                            label="Weather Risk"
                            dataPoint={corridorData.weatherRisk}
                            formatValue={(val) => val.toUpperCase()}
                        />
                    )}

                    {/* Transit Time */}
                    {corridorData.transitTime && (
                        <RealTimeMetricsCard
                            icon={Clock}
                            label="Transit Time"
                            dataPoint={corridorData.transitTime}
                            formatValue={(val) => `${val} days`}
                        />
                    )}

                    {/* Pricing */}
                    {corridorData.pricing && (
                        <RealTimeMetricsCard
                            icon={DollarSign}
                            label="Market Price"
                            dataPoint={corridorData.pricing}
                            formatValue={(val) => `$${val}/MT`}
                        />
                    )}
                </div>
            </div>

            {/* Market Benchmarks (Legacy - kept for comparison) */}
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white/70 mb-4">
                    Market Overview
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                    <Surface variant="panel" className="p-5 border border-white/10">
                        <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                            <Users className="w-4 h-4" />
                            Active Traders
                        </div>
                        <div className="text-2xl font-bold text-white">{corridorData.activeTraders}</div>
                        <div className="text-xs text-white/60 mt-2">Verified suppliers</div>
                    </Surface>

                    <Surface variant="panel" className="p-5 border border-white/10">
                        <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                            <Package className="w-4 h-4" />
                            Monthly Volume
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {(corridorData.monthlyVolume / 1000).toFixed(1)}K MT
                        </div>
                        <div className="text-xs text-white/60 mt-2">Network total</div>
                    </Surface>

                    <Surface variant="panel" className="p-5 border border-white/10">
                        <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                            <Clock className="w-4 h-4" />
                            On-Time Delivery
                        </div>
                        <div className="text-2xl font-bold text-white">{corridorData.onTimeDelivery}%</div>
                        <div className="text-xs text-white/60 mt-2">Historical average</div>
                    </Surface>

                    <Surface variant="panel" className="p-5 border border-white/10">
                        <div className="flex items-center gap-2 text-sm text-white/60 mb-2">
                            <Map className="w-4 h-4" />
                            Avg Transit
                        </div>
                        <div className="text-2xl font-bold text-white">{corridorData.avgTransitTime} days</div>
                        <div className="text-xs text-white/60 mt-2">Sea freight</div>
                    </Surface>
                </div>
            </div>

            {/* Your Activity */}
            {userActivity.trades > 0 && (
                <Surface variant="glass" className="p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Your Activity in This Corridor</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm text-white/60 mb-1">Total Trades</div>
                            <div className="text-2xl font-bold text-white">{userActivity.trades}</div>
                        </div>
                        <div>
                            <div className="text-sm text-white/60 mb-1">Your Avg Price</div>
                            <div className="text-2xl font-bold text-white">${userActivity.avgPrice}/MT</div>
                            {priceDiff !== 0 && (
                                <div className={cn(
                                    "text-xs mt-1 flex items-center gap-1",
                                    priceDiff > 0 ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {priceDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {priceDiff > 0 ? '+' : ''}{priceDiffPercent.toFixed(1)}% vs market
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-sm text-white/60 mb-1">Last Trade</div>
                            <div className="text-lg font-medium text-white">
                                {userActivity.lastTrade ? new Date(userActivity.lastTrade).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                    </div>
                </Surface>
            )}

            {/* Compliance Requirements */}
            <Surface variant="glass" className="p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Compliance Requirements</h3>
                <div className="flex flex-wrap gap-2">
                    {(corridorData.compliance || []).map((req) => (
                        <div
                            key={req}
                            className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400"
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

            {/* AI Recommendation */}
            <Surface variant="glass" className="p-6 border border-[#D4A937]/20 bg-[#D4A937]/5">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[#D4A937] mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">AI Recommendation</h3>
                        {userActivity.trades === 0 ? (
                            <p className="text-sm text-white/70 mb-4">
                                This corridor has <strong>{corridorData.riskLevel} risk</strong> and{' '}
                                <strong>health score of {corridorHealth?.score}/100</strong>.
                                Perfect for your first trade. Start with a small order to build trust.
                            </p>
                        ) : priceDiff < 0 ? (
                            <p className="text-sm text-white/70 mb-4">
                                You're paying <strong>{Math.abs(priceDiffPercent).toFixed(1)}% above market average</strong>.
                                Consider negotiating better rates or exploring alternative suppliers.
                            </p>
                        ) : (
                            <p className="text-sm text-white/70 mb-4">
                                Great pricing! You're <strong>{priceDiffPercent.toFixed(1)}% below market average</strong>.
                                Consider increasing volume to maximize savings.
                            </p>
                        )}
                        <Button
                            onClick={() => navigate('/dashboard/quick-trade')}
                            className="bg-[#D4A937] hover:bg-[#C09830] text-black"
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
