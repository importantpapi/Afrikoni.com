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
        <div className="min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Trust Health Dashboard</h1>
                            <p className="text-muted-foreground">
                                Real-time view of platform trust infrastructure
                            </p>
                        </div>
                        <Button onClick={loadTrustHealthData} variant="outline">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Platform Trust Score */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <Shield className="w-8 h-8 text-emerald-600" />
                                    <Badge variant={healthMetrics.platformTrustScore >= 80 ? 'success' : 'secondary'}>
                                        {healthMetrics.platformTrustScore >= 80 ? 'Excellent' : 'Good'}
                                    </Badge>
                                </div>
                                <div className="text-3xl font-bold mb-1">
                                    {healthMetrics.platformTrustScore}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Platform Trust Score
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Verification Rate */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <CheckCircle className="w-8 h-8 text-blue-600" />
                                    <Badge variant="outline">{verificationRate}%</Badge>
                                </div>
                                <div className="text-3xl font-bold mb-1">
                                    {healthMetrics.verifiedCompanies}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Verified Companies
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Corridor Health */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <Map className="w-8 h-8 text-purple-600" />
                                    <Badge variant={healthMetrics.avgCorridorHealth >= 75 ? 'success' : 'secondary'}>
                                        {healthMetrics.avgCorridorHealth >= 75 ? 'Healthy' : 'Monitor'}
                                    </Badge>
                                </div>
                                <div className="text-3xl font-bold mb-1">
                                    {healthMetrics.avgCorridorHealth}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Avg Corridor Health
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Fraud Alerts */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                    >
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <AlertTriangle className={`w-8 h-8 ${healthMetrics.fraudAlertsToday > 5 ? 'text-red-600' : 'text-yellow-600'}`} />
                                    <Badge variant={healthMetrics.fraudAlertsToday > 5 ? 'destructive' : 'secondary'}>
                                        {healthMetrics.paymentRiskLevel}
                                    </Badge>
                                </div>
                                <div className="text-3xl font-bold mb-1">
                                    {healthMetrics.fraudAlertsToday}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Fraud Alerts (24h)
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Trusted Companies */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Top Trusted Companies
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topTrustedCompanies.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No trust scores available yet
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {topTrustedCompanies.map((company, index) => (
                                        <div
                                            key={company.company_id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:border-afrikoni-gold/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                                    #{index + 1}
                                                </div>
                                                <div>
                                                    <div className="font-semibold">
                                                        {company.companies?.company_name || 'Unknown Company'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Level: {company.level}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-emerald-600">
                                                    {company.total_score}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Trust Score
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Link to="/dashboard/company-info">
                                <Button variant="outline" className="w-full mt-4">
                                    View All Companies
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Corridor Health */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Map className="w-5 h-5" />
                                Corridor Reliability
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {corridorHealth.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No corridor data available yet
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {corridorHealth.map((corridor) => (
                                        <div key={corridor.id} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium text-sm">
                                                    {corridor.origin_country} → {corridor.destination_country}
                                                </div>
                                                <Badge variant={corridor.reliability_score >= 80 ? 'success' : 'secondary'}>
                                                    {corridor.reliability_score}
                                                </Badge>
                                            </div>
                                            <Progress value={corridor.reliability_score} className="h-2" />
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>Avg Transit: {corridor.avg_transit_days || 'N/A'} days</span>
                                                <span>Delay Risk: {corridor.customs_delay_risk || 'low'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Link to="/dashboard/corridors">
                                <Button variant="outline" className="w-full mt-4">
                                    View All Corridors
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Recent Fraud Alerts */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Recent Fraud Alerts (24h)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {riskAlerts.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        No fraud alerts in the last 24 hours
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {riskAlerts.slice(0, 5).map((alert) => (
                                        <div
                                            key={alert.id}
                                            className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50"
                                        >
                                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="font-semibold text-sm mb-1">
                                                    {alert.action}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(alert.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                            <Badge variant="destructive">
                                                {alert.risk_level}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isAdmin && (
                                <Link to="/dashboard/risk">
                                    <Button variant="outline" className="w-full mt-4">
                                        View Risk Dashboard
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
