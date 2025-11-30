import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import {
  ShoppingCart, FileText, Package, Users, TrendingUp, Search,
  Plus, Eye, MessageSquare, DollarSign, Wallet, Truck, AlertCircle,
  BarChart3, Shield, CheckCircle, Clock, Bell, Activity, Target, HelpCircle, Building2
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import EmptyState from '@/components/ui/EmptyState';
import { format } from 'date-fns';

export default function DashboardHome({ currentRole = 'buyer' }) {
  const [stats, setStats] = useState([]);
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentRFQs, setRecentRFQs] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [viewMode, setViewMode] = useState('everything'); // For hybrid users
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, [currentRole, viewMode]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const userData = await supabaseHelpers.auth.me();
      if (!userData) {
        navigate('/login');
        return;
      }
      setUser(userData);

      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const userCompanyId = await getOrCreateCompany(supabase, userData);
      setCompanyId(userCompanyId);

      // Load stats based on role
      await loadStats(userData, userCompanyId);
      
      // Load activities
      await loadActivities(userData, userCompanyId);
      
      // Load tasks
      await loadTasks(userData, userCompanyId);
      
      // Load recent orders
      await loadRecentOrders(userData, userCompanyId);
      
      // Load recent RFQs
      await loadRecentRFQs(userData, userCompanyId);
      
      // Load unread messages
      await loadUnreadMessages(userData, userCompanyId);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async (userData, companyId) => {
    const role = userData.role || userData.user_role || 'buyer';
    const statsData = [];
    const isHybrid = role === 'hybrid';
    const showBuyerStats = isHybrid ? (viewMode === 'everything' || viewMode === 'buyer') : (role === 'buyer');
    const showSellerStats = isHybrid ? (viewMode === 'everything' || viewMode === 'seller') : (role === 'seller');

    if (showBuyerStats) {
      const [ordersRes, rfqsRes, messagesRes, savedProductsRes] = await Promise.all([
        companyId ? supabase.from('orders').select('*', { count: 'exact' }).eq('buyer_company_id', companyId) : Promise.resolve({ data: [], count: 0 }),
        companyId ? supabase.from('rfqs').select('*', { count: 'exact' }).eq('buyer_company_id', companyId).in('status', ['open', 'pending']) : Promise.resolve({ data: [], count: 0 }),
        companyId ? supabase.from('messages').select('*', { count: 'exact' }).eq('receiver_company_id', companyId).eq('read', false) : Promise.resolve({ data: [], count: 0 }),
        userData.id ? supabase.from('saved_items').select('*', { count: 'exact' }).eq('user_id', userData.id).eq('item_type', 'product') : Promise.resolve({ count: 0 })
      ]);

      const ordersInProgress = companyId ? await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('buyer_company_id', companyId)
        .in('status', ['pending', 'processing', 'shipped']) : { count: 0 };

      statsData.push(
        { icon: ShoppingCart, label: 'Open Orders', value: (ordersInProgress.count || 0).toString(), color: 'orange' },
        { icon: FileText, label: 'Active RFQs', value: (rfqsRes.count || 0).toString(), color: 'blue' },
        { icon: MessageSquare, label: 'Unread Messages', value: (messagesRes.count || 0).toString(), color: 'blue' },
        { icon: Package, label: 'Saved Products', value: (savedProductsRes.count || 0).toString(), color: 'purple' }
      );
    }

    if (showSellerStats) {
      const [ordersRes, productsRes, messagesRes, revenueRes, walletRes, inquiriesRes] = await Promise.all([
        companyId ? supabase.from('orders').select('*', { count: 'exact' }).eq('seller_company_id', companyId).in('status', ['pending', 'processing']) : Promise.resolve({ count: 0 }),
        companyId ? supabase.from('products').select('*', { count: 'exact' }).eq('supplier_id', companyId).eq('status', 'active') : Promise.resolve({ count: 0 }),
        companyId ? supabase.from('messages').select('*', { count: 'exact' }).eq('receiver_company_id', companyId).eq('read', false) : Promise.resolve({ count: 0 }),
        companyId ? supabase.from('orders').select('total_amount').eq('seller_company_id', companyId).eq('payment_status', 'paid') : Promise.resolve({ data: [] }),
        companyId ? supabase.from('wallet_transactions').select('amount').eq('company_id', companyId).eq('type', 'payout').eq('status', 'completed') : Promise.resolve({ data: [] }),
        companyId ? supabase.from('messages').select('*', { count: 'exact' }).eq('receiver_company_id', companyId).eq('read', false).not('related_type', 'is', null) : Promise.resolve({ count: 0 })
      ]);

      const revenue = (revenueRes.data || []).reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      const payoutBalance = (walletRes.data || []).reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

      statsData.push(
        { icon: Package, label: 'Active Listings', value: (productsRes.count || 0).toString(), color: 'purple' },
        { icon: MessageSquare, label: 'New Inquiries', value: (inquiriesRes.count || 0).toString(), color: 'blue' },
        { icon: ShoppingCart, label: 'Orders to Fulfill', value: (ordersRes.count || 0).toString(), color: 'orange' },
        { icon: Wallet, label: 'Payout Balance', value: `$${payoutBalance.toLocaleString()}`, color: 'green' }
      );
    }

    if (role === 'logistics') {
      const [shipmentsRes, quoteRequestsRes] = await Promise.all([
        companyId ? supabase.from('shipments').select('*', { count: 'exact' }).eq('logistics_partner_id', companyId).in('status', ['picked_up', 'in_transit', 'out_for_delivery']) : Promise.resolve({ count: 0 }),
        supabase.from('rfqs').select('*', { count: 'exact' }).eq('status', 'open')
      ]);

      statsData.push(
        { icon: Truck, label: 'Shipments in Transit', value: (shipmentsRes.count || 0).toString(), color: 'orange' },
        { icon: FileText, label: 'Open Quote Requests', value: (quoteRequestsRes.count || 0).toString(), color: 'blue' }
      );
    }

    setStats(statsData);
  };

  const loadActivities = async (userData, companyId) => {
    const activitiesData = [];

    // Load recent notifications
    if (companyId) {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(10);

      (notifications || []).forEach(notif => {
        activitiesData.push({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          timestamp: notif.created_at,
          link: notif.link
        });
      });
    }

    // Load recent order updates
    if (companyId) {
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*, products(*)')
        .or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`)
        .order('updated_at', { ascending: false })
        .limit(5);

      (recentOrders || []).forEach(order => {
        activitiesData.push({
          id: `order-${order.id}`,
          type: 'order',
          title: `Order ${order.id.slice(0, 8)} status updated`,
          message: `Status changed to ${order.status}`,
          timestamp: order.updated_at,
          link: `/dashboard/orders/${order.id}`
        });
      });
    }

    // Sort by timestamp and limit
    activitiesData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setActivities(activitiesData.slice(0, 10));
  };

  const loadTasks = async (userData, companyId) => {
    const tasksData = [];

    // Check if company info is incomplete
    if (companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (!company?.company_name || !company?.country || !company?.phone) {
        tasksData.push({
          id: 'company-info',
          title: 'Complete Company Information',
          description: 'Add your company details to build trust with buyers',
          link: '/dashboard/company-info',
          priority: 'high'
        });
      }
    }

    // Check if seller/hybrid has no products
    const role = userData.role || userData.user_role || 'buyer';
    if ((role === 'seller' || role === 'hybrid') && companyId) {
      const { data: products } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('supplier_id', companyId);

      if ((products?.length || 0) === 0) {
        tasksData.push({
          id: 'add-products',
          title: 'Add Your First Product',
          description: 'Start selling by listing your first product',
          link: '/dashboard/products/new',
          priority: 'high'
        });
      } else if ((products?.length || 0) < 3) {
        tasksData.push({
          id: 'add-more-products',
          title: `Add ${3 - (products?.length || 0)} More Products`,
          description: 'Add more products to increase visibility',
          link: '/dashboard/products/new',
          priority: 'medium'
        });
      }
    }

    // Check for unread messages
    if (companyId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('receiver_company_id', companyId)
        .eq('read', false);

      if ((messages?.length || 0) > 0) {
        tasksData.push({
          id: 'respond-messages',
          title: `Respond to ${messages?.length || 0} Messages`,
          description: 'You have unread messages waiting for your response',
          link: '/messages',
          priority: 'high'
        });
      }
    }

    // Check for pending RFQ responses (for sellers)
    if ((role === 'seller' || role === 'hybrid') && companyId) {
      const { data: rfqs } = await supabase
        .from('rfqs')
        .select('*')
        .eq('status', 'open')
        .limit(5);

      if ((rfqs?.length || 0) > 0) {
        tasksData.push({
          id: 'respond-rfqs',
          title: `Respond to ${rfqs.length} Open RFQs`,
          description: 'New RFQs are waiting for your quotes',
          link: '/dashboard/rfqs',
          priority: 'medium'
        });
      }
    }

    setTasks(tasksData);
  };

  const loadRecentOrders = async (userData, companyId) => {
    if (!companyId) return;

    const role = userData.role || userData.user_role || 'buyer';
    const isHybrid = role === 'hybrid';
    const showBuyerOrders = isHybrid ? (viewMode === 'everything' || viewMode === 'buyer') : (role === 'buyer');
    const showSellerOrders = isHybrid ? (viewMode === 'everything' || viewMode === 'seller') : (role === 'seller');

    let orders = [];

    if (showBuyerOrders) {
      const { data: buyerOrders } = await supabase
        .from('orders')
        .select('*, products(*)')
        .eq('buyer_company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5);
      orders = [...orders, ...(buyerOrders || [])];
    }

    if (showSellerOrders) {
      const { data: sellerOrders } = await supabase
        .from('orders')
        .select('*, products(*)')
        .eq('seller_company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5);
      orders = [...orders, ...(sellerOrders || [])];
    }

    // Sort by created_at and limit to 5
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setRecentOrders(orders.slice(0, 5));
  };

  const loadRecentRFQs = async (userData, companyId) => {
    if (!companyId) return;

    const role = userData.role || userData.user_role || 'buyer';
    const isHybrid = role === 'hybrid';
    const showBuyerRFQs = isHybrid ? (viewMode === 'everything' || viewMode === 'buyer') : (role === 'buyer');
    const showSellerRFQs = isHybrid ? (viewMode === 'everything' || viewMode === 'seller') : (role === 'seller');

    let rfqs = [];

    if (showBuyerRFQs) {
      const { data: sentRFQs } = await supabase
        .from('rfqs')
        .select('*, categories(*)')
        .eq('buyer_company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5);
      rfqs = [...rfqs, ...(sentRFQs || [])];
    }

    if (showSellerRFQs) {
      const { data: receivedRFQs } = await supabase
        .from('rfqs')
        .select('*, categories(*)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5);
      rfqs = [...rfqs, ...(receivedRFQs || [])];
    }

    // Sort by created_at and limit to 5
    rfqs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setRecentRFQs(rfqs.slice(0, 5));
  };

  const loadUnreadMessages = async (userData, companyId) => {
    if (!companyId) return;

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_company_id', companyId)
      .eq('read', false);

    setUnreadMessages(count || 0);
  };

  const quickActions = {
    buyer: [
      { icon: Search, label: 'Search Products', link: '/marketplace', color: 'blue' },
      { icon: Plus, label: 'Create RFQ', link: '/rfq/create', color: 'orange' },
      { icon: MessageSquare, label: 'Messages', link: '/messages', color: 'blue', badge: unreadMessages },
      { icon: Building2, label: 'Company Info', link: '/dashboard/company-info', color: 'purple' },
      { icon: ShoppingCart, label: 'Orders', link: '/dashboard/orders', color: 'green' }
    ],
    seller: [
      { icon: Plus, label: 'Add Product', link: '/dashboard/products/new', color: 'orange' },
      { icon: ShoppingCart, label: 'Orders', link: '/dashboard/orders', color: 'blue' },
      { icon: MessageSquare, label: 'Messages', link: '/messages', color: 'purple', badge: unreadMessages },
      { icon: Building2, label: 'Company Info', link: '/dashboard/company-info', color: 'green' },
      { icon: Package, label: 'Products', link: '/dashboard/products', color: 'orange' }
    ],
    hybrid: [
      { icon: Plus, label: 'Add Product', link: '/dashboard/products/new', color: 'orange' },
      { icon: FileText, label: 'Create RFQ', link: '/rfq/create', color: 'green' },
      { icon: MessageSquare, label: 'Messages', link: '/messages', color: 'blue', badge: unreadMessages },
      { icon: Building2, label: 'Company Info', link: '/dashboard/company-info', color: 'purple' },
      { icon: ShoppingCart, label: 'Orders', link: '/dashboard/orders', color: 'orange' }
    ],
    logistics: [
      { icon: Truck, label: 'Shipments', link: '/dashboard/shipments', color: 'orange' },
      { icon: FileText, label: 'RFQs', link: '/dashboard/rfqs', color: 'green' },
      { icon: MessageSquare, label: 'Messages', link: '/messages', color: 'blue', badge: unreadMessages },
      { icon: Building2, label: 'Company Info', link: '/dashboard/company-info', color: 'purple' },
      { icon: BarChart3, label: 'Analytics', link: '/dashboard/analytics', color: 'orange' }
    ]
  };

  const actions = quickActions[currentRole] || quickActions.buyer;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut capitalize">
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">
            {currentRole === 'buyer' && 'Source products and connect with verified suppliers'}
            {currentRole === 'seller' && 'Manage your products, orders, and grow your business'}
            {currentRole === 'hybrid' && 'Manage both buying and selling activities'}
            {currentRole === 'logistics' && 'Track shipments and manage logistics operations'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Hybrid View Mode Toggle */}
          {currentRole === 'hybrid' && (
            <div className="flex items-center gap-1 bg-afrikoni-cream rounded-lg p-1">
              {['everything', 'buyer', 'seller'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-afrikoni-offwhite text-afrikoni-gold shadow-sm'
                      : 'text-afrikoni-deep hover:text-afrikoni-chestnut'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          )}
          <Badge variant="outline" className="capitalize text-sm px-4 py-2">
            {currentRole}
          </Badge>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: idx * 0.05 }}
          >
            <StatCard
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              color={stat.color}
              trend={stat.trend}
              trendValue={stat.trendValue}
            />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          const colorMap = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
            orange: { bg: 'bg-afrikoni-gold/20', text: 'text-afrikoni-gold' },
            green: { bg: 'bg-green-100', text: 'text-green-600' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
            red: { bg: 'bg-red-100', text: 'text-red-600' }
          };
          const colors = colorMap[action.color] || colorMap.orange;
          return (
            <Link key={idx} to={action.link}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-all cursor-pointer group relative">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className={`p-3 rounded-lg ${colors.bg} group-hover:scale-110 transition-transform relative`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                      {action.badge > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-medium text-afrikoni-deep">{action.label}</span>
                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Tasks / To-Dos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Tasks & To-Dos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-afrikoni-deep/70">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>All tasks completed! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Link key={task.id} to={task.link}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-offwhite transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-sm text-afrikoni-chestnut">{task.title}</h4>
                        <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'} className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-afrikoni-deep/70">{task.description}</p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-afrikoni-deep/70">
                <Activity className="w-12 h-12 mx-auto mb-2 text-afrikoni-deep/30" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activities.map((activity) => (
                  <Link key={activity.id} to={activity.link || '#'}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-offwhite transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-afrikoni-gold/10 rounded-lg">
                          <Bell className="w-4 h-4 text-afrikoni-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-afrikoni-chestnut truncate">{activity.title}</h4>
                          <p className="text-xs text-afrikoni-deep/70 mt-1">{activity.message}</p>
                          <p className="text-xs text-afrikoni-deep/50 mt-1">
                            {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & RFQs */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Recent Orders
              </div>
              <Link to="/dashboard/orders">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <EmptyState type="orders" title="No orders yet" description="Your recent orders will appear here" />
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link key={order.id} to={`/dashboard/orders/${order.id}`}>
                    <div className="p-3 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-offwhite transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-afrikoni-chestnut">
                          {order.products?.title || `Order ${order.id.slice(0, 8)}`}
                        </span>
                        <Badge variant="outline" className="text-xs">{order.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-afrikoni-deep/70">
                        <span>Qty: {order.quantity}</span>
                        <span>${parseFloat(order.total_amount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent RFQs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent RFQs
              </div>
              <Link to="/dashboard/rfqs">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRFQs.length === 0 ? (
              <EmptyState type="rfqs" title="No RFQs yet" description="Your recent RFQs will appear here" />
            ) : (
              <div className="space-y-3">
                {recentRFQs.map((rfq) => (
                  <Link key={rfq.id} to={`/dashboard/rfqs/${rfq.id}`}>
                    <div className="p-3 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-offwhite transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-afrikoni-chestnut truncate">{rfq.title}</span>
                        <Badge variant={rfq.status === 'open' ? 'default' : 'outline'} className="text-xs">
                          {rfq.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-afrikoni-deep/70">
                        Qty: {rfq.quantity} {rfq.unit}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

