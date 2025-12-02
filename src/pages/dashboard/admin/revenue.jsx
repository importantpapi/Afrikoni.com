/**
 * Afrikoni Shield™ - Admin Revenue Dashboard
 * CEO-level financial insights: revenue, commissions, payment methods, growth trends
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Building2, Globe, Package,
  ArrowLeft, Calendar, BarChart3, PieChart, Activity, Percent, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isAdmin } from '@/utils/permissions';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import AccessDenied from '@/components/AccessDenied';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { toast } from 'sonner';

const COLORS = ['#D4A937', '#8140FF', '#3AB795', '#E85D5D', '#C9A961', '#8B5CF6', '#06B6D4'];

export default function AdminRevenue() {
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    commissionRevenue: 0,
    escrowVolume: 0,
    netRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    profitMargin: 0
  });
  const [revenueByCountry, setRevenueByCountry] = useState([]);
  const [revenueByCategory, setRevenueByCategory] = useState([]);
  const [revenueBySupplier, setRevenueBySupplier] = useState([]);
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [commissionTrend, setCommissionTrend] = useState([]);
  const [monthlyComparison, setMonthlyComparison] = useState([]);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (hasAccess) {
      loadRevenueData();
    }
  }, [hasAccess, timeRange]);

  const checkAccess = async () => {
    try {
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
      setHasAccess(isAdmin(userData));
    } catch (error) {
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '90d':
        return { start: subDays(now, 90), end: now };
      case '1y':
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const loadRevenueData = async () => {
    try {
      const { start, end } = getDateRange();
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      // Load orders with payment and company data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          buyer_company:buyer_company_id(country, company_name),
          seller_company:seller_company_id(country, company_name),
          products(category_id, categories(name))
        `)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .in('payment_status', ['paid', 'completed']);

      if (ordersError) throw ordersError;

      // Calculate commission (assume 3% of order value)
      const COMMISSION_RATE = 0.03;
      const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      const commissionRevenue = totalRevenue * COMMISSION_RATE;
      const netRevenue = commissionRevenue; // For now, commission is the revenue
      const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

      // Calculate revenue by country
      const countryRevenue = {};
      orders.forEach(order => {
        const country = order.buyer_company?.country || order.seller_company?.country || 'Unknown';
        if (!countryRevenue[country]) {
          countryRevenue[country] = { revenue: 0, orders: 0, commission: 0 };
        }
        const orderValue = parseFloat(order.total_amount) || 0;
        countryRevenue[country].revenue += orderValue;
        countryRevenue[country].orders += 1;
        countryRevenue[country].commission += orderValue * COMMISSION_RATE;
      });
      setRevenueByCountry(
        Object.entries(countryRevenue)
          .map(([country, data]) => ({
            country,
            revenue: data.revenue,
            orders: data.orders,
            commission: data.commission
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)
      );

      // Calculate revenue by category
      const categoryRevenue = {};
      orders.forEach(order => {
        const categoryName = order.products?.categories?.name || 'Uncategorized';
        if (!categoryRevenue[categoryName]) {
          categoryRevenue[categoryName] = { revenue: 0, orders: 0, commission: 0 };
        }
        const orderValue = parseFloat(order.total_amount) || 0;
        categoryRevenue[categoryName].revenue += orderValue;
        categoryRevenue[categoryName].orders += 1;
        categoryRevenue[categoryName].commission += orderValue * COMMISSION_RATE;
      });
      setRevenueByCategory(
        Object.entries(categoryRevenue)
          .map(([category, data]) => ({
            category,
            revenue: data.revenue,
            orders: data.orders,
            commission: data.commission
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)
      );

      // Calculate revenue by supplier
      const supplierRevenue = {};
      orders.forEach(order => {
        const supplierName = order.seller_company?.company_name || 'Unknown Supplier';
        if (!supplierRevenue[supplierName]) {
          supplierRevenue[supplierName] = { revenue: 0, orders: 0, commission: 0 };
        }
        const orderValue = parseFloat(order.total_amount) || 0;
        supplierRevenue[supplierName].revenue += orderValue;
        supplierRevenue[supplierName].orders += 1;
        supplierRevenue[supplierName].commission += orderValue * COMMISSION_RATE;
      });
      setRevenueBySupplier(
        Object.entries(supplierRevenue)
          .map(([supplier, data]) => ({
            supplier,
            revenue: data.revenue,
            orders: data.orders,
            commission: data.commission
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10)
      );

      // Payment method breakdown
      const paymentMethods = {};
      orders.forEach(order => {
        const method = order.payment_method || 'escrow';
        if (!paymentMethods[method]) {
          paymentMethods[method] = { count: 0, revenue: 0 };
        }
        paymentMethods[method].count += 1;
        paymentMethods[method].revenue += parseFloat(order.total_amount) || 0;
      });
      setPaymentMethodData(
        Object.entries(paymentMethods).map(([method, data]) => ({
          method: method === 'escrow' ? 'Escrow' : method === 'card' ? 'Credit Card' : method === 'bank_transfer' ? 'Bank Transfer' : method,
          count: data.count,
          revenue: data.revenue,
          percentage: (data.revenue / totalRevenue) * 100
        }))
      );

      // Build trend data
      const trendData = {};
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const key = format(date, 'MMM dd');
        if (!trendData[key]) {
          trendData[key] = { revenue: 0, commission: 0 };
        }
        const orderValue = parseFloat(order.total_amount) || 0;
        trendData[key].revenue += orderValue;
        trendData[key].commission += orderValue * COMMISSION_RATE;
      });
      setRevenueTrend(
        Object.entries(trendData)
          .map(([date, data]) => ({ date, revenue: Math.round(data.revenue), commission: Math.round(data.commission) }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      );
      setCommissionTrend(
        Object.entries(trendData)
          .map(([date, data]) => ({ date, commission: Math.round(data.commission) }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
      );

      // Calculate growth (compare with previous period)
      const previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - (end - start) / (1000 * 60 * 60 * 24));
      const previousEnd = start;

      const { data: previousOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString())
        .in('payment_status', ['paid', 'completed']);

      const previousRevenue = previousOrders?.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) || 0;
      const previousCommission = previousRevenue * COMMISSION_RATE;
      const revenueGrowth = previousRevenue > 0 ? ((commissionRevenue - previousCommission) / previousCommission) * 100 : 0;

      // Calculate profit margin (simplified: commission revenue - estimated costs)
      const estimatedCosts = commissionRevenue * 0.3; // Assume 30% operational costs
      const profitMargin = commissionRevenue > 0 ? ((commissionRevenue - estimatedCosts) / commissionRevenue) * 100 : 0;

      setMetrics({
        totalRevenue,
        commissionRevenue,
        escrowVolume: totalRevenue, // Escrow volume equals total revenue
        netRevenue: commissionRevenue - estimatedCosts,
        totalOrders: orders.length,
        averageOrderValue,
        revenueGrowth,
        profitMargin
      });

      // Monthly comparison
      const monthlyData = {};
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = format(date, 'MMM yyyy');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, commission: 0, orders: 0 };
        }
        const orderValue = parseFloat(order.total_amount) || 0;
        monthlyData[monthKey].revenue += orderValue;
        monthlyData[monthKey].commission += orderValue * COMMISSION_RATE;
        monthlyData[monthKey].orders += 1;
      });
      setMonthlyComparison(
        Object.entries(monthlyData)
          .map(([month, data]) => ({
            month,
            revenue: Math.round(data.revenue),
            commission: Math.round(data.commission),
            orders: data.orders
          }))
          .sort((a, b) => new Date(a.month) - new Date(b.month))
      );

    } catch (error) {
      toast.error('Failed to load revenue data');
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentRole="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-afrikoni-text-dark/70">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <DashboardLayout currentRole="admin">
      <div className="space-y-6">
        {/* Premium Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link to="/dashboard/admin" className="inline-flex items-center gap-2 text-afrikoni-gold hover:text-afrikoni-gold/80 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Panel
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-afrikoni-gold" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2 leading-tight">
                  Revenue Dashboard
                </h1>
                <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
                  Financial insights: revenue, commissions, payment methods, and growth trends
                </p>
              </div>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 border-afrikoni-gold/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                  {metrics.revenueGrowth !== 0 && (
                    <div className={`flex items-center gap-1 text-xs ${metrics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.revenueGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(metrics.revenueGrowth).toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-gold mb-2">
                  ${(metrics.commissionRevenue / 1000).toFixed(1)}K
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Commission Revenue
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-purple/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-afrikoni-purple" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-purple mb-2">
                  ${(metrics.totalRevenue / 1000).toFixed(1)}K
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Total GMV
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                    <Percent className="w-6 h-6 text-afrikoni-green" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-green mb-2">
                  {metrics.profitMargin.toFixed(1)}%
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Profit Margin
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-clay/20 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-afrikoni-clay" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  ${metrics.averageOrderValue.toFixed(0)}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Avg Order Value
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border border-afrikoni-gold/20">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Revenue Trend */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                    Revenue & Commission Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {revenueTrend.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={revenueTrend}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4A937" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#D4A937" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8140FF" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8140FF" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                        <XAxis dataKey="date" stroke="#2E2A1F" fontSize={12} />
                        <YAxis stroke="#2E2A1F" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FDF8F0', 
                            border: '1px solid #D4A937',
                            borderRadius: '8px'
                          }} 
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#D4A937" 
                          fillOpacity={1} 
                          fill="url(#colorRevenue)"
                          name="Total Revenue"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="commission" 
                          stroke="#8140FF" 
                          fillOpacity={1} 
                          fill="url(#colorCommission)"
                          name="Commission"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Method Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
            >
              <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                    Payment Method Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {paymentMethodData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ method, percentage }) => `${method}: ${percentage.toFixed(1)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-6">
            {/* Revenue by Country */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block flex items-center gap-2">
                    <Globe className="w-5 h-5 text-afrikoni-gold" />
                    Revenue by Country
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {revenueByCountry.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueByCountry}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                        <XAxis dataKey="country" stroke="#2E2A1F" fontSize={12} angle={-45} textAnchor="end" height={100} />
                        <YAxis stroke="#2E2A1F" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FDF8F0', 
                            border: '1px solid #D4A937',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="revenue" fill="#D4A937" radius={[8, 8, 0, 0]} name="Revenue" />
                        <Bar dataKey="commission" fill="#8140FF" radius={[8, 8, 0, 0]} name="Commission" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Revenue by Category */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
            >
              <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block flex items-center gap-2">
                    <Package className="w-5 h-5 text-afrikoni-gold" />
                    Revenue by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {revenueByCategory.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueByCategory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                        <XAxis dataKey="category" stroke="#2E2A1F" fontSize={12} angle={-45} textAnchor="end" height={100} />
                        <YAxis stroke="#2E2A1F" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FDF8F0', 
                            border: '1px solid #D4A937',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="revenue" fill="#3AB795" radius={[8, 8, 0, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Suppliers by Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-afrikoni-gold" />
                    Top Suppliers by Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {revenueBySupplier.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                      No data available
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {revenueBySupplier.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-gold/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-afrikoni-gold/20 rounded-full flex items-center justify-center font-bold text-afrikoni-gold">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-afrikoni-text-dark">{item.supplier}</div>
                              <div className="text-xs text-afrikoni-text-dark/70">{item.orders} orders</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-afrikoni-gold">${(item.commission / 1000).toFixed(1)}K</div>
                            <div className="text-xs text-afrikoni-text-dark/70">${(item.revenue / 1000).toFixed(1)}K GMV</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Monthly Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                    Monthly Revenue Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {monthlyComparison.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyComparison}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                        <XAxis dataKey="month" stroke="#2E2A1F" fontSize={12} />
                        <YAxis stroke="#2E2A1F" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FDF8F0', 
                            border: '1px solid #D4A937',
                            borderRadius: '8px'
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="#D4A937" radius={[8, 8, 0, 0]} name="Total Revenue" />
                        <Bar dataKey="commission" fill="#8140FF" radius={[8, 8, 0, 0]} name="Commission" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Commission Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
            >
              <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                    Commission Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {commissionTrend.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={commissionTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                        <XAxis dataKey="date" stroke="#2E2A1F" fontSize={12} />
                        <YAxis stroke="#2E2A1F" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FDF8F0', 
                            border: '1px solid #8140FF',
                            borderRadius: '8px'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="commission" 
                          stroke="#8140FF" 
                          strokeWidth={3}
                          dot={{ fill: '#8140FF', r: 4 }}
                          name="Commission Revenue"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-afrikoni-gold mb-2">
                    ${(metrics.commissionRevenue / 1000).toFixed(1)}K
                  </div>
                  <div className="text-sm text-afrikoni-text-dark/70">Commission Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-afrikoni-green mb-2">
                    {metrics.profitMargin.toFixed(1)}%
                  </div>
                  <div className="text-sm text-afrikoni-text-dark/70">Profit Margin</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-afrikoni-purple mb-2">
                    {metrics.totalOrders}
                  </div>
                  <div className="text-sm text-afrikoni-text-dark/70">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${metrics.revenueGrowth > 0 ? 'text-green-600' : metrics.revenueGrowth < 0 ? 'text-red-600' : 'text-afrikoni-text-dark'}`}>
                    {metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%
                  </div>
                  <div className="text-sm text-afrikoni-text-dark/70">Revenue Growth</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

