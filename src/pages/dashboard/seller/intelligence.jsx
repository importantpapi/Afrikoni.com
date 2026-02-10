/**
 * Seller Intelligence Dashboard
 * Supplier-focused intelligence view
 */

import React, { useState, useEffect } from 'react';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shared/ui/tabs';
import { Badge } from '@/components/shared/ui/badge';
import { Progress } from '@/components/shared/ui/progress';
import { useSupplierIntelligence, useTrustEvolution, useRiskSignals } from '@/hooks/useTradeIntelligence';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle, Package, DollarSign } from 'lucide-react';
import TrustHistoryTimeline from '@/components/intelligence/TrustHistoryTimeline';

export default function SellerIntelligence() {
  // ✅ KERNEL COMPLIANCE: Use useDashboardKernel as single source of truth
  const { user, profile, userId, profileCompanyId, isSystemReady, canLoadData } = useDashboardKernel();
  const [loading, setLoading] = useState(false); // Local loading state
  const [companyId, setCompanyId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading seller intelligence..." ready={isSystemReady} />;
  }
  
  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    return null;
  }
  
  // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel
  const { data: supplierIntelligence, loading: supplierLoading } = useSupplierIntelligence(profileCompanyId);
  const { data: trustEvolution, loading: trustLoading } = useTrustEvolution(profileCompanyId);
  const { data: riskSignals, loading: riskLoading } = useRiskSignals();

  if (loading || supplierLoading || trustLoading || riskLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" />
      </div>
    );
  }
  
  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          // Hooks will automatically refetch
        }}
      />
    );
  }

  const supplier = supplierIntelligence?.[0] || null;
  const trust = trustEvolution?.[0] || null;
  const risk = riskSignals?.find(r => r.company_id === profileCompanyId) || null;

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Supplier Intelligence
          </h1>
          <p className="">
            Your performance metrics and reliability insights
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-8 h-8" />
                <Badge className={
                  supplier?.reliability_score >= 80 ? 'bg-green-100 text-green-700' :
                  supplier?.reliability_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }>
                  {supplier?.reliability_score?.toFixed(0) || 'N/A'}
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">
                {supplier?.reliability_score?.toFixed(0) || 'N/A'}
              </div>
              <div className="text-sm">Reliability Score</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8" />
                <Badge className="">
                  {supplier?.completion_rate?.toFixed(1) || 0}%
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">
                {supplier?.completion_rate?.toFixed(1) || 0}%
              </div>
              <div className="text-sm">Completion Rate</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8" />
                <Badge className={
                  supplier?.avg_response_hours <= 24 ? 'bg-green-50 text-green-700' :
                  supplier?.avg_response_hours <= 48 ? 'bg-yellow-50 text-yellow-700' :
                  'bg-red-50 text-red-700'
                }>
                  {supplier?.avg_response_hours?.toFixed(1) || 'N/A'}h
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">
                {supplier?.avg_response_hours?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm">Avg Response Time (hours)</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8" />
                <Badge className="">
                  {supplier?.total_orders || 0}
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">
                {supplier?.total_orders || 0}
              </div>
              <div className="text-sm">Total Orders</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Intelligence */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="risk">Risk & Trust</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reliability Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplierLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
                  </div>
                ) : supplier ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Trust Score</span>
                        <span className="text-sm">{supplier.trust_score || 50}/100</span>
                      </div>
                      <div className="w-full rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all" 
                          style={{ width: `${supplier.trust_score || 50}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Completion Rate</span>
                        <span className="text-sm">{supplier.completion_rate?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="w-full rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all" 
                          style={{ width: `${supplier.completion_rate || 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Response Speed</span>
                        <span className="text-sm">
                          {supplier.avg_response_hours ? `${supplier.avg_response_hours.toFixed(1)} hours` : 'N/A'}
                        </span>
                      </div>
                      <div className="w-full rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all" 
                          style={{ width: `${supplier.avg_response_hours ? Math.max(0, 100 - (supplier.avg_response_hours / 72 * 100)) : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="text-sm font-semibold mb-3">Flags</div>
                      <div className="space-y-2">
                        {supplier.slow_response_flag && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">Slow response times detected</span>
                          </div>
                        )}
                        {supplier.high_dispute_flag && (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">High dispute rate</span>
                          </div>
                        )}
                        {supplier.inactive_flag && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Inactive for 90+ days</span>
                          </div>
                        )}
                        {!supplier.slow_response_flag && !supplier.high_dispute_flag && !supplier.inactive_flag && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">No issues detected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    No supplier data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supplier ? (
                    <>
                      <div className="flex items-center justify-between p-3 rounded-lg">
                        <span className="text-sm">Total Orders</span>
                        <span className="font-bold">{supplier.total_orders || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg">
                        <span className="text-sm">Completed</span>
                        <span className="font-bold">{supplier.completed_orders || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg">
                        <span className="text-sm">Cancelled</span>
                        <span className="font-bold">{supplier.cancelled_orders || 0}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">No data</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supplier ? (
                    <>
                      <div className="flex items-center justify-between p-3 rounded-lg">
                        <span className="text-sm">Total Quotes</span>
                        <span className="font-bold">{supplier.total_quotes_submitted || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg">
                        <span className="text-sm">Within 24h</span>
                        <span className="font-bold">{supplier.responses_within_24h || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg">
                        <span className="text-sm">Avg Response</span>
                        <span className="font-bold">
                          {supplier.avg_response_hours ? `${supplier.avg_response_hours.toFixed(1)}h` : 'N/A'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">No data</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk & Trust Tab */}
          <TabsContent value="risk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trust Evolution</CardTitle>
              </CardHeader>
              <CardContent>
                {trustLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
                  </div>
                ) : trust ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg">
                        <div className="text-sm mb-1">Current Trust Score</div>
                        <div className="text-3xl font-bold">{trust.current_trust_score || 50}</div>
                      </div>
                      <div className="p-4 rounded-lg">
                        <div className="text-sm mb-1">Completed Deals</div>
                        <div className="text-3xl font-bold">{trust.completed_deals || 0}</div>
                      </div>
                      <div className="p-4 rounded-lg">
                        <div className="text-sm mb-1">Total Reviews</div>
                        <div className="text-3xl font-bold">{trust.total_reviews || 0}</div>
                      </div>
                      <div className="p-4 rounded-lg">
                        <div className="text-sm mb-1">Avg Rating</div>
                        <div className="text-3xl font-bold">
                          {trust.avg_review_rating ? trust.avg_review_rating.toFixed(1) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">No trust data available</div>
                )}
              </CardContent>
            </Card>

            {risk && (
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg border-2 ${
                      risk.overall_risk_level === 'High' ? 'bg-red-50 border-red-200' :
                      risk.overall_risk_level === 'Medium' ? 'bg-orange-50 border-orange-200' :
                      'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Overall Risk Level</span>
                        <Badge className={
                          risk.overall_risk_level === 'High' ? 'bg-red-200 text-red-900' :
                          risk.overall_risk_level === 'Medium' ? 'bg-orange-200 text-orange-900' :
                          'bg-green-200 text-green-900'
                        }>
                          {risk.overall_risk_level}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>Response Delay Risk: {risk.response_delay_risk}</div>
                        <div>Dispute Risk: {risk.dispute_risk}</div>
                        {risk.abandoned_conversations > 0 && (
                          <div>Abandoned Conversations: {risk.abandoned_conversations}</div>
                        )}
                        {risk.stuck_deals > 0 && (
                          <div>Stuck Deals: {risk.stuck_deals}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

