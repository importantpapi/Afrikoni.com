import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BarChart3, TrendingUp, Eye, MessageSquare, FileText, Users, 
  Package, ArrowUp, ArrowDown, Target, Award, Globe, Clock,
  Calendar, Filter, Download, RefreshCw
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getOrCreateCompany } from '@/utils/companyHelper';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { toast } from 'sonner';
import RequireDashboardRole from '@/guards/RequireDashboardRole';

const COLORS = ['#D4A937', '#8140FF', '#3AB795', '#E85D5D', '#C9A961', '#5A5A5A'];

function SupplierAnalyticsInner() {
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  
  // Metrics
  const [metrics, setMetrics] = useState({
    totalViews: 0,
    totalImpressions: 0,
    totalContacts: 0,
    totalRFQs: 0,
    conversionRate: 0,
    avgViewsPerProduct: 0,
    topProductViews: 0,
    marketplaceAvgViews: 0,
    viewsGrowth: 0,
    contactsGrowth: 0,
  });

  // Chart data
  const [viewsTrendData, setViewsTrendData] = useState([]);
  const [conversionData, setConversionData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [trafficSourceData, setTrafficSourceData] = useState([]);
  const [engagementData, setEngagementData] = useState([]);

  useEffect(() => {
    loadUserAndData();
  }, []);

  useEffect(() => {
    if (companyId) {
      loadAnalytics();
    }
  }, [companyId, timeRange]);

  const loadUserAndData = async () => {
    try {
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
      
      if (!userData) {
        toast.error('Please log in to view analytics');
        return;
      }

      const company = await getOrCreateCompany(supabase, userData);
      setCompanyId(company);
    } catch (error) {
      toast.error('Failed to load user data');
      console.error('User load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (range) => {
    const now = new Date();
    let start, end;
    switch (range) {
      case '7d':
        start = subDays(now, 7);
        end = now;
        break;
      case '30d':
        start = subDays(now, 30);
        end = now;
        break;
      case '90d':
        start = subDays(now, 90);
        end = now;
        break;
      case '1y':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = subDays(now, 30);
        end = now;
        break;
    }
    return { start, end };
  };

  const loadAnalytics = async () => {
    if (!companyId) return;
    
    setRefreshing(true);
    try {
      const { start, end } = getDateRange(timeRange);
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      // Get previous period for growth calculation
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const prevStart = subDays(start, daysDiff);
      const prevEnd = start;
      const prevStartISO = prevStart.toISOString();
      const prevEndISO = prevEnd.toISOString();

      // Load products for this supplier
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title, views, status, created_at, category_id, country_of_origin')
        .eq('company_id', companyId)
        .eq('status', 'active');

      if (productsError) throw productsError;

      const productIds = (products || []).map(p => p.id);

      // Load conversations related to products
      let conversations = [];
      if (productIds.length > 0) {
        const { data: conversationsData } = await supabase
          .from('conversations')
          .select('id')
          .in('related_to', productIds);
        
        const conversationIds = (conversationsData || []).map(c => c.id);
        
        // Load messages from those conversations
        if (conversationIds.length > 0) {
          const { data: messagesData } = await supabase
            .from('messages')
            .select('id, created_at, conversation_id')
            .in('conversation_id', conversationIds)
            .gte('created_at', startISO)
            .lte('created_at', endISO);
          
          conversations = messagesData || [];
        }
      }
      
      const messages = conversations;

      // Load RFQs related to products
      let rfqs = [];
      if (productIds.length > 0) {
        const { data: rfqsData } = await supabase
          .from('rfqs')
          .select('id, created_at, product_id')
          .in('product_id', productIds)
          .gte('created_at', startISO)
          .lte('created_at', endISO);
        
        rfqs = rfqsData || [];
      }

      // Load previous period data for growth
      const { data: prevProducts } = await supabase
        .from('products')
        .select('views')
        .eq('company_id', companyId)
        .eq('status', 'active');

      // Calculate metrics
      const totalViews = (products || []).reduce((sum, p) => sum + (parseInt(p.views) || 0), 0);
      const totalImpressions = totalViews; // For now, impressions = views
      const totalContacts = messages?.length || 0;
      const totalRFQs = rfqs?.length || 0;
      const conversionRate = totalViews > 0 ? ((totalContacts + totalRFQs) / totalViews) * 100 : 0;
      const avgViewsPerProduct = products && products.length > 0 ? totalViews / products.length : 0;
      const topProductViews = products && products.length > 0 
        ? Math.max(...products.map(p => parseInt(p.views) || 0))
        : 0;

      // Calculate marketplace average (sample of all products)
      const { data: allProducts } = await supabase
        .from('products')
        .select('views')
        .eq('status', 'active')
        .limit(100);
      
      const marketplaceAvgViews = allProducts && allProducts.length > 0
        ? allProducts.reduce((sum, p) => sum + (parseInt(p.views) || 0), 0) / allProducts.length
        : 0;

      // Calculate growth
      const prevTotalViews = (prevProducts || []).reduce((sum, p) => sum + (parseInt(p.views) || 0), 0);
      const viewsGrowth = prevTotalViews > 0 
        ? ((totalViews - prevTotalViews) / prevTotalViews) * 100 
        : (totalViews > 0 ? 100 : 0);

      // Previous period contacts (simplified - would need proper date filtering)
      const prevContacts = 0; // Placeholder
      const contactsGrowth = prevContacts > 0
        ? ((totalContacts - prevContacts) / prevContacts) * 100
        : (totalContacts > 0 ? 100 : 0);

      setMetrics({
        totalViews,
        totalImpressions,
        totalContacts,
        totalRFQs,
        conversionRate,
        avgViewsPerProduct,
        topProductViews,
        marketplaceAvgViews,
        viewsGrowth,
        contactsGrowth,
      });

      // Build chart data
      buildViewsTrendData(products || [], start, end);
      buildConversionData(products || [], messages || [], rfqs || []);
      buildTopProductsData(products || []);
      buildTrafficSourceData(products || []);
      buildEngagementData(products || [], messages || [], rfqs || []);

    } catch (error) {
      toast.error('Failed to load analytics');
      console.error('Analytics error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const buildViewsTrendData = (products, start, end) => {
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const interval = days <= 30 ? 'day' : 'month';
    
    // Simplified: distribute views evenly (in real app, would track daily views)
    const data = [];
    let currentDate = new Date(start);
    let totalViews = products.reduce((sum, p) => sum + (parseInt(p.views) || 0), 0);
    const viewsPerDay = totalViews / days;

    while (currentDate <= end) {
      const key = interval === 'day' 
        ? format(currentDate, 'MMM dd') 
        : format(currentDate, 'MMM yyyy');
      
      data.push({
        date: key,
        views: Math.round(viewsPerDay),
        contacts: Math.round(viewsPerDay * 0.05), // 5% conversion estimate
      });
      
      currentDate = new Date(currentDate.getTime() + (interval === 'day' ? 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000));
    }

    setViewsTrendData(data);
  };

  const buildConversionData = async (products, messages, rfqs) => {
    // Get conversation IDs for each product
    const productIds = products.map(p => p.id);
    const { data: conversationsData } = await supabase
      .from('conversations')
      .select('id, related_to')
      .in('related_to', productIds);
    
    const productConversationMap = {};
    (conversationsData || []).forEach(conv => {
      if (conv.related_to && !productConversationMap[conv.related_to]) {
        productConversationMap[conv.related_to] = [];
      }
      if (conv.related_to) {
        productConversationMap[conv.related_to].push(conv.id);
      }
    });
    
    const data = products.slice(0, 10).map(product => {
      const conversationIds = productConversationMap[product.id] || [];
      const productMessages = messages?.filter(m => 
        conversationIds.includes(m.conversation_id)
      ).length || 0;
      const productRFQs = rfqs?.filter(r => r.product_id === product.id).length || 0;
      const views = parseInt(product.views) || 0;
      const conversions = productMessages + productRFQs;
      const rate = views > 0 ? (conversions / views) * 100 : 0;

      return {
        name: product.title?.substring(0, 20) || 'Product',
        views,
        conversions,
        rate: parseFloat(rate.toFixed(2)),
      };
    });

    setConversionData(data);
  };

  const buildTopProductsData = (products) => {
    const sorted = [...products]
      .sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0))
      .slice(0, 10)
      .map(p => ({
        name: p.title?.substring(0, 25) || 'Product',
        views: parseInt(p.views) || 0,
        contacts: Math.round((parseInt(p.views) || 0) * 0.05), // Estimate
      }));

    setTopProductsData(sorted);
  };

  const buildTrafficSourceData = (products) => {
    // Simplified: would need actual traffic source tracking
    const sources = [
      { name: 'Marketplace Search', value: 60 },
      { name: 'Category Browse', value: 25 },
      { name: 'Direct Link', value: 10 },
      { name: 'External', value: 5 },
    ];
    setTrafficSourceData(sources);
  };

  const buildEngagementData = (products, messages, rfqs) => {
    const data = [
      { name: 'Views', value: metrics.totalViews, color: '#D4A937' },
      { name: 'Contacts', value: metrics.totalContacts, color: '#8140FF' },
      { name: 'RFQs', value: metrics.totalRFQs, color: '#3AB795' },
    ];
    setEngagementData(data);
  };

  const handleRefresh = () => {
    loadAnalytics();
  };

  if (loading) {
    return (
      <DashboardLayout currentRole="seller">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  if (!companyId) {
    return (
      <DashboardLayout currentRole="seller">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 text-afrikoni-gold mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-afrikoni-chestnut mb-2">
                Company Setup Required
              </h2>
              <p className="text-afrikoni-deep/70 mb-6">
                Please complete your company profile to view analytics.
              </p>
              <Link to="/dashboard/company-info">
                <Button className="bg-afrikoni-gold hover:bg-afrikoni-goldDark">
                  Complete Setup
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentRole="seller">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-afrikoni-gold" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2">
                Supplier Analytics
              </h1>
              <p className="text-afrikoni-text-dark/70 text-sm md:text-base">
                Track your product performance and optimize your listings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="touch-manipulation"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                  {metrics.viewsGrowth !== 0 && (
                    <Badge className={metrics.viewsGrowth > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                      {metrics.viewsGrowth > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {Math.abs(metrics.viewsGrowth).toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-afrikoni-gold mb-2">
                  {metrics.totalViews.toLocaleString()}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Total Views
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
                    <MessageSquare className="w-6 h-6 text-afrikoni-purple" />
                  </div>
                  {metrics.contactsGrowth !== 0 && (
                    <Badge className={metrics.contactsGrowth > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                      {metrics.contactsGrowth > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {Math.abs(metrics.contactsGrowth).toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-afrikoni-purple mb-2">
                  {metrics.totalContacts.toLocaleString()}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Contacts
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
                    <FileText className="w-6 h-6 text-afrikoni-green" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-afrikoni-green mb-2">
                  {metrics.totalRFQs.toLocaleString()}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  RFQs Received
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
                    <Target className="w-6 h-6 text-afrikoni-clay" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2">
                  {metrics.conversionRate.toFixed(2)}%
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Conversion Rate
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
                  <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-afrikoni-gold mb-2">
                  {metrics.avgViewsPerProduct.toFixed(0)}
                </div>
                <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                  Avg Views/Product
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Top Products</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
            <TabsTrigger value="traffic">Traffic</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Views Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                    Views & Engagement Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {viewsTrendData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={viewsTrendData}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4A937" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#D4A937" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
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
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="#D4A937"
                          fillOpacity={1}
                          fill="url(#colorViews)"
                          name="Views"
                        />
                        <Area
                          type="monotone"
                          dataKey="contacts"
                          stroke="#8140FF"
                          fillOpacity={1}
                          fill="url(#colorContacts)"
                          name="Contacts"
                        />
                        <Legend />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Engagement Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
            >
              <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                    Engagement Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {engagementData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                      No data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={engagementData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {engagementData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FDF8F0',
                            border: '1px solid #D4A937',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {/* Top Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                    Top Performing Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {topProductsData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                      No products data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={topProductsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#2E2A1F" 
                          fontSize={12}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis stroke="#2E2A1F" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FDF8F0',
                            border: '1px solid #D4A937',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="views" fill="#D4A937" radius={[8, 8, 0, 0]} name="Views" />
                        <Bar dataKey="contacts" fill="#8140FF" radius={[8, 8, 0, 0]} name="Contacts" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="conversions" className="space-y-6">
            {/* Conversion Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                    Conversion Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {conversionData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                      No conversion data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={conversionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#2E2A1F" 
                          fontSize={12}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis stroke="#2E2A1F" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FDF8F0',
                            border: '1px solid #D4A937',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="views" fill="#D4A937" radius={[8, 8, 0, 0]} name="Views" />
                        <Bar dataKey="conversions" fill="#3AB795" radius={[8, 8, 0, 0]} name="Conversions" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-6">
            {/* Traffic Sources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
                <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                  <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                    Traffic Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {trafficSourceData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-afrikoni-text-dark/50">
                      No traffic data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={trafficSourceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {trafficSourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FDF8F0',
                            border: '1px solid #D4A937',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Marketplace Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border-afrikoni-gold/20 bg-afrikoni-gold/5">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block flex items-center gap-2">
                <Award className="w-5 h-5 text-afrikoni-gold" />
                Marketplace Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-afrikoni-deep/70">Your Average Views/Product</span>
                    <span className="font-bold text-afrikoni-gold">{metrics.avgViewsPerProduct.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-afrikoni-deep/70">Marketplace Average</span>
                    <span className="font-bold text-afrikoni-deep">{metrics.marketplaceAvgViews.toFixed(0)}</span>
                  </div>
                  <div className="h-2 bg-afrikoni-cream rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-afrikoni-gold rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, (metrics.avgViewsPerProduct / Math.max(metrics.marketplaceAvgViews, 1)) * 100)}%` 
                      }}
                    />
                  </div>
                  {metrics.avgViewsPerProduct > metrics.marketplaceAvgViews && (
                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      You're performing above average!
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-afrikoni-deep/70">Your Top Product Views</span>
                    <span className="font-bold text-afrikoni-gold">{metrics.topProductViews}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-afrikoni-deep/70">Marketplace Average</span>
                    <span className="font-bold text-afrikoni-deep">{metrics.marketplaceAvgViews.toFixed(0)}</span>
                  </div>
                  <div className="h-2 bg-afrikoni-cream rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-afrikoni-gold rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, (metrics.topProductViews / Math.max(metrics.marketplaceAvgViews, 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default function SupplierAnalytics() {
  return (
    <RequireDashboardRole allow={['seller', 'hybrid']}>
      <SupplierAnalyticsInner />
    </RequireDashboardRole>
  );
}

