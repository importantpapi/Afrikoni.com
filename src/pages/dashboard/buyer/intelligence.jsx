/**
 * Buyer Intelligence Dashboard
 * Buyer-focused intelligence view
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shared/ui/tabs';
import { Badge } from '@/components/shared/ui/badge';
import { useBuyerIntelligence, useTrustEvolution } from '@/hooks/useTradeIntelligence';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { ShoppingBag, TrendingUp, DollarSign, MessageCircle, Package, CheckCircle, Clock } from 'lucide-react';

export default function BuyerIntelligence() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false); // Local loading state
  const [companyId, setCompanyId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[BuyerIntelligence] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → exit
    if (!user) {
      setLoading(false);
      return;
    }

    // Use company_id from profile
    const cid = profile?.company_id || null;
    setCompanyId(cid);
    setLoading(false);
  }, [authReady, authLoading, user?.id, profile?.company_id]); // ✅ Primitives only - prevents reload on token refresh

  const { data: buyerIntelligence, loading: buyerLoading } = useBuyerIntelligence(companyId);
  const { data: trustEvolution, loading: trustLoading } = useTrustEvolution(companyId);

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading buyer intelligence..." />;
  }

  if (loading) {
    return (
      <DashboardLayout currentRole="buyer">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  const buyer = buyerIntelligence?.[0] || null;
  const trust = trustEvolution?.[0] || null;

  return (
    <DashboardLayout currentRole="buyer">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
            Buyer Intelligence
          </h1>
          <p className="text-afrikoni-deep/70">
            Your buying activity and segment insights
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <ShoppingBag className="w-8 h-8 text-afrikoni-gold" />
                <Badge className={
                  buyer?.buyer_segment === 'High-Value Buyer' ? 'bg-green-100 text-green-700' :
                  buyer?.buyer_segment === 'Serious Buyer' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }>
                  {buyer?.buyer_segment || 'N/A'}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-afrikoni-text-dark mb-1">
                {buyer?.buyer_segment || 'N/A'}
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Buyer Segment</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-500" />
                <Badge className="bg-green-50 text-green-700">
                  ${(buyer?.total_deal_value / 1000).toFixed(1) || 0}k
                </Badge>
              </div>
              <div className="text-2xl font-bold text-afrikoni-text-dark mb-1">
                ${(buyer?.total_deal_value / 1000).toFixed(1) || 0}k
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Total Deal Value</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-blue-500" />
                <Badge className="bg-blue-50 text-blue-700">
                  {buyer?.completed_orders || 0}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-afrikoni-text-dark mb-1">
                {buyer?.completed_orders || 0}
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Completed Orders</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <MessageCircle className="w-8 h-8 text-purple-500" />
                <Badge className="bg-purple-50 text-purple-700">
                  {buyer?.active_conversations || 0}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-afrikoni-text-dark mb-1">
                {buyer?.active_conversations || 0}
              </div>
              <div className="text-sm text-afrikoni-text-dark/70">Active Conversations</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Intelligence */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>RFQ Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {buyerLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
                    </div>
                  ) : buyer ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-afrikoni-cream rounded-lg">
                        <span className="text-sm text-afrikoni-deep">Total RFQs</span>
                        <span className="font-bold text-afrikoni-chestnut">{buyer.total_rfqs || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-afrikoni-deep">Open RFQs</span>
                        <span className="font-bold text-blue-700">{buyer.open_rfqs || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-afrikoni-deep">Closed RFQs</span>
                        <span className="font-bold text-green-700">{buyer.closed_rfqs || 0}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-afrikoni-deep/70 py-4">No data</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {buyer ? (
                    <>
                      <div className="flex items-center justify-between p-3 bg-afrikoni-cream rounded-lg">
                        <span className="text-sm text-afrikoni-deep">Total Orders</span>
                        <span className="font-bold text-afrikoni-chestnut">{buyer.total_orders || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-afrikoni-deep">Completed</span>
                        <span className="font-bold text-green-700">{buyer.completed_orders || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <span className="text-sm text-afrikoni-deep">Cancelled</span>
                        <span className="font-bold text-red-700">{buyer.cancelled_orders || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-afrikoni-deep">Avg Deal Value</span>
                        <span className="font-bold text-blue-700">
                          ${(buyer.avg_deal_value / 1000).toFixed(1) || 0}k
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-afrikoni-deep/70 py-4">No data</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Conversation Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {buyer ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-afrikoni-cream rounded-lg">
                      <span className="text-sm text-afrikoni-deep">Total Conversations</span>
                      <span className="font-bold text-afrikoni-chestnut">{buyer.total_conversations || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-afrikoni-deep">Active (Last 30 days)</span>
                      <span className="font-bold text-green-700">{buyer.active_conversations || 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-afrikoni-deep/70 py-4">No data</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {buyer ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-afrikoni-cream rounded-lg">
                      <Clock className="w-5 h-5 text-afrikoni-gold" />
                      <div className="flex-1">
                        <div className="font-semibold text-afrikoni-chestnut">Last Activity</div>
                        <div className="text-sm text-afrikoni-deep/70">
                          {buyer.last_activity_date 
                            ? new Date(buyer.last_activity_date).toLocaleDateString()
                            : 'No activity'}
                        </div>
                      </div>
                      <Badge className="bg-gray-100 text-gray-700">
                        {buyer.days_since_last_activity 
                          ? `${Math.floor(buyer.days_since_last_activity)} days ago`
                          : 'Recent'}
                      </Badge>
                    </div>

                    {buyer.last_rfq_date && (
                      <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <div className="font-semibold text-afrikoni-chestnut">Last RFQ</div>
                          <div className="text-sm text-afrikoni-deep/70">
                            {new Date(buyer.last_rfq_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {buyer.last_conversation_date && (
                      <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg">
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                        <div className="flex-1">
                          <div className="font-semibold text-afrikoni-chestnut">Last Conversation</div>
                          <div className="text-sm text-afrikoni-deep/70">
                            {new Date(buyer.last_conversation_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {buyer.last_order_date && (
                      <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <div className="font-semibold text-afrikoni-chestnut">Last Order</div>
                          <div className="text-sm text-afrikoni-deep/70">
                            {new Date(buyer.last_order_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-afrikoni-deep/70 py-8">No activity data available</div>
                )}
              </CardContent>
            </Card>

            {trust && (
              <Card>
                <CardHeader>
                  <CardTitle>Trust & Reputation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-afrikoni-cream rounded-lg">
                      <div className="text-sm text-afrikoni-deep/70 mb-1">Trust Score</div>
                      <div className="text-3xl font-bold text-afrikoni-gold">{trust.current_trust_score || 50}</div>
                    </div>
                    <div className="p-4 bg-afrikoni-cream rounded-lg">
                      <div className="text-sm text-afrikoni-deep/70 mb-1">Completed Deals</div>
                      <div className="text-3xl font-bold text-afrikoni-chestnut">{trust.completed_deals || 0}</div>
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

