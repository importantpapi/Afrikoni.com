/**
 * Buyer Intelligence Dashboard
 * Buyer-focused intelligence view
 */

import React, { useState, useEffect } from 'react';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shared/ui/tabs';
import { Badge } from '@/components/shared/ui/badge';
import { useBuyerIntelligence, useTrustEvolution } from '@/hooks/useTradeIntelligence';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import { ShoppingBag, TrendingUp, DollarSign, MessageCircle, Package, CheckCircle, Clock } from 'lucide-react';

export default function BuyerIntelligence() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady, isAdmin } = useDashboardKernel();
  const [loading, setLoading] = useState(false); // Local loading state
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading buyer intelligence..." ready={isSystemReady} />;
  }
  
  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    return null;
  }
  
  // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel
  const { data: buyerIntelligence, loading: buyerLoading } = useBuyerIntelligence(profileCompanyId);
  const { data: trustEvolution, loading: trustLoading } = useTrustEvolution(profileCompanyId);

  if (loading || buyerLoading || trustLoading) {
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

  const buyer = buyerIntelligence?.[0] || null;
  const trust = trustEvolution?.[0] || null;

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Buyer Intelligence
          </h1>
          <p className="">
            Your buying activity and segment insights
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <ShoppingBag className="w-8 h-8" />
                <Badge className={
                  buyer?.buyer_segment === 'High-Value Buyer' ? 'bg-green-100 text-green-700' :
                  buyer?.buyer_segment === 'Serious Buyer' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }>
                  {buyer?.buyer_segment || 'N/A'}
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">
                {buyer?.buyer_segment || 'N/A'}
              </div>
              <div className="text-sm">Buyer Segment</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8" />
                <Badge className="">
                  ${(buyer?.total_deal_value / 1000).toFixed(1) || 0}k
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">
                ${(buyer?.total_deal_value / 1000).toFixed(1) || 0}k
              </div>
              <div className="text-sm">Total Deal Value</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8" />
                <Badge className="">
                  {buyer?.completed_orders || 0}
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">
                {buyer?.completed_orders || 0}
              </div>
              <div className="text-sm">Completed Orders</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <MessageCircle className="w-8 h-8" />
                <Badge className="">
                  {buyer?.active_conversations || 0}
                </Badge>
              </div>
              <div className="text-2xl font-bold mb-1">
                {buyer?.active_conversations || 0}
              </div>
              <div className="text-sm">Active Conversations</div>
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
                    </div>
                  ) : buyer ? (
                    <>
                      <div className="flex items-center justify-between p-3 rounded-lg">
                        <span className="text-sm">Total RFQs</span>
                        <span className="font-bold">{buyer.total_rfqs || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg">
                        <span className="text-sm">Open RFQs</span>
                        <span className="font-bold">{buyer.open_rfqs || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg">
                        <span className="text-sm">Closed RFQs</span>
                        <span className="font-bold">{buyer.closed_rfqs || 0}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">No data</div>
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
                      <div className="flex items-center justify-between p-3 rounded-lg">
                        <span className="text-sm">Total Orders</span>
                        <span className="font-bold">{buyer.total_orders || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg">
                        <span className="text-sm">Completed</span>
                        <span className="font-bold">{buyer.completed_orders || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg">
                        <span className="text-sm">Cancelled</span>
                        <span className="font-bold">{buyer.cancelled_orders || 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg">
                        <span className="text-sm">Avg Deal Value</span>
                        <span className="font-bold">
                          ${(buyer.avg_deal_value / 1000).toFixed(1) || 0}k
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">No data</div>
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
                    <div className="flex items-center justify-between p-3 rounded-lg">
                      <span className="text-sm">Total Conversations</span>
                      <span className="font-bold">{buyer.total_conversations || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg">
                      <span className="text-sm">Active (Last 30 days)</span>
                      <span className="font-bold">{buyer.active_conversations || 0}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">No data</div>
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
                    <div className="flex items-center gap-4 p-3 rounded-lg">
                      <Clock className="w-5 h-5" />
                      <div className="flex-1">
                        <div className="font-semibold">Last Activity</div>
                        <div className="text-sm">
                          {buyer.last_activity_date 
                            ? new Date(buyer.last_activity_date).toLocaleDateString()
                            : 'No activity'}
                        </div>
                      </div>
                      <Badge className="">
                        {buyer.days_since_last_activity 
                          ? `${Math.floor(buyer.days_since_last_activity)} days ago`
                          : 'Recent'}
                      </Badge>
                    </div>

                    {buyer.last_rfq_date && (
                      <div className="flex items-center gap-4 p-3 rounded-lg">
                        <ShoppingBag className="w-5 h-5" />
                        <div className="flex-1">
                          <div className="font-semibold">Last RFQ</div>
                          <div className="text-sm">
                            {new Date(buyer.last_rfq_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {buyer.last_conversation_date && (
                      <div className="flex items-center gap-4 p-3 rounded-lg">
                        <MessageCircle className="w-5 h-5" />
                        <div className="flex-1">
                          <div className="font-semibold">Last Conversation</div>
                          <div className="text-sm">
                            {new Date(buyer.last_conversation_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {buyer.last_order_date && (
                      <div className="flex items-center gap-4 p-3 rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                        <div className="flex-1">
                          <div className="font-semibold">Last Order</div>
                          <div className="text-sm">
                            {new Date(buyer.last_order_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">No activity data available</div>
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
                    <div className="p-4 rounded-lg">
                      <div className="text-sm mb-1">Trust Score</div>
                      <div className="text-3xl font-bold">{trust.current_trust_score || 50}</div>
                    </div>
                    <div className="p-4 rounded-lg">
                      <div className="text-sm mb-1">Completed Deals</div>
                      <div className="text-3xl font-bold">{trust.completed_deals || 0}</div>
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

