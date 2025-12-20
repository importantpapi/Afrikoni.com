/**
 * Seller Intelligence Dashboard
 * Supplier-focused intelligence view
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSupplierIntelligence, useTrustEvolution, useRiskSignals } from '@/hooks/useTradeIntelligence';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle, Package, DollarSign } from 'lucide-react';
import TrustHistoryTimeline from '@/components/intelligence/TrustHistoryTimeline';

export default function SellerIntelligence() {
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const { companyId: cid } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        setCompanyId(cid);
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, []);

  const { data: supplierIntelligence, loading: supplierLoading } = useSupplierIntelligence(companyId);
  const { data: trustEvolution, loading: trustLoading } = useTrustEvolution(companyId);
  const { data: riskSignals, loading: riskLoading } = useRiskSignals();

  if (loading) {
    return (
      <DashboardLayout currentRole="seller">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  const supplier = supplierIntelligence?.[0] || null;
  const trust = trustEvolution?.[0] || null;
  const risk = riskSignals?.find(r => r.company_id === companyId) || null;

  return (
    <DashboardLayout currentRole="seller">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
            Supplier Intelligence
          </h1>
          <p className="text-afrikoni-deep/70">
            Your performance metrics and reliability insights
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-8 h-8 text-afrikoni-gold" />
                <Badge className={
                  supplier?.reliability_score >= 80 ? 'bg-green-100 text-green-700' :
                  supplier?.reliability_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }>
                  {supplier?.reliability_score?.toFixed(0) || 'N/A'}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-afrikoni-text-dark mb-1">
                {supplier?.reliability_score?.toFixed(0) || 'N/A'}
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Reliability Score</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <Badge className="bg-green-50 text-green-700">
                  {supplier?.completion_rate?.toFixed(1) || 0}%
                </Badge>
              </div>
              <div className="text-2xl font-bold text-afrikoni-text-dark mb-1">
                {supplier?.completion_rate?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Completion Rate</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-blue-500" />
                <Badge className={
                  supplier?.avg_response_hours <= 24 ? 'bg-green-50 text-green-700' :
                  supplier?.avg_response_hours <= 48 ? 'bg-yellow-50 text-yellow-700' :
                  'bg-red-50 text-red-700'
                }>
                  {supplier?.avg_response_hours?.toFixed(1) || 'N/A'}h
                </Badge>
              </div>
              <div className="text-2xl font-bold text-afrikoni-text-dark mb-1">
                {supplier?.avg_response_hours?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Avg Response Time (hours)</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-purple-500" />
                <Badge className="bg-purple-50 text-purple-700">
                  {supplier?.total_orders || 0}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-afrikoni-text-dark mb-1">
                {supplier?.total_orders || 0}
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Total Orders</div>
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
                  </div>
                ) : supplier ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-afrikoni-deep">Trust Score</span>
                        <span className="text-sm text-afrikoni-deep/70">{supplier.trust_score || 50}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-afrikoni-gold h-2 rounded-full transition-all" 
                          style={{ width: `${supplier.trust_score || 50}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-afrikoni-deep">Completion Rate</span>
                        <span className="text-sm text-afrikoni-deep/70">{supplier.completion_rate?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all" 
                          style={{ width: `${supplier.completion_rate || 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-afrikoni-deep">Response Speed</span>
                        <span className="text-sm text-afrikoni-deep/70">
                          {supplier.avg_response_hours ? `${supplier.avg_response_hours.toFixed(1)} hours` : 'N/A'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all" 
                          style={{ width: `${supplier.avg_response_hours ? Math.max(0, 100 - (supplier.avg_response_hours / 72 * 100)) : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-afrikoni-gold/20">
                      <div className="text-sm font-semibold text-afrikoni-chestnut mb-3">Flags</div>
                      <div className="space-y-2">
                        {supplier.slow_response_flag && (
                          <div className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">Slow response times detected</span>
                          </div>
                        )}
                        {supplier.high_dispute_flag && (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">High dispute rate</span>
                          </div>
                        )}
                        {supplier.inactive_flag && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Inactive for 90+ days</span>
                          </div>
                        )}
                        {!supplier.slow_response_flag && !supplier.high_dispute_flag && !supplier.inactive_flag && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">No issues detected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-afrikoni-deep/70 py-8">
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
                      <div className="flex items-center justify-between p-3 bg-afrikoni-cream rounded-lg">
                        <span className="text-sm text-afrikoni-deep">Total Orders</span>
                        <span className="font-bold text-afrikoni-chestnut">{supplier.total_orders || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-afrikoni-deep">Completed</span>
                        <span className="font-bold text-green-700">{supplier.completed_orders || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <span className="text-sm text-afrikoni-deep">Cancelled</span>
                        <span className="font-bold text-red-700">{supplier.cancelled_orders || 0}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-afrikoni-deep/70 py-4">No data</div>
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
                      <div className="flex items-center justify-between p-3 bg-afrikoni-cream rounded-lg">
                        <span className="text-sm text-afrikoni-deep">Total Quotes</span>
                        <span className="font-bold text-afrikoni-chestnut">{supplier.total_quotes_submitted || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-afrikoni-deep">Within 24h</span>
                        <span className="font-bold text-green-700">{supplier.responses_within_24h || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-afrikoni-deep">Avg Response</span>
                        <span className="font-bold text-blue-700">
                          {supplier.avg_response_hours ? `${supplier.avg_response_hours.toFixed(1)}h` : 'N/A'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-afrikoni-deep/70 py-4">No data</div>
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
                  </div>
                ) : trust ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-afrikoni-cream rounded-lg">
                        <div className="text-sm text-afrikoni-deep/70 mb-1">Current Trust Score</div>
                        <div className="text-3xl font-bold text-afrikoni-gold">{trust.current_trust_score || 50}</div>
                      </div>
                      <div className="p-4 bg-afrikoni-cream rounded-lg">
                        <div className="text-sm text-afrikoni-deep/70 mb-1">Completed Deals</div>
                        <div className="text-3xl font-bold text-afrikoni-chestnut">{trust.completed_deals || 0}</div>
                      </div>
                      <div className="p-4 bg-afrikoni-cream rounded-lg">
                        <div className="text-sm text-afrikoni-deep/70 mb-1">Total Reviews</div>
                        <div className="text-3xl font-bold text-afrikoni-chestnut">{trust.total_reviews || 0}</div>
                      </div>
                      <div className="p-4 bg-afrikoni-cream rounded-lg">
                        <div className="text-sm text-afrikoni-deep/70 mb-1">Avg Rating</div>
                        <div className="text-3xl font-bold text-afrikoni-gold">
                          {trust.avg_review_rating ? trust.avg_review_rating.toFixed(1) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-afrikoni-deep/70 py-8">No trust data available</div>
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
                        <span className="font-semibold text-afrikoni-chestnut">Overall Risk Level</span>
                        <Badge className={
                          risk.overall_risk_level === 'High' ? 'bg-red-200 text-red-900' :
                          risk.overall_risk_level === 'Medium' ? 'bg-orange-200 text-orange-900' :
                          'bg-green-200 text-green-900'
                        }>
                          {risk.overall_risk_level}
                        </Badge>
                      </div>
                      <div className="text-sm text-afrikoni-deep/70 space-y-1">
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
    </DashboardLayout>
  );
}

