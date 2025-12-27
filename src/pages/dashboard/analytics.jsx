import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';
import { getUserRole } from '@/utils/roleHelpers';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Package, Users, FileText, MessageSquare, CheckCircle, Clock, Sparkles, Target, MapPin, Image as ImageIcon, Shield } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import RequireDashboardRole from '@/guards/RequireDashboardRole';

function DashboardAnalyticsInner() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState('30');
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [viewMode, setViewMode] = useState('all'); // For hybrid: 'all', 'buyer', 'seller'
  const navigate = useNavigate();
  const currentRole = getUserRole(profile || user) || role || 'buyer';

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[DashboardAnalytics] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect to login
    if (!user) {
      console.log('[DashboardAnalytics] No user → redirecting to login');
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadUserAndAnalytics();
  }, [authReady, authLoading, user, profile, role, period, viewMode, navigate]);

  const loadUserAndAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Use auth from context (no duplicate call)
      const normalizedRole = getUserRole(profile || user) || role || 'buyer';
      const companyId = profile?.company_id || null;

      const days = parseInt(period);
      const startDate = startOfDay(subDays(new Date(), days)).toISOString();

      // Load analytics data based on role
      const showBuyerAnalytics = (normalizedRole === 'buyer') || (normalizedRole === 'hybrid' && (viewMode === 'all' || viewMode === 'buyer'));
      const showSellerAnalytics = (normalizedRole === 'seller') || (normalizedRole === 'hybrid' && (viewMode === 'all' || viewMode === 'seller'));

      let buyerData = null;
      let sellerData = null;

      if (showBuyerAnalytics && companyId) {
        const [ordersRes, rfqsRes, quotesRes] = await Promise.all([
          supabase.from('orders').select('*').eq('buyer_company_id', companyId).gte('created_at', startDate),
          supabase.from('rfqs').select('*').eq('buyer_company_id', companyId).gte('created_at', startDate),
          supabase.from('quotes').select('*, rfqs!inner(buyer_company_id)').eq('rfqs.buyer_company_id', companyId).gte('quotes.created_at', startDate)
        ]);

        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const rfqs = Array.isArray(rfqsRes.data) ? rfqsRes.data : [];
        const quotes = Array.isArray(quotesRes?.data) ? quotesRes.data : [];

        // Build chart data for orders over time
        const ordersByDate = {};
        orders.forEach(order => {
          if (order && order.created_at) {
            const date = format(new Date(order.created_at), 'MMM d');
            ordersByDate[date] = (ordersByDate[date] || 0) + 1;
          }
        });

        const chartDataArray = Object.entries(ordersByDate).map(([date, count]) => ({
          date,
          orders: count,
          rfqs: 0
        }));

        // Trade execution metrics: Deal status tracking
        const openRfqs = rfqs.filter(r => r.status === 'pending_review' || r.status === 'matched' || r.status === 'clarification_requested');
        const closedDeals = orders.filter(o => o.status === 'completed' || o.status === 'delivered');
        const negotiatingDeals = orders.filter(o => o.status === 'processing' || o.status === 'confirmed');
        
        buyerData = {
          chartData: chartDataArray,
          analytics: {
          totalOrders: orders.length,
          totalRFQs: rfqs.length,
            totalQuotes: quotes.length,
          totalSpent: orders.reduce((sum, o) => sum + (parseFloat(o?.total_amount) || 0), 0),
            // Trade execution metrics (primary)
            openRfqs: openRfqs.length,
            closedDeals: closedDeals.length,
            negotiatingDeals: negotiatingDeals.length,
            avgResponseTime: quotes.length > 0 ? '24h' : 'N/A' // Placeholder - calculate from quote timestamps
          }
        };
      }
      
      if (showSellerAnalytics && companyId) {
        const [ordersRes, productsRes, rfqsRes, quotesRes] = await Promise.all([
          supabase.from('orders').select('*').eq('seller_company_id', companyId).gte('created_at', startDate),
          supabase.from('products').select('*').eq('company_id', companyId),
          supabase.from('rfqs').select('*, matched_supplier_ids').gte('created_at', startDate),
          supabase.from('quotes').select('*, rfqs!inner(*)').eq('supplier_company_id', companyId).gte('created_at', startDate)
        ]);

        const orders = ordersRes.data || [];
        const products = productsRes.data || [];
        
        // Trade execution metrics: RFQs and quotes
        const allRfqs = rfqsRes.data || [];
        const matchedRfqs = allRfqs.filter(rfq => 
          rfq.matched_supplier_ids && 
          Array.isArray(rfq.matched_supplier_ids) && 
          rfq.matched_supplier_ids.includes(companyId)
        );
        const quotes = quotesRes.data || [];
        const acceptedQuotes = quotes.filter(q => q.status === 'accepted' || q.status === 'awarded');
        const winRate = quotes.length > 0 ? Math.round((acceptedQuotes.length / quotes.length) * 100) : 0;
        
        // Countries reached (from orders)
        const uniqueBuyerCountries = new Set();
        orders.forEach(o => {
          if (o.buyer_company_id) {
            // Will be populated from join below
          }
        });

        // Build chart data for revenue over time
        const revenueByDate = {};
        orders.forEach(order => {
          const date = format(new Date(order.created_at), 'MMM d');
          revenueByDate[date] = (revenueByDate[date] || 0) + (parseFloat(order.total_amount) || 0);
        });

        const chartDataArray = Object.entries(revenueByDate).map(([date, revenue]) => ({
          date,
          revenue: Math.round(revenue),
          orders: 0
        }));

        // Also add order count
        const ordersByDate = {};
        orders.forEach(order => {
          if (order && order.created_at) {
            const date = format(new Date(order.created_at), 'MMM d');
            ordersByDate[date] = (ordersByDate[date] || 0) + 1;
          }
        });

        const combinedChartData = Object.keys({ ...revenueByDate, ...ordersByDate }).map(date => ({
          date,
          revenue: Math.round(revenueByDate[date] || 0),
          orders: ordersByDate[date] || 0
        }));

        // Load inquiries (messages related to products)
        const { data: inquiriesData } = await supabase
          .from('messages')
          .select('*')
          .eq('receiver_company_id', companyId)
          .not('related_type', 'is', null)
          .gte('created_at', startDate);

        const inquiries = Array.isArray(inquiriesData) ? inquiriesData : [];

        // Load top categories
        const { data: categoryData } = await supabase
          .from('products')
          .select('category_id, categories(name)')
          .eq('company_id', companyId);

        const categoryCounts = {};
        (Array.isArray(categoryData) ? categoryData : []).forEach(p => {
          if (p && p.categories?.name) {
            categoryCounts[p.categories.name] = (categoryCounts[p.categories.name] || 0) + 1;
          }
        });

        // Load buyer countries
        const { data: buyerOrders } = await supabase
          .from('orders')
          .select('buyer_company_id, companies:buyer_company_id(country)')
          .eq('seller_company_id', companyId)
          .gte('created_at', startDate);

        const countryCounts = {};
        (buyerOrders || []).forEach(o => {
          if (o.companies?.country) {
            countryCounts[o.companies.country] = (countryCounts[o.companies.country] || 0) + 1;
          }
        });

        sellerData = {
          chartData: combinedChartData,
          analytics: {
          totalSales: orders.length,
          totalProducts: products.length,
          totalRevenue: orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
            // Trade execution metrics (primary)
            rfqsReceived: matchedRfqs.length,
            quotesSent: quotes.length,
            winRate: winRate,
            countriesReached: Object.keys(countryCounts).length,
            // Secondary metrics (de-emphasized)
            totalViews: products.reduce((sum, p) => sum + (p.views || 0), 0),
            totalInquiries: inquiries.length,
            topCategories: Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
            buyerCountries: Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
          }
        };
      }

      // For hybrid users, combine data if viewing 'all'
      if (role === 'hybrid' && viewMode === 'all' && buyerData && sellerData) {
        setChartData([...buyerData.chartData, ...sellerData.chartData]);
        setAnalytics({
          ...buyerData.analytics,
          ...sellerData.analytics,
          isHybrid: true
        });
      } else if (buyerData) {
        setChartData(buyerData.chartData);
        setAnalytics(buyerData.analytics);
      } else if (sellerData) {
        setChartData(sellerData.chartData);
        setAnalytics(sellerData.analytics);
      } else if (role === 'logistics') {
        const [shipmentsRes, ordersRes] = await Promise.all([
          supabase
            .from('shipments')
            .select('*')
            .eq('logistics_partner_id', companyId)
            .gte('created_at', startDate),
          supabase
          .from('orders')
          .select('*')
          .in('status', ['processing', 'shipped', 'delivered'])
          .gte('created_at', startDate)
            .limit(100)
        ]);

        const shipments = shipmentsRes.data || [];
        const orders = ordersRes.data || [];

        // Build shipments by status chart
        const shipmentsByStatus = {};
        shipments.forEach(s => {
          shipmentsByStatus[s.status] = (shipmentsByStatus[s.status] || 0) + 1;
        });

        // Calculate delivery success rate
        const delivered = shipments.filter(s => s.status === 'delivered').length;
        const successRate = shipments.length > 0 ? (delivered / shipments.length) * 100 : 0;

        // Calculate average delivery time
        const deliveredShipments = shipments.filter(s => s.status === 'delivered' && s.delivered_at && s.created_at);
        const avgDeliveryTime = deliveredShipments.length > 0
          ? deliveredShipments.reduce((sum, s) => {
              const days = (new Date(s.delivered_at) - new Date(s.created_at)) / (1000 * 60 * 60 * 24);
              return sum + days;
            }, 0) / deliveredShipments.length
          : 0;

        setChartData(Object.entries(shipmentsByStatus).map(([status, count]) => ({ status, count })));
        setAnalytics({
          totalShipments: shipments.length,
          totalRevenue: orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
          successRate: Math.round(successRate),
          avgDeliveryTime: Math.round(avgDeliveryTime),
          shipmentsByStatus: Object.entries(shipmentsByStatus)
        });
      }
    } catch (error) {
      // Fail gracefully - treat as no data instead of error
      setAnalytics(null);
      setChartData([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout currentRole={currentRole}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading analytics..." />;
  }

  return (
    <DashboardLayout currentRole={currentRole}>
      <div className="space-y-6">
        {/* v2.5: Premium Header with Improved Spacing */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-3 leading-tight">Analytics & Insights</h1>
            <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">Track your performance and insights</p>
          </div>
          {/* v2.5: Premium Segmented Role Switcher */}
          {currentRole === 'hybrid' && (
            <div className="flex items-center gap-0.5 bg-afrikoni-sand/40 p-1 rounded-full border border-afrikoni-gold/20 shadow-premium relative">
              {['all', 'buyer', 'seller'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 capitalize z-10 min-w-[60px] ${
                    viewMode === mode
                      ? 'text-afrikoni-charcoal'
                      : 'text-afrikoni-text-dark/70 hover:text-afrikoni-text-dark'
                  }`}
                >
                  {mode === 'all' ? 'All' : mode === 'buyer' ? 'Buyer' : 'Seller'}
                </button>
              ))}
              <motion.div
                layoutId="activeAnalyticsView"
                className="absolute top-1 bottom-1 rounded-full bg-afrikoni-gold shadow-afrikoni z-0"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                animate={{
                  x: viewMode === 'all' ? 0 : viewMode === 'buyer' ? 'calc(33.333% + 0.125rem)' : 'calc(66.666% + 0.25rem)',
                  width: 'calc(33.333% - 0.25rem)',
                }}
              />
            </div>
          )}
        </motion.div>

        {/* Stats */}
        {!analytics ? (
          <EmptyState 
            type="analytics"
            title="No analytics data yet"
            description="Complete your company profile or add products to generate insights."
            cta="View Products"
            ctaLink="/dashboard/products"
          />
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentRole === 'buyer' && analytics && (
            <>
              {/* v2.5: Premium Analytics KPI Cards */}
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-afrikoni-gold" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">{analytics.totalOrders}</div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">Total Orders</div>
                </CardContent>
              </Card>
              <Card className="border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep font-semibold">RFQs Submitted</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.totalRFQs}</p>
                      {analytics.openRfqs !== undefined && (
                        <p className="text-xs text-afrikoni-deep/60 mt-1">{analytics.openRfqs} active</p>
                      )}
                    </div>
                    <FileText className="w-8 h-8 text-afrikoni-gold" />
                  </div>
                </CardContent>
              </Card>
              {analytics.negotiatingDeals !== undefined && (
                <Card className="border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-afrikoni-deep font-semibold">Deals in Progress</p>
                        <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.negotiatingDeals}</p>
                        <p className="text-xs text-afrikoni-deep/60 mt-1">Negotiating</p>
                      </div>
                      <Clock className="w-8 h-8 text-afrikoni-gold" />
                    </div>
                  </CardContent>
                </Card>
              )}
              {analytics.closedDeals !== undefined && (
                <Card className="border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-afrikoni-deep font-semibold">Deals Closed</p>
                        <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.closedDeals}</p>
                        <p className="text-xs text-afrikoni-deep/60 mt-1">Completed</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep">Total Spent</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">${analytics.totalSpent.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              {analytics.totalQuotes !== undefined && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-afrikoni-deep">Quotes Received</p>
                        <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.totalQuotes}</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {((currentRole === 'seller' || (currentRole === 'hybrid' && (viewMode === 'all' || viewMode === 'seller'))) && analytics && analytics.totalSales !== undefined) && (
            <>
              <Card className="border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep font-semibold">Deals Facilitated</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.totalSales}</p>
                      <p className="text-xs text-afrikoni-deep/60 mt-1">Successful orders</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-afrikoni-gold" />
                  </div>
                </CardContent>
              </Card>
              {/* Trade execution metrics - primary focus */}
              {analytics.rfqsReceived !== undefined && (
                <Card className="border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-afrikoni-deep font-semibold">RFQs Received</p>
                        <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.rfqsReceived}</p>
                        <p className="text-xs text-afrikoni-deep/60 mt-1">Active opportunities</p>
                      </div>
                      <FileText className="w-8 h-8 text-afrikoni-gold" />
                    </div>
                  </CardContent>
                </Card>
              )}
              {analytics.quotesSent !== undefined && (
                <Card className="border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-afrikoni-deep font-semibold">Quotes Sent</p>
                        <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.quotesSent}</p>
                        <p className="text-xs text-afrikoni-deep/60 mt-1">Responses submitted</p>
                      </div>
                      <FileText className="w-8 h-8 text-afrikoni-gold" />
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Secondary metrics - de-emphasized */}
              {analytics.totalViews !== undefined && (
                <Card className="opacity-70">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-afrikoni-deep/60">Total Views</p>
                        <p className="text-xl font-semibold text-afrikoni-chestnut">{analytics.totalViews}</p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {currentRole === 'logistics' && analytics && (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep">Total Shipments</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.totalShipments}</p>
                    </div>
                    <Package className="w-8 h-8 text-afrikoni-gold" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep">Success Rate</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.successRate}%</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep">Avg Delivery Time</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.avgDeliveryTime}d</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep">Total Revenue</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">${analytics.totalRevenue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
        )}

        {/* v2.5: Premium Chart Section */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
            <div className="flex items-center justify-between">
              {/* v2.5: Premium Section Title with Gold Underline */}
              <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 inline-block flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-afrikoni-gold" />
                Performance Overview
              </CardTitle>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-afrikoni-deep/70">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>No data for selected period</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {((currentRole === 'seller' || (currentRole === 'hybrid' && (viewMode === 'all' || viewMode === 'seller'))) && analytics && analytics.totalRevenue !== undefined && chartData.length > 0) && (
                  <>
                    <div className="h-64">
                      <h3 className="text-sm font-semibold mb-4">Revenue Over Time</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#d97706" 
                            strokeWidth={2}
                            name="Revenue ($)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {analytics.topCategories && analytics.topCategories.length > 0 && (
                    <div className="h-64">
                        <h3 className="text-sm font-semibold mb-4">Top Categories</h3>
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.topCategories.map(([name, count]) => ({ name, count }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          />
                          <Legend />
                            <Bar dataKey="count" fill="#d97706" name="Products" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    )}
                    {analytics.buyerCountries && analytics.buyerCountries.length > 0 && (
                      <div className="h-64">
                        <h3 className="text-sm font-semibold mb-4">Buyer Countries</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.buyerCountries.map(([name, value]) => ({ name, value }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {analytics.buyerCountries.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'][index % 5]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
                {((currentRole === 'buyer' || (currentRole === 'hybrid' && (viewMode === 'all' || viewMode === 'buyer'))) && chartData.length > 0) && (
                  <div className="h-64">
                    <h3 className="text-sm font-semibold mb-4">Orders Over Time</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Bar dataKey="orders" fill="#d97706" name="Orders" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {currentRole === 'logistics' && analytics && analytics.shipmentsByStatus && analytics.shipmentsByStatus.length > 0 && (
                  <div className="h-64">
                    <h3 className="text-sm font-semibold mb-4">Shipments by Status</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.shipmentsByStatus.map(([status, count]) => ({ status, count }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="status" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Bar dataKey="count" fill="#d97706" name="Shipments" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Supplier Reliability Indicators - Trade-focused */}
            {(currentRole === 'seller' || currentRole === 'hybrid') && analytics && (analytics.winRate !== undefined || analytics.countriesReached !== undefined) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 pt-8 border-t border-afrikoni-gold/20"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-afrikoni-gold" />
                  <h3 className="text-xl font-bold text-afrikoni-chestnut">Trade Performance</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {analytics.winRate !== undefined && (
                    <Card className="border-afrikoni-gold/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-afrikoni-chestnut mb-1">
                              Quote Acceptance Rate
                            </p>
                            <p className="text-xs text-afrikoni-deep/70">
                              {analytics.winRate}% of your quotes result in deals. This indicates strong supplier reliability.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {analytics.countriesReached !== undefined && analytics.countriesReached > 0 && (
                    <Card className="border-afrikoni-gold/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-afrikoni-chestnut mb-1">
                              Geographic Reach
                            </p>
                            <p className="text-xs text-afrikoni-deep/70">
                              Active in {analytics.countriesReached} countries. Demonstrates cross-border trade capability.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function DashboardAnalytics() {
  return (
    <RequireDashboardRole allow={['buyer', 'hybrid']}>
      <DashboardAnalyticsInner />
    </RequireDashboardRole>
  );
}

