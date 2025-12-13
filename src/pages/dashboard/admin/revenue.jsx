/**
 * Executive Revenue Dashboard
 * For Youba only - tracks all revenue streams
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, ShoppingCart, Truck, Shield, Sparkles, Calendar } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { isAdmin } from '@/utils/permissions';
import { useNavigate } from 'react-router-dom';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

export default function RevenueDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'
  const [revenueData, setRevenueData] = useState({
    mrr: 0,
    totalCommissions: 0,
    logisticsMargin: 0,
    verificationFees: 0,
    protectionFees: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    verifiedSuppliers: 0,
    successfulOrders: 0
  });
  const [chartData, setChartData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoad();
  }, [timeRange]);

  const checkAuthAndLoad = async () => {
    try {
      const { user } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!user) {
        navigate('/login');
        return;
      }

      const admin = isAdmin(user);
      if (!admin) {
        toast.error('Unauthorized: Admin access required');
        navigate('/dashboard');
        return;
      }

      setIsAuthorized(true);
      await loadRevenueData();
    } catch (error) {
      console.error('Error checking auth:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRevenueData = async () => {
    try {
      const now = new Date();
      let startDate, endDate;

      switch (timeRange) {
        case 'week':
          startDate = subDays(now, 7);
          endDate = now;
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }

      // Load MRR (Monthly Recurring Revenue)
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('monthly_price, plan_type')
        .eq('status', 'active');

      const mrr = subscriptions?.reduce((sum, sub) => sum + (parseFloat(sub.monthly_price) || 0), 0) || 0;

      // Load commissions
      const { data: commissions } = await supabase
        .from('revenue_transactions')
        .select('amount')
        .eq('transaction_type', 'commission')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const totalCommissions = commissions?.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;

      // Load logistics margin
      const { data: logistics } = await supabase
        .from('revenue_transactions')
        .select('amount')
        .eq('transaction_type', 'logistics_margin')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const logisticsMargin = logistics?.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;

      // Load verification fees
      const { data: verifications } = await supabase
        .from('revenue_transactions')
        .select('amount')
        .eq('transaction_type', 'verification_fee')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const verificationFees = verifications?.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;

      // Load protection fees
      const { data: protection } = await supabase
        .from('revenue_transactions')
        .select('amount')
        .eq('transaction_type', 'protection_fee')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const protectionFees = protection?.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;

      // Count active subscriptions
      const { count: activeSubs } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Count verified suppliers
      const { count: verified } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('verified', true);

      // Count successful orders
      const { count: orders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      setRevenueData({
        mrr,
        totalCommissions,
        logisticsMargin,
        verificationFees,
        protectionFees,
        totalRevenue: mrr + totalCommissions + logisticsMargin + verificationFees + protectionFees,
        activeSubscriptions: activeSubs || 0,
        verifiedSuppliers: verified || 0,
        successfulOrders: orders || 0
      });

      // Load chart data (daily breakdown)
      await loadChartData(startDate, endDate);
    } catch (error) {
      console.error('Error loading revenue data:', error);
      toast.error('Failed to load revenue data');
    }
  };

  const loadChartData = async (startDate, endDate) => {
    try {
      const { data: transactions } = await supabase
        .from('revenue_transactions')
        .select('amount, transaction_type, created_at')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      // Group by date
      const dailyData = {};
      transactions?.forEach(t => {
        const date = format(new Date(t.created_at), 'MMM dd');
        if (!dailyData[date]) {
          dailyData[date] = { date, commission: 0, subscription: 0, logistics: 0, other: 0 };
        }
        const amount = parseFloat(t.amount) || 0;
        if (t.transaction_type === 'commission') dailyData[date].commission += amount;
        else if (t.transaction_type === 'subscription') dailyData[date].subscription += amount;
        else if (t.transaction_type === 'logistics_margin') dailyData[date].logistics += amount;
        else dailyData[date].other += amount;
      });

      setChartData(Object.values(dailyData));
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">
              Executive Revenue Dashboard
            </h1>
            <p className="text-afrikoni-text-dark/70">
              Track all revenue streams and platform growth
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-afrikoni-text-dark/70">Total Revenue</p>
                <DollarSign className="w-5 h-5 text-afrikoni-gold" />
              </div>
              <p className="text-2xl font-bold text-afrikoni-text-dark">
                ${revenueData.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                {timeRange === 'month' ? 'This month' : timeRange === 'week' ? 'This week' : 'This year'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-afrikoni-text-dark/70">MRR</p>
                <TrendingUp className="w-5 h-5 text-afrikoni-green" />
              </div>
              <p className="text-2xl font-bold text-afrikoni-text-dark">
                ${revenueData.mrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                {revenueData.activeSubscriptions} active subscriptions
              </p>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-afrikoni-text-dark/70">Escrow Commissions</p>
                <Shield className="w-5 h-5 text-afrikoni-purple" />
              </div>
              <p className="text-2xl font-bold text-afrikoni-text-dark">
                ${revenueData.totalCommissions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                8% commission on protected orders
              </p>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-afrikoni-text-dark/70">Logistics Margin</p>
                <Truck className="w-5 h-5 text-afrikoni-blue" />
              </div>
              <p className="text-2xl font-bold text-afrikoni-text-dark">
                ${revenueData.logisticsMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                3-10% markup on shipping
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-afrikoni-text-dark/70">Verified Suppliers</p>
                <Users className="w-5 h-5 text-afrikoni-gold" />
              </div>
              <p className="text-2xl font-bold text-afrikoni-text-dark">
                {revenueData.verifiedSuppliers}
              </p>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-afrikoni-text-dark/70">Successful Orders</p>
                <ShoppingCart className="w-5 h-5 text-afrikoni-green" />
              </div>
              <p className="text-2xl font-bold text-afrikoni-text-dark">
                {revenueData.successfulOrders}
              </p>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-afrikoni-text-dark/70">Other Revenue</p>
                <Sparkles className="w-5 h-5 text-afrikoni-purple" />
              </div>
              <p className="text-2xl font-bold text-afrikoni-text-dark">
                ${(revenueData.verificationFees + revenueData.protectionFees).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                Verification + Protection fees
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="border-afrikoni-gold/20">
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="commission" fill="#D4A032" name="Commissions" />
                  <Bar dataKey="subscription" fill="#8B5CF6" name="Subscriptions" />
                  <Bar dataKey="logistics" fill="#3B82F6" name="Logistics" />
                  <Bar dataKey="other" fill="#10B981" name="Other" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-afrikoni-text-dark/70">
                No revenue data for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
