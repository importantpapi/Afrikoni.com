/**
 * Afrikoni Shield™ - Admin Analytics Dashboard
 * CEO-level control panel showing GMV, escrow volume, disputes, deliveries
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, TrendingUp, AlertTriangle, Truck, Package, Users,
  ArrowLeft, Calendar, BarChart3, PieChart, Activity, Download,
  FileSpreadsheet, FileJson, FileCheck, FileText, CheckCircle, ShoppingCart, Globe
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isAdmin } from '@/utils/permissions';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';
import AccessDenied from '@/components/AccessDenied';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { toast } from 'sonner';

const COLORS = ['#D4A937', '#8140FF', '#3AB795', '#E85D5D', '#C9A961'];

export default function AdminAnalytics() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(false); // Local loading state
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState({
    gmv: 0,
    escrowVolume: 0,
    totalOrders: 0,
    completedOrders: 0,
    disputes: 0,
    resolvedDisputes: 0,
    totalShipments: 0,
    deliveredShipments: 0,
    activeUsers: 0,
    activeSuppliers: 0
  });
  const [gmvChartData, setGmvChartData] = useState([]);
  const [escrowChartData, setEscrowChartData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [disputeData, setDisputeData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [searchInsights, setSearchInsights] = useState({
    topQueries: [],
    lowSupplyQueries: [],
    topFilters: []
  });

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[AdminAnalytics] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → set no access
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    // Check admin access
    const admin = isAdmin(user);
    setHasAccess(admin);
    setLoading(false);
    
    if (admin) {
      loadAnalytics();
    }
  }, [authReady, authLoading, user, profile, role, timeRange]);

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

  const loadAnalytics = async () => {
    try {
      const { start, end } = getDateRange();
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      // Load all metrics in parallel
      const [
        ordersRes,
        rfqsRes,
        escrowRes,
        disputesRes,
        shipmentsRes,
        usersRes,
        companiesRes,
        searchEventsRes
      ] = await Promise.allSettled([
        // GMV & Orders
        supabase
          .from('orders')
          .select('total_amount, status, created_at, currency')
          .gte('created_at', startISO)
          .lte('created_at', endISO),
        
        // RFQs (Trade execution core metric)
        supabase
          .from('rfqs')
          .select('id, status, created_at, buyer_company_id')
          .gte('created_at', startISO)
          .lte('created_at', endISO),
        
        // Escrow Volume
        supabase
          .from('wallet_transactions')
          .select('amount, type, status, created_at, currency')
          .in('type', ['escrow_hold', 'escrow_release'])
          .gte('created_at', startISO)
          .lte('created_at', endISO),
        
        // Disputes
        supabase
          .from('disputes')
          .select('status, created_at, updated_at')
          .gte('created_at', startISO)
          .lte('created_at', endISO),
        
        // Shipments
        supabase
          .from('shipments')
          .select('status, created_at, updated_at')
          .gte('created_at', startISO)
          .lte('created_at', endISO),
        
        // Active Users
        supabase
          .from('profiles')
          .select('id, created_at')
          .gte('created_at', startISO)
          .lte('created_at', endISO),
        
        // Active Suppliers
        supabase
          .from('companies')
          .select('id, role, created_at, country')
          .eq('role', 'seller')
          .gte('created_at', startISO)
          .lte('created_at', endISO),

        // Search events (for search insights)
        supabase
          .from('search_events')
          .select('query, filters, result_count, created_at')
          .gte('created_at', startISO)
          .lte('created_at', endISO)
      ]);

      // Process GMV & Orders
      const orders = ordersRes.status === 'fulfilled' ? (ordersRes.value?.data || []) : [];
      const gmv = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
      const orderStatusCounts = orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {});

      // Process Escrow
      const escrowTxs = escrowRes.status === 'fulfilled' ? (escrowRes.value?.data || []) : [];
      const escrowVolume = escrowTxs
        .filter(tx => tx.status === 'completed')
        .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

      // Process Disputes
      const disputes = disputesRes.status === 'fulfilled' ? (disputesRes.value?.data || []) : [];
      const resolvedDisputes = disputes.filter(d => d.status === 'resolved' || d.status === 'closed').length;

      // Process Shipments
      const shipments = shipmentsRes.status === 'fulfilled' ? (shipmentsRes.value?.data || []) : [];
      const deliveredShipments = shipments.filter(s => s.status === 'delivered').length;

      // Process Users & Suppliers
      const users = usersRes.status === 'fulfilled' ? (usersRes.value?.data || []) : [];
      const suppliers = companiesRes.status === 'fulfilled' ? (companiesRes.value?.data || []) : [];

      // Country distribution
      const countryCounts = suppliers.reduce((acc, s) => {
        const country = s.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {});
      const countryDataArray = Object.entries(countryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      const countriesActive = Object.keys(countryCounts).length;

      // Process Search Events
      const searchEvents = searchEventsRes.status === 'fulfilled' ? (searchEventsRes.value?.data || []) : [];
      buildSearchInsights(searchEvents);

      setMetrics({
        gmv,
        escrowVolume,
        totalOrders: orders.length,
        completedOrders,
        totalRFQs: rfqs.length,
        fulfilledRFQs,
        activeBuyers: uniqueBuyers.size,
        disputes: disputes.length,
        resolvedDisputes,
        totalShipments: shipments.length,
        deliveredShipments,
        activeUsers: users.length,
        activeSuppliers: suppliers.length,
        countriesActive
      });

      // Build chart data
      buildChartData(orders, escrowTxs, disputes, shipments);
      setOrderStatusData(Object.entries(orderStatusCounts).map(([name, value]) => ({ name, value })));
      setCountryData(countryDataArray);

    } catch (error) {
      toast.error('Failed to load analytics');
    }
  };

  const buildChartData = (orders, escrowTxs, disputes, shipments) => {
    const { start, end } = getDateRange();
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const interval = days <= 7 ? 'day' : days <= 30 ? 'day' : 'week';

    // GMV Chart Data
    const gmvByPeriod = {};
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const key = interval === 'day' 
        ? format(date, 'MMM dd')
        : format(date, 'MMM dd');
      if (!gmvByPeriod[key]) gmvByPeriod[key] = 0;
      gmvByPeriod[key] += parseFloat(order.total_amount) || 0;
    });
    setGmvChartData(Object.entries(gmvByPeriod).map(([date, value]) => ({ date, value: Math.round(value) })));

    // Escrow Chart Data
    const escrowByPeriod = {};
    escrowTxs
      .filter(tx => tx.status === 'completed')
      .forEach(tx => {
        const date = new Date(tx.created_at);
        const key = interval === 'day' 
          ? format(date, 'MMM dd')
          : format(date, 'MMM dd');
        if (!escrowByPeriod[key]) escrowByPeriod[key] = 0;
        escrowByPeriod[key] += parseFloat(tx.amount) || 0;
      });
    setEscrowChartData(Object.entries(escrowByPeriod).map(([date, value]) => ({ date, value: Math.round(value) })));

    // Dispute Chart Data
    const disputeByPeriod = {};
    disputes.forEach(dispute => {
      const date = new Date(dispute.created_at);
      const key = interval === 'day' 
        ? format(date, 'MMM dd')
        : format(date, 'MMM dd');
      if (!disputeByPeriod[key]) disputeByPeriod[key] = 0;
      disputeByPeriod[key] += 1;
    });
    setDisputeData(Object.entries(disputeByPeriod).map(([date, value]) => ({ date, value })));
  };

  // Build search insights from search_events
  const buildSearchInsights = (events) => {
    if (!Array.isArray(events) || events.length === 0) {
      setSearchInsights({
        topQueries: [],
        lowSupplyQueries: [],
        topFilters: []
      });
      return;
    }

    const queryStats = {};
    const filterStats = {};

    events.forEach(evt => {
      const rawQuery = (evt.query || '').trim();
      const normalizedQuery = rawQuery.toLowerCase();
      const resultCount = typeof evt.result_count === 'number' ? evt.result_count : null;

      if (normalizedQuery) {
        if (!queryStats[normalizedQuery]) {
          queryStats[normalizedQuery] = {
            query: rawQuery,
            count: 0,
            totalResults: 0,
            withResultCount: 0
          };
        }
        queryStats[normalizedQuery].count += 1;
        if (resultCount !== null) {
          queryStats[normalizedQuery].totalResults += resultCount;
          queryStats[normalizedQuery].withResultCount += 1;
        }
      }

      // Aggregate filters usage
      const filters = evt.filters || {};
      const {
        category,
        country,
        verification,
        priceRange,
        moq,
        certifications,
        deliveryTime,
        verified,
        fastResponse,
        readyToShip,
        priceMin,
        priceMax,
        moqMin,
        sortBy
      } = filters;

      const addFilterKey = (key) => {
        if (!key) return;
        filterStats[key] = (filterStats[key] || 0) + 1;
      };

      if (category) addFilterKey(`Category: ${category}`);
      if (country) addFilterKey(`Country: ${country}`);
      if (verification) addFilterKey(`Verification: ${verification}`);
      if (priceRange) addFilterKey(`Price Range: ${priceRange}`);
      if (moq) addFilterKey(`MOQ: ${moq}`);
      if (deliveryTime) addFilterKey(`Lead Time: ${deliveryTime}`);
      if (sortBy) addFilterKey(`Sort: ${sortBy}`);

      if (Array.isArray(certifications)) {
        certifications.forEach(cert => addFilterKey(`Cert: ${cert}`));
      }

      if (verified) addFilterKey('Chip: Verified Only');
      if (fastResponse) addFilterKey('Chip: Fast Response');
      if (readyToShip) addFilterKey('Chip: Ready to Ship');

      if (priceMin) addFilterKey(`Min Price ≥ ${priceMin}`);
      if (priceMax) addFilterKey(`Max Price ≤ ${priceMax}`);
      if (moqMin) addFilterKey(`Min MOQ ≥ ${moqMin}`);
    });

    // Top queries by count
    const topQueries = Object.values(queryStats)
      .map(stat => ({
        query: stat.query,
        count: stat.count,
        avgResults: stat.withResultCount > 0
          ? (stat.totalResults / stat.withResultCount)
          : null
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Low-supply queries: average results <= 3 and at least 2 occurrences
    const lowSupplyQueries = topQueries
      .filter(q => q.avgResults !== null && q.avgResults <= 3 && q.count >= 2)
      .slice(0, 10);

    // Top filters by usage
    const topFilters = Object.entries(filterStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    setSearchInsights({
      topQueries,
      lowSupplyQueries,
      topFilters
    });
  };

  // Export Functions
  const convertToCSV = (data, headers) => {
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };

  const handleExportCSV = () => {
    try {
      const { start, end } = getDateRange();
      const dateRangeStr = `${format(start, 'yyyy-MM-dd')}_to_${format(end, 'yyyy-MM-dd')}`;
      
      // Prepare comprehensive export data
      const exportData = {
        summary: [
          {
            Metric: 'GMV',
            Value: `$${metrics.gmv.toLocaleString()}`,
            'Time Range': timeRange
          },
          {
            Metric: 'Escrow Volume',
            Value: `$${metrics.escrowVolume.toLocaleString()}`,
            'Time Range': timeRange
          },
          {
            Metric: 'Total Orders',
            Value: metrics.totalOrders,
            'Time Range': timeRange
          },
          {
            Metric: 'Completed Orders',
            Value: metrics.completedOrders,
            'Time Range': timeRange
          },
          {
            Metric: 'Disputes',
            Value: metrics.disputes,
            'Time Range': timeRange
          },
          {
            Metric: 'Resolved Disputes',
            Value: metrics.resolvedDisputes,
            'Time Range': timeRange
          },
          {
            Metric: 'Total Shipments',
            Value: metrics.totalShipments,
            'Time Range': timeRange
          },
          {
            Metric: 'Delivered Shipments',
            Value: metrics.deliveredShipments,
            'Time Range': timeRange
          },
          {
            Metric: 'Active Users',
            Value: metrics.activeUsers,
            'Time Range': timeRange
          },
          {
            Metric: 'Active Suppliers',
            Value: metrics.activeSuppliers,
            'Time Range': timeRange
          },
          {
            Metric: 'Total RFQs',
            Value: metrics.totalRFQs || 0,
            'Time Range': timeRange
          },
          {
            Metric: 'Fulfilled RFQs',
            Value: metrics.fulfilledRFQs || 0,
            'Time Range': timeRange
          },
          {
            Metric: 'Active Buyers',
            Value: metrics.activeBuyers || 0,
            'Time Range': timeRange
          },
          {
            Metric: 'Countries Active',
            Value: metrics.countriesActive || 0,
            'Time Range': timeRange
          }
        ],
        gmvTrend: gmvChartData.map(item => ({
          Date: item.date,
          GMV: item.value
        })),
        escrowTrend: escrowChartData.map(item => ({
          Date: item.date,
          'Escrow Volume': item.value
        })),
        orderStatus: orderStatusData.map(item => ({
          Status: item.name,
          Count: item.value
        })),
        topCountries: countryData.map(item => ({
          Country: item.name,
          'Supplier Count': item.value
        }))
      };

      // Create CSV content
      let csvContent = 'AFRIKONI ANALYTICS EXPORT\n';
      csvContent += `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
      csvContent += `Time Range: ${timeRange}\n`;
      csvContent += `Period: ${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}\n\n`;
      
      csvContent += '=== SUMMARY METRICS ===\n';
      csvContent += convertToCSV(exportData.summary, ['Metric', 'Value', 'Time Range']) + '\n\n';
      
      csvContent += '=== GMV TREND ===\n';
      csvContent += convertToCSV(exportData.gmvTrend, ['Date', 'GMV']) + '\n\n';
      
      csvContent += '=== ESCROW VOLUME TREND ===\n';
      csvContent += convertToCSV(exportData.escrowTrend, ['Date', 'Escrow Volume']) + '\n\n';
      
      csvContent += '=== ORDER STATUS DISTRIBUTION ===\n';
      csvContent += convertToCSV(exportData.orderStatus, ['Status', 'Count']) + '\n\n';
      
      csvContent += '=== TOP COUNTRIES BY SUPPLIERS ===\n';
      csvContent += convertToCSV(exportData.topCountries, ['Country', 'Supplier Count']);

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `afrikoni-analytics-${dateRangeStr}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Analytics data exported as CSV');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const handleExportJSON = () => {
    try {
      const { start, end } = getDateRange();
      const dateRangeStr = `${format(start, 'yyyy-MM-dd')}_to_${format(end, 'yyyy-MM-dd')}`;
      
      const exportData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          timeRange: timeRange,
          period: {
            start: start.toISOString(),
            end: end.toISOString()
          },
          platform: 'Afrikoni B2B Marketplace'
        },
        metrics: {
          gmv: metrics.gmv,
          escrowVolume: metrics.escrowVolume,
          totalOrders: metrics.totalOrders,
          completedOrders: metrics.completedOrders,
          orderCompletionRate: `${orderCompletionRate}%`,
          disputes: metrics.disputes,
          resolvedDisputes: metrics.resolvedDisputes,
          disputeResolutionRate: `${disputeResolutionRate}%`,
          totalShipments: metrics.totalShipments,
          deliveredShipments: metrics.deliveredShipments,
          deliveryRate: `${deliveryRate}%`,
          activeUsers: metrics.activeUsers,
          activeSuppliers: metrics.activeSuppliers,
          totalRFQs: metrics.totalRFQs || 0,
          fulfilledRFQs: metrics.fulfilledRFQs || 0,
          activeBuyers: metrics.activeBuyers || 0,
          countriesActive: metrics.countriesActive || 0
        },
        charts: {
          gmvTrend: gmvChartData,
          escrowTrend: escrowChartData,
          orderStatusDistribution: orderStatusData,
          topCountriesBySuppliers: countryData
        }
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `afrikoni-analytics-${dateRangeStr}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Analytics data exported as JSON');
    } catch (error) {
      toast.error('Failed to export JSON');
    }
  };

  const handleExportPDF = () => {
    // Mock PDF generation - in production, this would call a backend service
    toast.info('PDF report generation is in development. For now, please use CSV or JSON exports.');
  };

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading analytics..." />;
  }

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

  const disputeResolutionRate = metrics.disputes > 0 
    ? ((metrics.resolvedDisputes / metrics.disputes) * 100).toFixed(1)
    : 0;
  const deliveryRate = metrics.totalShipments > 0
    ? ((metrics.deliveredShipments / metrics.totalShipments) * 100).toFixed(1)
    : 0;
  const orderCompletionRate = metrics.totalOrders > 0
    ? ((metrics.completedOrders / metrics.totalOrders) * 100).toFixed(1)
    : 0;

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
                <BarChart3 className="w-6 h-6 text-afrikoni-gold" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2 leading-tight">
                  Admin Analytics
                </h1>
                <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
                  Founder Control Tower: Marketplace health, RFQs, deals, countries, and trade execution metrics
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-gold mb-2">
                  ${(metrics.gmv / 1000).toFixed(1)}K
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  GMV
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
                    <Activity className="w-6 h-6 text-afrikoni-purple" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-purple mb-2">
                  ${(metrics.escrowVolume / 1000).toFixed(1)}K
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Escrow Volume
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
                  <div className="w-12 h-12 bg-afrikoni-red/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-afrikoni-red" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {metrics.disputes}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Disputes ({disputeResolutionRate}% resolved)
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
                  <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-afrikoni-green" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {metrics.deliveredShipments}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Delivered ({deliveryRate}% rate)
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-clay/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-afrikoni-clay" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {metrics.activeSuppliers}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Active Suppliers
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* RFQ Metrics - Trade Execution Core */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="border-afrikoni-gold/30 hover:border-afrikoni-gold/50 hover:shadow-premium-lg transition-all bg-gradient-to-br from-afrikoni-gold/5 to-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-gold/30 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-gold mb-2">
                  {metrics.totalRFQs || 0}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  RFQs Created
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {metrics.fulfilledRFQs || 0}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  RFQs Fulfilled
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {metrics.activeBuyers || 0}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Active Buyers
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                  {metrics.countriesActive || 0}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Countries Active
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* GMV Trend */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                  GMV Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {gmvChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={gmvChartData}>
                      <defs>
                        <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4A937" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4A937" stopOpacity={0}/>
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
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#D4A937" 
                        fillOpacity={1} 
                        fill="url(#colorGmv)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Escrow Volume Trend */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                  Escrow Volume Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {escrowChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={escrowChartData}>
                      <defs>
                        <linearGradient id="colorEscrow" x1="0" y1="0" x2="0" y2="1">
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
                          border: '1px solid #8140FF',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8140FF" 
                        fillOpacity={1} 
                        fill="url(#colorEscrow)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                  Order Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {orderStatusData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {orderStatusData.map((entry, index) => (
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

          {/* Top Countries by Suppliers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
          >
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                  Top Countries by Suppliers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {countryData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={countryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                      <XAxis dataKey="name" stroke="#2E2A1F" fontSize={12} />
                      <YAxis stroke="#2E2A1F" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FDF8F0', 
                          border: '1px solid #D4A937',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="value" fill="#D4A937" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search Insights Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="grid lg:grid-cols-3 gap-6"
        >
          {/* Top Search Queries */}
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block flex items-center gap-2">
                <Search className="w-4 h-4 text-afrikoni-gold" />
                Top Search Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {searchInsights.topQueries.length === 0 ? (
                <div className="text-afrikoni-text-dark/60 text-sm">
                  Not enough search data yet. Come back after buyers have used the marketplace.
                </div>
              ) : (
                <div className="space-y-3">
                  {searchInsights.topQueries.map((q, idx) => (
                    <div
                      key={q.query + idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-afrikoni-gold/10 bg-afrikoni-offwhite"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-afrikoni-chestnut truncate">
                            {q.query || '(no query)'}
                          </span>
                          <Badge className="bg-afrikoni-gold/10 text-afrikoni-gold text-[10px] uppercase tracking-wide">
                            {q.count} searches
                          </Badge>
                        </div>
                        <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                          Avg. results:&nbsp;
                          {q.avgResults === null
                            ? 'N/A'
                            : q.avgResults.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low-Supply Queries */}
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-afrikoni-red" />
                High-Intent, Low-Supply Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {searchInsights.lowSupplyQueries.length === 0 ? (
                <div className="text-afrikoni-text-dark/60 text-sm">
                  No clear supply gaps detected yet. Once buyers start searching more, you&apos;ll see which queries have few results.
                </div>
              ) : (
                <div className="space-y-3">
                  {searchInsights.lowSupplyQueries.map((q, idx) => (
                    <div
                      key={q.query + idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-afrikoni-gold/10 bg-afrikoni-gold/5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-afrikoni-chestnut truncate">
                            {q.query || '(no query)'}
                          </span>
                          <Badge className="bg-afrikoni-red/10 text-afrikoni-red text-[10px] uppercase tracking-wide">
                            Gap
                          </Badge>
                        </div>
                        <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                          {q.count} searches · Avg. results {q.avgResults?.toFixed(1) ?? 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Filters Used */}
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block flex items-center gap-2">
                <Filter className="w-4 h-4 text-afrikoni-gold" />
                Most Used Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {searchInsights.topFilters.length === 0 ? (
                <div className="text-afrikoni-text-dark/60 text-sm">
                  Filters haven&apos;t been used enough yet to show insights.
                </div>
              ) : (
                <div className="space-y-3">
                  {searchInsights.topFilters.map((f, idx) => (
                    <div
                      key={f.name + idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-afrikoni-gold/10 bg-afrikoni-offwhite"
                    >
                      <span className="text-sm font-medium text-afrikoni-chestnut truncate">
                        {f.name}
                      </span>
                      <Badge className="bg-afrikoni-gold/10 text-afrikoni-gold text-[10px] uppercase tracking-wide">
                        {f.value} uses
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-afrikoni-gold mb-2">{orderCompletionRate}%</div>
                  <div className="text-sm text-afrikoni-text-dark/70">Order Completion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-afrikoni-green mb-2">{deliveryRate}%</div>
                  <div className="text-sm text-afrikoni-text-dark/70">On-Time Delivery Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-afrikoni-purple mb-2">{disputeResolutionRate}%</div>
                  <div className="text-sm text-afrikoni-text-dark/70">Dispute Resolution Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-afrikoni-clay mb-2">{metrics.totalOrders}</div>
                  <div className="text-sm text-afrikoni-text-dark/70">Total Orders</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Export & Download Tools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
        >
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block flex items-center gap-2">
                <Download className="w-5 h-5 text-afrikoni-gold" />
                Export & Download Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <Button
                  className="w-full bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal rounded-afrikoni justify-start h-auto py-4"
                  onClick={handleExportCSV}
                >
                  <FileSpreadsheet className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Export CSV</div>
                    <div className="text-xs opacity-80">All metrics & charts</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-afrikoni-gold/30 hover:border-afrikoni-gold/50 hover:bg-afrikoni-gold/5 rounded-afrikoni justify-start h-auto py-4"
                  onClick={handleExportJSON}
                >
                  <FileJson className="w-5 h-5 mr-3 text-afrikoni-gold" />
                  <div className="text-left">
                    <div className="font-semibold">Export JSON</div>
                    <div className="text-xs opacity-80">Structured data format</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-afrikoni-gold/30 hover:border-afrikoni-gold/50 hover:bg-afrikoni-gold/5 rounded-afrikoni justify-start h-auto py-4"
                  onClick={handleExportPDF}
                >
                  <FileCheck className="w-5 h-5 mr-3 text-afrikoni-gold" />
                  <div className="text-left">
                    <div className="font-semibold">Compliance Report</div>
                    <div className="text-xs opacity-80">PDF format (coming soon)</div>
                  </div>
                </Button>
              </div>
              <div className="mt-6 pt-4 border-t border-afrikoni-gold/20">
                <Badge variant="outline" className="text-xs border-afrikoni-gold/30 w-full justify-center py-2">
                  <Calendar className="w-3 h-3 mr-2" />
                  Reports include data for: {format(getDateRange().start, 'MMM dd, yyyy')} - {format(getDateRange().end, 'MMM dd, yyyy')}
                </Badge>
                <p className="text-xs text-afrikoni-text-dark/60 text-center mt-3">
                  For regulators, auditors, investors, and partners
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

