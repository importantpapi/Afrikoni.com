/**
 * Trust Health Dashboard
 * Unified view of trust infrastructure across the platform
 * Aggregates: Trust Scores, Corridor Reliability, Payment Risk, Fraud Detection
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield, TrendingUp, AlertTriangle, CheckCircle,
    Map, DollarSign, Users, Activity, ArrowRight,
    RefreshCw, Eye, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Progress } from '@/components/shared/ui/progress';
import { Surface } from '@/components/system/Surface';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { TrustEngineService } from '@/services/TrustEngineService';
import { FraudDetectionService } from '@/services/FraudDetectionService';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function TrustHealthDashboard() {
    const { profileCompanyId, userId, canLoadData, isSystemReady, isAdmin } = useDashboardKernel();

    const [loading, setLoading] = useState(true);
    const [healthMetrics, setHealthMetrics] = useState({
        platformTrustScore: 0,
        verifiedCompanies: 0,
        totalCompanies: 0,
        avgCorridorHealth: 0,
        activeCorridors: 0,
        fraudAlertsToday: 0,
        paymentRiskLevel: 'low'
    });

    const [topTrustedCompanies, setTopTrustedCompanies] = useState([]);
    const [riskAlerts, setRiskAlerts] = useState([]);
    const [corridorHealth, setCorridorHealth] = useState([]);

    useEffect(() => {
        if (!canLoadData) return;
        loadTrustHealthData();
    }, [canLoadData]);

    const loadTrustHealthData = async () => {
        try {
            setLoading(true);

            // 1. Load Trust Scores
            const { data: trustScores } = await supabase
                .from('trust_scores')
                .select('*, companies:company_id(company_name, verified)')
                .order('total_score', { ascending: false })
                .limit(10);

            // 2. Load Company Stats
            const { count: totalCompanies } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true });

            const { count: verifiedCompanies } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true })
                .eq('verified', true);

            // 3. Load Corridor Reliability
            const { data: corridors } = await supabase
                .from('corridor_reliability')
                .select('*')
                .order('reliability_score', { ascending: false })
                .limit(5);

            // 4. Load Recent Fraud Alerts (last 24h)
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: fraudAlerts } = await supabase
                .from('audit_log')
                .select('*')
                .gte('created_at', twentyFourHoursAgo)
                .eq('metadata->>ai_flagged', 'true')
                .order('created_at', { ascending: false });

            // 5. Calculate Platform Trust Score (average of all companies)
            const avgTrustScore = trustScores?.length > 0
                ? Math.round(trustScores.reduce((sum, t) => sum + t.total_score, 0) / trustScores.length)
                : 0;

            // 6. Calculate Average Corridor Health
            const avgCorridorHealth = corridors?.length > 0
                ? Math.round(corridors.reduce((sum, c) => sum + c.reliability_score, 0) / corridors.length)
                : 0;

            setHealthMetrics({
                platformTrustScore: avgTrustScore,
                verifiedCompanies: verifiedCompanies || 0,
                totalCompanies: totalCompanies || 0,
                avgCorridorHealth,
                activeCorridors: corridors?.length || 0,
                fraudAlertsToday: fraudAlerts?.length || 0,
                paymentRiskLevel: fraudAlerts?.length > 5 ? 'high' : fraudAlerts?.length > 2 ? 'medium' : 'low'
            });

            setTopTrustedCompanies(trustScores || []);
            setRiskAlerts(fraudAlerts || []);
            setCorridorHealth(corridors || []);

        } catch (error) {
            console.error('Error loading trust health:', error);
            toast.error('Failed to load trust health data');
        } finally {
            setLoading(false);
        }
    };

    if (!isSystemReady) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <SpinnerWithTimeout message="Loading trust health..." ready={isSystemReady} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <SpinnerWithTimeout message="Loading trust health..." ready={!loading} />
            </div>
        );
    }

    const verificationRate = healthMetrics.totalCompanies > 0
        ? Math.round((healthMetrics.verifiedCompanies / healthMetrics.totalCompanies) * 100)
        : 0;

    return (
        <div className="os-page-layout">
            {/* Header */}
            <div className="os-header-group">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-px w-8 bg-os-accent/40" />
                            <span className="text-os-xs uppercase font-black tracking-widest text-os-accent/80">
                                Infrastructure Protocol
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">Trust Health</h1>
                        <p className="text-os-lg text-os-text-secondary opacity-80">
                            Real-time view of platform trust infrastructure and risk thresholds.
                        </p>
                    </div>
                    <Button onClick={loadTrustHealthData} variant="outline" className="rounded-full border-os-stroke hover:bg-os-accent/10">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync
                    </Button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="os-stat-grid mt-8">
                {/* Platform Trust Score */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Surface className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Shield className="w-6 h-6 text-emerald-500" />
                            </div>
                            <Badge variant={healthMetrics.platformTrustScore >= 80 ? 'success' : 'secondary'} className="rounded-full text-[10px] py-0 px-2">
                                {healthMetrics.platformTrustScore >= 80 ? 'EXCELLENT' : 'GOOD'}
                            </Badge>
                        </div>
                        <div className="text-4xl font-black tracking-tight mb-1">
                            {healthMetrics.platformTrustScore}
                        </div>
                        <div className="os-label">
                            Trust DNA Index
                        </div>
                    </Surface>
                </motion.div>

                {/* Verification Rate */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <Surface className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-blue-500" />
                            </div>
                            <Badge variant="outline" className="rounded-full text-[10px] py-0 px-2 border-blue-500/30 text-blue-500">{verificationRate}%</Badge>
                        </div>
                        <div className="text-4xl font-black tracking-tight mb-1">
                            {healthMetrics.verifiedCompanies}
                        </div>
                        <div className="os-label">
                            Verified Entities
                        </div>
                    </Surface>
                </motion.div>

                {/* Corridor Health */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                >
                    <Surface className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Map className="w-6 h-6 text-purple-500" />
                            </div>
                            <Badge variant={healthMetrics.avgCorridorHealth >= 75 ? 'success' : 'secondary'} className="rounded-full text-[10px] py-0 px-2">
                                {healthMetrics.avgCorridorHealth >= 75 ? 'HEALTHY' : 'MONITOR'}
                            </Badge>
                        </div>
                        <div className="text-4xl font-black tracking-tight mb-1">
                            {healthMetrics.avgCorridorHealth}
                        </div>
                        <div className="os-label">
                            Avg Corridor Health
                        </div>
                    </Surface>
                </motion.div>

                {/* Fraud Alerts */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                >
                    <Surface className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <AlertTriangle className={`w-6 h-6 ${healthMetrics.fraudAlertsToday > 5 ? 'text-red-500' : 'text-amber-500'}`} />
                            </div>
                            <Badge variant={healthMetrics.fraudAlertsToday > 5 ? 'destructive' : 'secondary'} className="rounded-full text-[10px] py-0 px-2">
                                {healthMetrics.paymentRiskLevel.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="text-4xl font-black tracking-tight mb-1">
                            {healthMetrics.fraudAlertsToday}
                        </div>
                        <div className="os-label">
                            Fraud Alerts (24h)
                        </div>
                    </Surface>
                </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Top Trusted Companies */}
                <Surface variant="panel" className="p-0 overflow-hidden border-os-stroke">
                    <div className="p-6 border-b border-os-stroke bg-white/5">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-os-accent" />
                            <h3 className="text-os-base font-black uppercase tracking-widest text-[var(--os-text-primary)]">Top Trusted Companies</h3>
                        </div>
                    </div>
                    <div className="p-6">
                        {topTrustedCompanies.length === 0 ? (
                            <p className="text-os-sm text-os-text-secondary text-center py-8 italic">
                                No trust scores available yet
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {topTrustedCompanies.map((company, index) => (
                                    <div
                                        key={company.company_id}
                                        className="flex items-center justify-between p-4 rounded-os-md border border-os-stroke hover:border-os-accent/40 bg-white/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-black text-os-xs shadow-lg">
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold text-os-base group-hover:text-os-accent transition-colors">
                                                    {company.companies?.company_name || 'Unknown Company'}
                                                </div>
                                                <div className="os-label opacity-60">
                                                    Level: {company.level}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-emerald-500">
                                                {company.total_score}
                                            </div>
                                            <div className="os-label opacity-40">
                                                PTS
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link to="/dashboard/company-info">
                            <Button variant="ghost" className="w-full mt-6 text-os-accent font-bold uppercase tracking-widest text-os-xs hover:bg-os-accent/10">
                                View Full Intelligence Directory
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </Surface>

                {/* Corridor Health */}
                <Surface variant="panel" className="p-0 overflow-hidden border-os-stroke">
                    <div className="p-6 border-b border-os-stroke bg-white/5">
                        <div className="flex items-center gap-3">
                            <Map className="w-5 h-5 text-os-accent" />
                            <h3 className="text-os-base font-black uppercase tracking-widest text-[var(--os-text-primary)]">Corridor Reliability</h3>
                        </div>
                    </div>
                    <div className="p-6">
                        {corridorHealth.length === 0 ? (
                            <p className="text-os-sm text-os-text-secondary text-center py-8 italic">
                                No corridor data available yet
                            </p>
                        ) : (
                            <div className="space-y-6">
                                {corridorHealth.map((corridor) => (
                                    <div key={corridor.id} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="font-bold text-os-sm flex items-center gap-2">
                                                {corridor.origin_country} <ArrowRight className="w-3 h-3 opacity-40" /> {corridor.destination_country}
                                            </div>
                                            <Badge variant={corridor.reliability_score >= 80 ? 'success' : 'secondary'} className="rounded-full text-[10px] px-2 py-0 border-emerald-500/20">
                                                {corridor.reliability_score}%
                                            </Badge>
                                        </div>
                                        <div className="h-2 bg-os-stroke rounded-full overflow-hidden p-0.5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${corridor.reliability_score}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full bg-emerald-500 rounded-full"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-os-text-secondary opacity-60">
                                            <span>Avg Transit: {corridor.avg_transit_days || 'N/A'} days</span>
                                            <span>Delay Risk: {corridor.customs_delay_risk || 'LOW'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link to="/dashboard/corridors">
                            <Button variant="ghost" className="w-full mt-6 text-os-accent font-bold uppercase tracking-widest text-os-xs hover:bg-os-accent/10">
                                View Logistics Risk Map
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </Surface>

                {/* Recent Fraud Alerts */}
                <Surface variant="panel" className="lg:col-span-2 p-0 overflow-hidden border-os-stroke">
                    <div className="p-6 border-b border-os-stroke bg-white/5">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-os-accent" />
                            <h3 className="text-os-base font-black uppercase tracking-widest text-[var(--os-text-primary)]">Recent Fraud Warnings (24h)</h3>
                        </div>
                    </div>
                    <div className="p-6">
                        {riskAlerts.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-50" />
                                <p className="text-os-sm text-os-text-secondary italic">
                                    No High-Risk anomalies detected in the last 24 hours.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {riskAlerts.slice(0, 5).map((alert) => (
                                    <div
                                        key={alert.id}
                                        className="flex items-start gap-4 p-4 rounded-os-md border border-red-500/10 bg-red-500/5 group hover:bg-red-500/[0.08] transition-all"
                                    >
                                        <div className="p-2 bg-red-500/10 rounded-lg">
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-os-base mb-1">
                                                {alert.action}
                                            </div>
                                            <div className="text-os-xs text-os-text-secondary font-mono">
                                                {new Date(alert.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                        <Badge variant="destructive" className="rounded-full text-[10px] px-3 font-black">
                                            {alert.risk_level.toUpperCase()}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                        {isAdmin && (
                            <Link to="/dashboard/risk">
                                <Button variant="ghost" className="w-full mt-6 text-os-accent font-bold uppercase tracking-widest text-os-xs hover:bg-os-accent/10">
                                    Open Advanced Risk Intelligence Center
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        )}
                    </div>
                </Surface>
            </div>
        </div>
    );
}
