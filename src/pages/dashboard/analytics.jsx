import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Package, Users, FileText, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

export default function DashboardAnalytics() {
  const [currentRole, setCurrentRole] = useState('buyer');
  const [analytics, setAnalytics] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState('30');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('all'); // For hybrid: 'all', 'buyer', 'seller'
  const navigate = useNavigate();

  useEffect(() => {
    loadUserAndAnalytics();
  }, [period, viewMode]);

  const loadUserAndAnalytics = async () => {
    try {
      const userData = await supabaseHelpers.auth.me();
      if (!userData) {
        navigate('/login');
        return;
      }

      const role = userData.role || userData.user_role || 'buyer';
      setCurrentRole(role === 'logistics_partner' ? 'logistics' : role);

      // Get or create company
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, userData);

      const days = parseInt(period);
      const startDate = startOfDay(subDays(new Date(), days)).toISOString();

      // Load analytics data based on role
      const showBuyerAnalytics = (role === 'buyer') || (role === 'hybrid' && (viewMode === 'all' || viewMode === 'buyer'));
      const showSellerAnalytics = (role === 'seller') || (role === 'hybrid' && (viewMode === 'all' || viewMode === 'seller'));

      let buyerData = null;
      let sellerData = null;

      if (showBuyerAnalytics && companyId) {
        const [ordersRes, rfqsRes, quotesRes] = await Promise.all([
          supabase.from('orders').select('*').eq('buyer_company_id', companyId).gte('created_at', startDate),
          supabase.from('rfqs').select('*').eq('buyer_company_id', companyId).gte('created_at', startDate),
          supabase.from('quotes').select('*, rfqs!inner(buyer_company_id)').eq('rfqs.buyer_company_id', companyId).gte('quotes.created_at', startDate)
        ]);

        const orders = ordersRes.data || [];
        const rfqs = rfqsRes.data || [];
        const quotes = quotesRes?.data || [];

        // Build chart data for orders over time
        const ordersByDate = {};
        orders.forEach(order => {
          const date = format(new Date(order.created_at), 'MMM d');
          ordersByDate[date] = (ordersByDate[date] || 0) + 1;
        });

        const chartDataArray = Object.entries(ordersByDate).map(([date, count]) => ({
          date,
          orders: count,
          rfqs: 0
        }));

        buyerData = {
          chartData: chartDataArray,
          analytics: {
            totalOrders: orders.length,
            totalRFQs: rfqs.length,
            totalQuotes: quotes.length,
            totalSpent: orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0)
          }
        };
      }
      
      if (showSellerAnalytics && companyId) {
        const [ordersRes, productsRes] = await Promise.all([
          supabase.from('orders').select('*').eq('seller_company_id', companyId).gte('created_at', startDate),
          supabase.from('products').select('*').eq('supplier_id', companyId).or('company_id.eq.' + companyId)
        ]);

        const orders = ordersRes.data || [];
        const products = productsRes.data || [];

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
          const date = format(new Date(order.created_at), 'MMM d');
          ordersByDate[date] = (ordersByDate[date] || 0) + 1;
        });

        const combinedChartData = Object.keys({ ...revenueByDate, ...ordersByDate }).map(date => ({
          date,
          revenue: Math.round(revenueByDate[date] || 0),
          orders: ordersByDate[date] || 0
        }));

        // Load inquiries (messages related to products)
        const { data: inquiriesRes } = await supabase
          .from('messages')
          .select('*')
          .eq('receiver_company_id', companyId)
          .not('related_type', 'is', null)
          .gte('created_at', startDate);

        const inquiries = inquiriesRes?.data || [];

        // Load top categories
        const { data: categoryData } = await supabase
          .from('products')
          .select('category_id, categories(name)')
          .eq('supplier_id', companyId)
          .or(`company_id.eq.${companyId}`);

        const categoryCounts = {};
        (categoryData || []).forEach(p => {
          if (p.categories?.name) {
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
      // Error logged (removed for production)
      toast.error('Failed to load analytics');
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

  return (
    <DashboardLayout currentRole={currentRole}>
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">Analytics & Insights</h1>
            <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">Track your performance and insights</p>
          </div>
          {currentRole === 'hybrid' && (
            <div className="flex items-center gap-1 bg-afrikoni-cream rounded-lg p-1">
              {['all', 'buyer', 'seller'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                    viewMode === mode
                      ? 'bg-afrikoni-offwhite text-afrikoni-gold shadow-sm'
                      : 'text-afrikoni-deep hover:text-afrikoni-chestnut'
                  }`}
                >
                  {mode === 'all' ? 'All' : mode === 'buyer' ? 'Buyer' : 'Seller'}
                </button>
              ))}
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
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep">Total Orders</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.totalOrders}</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-afrikoni-gold" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep">Total RFQs</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.totalRFQs}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
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
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep">Total Sales</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.totalSales}</p>
                    </div>
                    <ShoppingCart className="w-8 h-8 text-afrikoni-gold" />
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
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep">Products</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.totalProducts}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-afrikoni-deep">Total Views</p>
                      <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.totalViews}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              {analytics.totalInquiries !== undefined && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-afrikoni-deep">Inquiries</p>
                        <p className="text-2xl font-bold text-afrikoni-chestnut">{analytics.totalInquiries}</p>
                      </div>
                      <MessageSquare className="w-8 h-8 text-blue-600" />
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

        {/* Period Selector */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

