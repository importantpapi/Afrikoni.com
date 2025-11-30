import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { getUserRole, shouldLoadBuyerData, shouldLoadSellerData, isHybrid } from '@/utils/roleHelpers';
import { getRFQsInUserCategories, getRFQsExpiringSoon, getNewSuppliersInCountry, getTopCategoriesThisWeek } from '@/utils/marketplaceIntelligence';
import { getTimeRemaining } from '@/utils/marketplaceHelpers';
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
import ErrorState from '@/components/ui/ErrorState';
import { format } from 'date-fns';

export default function DashboardHome({ currentRole = 'buyer' }) {
  const [allStats, setAllStats] = useState([]); // Store all stats
  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [allRecentRFQs, setAllRecentRFQs] = useState([]); // Store all RFQs
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [viewMode, setViewMode] = useState('everything'); // For hybrid users
  const navigate = useNavigate();
  const [rfqsInCategories, setRfqsInCategories] = useState([]);
  const [rfqsExpiringSoon, setRfqsExpiringSoon] = useState([]);
  const [newSuppliers, setNewSuppliers] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false); // Prevent concurrent loads

  // Filter stats based on viewMode (no reload needed)
  const stats = React.useMemo(() => {
    if (!Array.isArray(allStats)) return [];
    if (viewMode === 'everything') return allStats;
    if (viewMode === 'buyer') {
      return allStats.filter(s => s && ['Open Orders', 'Active RFQs', 'Unread Messages', 'Saved Products'].includes(s.label));
    }
    if (viewMode === 'seller') {
      return allStats.filter(s => s && ['Active Listings', 'New Inquiries', 'Orders to Fulfill', 'Payout Balance'].includes(s.label));
    }
    return allStats;
  }, [allStats, viewMode]);

  useEffect(() => {
    if (!loadingRef.current) {
      loadDashboardData();
      loadIntelligenceData();
    }
  }, [currentRole, loadDashboardData, loadIntelligenceData]); // Include both callbacks to prevent stale closures

  const loadDashboardData = useCallback(async () => {
    if (loadingRef.current) return; // Prevent concurrent loads
    loadingRef.current = true;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Use centralized helper
      const { user: userData, profile, companyId: userCompanyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!userData) {
        navigate('/login');
        return;
      }

      setUser(userData || profile);
      setCompanyId(userCompanyId);

      // Load all data in parallel with individual error handling
      const results = await Promise.allSettled([
        loadStats(profile || userData, userCompanyId),
        loadActivities(userData, userCompanyId),
        loadTasks(userData, userCompanyId),
        loadRecentOrders(userData, userCompanyId),
        loadRecentRFQs(userData, userCompanyId),
        loadUnreadMessages(userData, userCompanyId)
      ]);

      // Check for critical errors
      const criticalErrors = Array.isArray(results) ? results.filter(r => r && r.status === 'rejected' && 
        (r.reason?.message?.includes('auth') || r.reason?.message?.includes('session') || r.reason?.message?.includes('unauthorized'))
      ) : [];

      if (criticalErrors.length > 0) {
        throw new Error('Authentication error. Please log in again.');
      }
    } catch (error) {
      // Only show error if it's a critical error, not just data loading issues
      if (error?.message?.includes('auth') || error?.message?.includes('session') || error?.message?.includes('unauthorized')) {
        toast.error('Authentication error. Please log in again.');
        navigate('/login');
      } else {
        setError(error?.message || 'Failed to load dashboard data');
      }
      // Non-critical errors are silently handled - partial data may still load
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [currentRole, navigate]);

  const loadIntelligenceData = useCallback(async () => {
    try {
      const { user: userData, profile, companyId: userCompanyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!userData || !userCompanyId) return;
      
      const role = getUserRole(profile || userData);
      
      // Load data based on role
      if (role === 'seller' || role === 'hybrid') {
        const [rfqsInCats, expiringRfqs] = await Promise.all([
          getRFQsInUserCategories(userCompanyId, 5),
          getRFQsExpiringSoon(userCompanyId, 7, 5)
        ]);
        setRfqsInCategories(rfqsInCats);
        setRfqsExpiringSoon(expiringRfqs);
      }
      
      if (role === 'buyer' || role === 'hybrid') {
        // Get user's country
        const { data: company } = await supabase
          .from('companies')
          .select('country')
          .eq('id', userCompanyId)
          .single();
        
        if (company?.country) {
          const suppliers = await getNewSuppliersInCountry(company.country, 30, 5);
          setNewSuppliers(suppliers);
        }
      }
      
      // Load top categories (for all roles)
      const topCats = await getTopCategoriesThisWeek(5);
      setTopCategories(topCats);
    } catch (error) {
      // Silently fail - intelligence is optional
    }
  }, []);

  const loadStats = async (profileData, companyId) => {
    try {
      const role = getUserRole(profileData);
      const statsData = [];
      const userIsHybrid = isHybrid(role);
      
      // Use helper functions for data loading decisions
      const showBuyerStats = shouldLoadBuyerData(role, viewMode);
      const showSellerStats = shouldLoadSellerData(role, viewMode);

      if (showBuyerStats) {
        const [ordersRes, rfqsRes, messagesRes, savedProductsRes] = await Promise.all([
          companyId ? supabase.from('orders').select('*', { count: 'exact' }).eq('buyer_company_id', companyId).catch(() => ({ data: [], count: 0 })) : Promise.resolve({ data: [], count: 0 }),
          companyId ? supabase.from('rfqs').select('*', { count: 'exact' }).eq('buyer_company_id', companyId).in('status', ['open', 'pending']).catch(() => ({ data: [], count: 0 })) : Promise.resolve({ data: [], count: 0 }),
          companyId ? supabase.from('messages').select('*', { count: 'exact' }).eq('receiver_company_id', companyId).eq('read', false).catch(() => ({ data: [], count: 0 })) : Promise.resolve({ data: [], count: 0 }),
          profileData?.id ? supabase.from('saved_items').select('*', { count: 'exact' }).eq('user_id', profileData.id).eq('item_type', 'product').catch(() => ({ count: 0 })) : Promise.resolve({ count: 0 })
      ]);

      const ordersInProgress = companyId ? await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('buyer_company_id', companyId)
          .in('status', ['pending', 'processing', 'shipped'])
          .catch(() => ({ count: 0 })) : { count: 0 };

      statsData.push(
          { icon: ShoppingCart, label: 'Open Orders', value: (ordersInProgress.count || 0).toString(), color: 'orange' },
        { icon: FileText, label: 'Active RFQs', value: (rfqsRes.count || 0).toString(), color: 'blue' },
          { icon: MessageSquare, label: 'Unread Messages', value: (messagesRes.count || 0).toString(), color: 'blue' },
          { icon: Package, label: 'Saved Products', value: (savedProductsRes.count || 0).toString(), color: 'purple' }
        );
      }

      if (showSellerStats) {
        const [ordersRes, productsRes, messagesRes, revenueRes, walletRes, inquiriesRes] = await Promise.all([
          companyId ? supabase.from('orders').select('*', { count: 'exact' }).eq('seller_company_id', companyId).in('status', ['pending', 'processing']).catch(() => ({ count: 0 })) : Promise.resolve({ count: 0 }),
          companyId ? supabase.from('products').select('*', { count: 'exact' }).eq('company_id', companyId).eq('status', 'active').catch(() => ({ count: 0 })) : Promise.resolve({ count: 0 }),
          companyId ? supabase.from('messages').select('*', { count: 'exact' }).eq('receiver_company_id', companyId).eq('read', false).catch(() => ({ count: 0 })) : Promise.resolve({ count: 0 }),
          companyId ? supabase.from('orders').select('total_amount').eq('seller_company_id', companyId).eq('payment_status', 'paid').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          companyId ? supabase.from('wallet_transactions').select('amount').eq('company_id', companyId).eq('type', 'payout').eq('status', 'completed').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          companyId ? supabase.from('messages').select('*', { count: 'exact' }).eq('receiver_company_id', companyId).eq('read', false).not('related_type', 'is', null).catch(() => ({ count: 0 })) : Promise.resolve({ count: 0 })
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
          companyId ? supabase.from('shipments').select('*', { count: 'exact' }).eq('logistics_partner_id', companyId).in('status', ['picked_up', 'in_transit', 'out_for_delivery']).catch(() => ({ count: 0 })) : Promise.resolve({ count: 0 }),
          supabase.from('rfqs').select('*', { count: 'exact' }).eq('status', 'open').catch(() => ({ count: 0 }))
      ]);

      statsData.push(
          { icon: Truck, label: 'Shipments in Transit', value: (shipmentsRes.count || 0).toString(), color: 'orange' },
          { icon: FileText, label: 'Open Quote Requests', value: (quoteRequestsRes.count || 0).toString(), color: 'blue' }
      );
    }

      setAllStats(statsData); // Store all stats
    } catch (error) {
      // Set empty stats instead of crashing
      setAllStats([]);
    }
  };

  const loadActivities = async (userData, companyId) => {
    const activitiesData = [];

    try {
    // Load recent notifications
    if (companyId) {
        const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(10);

        if (!notifError && Array.isArray(notifications)) {
          notifications.forEach(notif => {
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
    }

    // Load recent order updates
    if (companyId) {
        const { data: recentOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*, products(*)')
        .or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`)
        .order('updated_at', { ascending: false })
        .limit(5);

        if (!ordersError && Array.isArray(recentOrders)) {
          recentOrders.forEach(order => {
        activitiesData.push({
          id: `order-${order.id}`,
          type: 'order',
              title: `Order ${order.id?.slice(0, 8) || 'N/A'} status updated`,
          message: `Status changed to ${order.status}`,
          timestamp: order.updated_at,
          link: `/dashboard/orders/${order.id}`
        });
      });
        }
    }

    // Sort by timestamp and limit
    activitiesData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setActivities(activitiesData.slice(0, 10));
    } catch (error) {
      setActivities([]);
    }
  };

  const loadTasks = async (userData, companyId) => {
    const tasksData = [];

    try {
    // Check if company info is incomplete
    if (companyId) {
        const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

        if (!companyError && (!company?.company_name || !company?.country || !company?.phone)) {
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
        const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('supplier_id', companyId);

        if (!productsError) {
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
    }

    // Check for unread messages
    if (companyId) {
        const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('receiver_company_id', companyId)
        .eq('read', false);

        if (!messagesError && (messages?.length || 0) > 0) {
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
        const { data: rfqs, error: rfqsError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('status', 'open')
        .limit(5);

        if (!rfqsError && (rfqs?.length || 0) > 0) {
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
    } catch (error) {
      setTasks([]);
    }
  };

  const loadRecentOrders = async (userData, companyId) => {
    if (!companyId) {
      setRecentOrders([]);
      return;
    }

    try {
    const role = userData.role || userData.user_role || 'buyer';
      const isHybrid = role === 'hybrid';
      const showBuyerOrders = isHybrid ? (viewMode === 'everything' || viewMode === 'buyer') : (role === 'buyer');
      const showSellerOrders = isHybrid ? (viewMode === 'everything' || viewMode === 'seller') : (role === 'seller');

      let orders = [];

      if (showBuyerOrders) {
        const { data: buyerOrders, error: buyerError } = await supabase
          .from('orders')
          .select('*, products(*)')
          .eq('buyer_company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (!buyerError && buyerOrders) {
          orders = [...orders, ...buyerOrders];
        }
      }

      if (showSellerOrders) {
        const { data: sellerOrders, error: sellerError } = await supabase
          .from('orders')
          .select('*, products(*)')
          .eq('seller_company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (!sellerError && sellerOrders) {
          orders = [...orders, ...sellerOrders];
        }
      }

      // Sort by created_at and limit to 5
      orders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      setRecentOrders([]);
    }
  };

  const loadRecentRFQs = async (userData, companyId) => {
    if (!companyId) {
      setAllRecentRFQs([]);
      return;
    }

    try {
    const role = userData.role || userData.user_role || 'buyer';
      const isHybrid = role === 'hybrid';

      let rfqs = [];

      // Always load buyer RFQs if user is buyer or hybrid
      if (role === 'buyer' || isHybrid) {
        const { data: sentRFQs, error: sentError } = await supabase
          .from('rfqs')
          .select('*, categories(*)')
          .eq('buyer_company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!sentError && sentRFQs) {
          rfqs = [...rfqs, ...sentRFQs];
        }
      }

      // Always load seller RFQs if user is seller or hybrid
      if (role === 'seller' || isHybrid) {
        const { data: receivedRFQs, error: receivedError } = await supabase
          .from('rfqs')
          .select('*, categories(*)')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (!receivedError && receivedRFQs) {
          rfqs = [...rfqs, ...receivedRFQs];
        }
      }

      // Sort by created_at and store all
      rfqs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setAllRecentRFQs(rfqs);
    } catch (error) {
      setAllRecentRFQs([]);
    }
  };

  // Filter RFQs based on viewMode (no reload needed)
  const recentRFQs = React.useMemo(() => {
    const role = user?.role || user?.user_role || 'buyer';
    const isHybrid = role === 'hybrid';
    
    if (!Array.isArray(allRecentRFQs)) return [];
    
    if (!isHybrid || viewMode === 'everything') {
      return allRecentRFQs.slice(0, 5);
    }
    
    if (viewMode === 'buyer') {
      return allRecentRFQs.filter(rfq => rfq && rfq.buyer_company_id === companyId).slice(0, 5);
    }
    
    if (viewMode === 'seller') {
      return allRecentRFQs.filter(rfq => rfq && rfq.buyer_company_id !== companyId).slice(0, 5);
    }
    
    return allRecentRFQs.slice(0, 5);
  }, [allRecentRFQs, viewMode, user, companyId]);

  const loadUnreadMessages = async (userData, companyId) => {
    if (!companyId) {
      setUnreadMessages(0);
      return;
    }

    try {
      const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_company_id', companyId)
      .eq('read', false);

      if (error) throw error;
    setUnreadMessages(count || 0);
    } catch (error) {
      setUnreadMessages(0);
    }
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

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          loadDashboardData();
        }}
      />
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
            Welcome back{user?.full_name || user?.name ? `, ${(user.full_name || user.name || '').split(' ')[0]}` : ''}!
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
        {Array.isArray(stats) && stats.map((stat, idx) => (
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
        {Array.isArray(actions) && actions.map((action, idx) => {
          const Icon = action.icon;
          const colorMap = {
            blue: { bg: 'bg-afrikoni-gold/20', text: 'text-afrikoni-gold' },
            orange: { bg: 'bg-afrikoni-gold/20', text: 'text-afrikoni-gold' },
            green: { bg: 'bg-afrikoni-gold/20', text: 'text-afrikoni-gold' },
            purple: { bg: 'bg-afrikoni-gold/20', text: 'text-afrikoni-gold' },
            red: { bg: 'bg-afrikoni-gold/20', text: 'text-afrikoni-gold' }
          };
          const colors = colorMap[action.color] || colorMap.orange;
          return (
            <Link key={idx} to={action.link}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-afrikoni-lg transition-all cursor-pointer group relative">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className={`p-3 rounded-lg ${colors.bg} group-hover:scale-110 transition-transform relative`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                      {action.badge > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-afrikoni-chestnut text-afrikoni-cream">
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
                {Array.isArray(tasks) && tasks.map((task) => (
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
                {Array.isArray(activities) && activities.map((activity) => (
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
                {Array.isArray(recentOrders) && recentOrders.map((order) => (
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
                {Array.isArray(recentRFQs) && recentRFQs.map((rfq) => (
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

      {/* Intelligence Widgets */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* RFQs in Your Categories (Seller/Hybrid) */}
        {(currentRole === 'seller' || currentRole === 'hybrid') && rfqsInCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Active RFQs in Your Categories
                </div>
                <Link to="/dashboard/rfqs">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(rfqsInCategories) && rfqsInCategories.map((rfq) => (
                  <Link key={rfq.id} to={`/dashboard/rfqs/${rfq.id}`}>
                    <div className="p-3 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-offwhite transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-afrikoni-chestnut truncate">{rfq.title}</span>
                        <Badge variant="outline" className="text-xs">{rfq.categories?.name}</Badge>
                      </div>
                      <div className="text-xs text-afrikoni-deep/70">
                        Budget: {rfq.target_price ? `$${rfq.target_price.toLocaleString()}` : 'Negotiable'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* RFQs Expiring Soon (Seller/Hybrid) */}
        {(currentRole === 'seller' || currentRole === 'hybrid') && rfqsExpiringSoon.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-600" />
                  RFQs Expiring Soon
                </div>
                <Link to="/dashboard/rfqs">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(rfqsExpiringSoon) && rfqsExpiringSoon.map((rfq) => {
                  const deadline = rfq.delivery_deadline || rfq.expires_at;
                  const timeRemaining = deadline ? getTimeRemaining(deadline) : null;
                  return (
                    <Link key={rfq.id} to={`/dashboard/rfqs/${rfq.id}`}>
                      <div className="p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-afrikoni-chestnut truncate">{rfq.title}</span>
                          {timeRemaining && (
                            <Badge variant="destructive" className="text-xs">
                              {timeRemaining.text}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-afrikoni-deep/70">
                          {rfq.categories?.name}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* New Suppliers in Your Country (Buyer/Hybrid) */}
        {(currentRole === 'buyer' || currentRole === 'hybrid') && newSuppliers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  New Suppliers in Your Country
                </div>
                <Link to="/suppliers">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(newSuppliers) && newSuppliers.map((supplier) => (
                  <Link key={supplier.id} to={`/supplier?id=${supplier.id}`}>
                    <div className="p-3 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-offwhite transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-afrikoni-chestnut">{supplier.company_name}</span>
                        {supplier.verified && (
                          <Badge variant="verified" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      <div className="text-xs text-afrikoni-deep/70">
                        {supplier.country}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Categories This Week */}
        {topCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Categories This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.isArray(topCategories) && topCategories.map((item, idx) => (
                  <div key={item.category_id} className="flex items-center justify-between p-2 border border-afrikoni-gold/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-afrikoni-gold w-6 text-center">{idx + 1}</span>
                      <span className="text-sm text-afrikoni-deep">{item.category?.name || 'Uncategorized'}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{item.count} RFQs</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

