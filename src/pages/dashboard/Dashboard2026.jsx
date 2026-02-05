import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Progress } from '@/components/shared/ui/progress';
import EmptyState from '@/components/shared/ui/EmptyState';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import {
  Package, FileText, ShoppingCart, MessageSquare, Truck, TrendingUp, TrendingDown,
  Plus, ArrowRight, Clock, CheckCircle, XCircle, AlertCircle, Sparkles,
  Eye, Users, DollarSign, BarChart3, Send, Inbox, Bell, Zap,
  Globe, Award, Target, Activity, ChevronRight, Search, Filter,
  Star, Shield, RefreshCw, ExternalLink, Wallet, Building2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currencyConverter';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

// Modern Stat Card Component
const StatCard = ({ icon: Icon, label, value, change, trend, color, onClick }) => (
  <motion.div variants={itemVariants}>
    <Card
      className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${onClick ? 'hover:border-afrikoni-gold' : ''}`}
      onClick={onClick}
    >
      <div className={`absolute inset-0 ${color} opacity-5`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-15 flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
          </div>
          {change !== undefined && change !== null && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null}
              {change}%
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-bold text-afrikoni-chestnut">{value}</h3>
          <p className="text-sm text-afrikoni-deep/70 mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// Quick Action Card
const QuickActionCard = ({ icon: Icon, title, description, to, color, badge }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className="cursor-pointer hover:shadow-md transition-all border-2 border-transparent hover:border-afrikoni-gold/30"
        onClick={() => navigate(to)}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-afrikoni-chestnut">{title}</h4>
              {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
            </div>
            <p className="text-sm text-afrikoni-deep/70 truncate">{description}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-afrikoni-deep/40" />
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Activity Item Component
const ActivityItem = ({ icon: Icon, title, description, time, status, onClick }) => (
  <div
    className={`flex items-start gap-3 p-3 rounded-lg hover:bg-afrikoni-cream/50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
      status === 'success' ? 'bg-green-100 text-green-600' :
      status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
      status === 'info' ? 'bg-blue-100 text-blue-600' :
      'bg-afrikoni-gold/10 text-afrikoni-gold'
    }`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm text-afrikoni-chestnut line-clamp-1">{title}</p>
      <p className="text-xs text-afrikoni-deep/70 line-clamp-1">{description}</p>
    </div>
    <span className="text-xs text-afrikoni-deep/50 whitespace-nowrap">{time}</span>
  </div>
);

// Pie Chart Colors
const CHART_COLORS = ['#C4A962', '#8B4513', '#D4AF37', '#A0522D', '#DAA520'];

export default function Dashboard2026({ activeView = 'all' }) {
  const { profileCompanyId, userId, user, capabilities, canLoadData, isSystemReady } = useDashboardKernel();
  const navigate = useNavigate();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRFQs: 0,
    totalProducts: 0,
    unreadMessages: 0,
    totalRevenue: 0,
    pendingQuotes: 0,
    activeShipments: 0,
    profileViews: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [company, setCompany] = useState(null);
  const [onboardingProgress, setOnboardingProgress] = useState(0);

  // Derived state
  const isSeller = capabilities?.can_sell && capabilities?.sell_status === 'approved';
  const isBuyer = capabilities?.can_buy;
  const isHybrid = isSeller && isBuyer;

  // Load dashboard data
  useEffect(() => {
    if (!canLoadData || !profileCompanyId) return;
    loadDashboardData();
  }, [canLoadData, profileCompanyId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Parallel data fetching
      const [
        ordersResult,
        rfqsResult,
        productsResult,
        messagesResult,
        quotesResult,
        companyResult,
      ] = await Promise.all([
        // Orders count
        supabase
          .from('orders')
          .select('id, total_amount, status, created_at', { count: 'exact' })
          .or(`buyer_company_id.eq.${profileCompanyId},seller_company_id.eq.${profileCompanyId}`)
          .order('created_at', { ascending: false })
          .limit(10),

        // RFQs count
        supabase
          .from('rfqs')
          .select('id, status, created_at', { count: 'exact' })
          .eq('buyer_company_id', profileCompanyId)
          .order('created_at', { ascending: false })
          .limit(5),

        // Products count (for sellers)
        isSeller
          ? supabase
              .from('products')
              .select('id, title, status, category_id', { count: 'exact' })
              .eq('company_id', profileCompanyId)
          : { count: 0, data: [] },

        // Unread messages
        supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('receiver_id', userId)
          .eq('read', false),

        // Pending quotes (for sellers)
        isSeller
          ? supabase
              .from('quotes')
              .select('id', { count: 'exact' })
              .eq('supplier_company_id', profileCompanyId)
              .eq('status', 'pending')
          : { count: 0 },

        // Company info
        supabase
          .from('companies')
          .select('*')
          .eq('id', profileCompanyId)
          .single(),
      ]);

      // Calculate total revenue from completed orders
      const completedOrders = ordersResult.data?.filter(o => o.status === 'completed') || [];
      const totalRevenue = completedOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      // Set stats
      setStats({
        totalOrders: ordersResult.count || 0,
        totalRFQs: rfqsResult.count || 0,
        totalProducts: productsResult.count || 0,
        unreadMessages: messagesResult.count || 0,
        pendingQuotes: quotesResult.count || 0,
        totalRevenue,
        activeShipments: 0, // Would need shipments table query
        profileViews: Math.floor(Math.random() * 150) + 50, // Placeholder
      });

      // Set company
      if (companyResult.data) {
        setCompany(companyResult.data);

        // Calculate onboarding progress
        const fields = ['company_name', 'country', 'city', 'business_email', 'website', 'company_description'];
        const completedFields = fields.filter(f => companyResult.data[f]);
        setOnboardingProgress(Math.round((completedFields.length / fields.length) * 100));
      }

      // Build recent activity
      const activity = [];

      // Add recent orders to activity
      ordersResult.data?.slice(0, 3).forEach(order => {
        activity.push({
          icon: ShoppingCart,
          title: `Order ${order.status === 'completed' ? 'completed' : 'updated'}`,
          description: `Order #${order.id.slice(0, 8)}`,
          time: formatDistanceToNow(new Date(order.created_at), { addSuffix: true }),
          status: order.status === 'completed' ? 'success' : 'info',
          link: `/dashboard/orders/${order.id}`,
        });
      });

      // Add recent RFQs to activity
      rfqsResult.data?.slice(0, 2).forEach(rfq => {
        activity.push({
          icon: FileText,
          title: 'RFQ submitted',
          description: `Request #${rfq.id.slice(0, 8)}`,
          time: formatDistanceToNow(new Date(rfq.created_at), { addSuffix: true }),
          status: 'info',
          link: `/dashboard/rfqs/${rfq.id}`,
        });
      });

      setRecentActivity(activity.slice(0, 5));

      // Generate chart data (last 7 days)
      const chartDataArr = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayOrders = ordersResult.data?.filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate.toDateString() === date.toDateString();
        }) || [];

        chartDataArr.push({
          date: format(date, 'EEE'),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
        });
      }
      setChartData(chartDataArr);

      // Generate category distribution (for sellers)
      if (isSeller && productsResult.data?.length > 0) {
        const categoryCount = {};
        productsResult.data.forEach(p => {
          const catId = p.category_id || 'uncategorized';
          categoryCount[catId] = (categoryCount[catId] || 0) + 1;
        });

        const catData = Object.entries(categoryCount)
          .map(([name, value]) => ({ name: name.slice(0, 8), value }))
          .slice(0, 5);
        setCategoryData(catData);
      }

    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading dashboard..." ready={isSystemReady} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold mx-auto" />
          <p className="mt-4 text-afrikoni-deep">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! 👋
          </h1>
          <p className="text-afrikoni-deep/70 mt-1">
            Here's what's happening with your business today
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/products/quick-add')}
            className="border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
          <Button
            onClick={() => navigate('/dashboard/rfqs/new')}
            className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white"
          >
            <Send className="w-4 h-4 mr-2" />
            Create RFQ
          </Button>
        </div>
      </motion.div>

      {/* Onboarding Progress (if incomplete) */}
      {onboardingProgress < 100 && (
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-cream border-afrikoni-gold/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-afrikoni-gold/20 flex items-center justify-center">
                    <Target className="w-6 h-6 text-afrikoni-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-afrikoni-chestnut">Complete Your Profile</h3>
                    <p className="text-sm text-afrikoni-deep/70">
                      {onboardingProgress}% complete • Add more details to attract buyers
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-1 max-w-md">
                  <Progress value={onboardingProgress} className="h-2 flex-1" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/dashboard/settings/company')}
                  >
                    Complete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={stats.totalOrders}
          change={12}
          trend="up"
          color="bg-afrikoni-gold"
          onClick={() => navigate('/dashboard/orders')}
        />
        <StatCard
          icon={FileText}
          label="Active RFQs"
          value={stats.totalRFQs}
          change={8}
          trend="up"
          color="bg-blue-500"
          onClick={() => navigate('/dashboard/rfqs')}
        />
        {isSeller && (
          <StatCard
            icon={Package}
            label="Products Listed"
            value={stats.totalProducts}
            change={5}
            trend="up"
            color="bg-green-500"
            onClick={() => navigate('/dashboard/products')}
          />
        )}
        <StatCard
          icon={MessageSquare}
          label="Unread Messages"
          value={stats.unreadMessages}
          change={stats.unreadMessages > 0 ? null : undefined}
          trend={stats.unreadMessages > 0 ? 'up' : undefined}
          color="bg-purple-500"
          onClick={() => navigate('/dashboard/messages')}
        />
        {!isSeller && (
          <StatCard
            icon={DollarSign}
            label="Total Spent"
            value={formatCurrency(stats.totalRevenue, 'USD')}
            color="bg-emerald-500"
            onClick={() => navigate('/dashboard/orders')}
          />
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Chart & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Chart */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-afrikoni-chestnut flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-afrikoni-gold" />
                    {isSeller ? 'Sales Performance' : 'Order Activity'}
                  </CardTitle>
                  <Badge variant="secondary">Last 7 days</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C4A962" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#C4A962" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#888" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #E5E5E5',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="#C4A962"
                        strokeWidth={2}
                        fill="url(#colorOrders)"
                        name="Orders"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-afrikoni-chestnut flex items-center gap-2">
                <Zap className="w-5 h-5 text-afrikoni-gold" />
                Quick Actions
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {isSeller && (
                <QuickActionCard
                  icon={Package}
                  title="Add New Product"
                  description="List a product in seconds with AI"
                  to="/dashboard/products/quick-add"
                  color="bg-afrikoni-gold"
                  badge="Quick"
                />
              )}
              <QuickActionCard
                icon={Search}
                title="Browse Products"
                description="Find suppliers and products"
                to="/marketplace"
                color="bg-blue-500"
              />
              <QuickActionCard
                icon={FileText}
                title="Create RFQ"
                description="Request quotes from suppliers"
                to="/dashboard/rfqs/new"
                color="bg-green-500"
              />
              <QuickActionCard
                icon={MessageSquare}
                title="Messages"
                description={stats.unreadMessages > 0 ? `${stats.unreadMessages} unread` : 'View conversations'}
                to="/dashboard/messages"
                color="bg-purple-500"
                badge={stats.unreadMessages > 0 ? `${stats.unreadMessages} new` : undefined}
              />
              {isSeller && (
                <QuickActionCard
                  icon={Sparkles}
                  title="KoniAI Assistant"
                  description="Get AI-powered trade insights"
                  to="/dashboard/koniai"
                  color="bg-gradient-to-r from-amber-500 to-orange-500"
                  badge="AI"
                />
              )}
              <QuickActionCard
                icon={Building2}
                title="Company Profile"
                description="Update your business details"
                to="/dashboard/settings/company"
                color="bg-gray-600"
              />
            </div>
          </motion.div>
        </div>

        {/* Right Column - Activity & Insights */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-afrikoni-chestnut flex items-center gap-2">
                    <Activity className="w-5 h-5 text-afrikoni-gold" />
                    Recent Activity
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={loadDashboardData}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentActivity.length > 0 ? (
                  <div className="divide-y divide-afrikoni-gold/10">
                    {recentActivity.map((item, index) => (
                      <ActivityItem
                        key={index}
                        {...item}
                        onClick={() => item.link && navigate(item.link)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <Clock className="w-10 h-10 text-afrikoni-gold/30 mx-auto mb-2" />
                    <p className="text-sm text-afrikoni-deep/60">No recent activity</p>
                    <p className="text-xs text-afrikoni-deep/40 mt-1">
                      Your activity will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Distribution (Sellers) */}
          {isSeller && categoryData.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-afrikoni-chestnut flex items-center gap-2">
                    <Package className="w-5 h-5 text-afrikoni-gold" />
                    Product Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {categoryData.map((cat, index) => (
                      <Badge
                        key={cat.name}
                        variant="secondary"
                        className="text-xs"
                        style={{ backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}20` }}
                      >
                        <span
                          className="w-2 h-2 rounded-full mr-1"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        {cat.value} products
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Trust Score Card */}
          {company && (
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-afrikoni-gold/5 to-afrikoni-cream">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-afrikoni-gold/20 flex items-center justify-center">
                      <Shield className="w-7 h-7 text-afrikoni-gold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-afrikoni-chestnut">
                          {company.trust_score || 75}
                        </span>
                        <span className="text-afrikoni-deep/60">/100</span>
                      </div>
                      <p className="text-sm text-afrikoni-deep/70">Trust Score</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={company.trust_score || 75} className="h-2" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-afrikoni-deep/60">
                    <span className="flex items-center gap-1">
                      {company.verified ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Verified
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-yellow-500" />
                          Pending Verification
                        </>
                      )}
                    </span>
                    <Link to="/dashboard/settings/verification" className="text-afrikoni-gold hover:underline">
                      Improve Score →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Help Card */}
          <motion.div variants={itemVariants}>
            <Card className="border-dashed border-2 border-afrikoni-gold/30 bg-afrikoni-cream/30">
              <CardContent className="p-5 text-center">
                <Sparkles className="w-10 h-10 text-afrikoni-gold mx-auto mb-3" />
                <h3 className="font-semibold text-afrikoni-chestnut mb-1">
                  Need Help Getting Started?
                </h3>
                <p className="text-sm text-afrikoni-deep/70 mb-4">
                  Our AI assistant can help you navigate the platform
                </p>
                <Button
                  variant="outline"
                  className="border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10"
                  onClick={() => navigate('/dashboard/koniai')}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ask KoniAI
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
