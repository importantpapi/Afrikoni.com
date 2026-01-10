/**
 * Trade Intelligence & Execution System Dashboard
 * Admin view for all intelligence layers
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, ShoppingBag, AlertTriangle, MapPin, BarChart3,
  Shield, Target, Activity, DollarSign, Globe, Package
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shared/ui/tabs';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import {
  useBuyerIntelligence,
  useSupplierIntelligence,
  useTradePerformance,
  useCategoryPerformance,
  useConversionFunnel,
  useDemandIntelligence,
  useDemandTrends,
  useSupplyGapInsights,
  useRiskSignals,
  useTrustEvolution,
  useHighRiskCompanies,
  useHighValueDealsNeedingAttention
} from '@/hooks/useTradeIntelligence';
import { isAdmin } from '@/utils/permissions';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import AccessDenied from '@/components/AccessDenied';
import { toast } from 'sonner';

export default function TradeIntelligenceDashboard() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false); // Local loading state
  const [hasAccess, setHasAccess] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[TradeIntelligenceDashboard] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → set no access
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    // Check admin access
    const admin = isAdmin(user) || profile?.is_admin || false;
    setHasAccess(admin);
    setLoading(false);
  }, [authReady, authLoading, user, profile, role]);

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    let start, end = now;
    switch (timeRange) {
      case '7d':
        start = subDays(now, 7);
        break;
      case '30d':
        start = subDays(now, 30);
        break;
      case '90d':
        start = subDays(now, 90);
        break;
      case '1y':
        start = subDays(now, 365);
        break;
      default:
        start = subDays(now, 30);
    }
    return { start, end };
  };

  const { start, end } = getDateRange();

  // Fetch intelligence data
  const { data: buyerIntelligence, loading: buyersLoading } = useBuyerIntelligence();
  const { data: supplierIntelligence, loading: suppliersLoading } = useSupplierIntelligence();
  const { data: tradePerformance, loading: tradeLoading } = useTradePerformance('day', start, end);
  const { data: categoryPerformance, loading: categoriesLoading } = useCategoryPerformance();
  const { data: conversionFunnel, loading: funnelLoading } = useConversionFunnel(start, end);
  const { data: demandIntelligence, loading: demandLoading } = useDemandIntelligence(null, false);
  const { data: demandTrends, loading: trendsLoading } = useDemandTrends();
  const { data: supplyGaps, loading: gapsLoading } = useSupplyGapInsights();
  const { data: riskSignals, loading: riskLoading } = useRiskSignals();
  const { data: trustEvolution, loading: trustLoading } = useTrustEvolution();
  const { data: highRiskCompanies, loading: highRiskLoading } = useHighRiskCompanies();
  const { data: highValueDeals, loading: highValueLoading } = useHighValueDealsNeedingAttention();

  // Access checking handled in first useEffect above (using AuthProvider)

  if (loading) {
    return (
      <DashboardLayout currentRole="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  // Calculate summary metrics
  const totalBuyers = buyerIntelligence?.length || 0;
  const totalSuppliers = supplierIntelligence?.length || 0;
  const totalGMV = tradePerformance?.reduce((sum, p) => sum + (p.gmv || 0), 0) || 0;
  const totalCommission = tradePerformance?.reduce((sum, p) => sum + (p.commission_earned || 0), 0) || 0;
  const highRiskCount = highRiskCompanies?.length || 0;
  const supplyGapCount = supplyGaps?.length || 0;

  // Buyer segments breakdown
  const buyerSegments = buyerIntelligence?.reduce((acc, buyer) => {
    acc[buyer.buyer_segment] = (acc[buyer.buyer_segment] || 0) + 1;
    return acc;
  }, {}) || {};

  // Top categories by GMV
  const topCategories = categoryPerformance
    ?.sort((a, b) => (b.gmv || 0) - (a.gmv || 0))
    .slice(0, 5) || [];

  // Risk level breakdown
  const riskBreakdown = riskSignals?.reduce((acc, risk) => {
    acc[risk.overall_risk_level] = (acc[risk.overall_risk_level] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <DashboardLayout currentRole="admin">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
              Trade Intelligence & Execution System
            </h1>
            <p className="text-afrikoni-deep/70">
              Real-time insights for matching, risk, and trade execution
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Admin Alerts Panel */}
        <AdminAlertsPanel />

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-afrikoni-gold" />
                <Badge className="bg-green-50 text-green-700">
                  {buyerSegments['Serious Buyer'] || 0} serious
                </Badge>
              </div>
              <div className="text-3xl font-bold text-afrikoni-text-dark mb-1">
                {totalBuyers}
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Total Buyers</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-afrikoni-gold" />
                <Badge className="bg-blue-50 text-blue-700">
                  {supplierIntelligence?.filter(s => s.reliability_score > 70).length || 0} reliable
                </Badge>
              </div>
              <div className="text-3xl font-bold text-afrikoni-text-dark mb-1">
                {totalSuppliers}
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Total Suppliers</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-afrikoni-gold" />
                <Badge className="bg-green-50 text-green-700">
                  ${(totalCommission / 1000).toFixed(1)}k commission
                </Badge>
              </div>
              <div className="text-3xl font-bold text-afrikoni-text-dark mb-1">
                ${(totalGMV / 1000).toFixed(1)}k
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Total GMV</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <Badge className="bg-red-50 text-red-700">
                  {highRiskCount} high risk
                </Badge>
              </div>
              <div className="text-3xl font-bold text-afrikoni-text-dark mb-1">
                {highRiskCount}
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">High-Risk Companies</div>
            </CardContent>
          </Card>
        </div>

        {/* Intelligence Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="buyers">Buyers</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="demand">Demand</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                {funnelLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
                  </div>
                ) : conversionFunnel ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-afrikoni-gold/10 rounded-lg">
                        <div className="text-2xl font-bold text-afrikoni-chestnut">
                          {conversionFunnel.rfqs}
                        </div>
                        <div className="text-sm text-afrikoni-deep/70">RFQs</div>
                      </div>
                      <div className="text-center p-4 bg-afrikoni-purple/10 rounded-lg">
                        <div className="text-2xl font-bold text-afrikoni-chestnut">
                          {conversionFunnel.conversations}
                        </div>
                        <div className="text-sm text-afrikoni-deep/70">Conversations</div>
                        <div className="text-xs text-afrikoni-deep/50 mt-1">
                          {conversionFunnel.rfqToConversationRate.toFixed(1)}% conversion
                        </div>
                      </div>
                      <div className="text-center p-4 bg-afrikoni-green/10 rounded-lg">
                        <div className="text-2xl font-bold text-afrikoni-chestnut">
                          {conversionFunnel.deals}
                        </div>
                        <div className="text-sm text-afrikoni-deep/70">Deals</div>
                        <div className="text-xs text-afrikoni-deep/50 mt-1">
                          {conversionFunnel.conversationToDealRate.toFixed(1)}% conversion
                        </div>
                      </div>
                      <div className="text-center p-4 bg-afrikoni-gold/20 rounded-lg">
                        <div className="text-2xl font-bold text-afrikoni-chestnut">
                          {conversionFunnel.completed}
                        </div>
                        <div className="text-sm text-afrikoni-deep/70">Completed</div>
                        <div className="text-xs text-afrikoni-deep/50 mt-1">
                          {conversionFunnel.dealCompletionRate.toFixed(1)}% completion
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-afrikoni-deep/70 py-8">
                    No conversion data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Categories by GMV</CardTitle>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
                  </div>
                ) : topCategories.length > 0 ? (
                  <div className="space-y-3">
                    {topCategories.map((cat, idx) => (
                      <div key={cat.category_id} className="flex items-center justify-between p-3 bg-afrikoni-cream rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-afrikoni-gold/20 flex items-center justify-center text-afrikoni-gold font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-afrikoni-chestnut">
                              {cat.category_name}
                            </div>
                            <div className="text-sm text-afrikoni-deep/70">
                              {cat.completed_deals} completed deals
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-afrikoni-gold">
                            ${(cat.gmv / 1000).toFixed(1)}k
                          </div>
                          <div className="text-xs text-afrikoni-deep/50">
                            {cat.conversion_rate.toFixed(1)}% conversion
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-afrikoni-deep/70 py-8">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supply Gaps & Onboarding Signals */}
            <SupplierOnboardingInsights />

          </TabsContent>

          {/* Trending Demand Tab */}
          <TabsContent value="trending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trending Demand</CardTitle>
                <p className="text-sm text-afrikoni-deep/70 mt-1">
                  Categories and regions with increasing demand
                </p>
              </CardHeader>
              <CardContent>
                {trendsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
                  </div>
                ) : demandTrends?.length > 0 ? (
                  <div className="space-y-4">
                    {/* Group by category and show trends */}
                    {Object.entries(
                      demandTrends.reduce((acc, trend) => {
                        const key = trend.category_name || 'Uncategorized';
                        if (!acc[key]) {
                          acc[key] = {
                            category_name: key,
                            total_rfqs: 0,
                            total_budget: 0,
                            countries: new Set()
                          };
                        }
                        acc[key].total_rfqs += trend.rfqs_count || 0;
                        acc[key].total_budget += parseFloat(trend.total_budget_demanded || 0);
                        if (trend.buyer_country) {
                          acc[key].countries.add(trend.buyer_country);
                        }
                        return acc;
                      }, {})
                    )
                      .map(([key, data]) => ({
                        ...data,
                        countries: Array.from(data.countries)
                      }))
                      .sort((a, b) => b.total_rfqs - a.total_rfqs)
                      .slice(0, 20)
                      .map((trend, idx) => (
                        <div key={idx} className="p-4 bg-afrikoni-cream rounded-lg hover:bg-afrikoni-gold/5 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-semibold text-afrikoni-chestnut text-lg">
                              {trend.category_name}
                            </div>
                            <Badge className="bg-afrikoni-gold/20 text-afrikoni-gold">
                              #{idx + 1} Trending
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-afrikoni-deep/70 mb-1">RFQs</div>
                              <div className="font-bold text-afrikoni-chestnut text-lg">{trend.total_rfqs}</div>
                            </div>
                            <div>
                              <div className="text-afrikoni-deep/70 mb-1">Total Budget</div>
                              <div className="font-bold text-afrikoni-gold text-lg">
                                ${(trend.total_budget / 1000).toFixed(1)}k
                              </div>
                            </div>
                            <div>
                              <div className="text-afrikoni-deep/70 mb-1">Countries</div>
                              <div className="font-bold text-afrikoni-chestnut text-lg">
                                {trend.countries.length}
                              </div>
                            </div>
                          </div>
                          {trend.countries.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-afrikoni-gold/20">
                              <div className="text-xs text-afrikoni-deep/70 mb-1">Top Countries:</div>
                              <div className="flex flex-wrap gap-2">
                                {trend.countries.slice(0, 5).map((country, cIdx) => (
                                  <Badge key={cIdx} variant="outline" className="text-xs">
                                    {country}
                                  </Badge>
                                ))}
                                {trend.countries.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{trend.countries.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center text-afrikoni-deep/70 py-8">
                    No demand trend data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buyers Tab */}
          <TabsContent value="buyers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Buyer Segmentation</CardTitle>
              </CardHeader>
              <CardContent>
                {buyersLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
                  </div>
                ) : buyerIntelligence?.length > 0 ? (
                  <div className="space-y-4">
                    {/* Segment Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {Object.entries(buyerSegments).map(([segment, count]) => (
                        <div key={segment} className="p-4 bg-afrikoni-cream rounded-lg text-center">
                          <div className="text-2xl font-bold text-afrikoni-chestnut">{count}</div>
                          <div className="text-sm text-afrikoni-deep/70">{segment}</div>
                        </div>
                      ))}
                    </div>

                    {/* Buyer List */}
                    <div className="space-y-2">
                      {buyerIntelligence.slice(0, 20).map((buyer) => (
                        <div key={buyer.company_id} className="p-4 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-cream transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-afrikoni-chestnut">
                                {buyer.company_name}
                              </div>
                              <div className="text-sm text-afrikoni-deep/70">
                                {buyer.country} • {buyer.buyer_segment}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-afrikoni-gold">
                                ${(buyer.total_deal_value / 1000).toFixed(1)}k
                              </div>
                              <div className="text-xs text-afrikoni-deep/50">
                                {buyer.completed_orders} deals
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-afrikoni-deep/70 py-8">
                    No buyer data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Supplier Intelligence & Reliability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {suppliersLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
                      </div>
                    ) : supplierIntelligence?.length > 0 ? (
                      <div className="space-y-4">
                        {/* Supplier List */}
                        <div className="space-y-2">
                          {supplierIntelligence.slice(0, 20).map((supplier) => (
                            <div key={supplier.company_id} className="p-4 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-cream transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <div className="font-semibold text-afrikoni-chestnut">
                                      {supplier.company_name}
                                    </div>
                                    {supplier.verified && (
                                      <Badge className="bg-green-100 text-green-700">Verified</Badge>
                                    )}
                                    <ReliabilityBadge 
                                      reliabilityScore={supplier.reliability_score} 
                                      size="small"
                                    />
                                    {supplier.slow_response_flag && (
                                      <Badge variant="warning">Slow Response</Badge>
                                    )}
                                    {supplier.high_dispute_flag && (
                                      <Badge variant="destructive">High Disputes</Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-afrikoni-deep/70 space-y-1">
                                    <div>{supplier.country} • {supplier.completion_rate.toFixed(1)}% completion</div>
                                    <div>
                                      Avg response: {supplier.avg_response_hours?.toFixed(1) || 'N/A'} hours
                                      • {supplier.total_orders} orders
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <div className="text-2xl font-bold text-afrikoni-gold">
                                    {supplier.reliability_score?.toFixed(0) || 'N/A'}
                                  </div>
                                  <div className="text-xs text-afrikoni-deep/50">Reliability</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-afrikoni-deep/70 py-8">
                        No supplier data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Trust History Sidebar */}
              <div>
                <TrustHistoryTimeline companyId={supplierIntelligence?.[0]?.company_id} />
              </div>
            </div>
          </TabsContent>

          {/* Demand Tab */}
          <TabsContent value="demand" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Demand Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                {demandLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
                  </div>
                ) : demandIntelligence?.length > 0 ? (
                  <div className="space-y-4">
                    {/* Demand List */}
                    <div className="space-y-2">
                      {demandIntelligence
                        .filter(d => d.recent_demand)
                        .slice(0, 20)
                        .map((demand) => (
                          <div key={demand.rfq_id} className="p-4 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-cream transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-afrikoni-chestnut">
                                  {demand.rfq_title}
                                </div>
                                <div className="text-sm text-afrikoni-deep/70 space-y-1">
                                  <div>
                                    {demand.category_name} • {demand.buyer_country}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span>Budget: ${(demand.budget / 1000).toFixed(1)}k</span>
                                    <span>Qty: {demand.quantity}</span>
                                    <Badge className={
                                      demand.supply_status === 'No Supply' ? 'bg-red-100 text-red-700' :
                                      demand.supply_status === 'Low Supply' ? 'bg-orange-100 text-orange-700' :
                                      'bg-green-100 text-green-700'
                                    }>
                                      {demand.supply_status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              {demand.supply_gap_flag && (
                                <Badge className="bg-red-100 text-red-700">Supply Gap</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-afrikoni-deep/70 py-8">
                    No demand data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Risk Tab */}
          <TabsContent value="risk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Signals & Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {riskLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
                  </div>
                ) : riskSignals?.length > 0 ? (
                  <div className="space-y-4">
                    {/* Risk Breakdown */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {Object.entries(riskBreakdown).map(([level, count]) => (
                        <div key={level} className={`p-4 rounded-lg text-center ${
                          level === 'High' ? 'bg-red-50 border border-red-200' :
                          level === 'Medium' ? 'bg-orange-50 border border-orange-200' :
                          'bg-green-50 border border-green-200'
                        }`}>
                          <div className="text-2xl font-bold text-afrikoni-chestnut">{count}</div>
                          <div className="text-sm text-afrikoni-deep/70">{level} Risk</div>
                        </div>
                      ))}
                    </div>

                    {/* High-Risk Companies */}
                    {highRiskCompanies.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-afrikoni-chestnut mb-3">High-Risk Companies</h3>
                        {highRiskCompanies.map((risk) => (
                          <div key={risk.company_id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-red-900">
                                  {risk.company_name}
                                </div>
                                <div className="text-sm text-red-700 space-y-1">
                                  <div>{risk.country} • {risk.role}</div>
                                  <div className="flex items-center gap-4">
                                    <span>Response: {risk.response_delay_risk}</span>
                                    <span>Disputes: {risk.dispute_risk}</span>
                                    <span>Disputes: {risk.total_disputes}</span>
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-red-200 text-red-900">
                                {risk.overall_risk_level} Risk
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* High-Value Deals Needing Attention */}
                    {highValueDeals.length > 0 && (
                      <div className="space-y-2 mt-6">
                        <h3 className="font-semibold text-afrikoni-chestnut mb-3">High-Value Deals Needing Attention</h3>
                        {highValueDeals.map((deal) => (
                          <div key={deal.company_id} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-orange-900">
                                  {deal.company_name}
                                </div>
                                <div className="text-sm text-orange-700">
                                  {deal.high_value_deals} high-value deals • {deal.overall_risk_level} risk
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                Review
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-afrikoni-deep/70 py-8">
                    No risk data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

