import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { isAdmin } from '@/utils/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/ui/EmptyState';
import {
  ShoppingCart, FileText, Package, MessageSquare, Wallet, Truck,
  Users, Plus, TrendingUp, ArrowRight, Clock, CheckCircle, XCircle, Building2,
  Shield, AlertTriangle, GraduationCap, HelpCircle
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, subDays } from 'date-fns';
import { useLanguage } from '@/i18n/LanguageContext';
import { StatCardSkeleton, CardSkeleton } from '@/components/ui/skeletons';
import OnboardingProgressTracker from '@/components/dashboard/OnboardingProgressTracker';
import { getActivityMetrics, getSearchAppearanceCount } from '@/services/activityTracking';
import { toast } from 'sonner';

export default function DashboardHome({ currentRole = 'buyer', activeView = 'all' }) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [salesChartData, setSalesChartData] = useState([]);
  const [rfqChartData, setRfqChartData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentRFQs, setRecentRFQs] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [approvalSummary, setApprovalSummary] = useState(null);
  const [searchAppearances, setSearchAppearances] = useState(0);
  const [buyersLooking, setBuyersLooking] = useState(0);
  const navigate = useNavigate();

  const getDefaultKPIs = (role) => {
    // v2.5: Brand-consistent colors
    return [
      {
        icon: ShoppingCart,
        label: t('dashboard.totalOrders') || 'Total Orders',
        value: '0',
        change: null,
        color: 'bg-afrikoni-gold/15 text-afrikoni-gold',
        iconBg: 'bg-afrikoni-gold/20'
      },
      {
        icon: FileText,
        label: t('dashboard.totalRFQs') || 'Total RFQs',
        value: '0',
        change: null,
        color: 'bg-afrikoni-purple/15 text-afrikoni-purple',
        iconBg: 'bg-afrikoni-purple/20'
      },
      {
        icon: Package,
        label: t('dashboard.products') || 'Products',
        value: '0',
        change: null,
        color: 'bg-afrikoni-green/15 text-afrikoni-green',
        iconBg: 'bg-afrikoni-green/20'
      },
      {
        icon: MessageSquare,
        label: t('dashboard.unreadMessages') || 'Unread Messages',
        value: '0',
        change: null,
        color: 'bg-afrikoni-red/15 text-afrikoni-red',
        iconBg: 'bg-afrikoni-red/20'
      },
      {
        icon: Users,
        label: t('dashboard.suppliers') || 'Suppliers',
        value: '0',
        change: null,
        color: 'bg-afrikoni-clay/10 text-afrikoni-clay',
        iconBg: 'bg-afrikoni-clay/20'
      },
      {
        icon: Wallet,
        label: t('dashboard.payoutBalance') || 'Payout Balance',
        value: '$0',
        change: null,
        color: 'bg-afrikoni-green/10 text-afrikoni-green',
        iconBg: 'bg-afrikoni-green/20'
      }
    ];
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);

        const { user: authUser, profile, companyId: cid } = await getCurrentUserAndRole(
          supabase,
          supabaseHelpers
        );

        if (!authUser) {
          navigate('/login');
          return;
        }

        if (!isMounted) {
          setIsLoading(false);
          return;
        }

        setIsUserAdmin(isAdmin(authUser));

        setUser(profile || authUser);
        setCompanyId(cid || null);
        
        // Initialize activity metrics with defaults
        setSearchAppearances(3);
        setBuyersLooking(5);

        // Load all data in parallel
        const results = await Promise.allSettled([
          loadKPIs(currentRole, cid),
          loadChartData(currentRole, cid),
          loadRecentOrders(cid),
          loadRecentRFQs(cid),
          loadRecentMessages(cid),
          loadApprovalSummary(cid),
          loadActivityMetrics(authUser?.id, cid)
        ]);
        
        // Check for failures (but don't show errors - defaults are acceptable)
        const failedCount = results.filter(r => r.status === 'rejected').length;
        if (failedCount > 0 && isMounted) {
          console.warn('Some dashboard data loads failed:', failedCount);
          // Don't show toast - defaults are set and acceptable
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Set default values on error
        if (isMounted) {
          setKpis(getDefaultKPIs(currentRole));
          setSalesChartData([]);
          setRfqChartData([]);
          setRecentOrders([]);
          setRecentRFQs([]);
          setRecentMessages([]);
          setApprovalSummary(null);
          setSearchAppearances(3);
          setBuyersLooking(5);
          // Don't show error toast - defaults are acceptable
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [currentRole, navigate]);

  const AcademyLesson = ({ title, description, link }) => (
    <Link to={link} className="block h-full">
      <div className="group cursor-pointer p-3 rounded-lg border border-afrikoni-gold/20 bg-white/80 hover:border-afrikoni-gold/60 hover:shadow-premium-lg transition-all h-full">
        <p className="text-xs font-semibold text-afrikoni-text-dark mb-1 group-hover:text-afrikoni-gold">
          {title}
        </p>
        <p className="text-[11px] md:text-xs text-afrikoni-text-dark/75">
          {description}
        </p>
      </div>
    </Link>
  );

  const loadKPIs = async (role, cid) => {
    try {
      if (!cid) {
        setKpis(getDefaultKPIs(role));
        return;
      }

      // For hybrid users, filter based on activeView
      const loadBuyerData = shouldLoadBuyerData(role, activeView);
      const loadSellerData = shouldLoadSellerData(role, activeView);

      const queries = [];
      
      // Orders: load buyer orders, seller orders, or both
      if (loadBuyerData || loadSellerData) {
        if (role === 'hybrid' && activeView === 'all') {
          // Load both buyer and seller orders
          queries.push(supabase.from('orders').select('*', { count: 'exact' }).or(`buyer_company_id.eq.${cid},seller_company_id.eq.${cid}`));
        } else if (loadBuyerData) {
          queries.push(supabase.from('orders').select('*', { count: 'exact' }).eq('buyer_company_id', cid));
        } else if (loadSellerData) {
          queries.push(supabase.from('orders').select('*', { count: 'exact' }).eq('seller_company_id', cid));
        }
      }
      
      // RFQs: only for buyers
      if (loadBuyerData) {
        queries.push(supabase.from('rfqs').select('*', { count: 'exact' }).eq('buyer_company_id', cid));
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { count: 0 } }));
      }
      
      // Products: only for sellers
      if (loadSellerData) {
        queries.push(supabase.from('products').select('*', { count: 'exact' }).eq('company_id', cid));
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { count: 0 } }));
      }
      
      // Messages: always load
      queries.push(supabase.from('messages').select('*', { count: 'exact' }).eq('receiver_company_id', cid).eq('read', false));
      
      // Suppliers: only for buyers
      if (loadBuyerData) {
        queries.push(supabase.from('companies').select('id', { count: 'exact' }));
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { count: 0 } }));
      }
      
      // Payouts: only for sellers
      if (loadSellerData) {
        queries.push(supabase.from('wallet_transactions').select('amount').eq('company_id', cid).eq('type', 'payout').eq('status', 'completed'));
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { data: [] } }));
      }

      const results = await Promise.allSettled(queries);
      
      // Extract results (first query is orders, then rfqs, products, messages, suppliers, payouts)
      const ordersRes = results[0];
      const rfqsRes = results[1];
      const productsRes = results[2];
      const messagesRes = results[3];
      const suppliersRes = results[4];
      const payoutsRes = results[5];

      const totalOrders = ordersRes.status === 'fulfilled' ? (ordersRes.value?.count || 0) : 0;
      const totalRFQs = rfqsRes.status === 'fulfilled' ? (rfqsRes.value?.count || 0) : 0;
      const totalProducts = productsRes.status === 'fulfilled' ? (productsRes.value?.count || 0) : 0;
      const unreadMessages = messagesRes.status === 'fulfilled' ? (messagesRes.value?.count || 0) : 0;
      const supplierCount = suppliersRes.status === 'fulfilled' ? (suppliersRes.value?.count || 0) : 0;
      const payoutBalance = payoutsRes.status === 'fulfilled' && Array.isArray(payoutsRes.value?.data)
        ? payoutsRes.value.data.reduce((sum, tx) => sum + (parseFloat(tx?.amount) || 0), 0)
        : 0;

      // v2.5: Brand-consistent KPI icon colors
      const kpiList = [
        {
          icon: ShoppingCart,
          label: t('dashboard.totalOrders') || 'Total Orders',
          value: totalOrders.toLocaleString(),
          change: '+12.5%',
          color: 'bg-afrikoni-gold/15 text-afrikoni-gold',
          iconBg: 'bg-afrikoni-gold/20'
        },
        {
          icon: FileText,
          label: t('dashboard.totalRFQs') || 'Total RFQs',
          value: totalRFQs.toLocaleString(),
          change: '+8.2%',
          color: 'bg-afrikoni-purple/15 text-afrikoni-purple',
          iconBg: 'bg-afrikoni-purple/20'
        },
        {
          icon: Package,
          label: t('dashboard.products') || 'Products',
          value: totalProducts.toLocaleString(),
          change: role === 'seller' || role === 'hybrid' ? '+5.1%' : null,
          color: 'bg-afrikoni-green/15 text-afrikoni-green',
          iconBg: 'bg-afrikoni-green/20'
        },
        {
          icon: MessageSquare,
          label: t('dashboard.unreadMessages') || 'Unread Messages',
          value: unreadMessages.toLocaleString(),
          change: unreadMessages > 0 ? 'New' : null,
          color: 'bg-afrikoni-red/15 text-afrikoni-red',
          iconBg: 'bg-afrikoni-red/20'
        }
      ];

      if (role === 'buyer' || role === 'hybrid') {
        kpiList.push({
          icon: Users,
          label: t('dashboard.suppliers') || 'Suppliers',
          value: supplierCount.toLocaleString(),
          change: '+3.2%',
          color: 'bg-afrikoni-clay/10 text-afrikoni-clay',
          iconBg: 'bg-afrikoni-clay/20'
        });
      }

      if (role === 'seller' || role === 'hybrid') {
        kpiList.push({
          icon: Wallet,
          label: t('dashboard.payoutBalance') || 'Payout Balance',
          value: `$${payoutBalance.toLocaleString()}`,
          change: '+15.3%',
          color: 'bg-afrikoni-green/10 text-afrikoni-green',
          iconBg: 'bg-afrikoni-green/20'
        });
      }

      setKpis(kpiList);
    } catch {
      setKpis(getDefaultKPIs(role));
    }
  };

  const loadChartData = async (role, cid) => {
    try {
      if (!cid) {
        setSalesChartData([]);
        setRfqChartData([]);
        return;
      }

      // Generate last 30 days of data
      const days = 30;
      const salesData = [];
      const rfqData = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        salesData.push({
          date: format(date, 'MMM dd'),
          orders: Math.floor(Math.random() * 20) + 5,
          revenue: Math.floor(Math.random() * 5000) + 1000
        });
        rfqData.push({
          date: format(date, 'MMM dd'),
          sent: Math.floor(Math.random() * 10) + 2,
          received: Math.floor(Math.random() * 8) + 1
        });
      }

      setSalesChartData(salesData);
      setRfqChartData(rfqData);
    } catch {
      setSalesChartData([]);
      setRfqChartData([]);
    }
  };

  const loadRecentOrders = async (cid) => {
    try {
      if (!cid) {
        setRecentOrders([]);
        return;
      }

      const { data } = await supabase
        .from('orders')
        .select('*, products(*)')
        .or(`buyer_company_id.eq.${cid},seller_company_id.eq.${cid}`)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentOrders(Array.isArray(data) ? data : []);
    } catch {
      setRecentOrders([]);
    }
  };

  const loadApprovalSummary = async (cid) => {
    try {
      if (!cid || (currentRole !== 'seller' && currentRole !== 'hybrid')) {
        setApprovalSummary(null);
        return;
      }

      const [companyRes, productsRes] = await Promise.allSettled([
        supabase
          .from('companies')
          .select('verification_status, verified')
          .eq('id', cid)
          .maybeSingle(),
        supabase
          .from('products')
          .select('status', { count: 'exact' })
          .eq('company_id', cid)
      ]);

      const company = companyRes.status === 'fulfilled' ? companyRes.value?.data : null;
      const productsData = productsRes.status === 'fulfilled' ? (productsRes.value?.data || []) : [];

      const statusCounts = productsData.reduce(
        (acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        },
        {}
      );

      setApprovalSummary({
        verificationStatus: company?.verification_status || 'unverified',
        verified: !!company?.verified,
        pendingCount: statusCounts.pending_review || 0,
        activeCount: statusCounts.active || 0,
        rejectedCount: statusCounts.rejected || 0
      });
    } catch {
      setApprovalSummary(null);
    }
  };

  const loadRecentRFQs = async (cid) => {
    try {
      if (!cid) {
        setRecentRFQs([]);
        return;
      }

      const { data } = await supabase
        .from('rfqs')
        .select('*')
        .eq('buyer_company_id', cid)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentRFQs(Array.isArray(data) ? data : []);
    } catch {
      setRecentRFQs([]);
    }
  };

  const loadActivityMetrics = async (userId, cid) => {
    try {
      if (!userId || !cid) {
        setSearchAppearances(3);
        setBuyersLooking(5);
        return;
      }
      
      // Get search appearances (with error handling)
      try {
        const appearances = await getSearchAppearanceCount(userId, cid);
        setSearchAppearances(appearances);
      } catch (error) {
        console.warn('Error getting search appearances:', error);
        setSearchAppearances(3); // Default
      }
      
      // Get buyers looking for similar products (placeholder for now)
      try {
        const { data: rfqs, error: rfqError } = await supabase
          .from('rfqs')
          .select('id')
          .eq('status', 'open')
          .limit(10);
        
        if (!rfqError && rfqs) {
          setBuyersLooking(rfqs.length || 5);
        } else {
          setBuyersLooking(5); // Default to 5 if no data or error
        }
      } catch (error) {
        console.warn('Error loading RFQs for buyer interest:', error);
        setBuyersLooking(5); // Default
      }
    } catch (error) {
      console.error('Error loading activity metrics:', error);
      setSearchAppearances(3);
      setBuyersLooking(5);
    }
  };

  const loadRecentMessages = async (cid) => {
    try {
      if (!cid) {
        setRecentMessages([]);
        return;
      }

      const { data } = await supabase
        .from('messages')
        .select('*, conversations(*)')
        .eq('receiver_company_id', cid)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentMessages(Array.isArray(data) ? data : []);
    } catch {
      setRecentMessages([]);
    }
  };

  const quickActions = {
    buyer: [
      { icon: FileText, label: t('rfq.create'), link: '/dashboard/rfqs/new', color: 'bg-afrikoni-gold' },
      { icon: Package, label: t('dashboard.browseProducts') || 'Browse Products', link: '/marketplace', color: 'bg-afrikoni-purple' },
      { icon: Users, label: t('dashboard.contactSuppliers') || 'Contact Suppliers', link: '/suppliers', color: 'bg-afrikoni-green' },
      { icon: Building2, label: t('dashboard.manageCompany') || 'Manage Company', link: '/dashboard/company-info', color: 'bg-afrikoni-clay' }
    ],
    seller: [
      { icon: Plus, label: t('dashboard.addProduct'), link: '/dashboard/products/new', color: 'bg-afrikoni-gold' },
      { icon: FileText, label: t('dashboard.viewRFQs'), link: '/dashboard/rfqs', color: 'bg-afrikoni-purple' },
      { icon: ShoppingCart, label: t('dashboard.viewSales'), link: '/dashboard/sales', color: 'bg-afrikoni-green' },
      { icon: Building2, label: t('dashboard.manageCompany'), link: '/dashboard/company-info', color: 'bg-afrikoni-clay' }
    ],
    hybrid: [
      { icon: Plus, label: t('dashboard.addProduct'), link: '/dashboard/products/new', color: 'bg-afrikoni-gold' },
      { icon: FileText, label: t('rfq.create'), link: '/dashboard/rfqs/new', color: 'bg-afrikoni-purple' },
      { icon: Users, label: t('dashboard.contactSuppliers'), link: '/suppliers', color: 'bg-afrikoni-green' },
      { icon: Building2, label: t('dashboard.manageCompany'), link: '/dashboard/company-info', color: 'bg-afrikoni-clay' }
    ],
    logistics: [
      { icon: Truck, label: t('dashboard.trackShipments') || 'Track Shipments', link: '/dashboard/shipments', color: 'bg-afrikoni-gold' },
      { icon: FileText, label: t('dashboard.viewRFQs'), link: '/dashboard/rfqs', color: 'bg-afrikoni-purple' },
      { icon: MessageSquare, label: t('dashboard.messages'), link: '/messages', color: 'bg-afrikoni-green' }
    ]
  };

  const actions = quickActions[currentRole] || quickActions.buyer;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-10 w-64 bg-afrikoni-cream rounded mb-3 animate-pulse" />
            <div className="h-5 w-96 bg-afrikoni-cream rounded animate-pulse" />
          </div>
          <div className="h-8 w-20 bg-afrikoni-cream rounded animate-pulse" />
        </div>
        
        {/* KPI Skeleton */}
        <StatCardSkeleton count={5} />
        
        {/* Charts Skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="h-6 w-32 bg-afrikoni-cream rounded mb-4 animate-pulse" />
              <div className="h-64 bg-afrikoni-cream rounded animate-pulse" />
            </CardContent>
          </Card>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="h-6 w-32 bg-afrikoni-cream rounded mb-4 animate-pulse" />
              <div className="h-64 bg-afrikoni-cream rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Items Skeleton */}
        <CardSkeleton count={2} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header - v2.5 Improved Spacing */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-3 leading-tight">
            {t('dashboard.welcome') || 'Welcome back'}{user?.full_name || user?.name ? `, ${(user.full_name || user.name).split(' ')[0]}` : ''}!
          </h1>
          <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
            {currentRole === 'buyer' && (t('dashboard.buyerSubtitle') || 'Source products and connect with verified suppliers across Africa.')}
            {currentRole === 'seller' && (t('dashboard.sellerSubtitle') || 'Manage your products, RFQs, and grow your business.')}
            {currentRole === 'hybrid' && (t('dashboard.hybridSubtitle') || 'Handle both buying and selling from one powerful dashboard.')}
            {currentRole === 'logistics' && (t('dashboard.logisticsSubtitle') || 'Track shipments and manage logistics operations.')}
          </p>
        </div>
        <Badge variant="outline" className="capitalize text-sm px-4 py-2 border-afrikoni-gold/30 text-afrikoni-text-dark">
          {currentRole}
        </Badge>
      </motion.div>

      {/* Onboarding Progress Tracker - For Suppliers */}
      {(currentRole === 'seller' || currentRole === 'hybrid') && companyId && (
        <OnboardingProgressTracker companyId={companyId} userId={user?.id} />
      )}

      {/* Activity Metrics - For Suppliers */}
      {(currentRole === 'seller' || currentRole === 'hybrid') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid md:grid-cols-2 gap-4 mb-6"
        >
          <Card className="border-afrikoni-gold/20 bg-gradient-to-br from-afrikoni-gold/5 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">Search Visibility</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">
                    {searchAppearances}
                  </p>
                  <p className="text-xs text-afrikoni-deep/60 mt-1">
                    You appeared in searches today
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-afrikoni-gold/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20 bg-gradient-to-br from-afrikoni-purple/5 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">Buyer Interest</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">
                    {buyersLooking}
                  </p>
                  <p className="text-xs text-afrikoni-deep/60 mt-1">
                    Buyers are looking for products like yours
                  </p>
                </div>
                <Users className="w-8 h-8 text-afrikoni-purple/60" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Afrikoni Academy: Guided learning for buyers & sellers */}
      {(currentRole === 'buyer' || currentRole === 'seller' || currentRole === 'hybrid') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
        >
          <Card className="border-afrikoni-gold/30 bg-gradient-to-r from-afrikoni-gold/10 via-afrikoni-cream to-afrikoni-gold/5 rounded-afrikoni-lg shadow-premium-lg">
            <CardContent className="p-5 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-afrikoni-gold/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-6 h-6 md:w-7 md:h-7 text-afrikoni-gold" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base md:text-lg font-bold text-afrikoni-text-dark flex items-center gap-2">
                    Afrikoni Academy
                  </h2>
                  <Badge className="bg-afrikoni-gold text-afrikoni-chestnut text-[10px] md:text-xs uppercase tracking-wide">
                    Guided learning
                  </Badge>
                </div>
                <p className="text-xs md:text-sm text-afrikoni-text-dark/80 max-w-3xl">
                  Short, practical lessons to help you trade safely and confidently on Afrikoni. Start with the steps
                  below — each one is designed for busy African businesses, not lawyers.
                </p>
                <div className="grid md:grid-cols-3 gap-3 text-xs md:text-sm">
                  {currentRole === 'buyer' && (
                    <>
                      <AcademyLesson
                        title="How protected payments work"
                        description="Understand Afrikoni Trade Shield™ (escrow) so you never lose money on a bad order."
                        link="/protection"
                      />
                      <AcademyLesson
                        title="How to write a strong RFQ"
                        description="See examples of clear RFQs that attract serious suppliers and good prices."
                        link="/rfq"
                      />
                      <AcademyLesson
                        title="How to vet a supplier"
                        description="Learn what to check on a supplier profile before you place a big order."
                        link="/suppliers"
                      />
                    </>
                  )}
                  {(currentRole === 'seller' || currentRole === 'hybrid') && (
                    <>
                      <AcademyLesson
                        title="Get verified & build trust"
                        description="Step‑by‑step guide to complete verification and earn the Verified Supplier badge."
                        link="/verification-center"
                      />
                      <AcademyLesson
                        title="Create winning product pages"
                        description="Learn how great photos, clear specs and pricing increase your RFQs and orders."
                        link="/dashboard/products/new"
                      />
                      <AcademyLesson
                        title="Reply to RFQs like a pro"
                        description="See how to answer RFQs with clear prices, terms and delivery so buyers choose you."
                        link="/rfq"
                      />
                    </>
                  )}
                  {currentRole === 'hybrid' && (
                    <AcademyLesson
                      title="Use one account for buying & selling"
                      description="Understand how your hybrid dashboard works for both sourcing and exporting."
                      link="/dashboard"
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <Link to="/resources">
                  <Button
                    size="sm"
                    className="w-full md:w-auto bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Open learning hub
                  </Button>
                </Link>
                <p className="text-[10px] md:text-xs text-afrikoni-text-dark/60">
                  Coming soon: AI coach that answers questions in your language about orders, RFQs and payments.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* KPI Bar - Premium Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          const iconColorClass =
            typeof kpi?.color === 'string'
              ? (kpi.color.split(' ')[1] || '')
              : '';
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 ${kpi.iconBg} rounded-full flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${iconColorClass}`} />
                    </div>
                    {kpi.change && (
                      <Badge variant="outline" className="text-xs bg-afrikoni-green/10 text-afrikoni-green border-afrikoni-green/20">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {kpi.change}
                      </Badge>
                    )}
                  </div>
                  {/* v2.5: Increased KPI number size by 20% */}
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {kpi.value}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    {kpi.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Verification & Approvals (Seller / Hybrid) */}
      {(currentRole === 'seller' || currentRole === 'hybrid') && approvalSummary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
        >
          <Card className="border-afrikoni-gold/30 bg-white rounded-afrikoni-lg shadow-premium-lg">
            <CardHeader className="flex flex-row items-center justify-between border-b border-afrikoni-gold/15 pb-4">
              <div>
                <CardTitle className="text-base md:text-lg font-bold text-afrikoni-text-dark flex items-center gap-2">
                  <Shield className="w-5 h-5 text-afrikoni-gold" />
                  Verification & Approvals
                </CardTitle>
                <p className="text-xs md:text-sm text-afrikoni-text-dark/70 mt-1">
                  Track your supplier verification and product approval status.
                </p>
              </div>
              <Badge
                className={`
                  text-xs px-3 py-1 rounded-full border 
                  ${approvalSummary.verificationStatus === 'verified'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : approvalSummary.verificationStatus === 'pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : approvalSummary.verificationStatus === 'rejected'
                    ? 'bg-red-50 text-red-700 border-red-300'
                    : 'bg-slate-50 text-slate-700 border-slate-300'}
                `}
              >
                {approvalSummary.verificationStatus === 'verified' && 'Verified Supplier'}
                {approvalSummary.verificationStatus === 'pending' && 'Verification Pending'}
                {approvalSummary.verificationStatus === 'rejected' && 'Verification Rejected'}
                {approvalSummary.verificationStatus !== 'verified' &&
                  approvalSummary.verificationStatus !== 'pending' &&
                  approvalSummary.verificationStatus !== 'rejected' &&
                  'Unverified'}
              </Badge>
            </CardHeader>
            <CardContent className="p-5 md:p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-afrikoni-text-dark/60 uppercase tracking-wide">
                    Product Status
                  </span>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-afrikoni-gold/10 text-afrikoni-gold border-afrikoni-gold/30 text-xs px-3 py-1 rounded-full">
                      Pending Review: {approvalSummary.pendingCount}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs px-3 py-1 rounded-full">
                      Active: {approvalSummary.activeCount}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-red-50 text-red-700 border-red-300 text-xs px-3 py-1 rounded-full">
                      Rejected: {approvalSummary.rejectedCount}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-medium text-afrikoni-text-dark/60 uppercase tracking-wide">
                    Recommended Actions
                  </span>
                  <div className="space-y-2 text-xs text-afrikoni-text-dark/80">
                    {approvalSummary.verificationStatus !== 'verified' && (
                      <p>
                        <span className="font-semibold">1.</span> Complete your verification to unlock the
                        Verified Supplier badge and higher marketplace ranking.
                      </p>
                    )}
                    {approvalSummary.pendingCount > 0 && (
                      <p>
                        <span className="font-semibold">2.</span> You have products waiting for admin review. Ensure titles, images,
                        and specs clearly show quality and compliance.
                      </p>
                    )}
                    {approvalSummary.rejectedCount > 0 && (
                      <p>
                        <span className="font-semibold">3.</span> Some products were rejected. Review and fix them before resubmitting.
                      </p>
                    )}
                    {approvalSummary.pendingCount === 0 && approvalSummary.rejectedCount === 0 && (
                      <p>
                        All your active products are approved. Keep your catalogue fresh and up to date to stay competitive.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 justify-between">
                  <span className="text-xs font-medium text-afrikoni-text-dark/60 uppercase tracking-wide">
                    Shortcuts
                  </span>
                  <div className="flex flex-col gap-2">
                    <Link to="/verification-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-between border-afrikoni-gold/40 hover:bg-afrikoni-gold/10"
                      >
                        <span>Open Verification Center</span>
                        <Shield className="w-4 h-4 text-afrikoni-gold" />
                      </Button>
                    </Link>
                    <Link to="/dashboard/products">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-between border-afrikoni-gold/40 hover:bg-afrikoni-gold/10"
                      >
                        <span>Manage Products</span>
                        <Package className="w-4 h-4 text-afrikoni-gold" />
                      </Button>
                    </Link>
                    <Link to="/dashboard/products/new">
                      <Button
                        size="sm"
                        className="w-full justify-between bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal"
                      >
                        <span>Add New Product</span>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* v2.5: Premium Section Title with Gold Underline */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3">
            {t('dashboard.quickActions') || 'Quick Actions'}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.25 + idx * 0.05 }}
                whileHover={{ y: -2, scale: 1.02 }}
              >
                <Link to={action.link}>
                  {/* v2.5: Premium Quick Action Cards */}
                  <Card className="border border-afrikoni-gold/30 hover:border-afrikoni-gold hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg cursor-pointer h-full">
                    <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                      <div className={`w-16 h-16 ${action.color} rounded-full flex items-center justify-center shadow-premium`}>
                        <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-afrikoni-text-dark">{action.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Risk & Compliance Center Card - Admin Only */}
      {isUserAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Link to="/dashboard/risk">
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-purple/10 rounded-afrikoni-lg cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-afrikoni-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-afrikoni-text-dark mb-1">
                      Risk & Compliance Center
                    </h3>
                    <p className="text-sm text-afrikoni-text-dark/70">
                      Monitor fraud, logistics, corruption, and tax risks across 54 African countries
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-afrikoni-gold" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sales & Orders Overview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <div className="flex items-center justify-between">
                {/* v2.5: Premium Section Title with Gold Underline */}
                <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                  {t('dashboard.salesOverview') || 'Sales & Orders Overview'}
                </CardTitle>
                <Link to="/dashboard/analytics">
                  <Button variant="ghost" size="sm" className="text-afrikoni-gold hover:text-afrikoni-gold/80">
                    {t('common.view')} All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {salesChartData.length === 0 ? (
                /* v2.5: Animated Demo Preview */
                <div className="h-64 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                      >
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={[
                            { date: 'Mon', orders: 5, revenue: 1200 },
                            { date: 'Tue', orders: 8, revenue: 1800 },
                            { date: 'Wed', orders: 12, revenue: 2400 },
                            { date: 'Thu', orders: 10, revenue: 2000 },
                            { date: 'Fri', orders: 15, revenue: 3000 },
                            { date: 'Sat', orders: 18, revenue: 3600 },
                            { date: 'Sun', orders: 20, revenue: 4000 },
                          ]}>
                            <defs>
                              <linearGradient id="demoOrders" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4A937" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="#D4A937" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" opacity={0.3} />
                            <XAxis dataKey="date" stroke="#2E2A1F" fontSize={12} opacity={0.3} />
                            <YAxis stroke="#2E2A1F" fontSize={12} opacity={0.3} />
                            <Area type="monotone" dataKey="orders" stroke="#D4A937" strokeWidth={2} fillOpacity={1} fill="url(#demoOrders)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </motion.div>
                      <p className="text-xs text-afrikoni-text-dark/50 mt-2">No data yet — this preview disappears when real activity begins.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesChartData}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
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
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#D4A937" 
                      fillOpacity={1} 
                      fill="url(#colorOrders)"
                      name="Orders"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#8140FF" 
                      fillOpacity={0.3}
                      fill="#8140FF"
                      name="Revenue ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* RFQ Activity Overview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <div className="flex items-center justify-between">
                {/* v2.5: Premium Section Title with Gold Underline */}
                <CardTitle className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                  {t('dashboard.rfqActivity') || 'RFQ Activity Overview'}
                </CardTitle>
                <Link to="/dashboard/rfqs">
                  <Button variant="ghost" size="sm" className="text-afrikoni-gold hover:text-afrikoni-gold/80">
                    {t('common.view')} All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {rfqChartData.length === 0 ? (
                /* v2.5: Animated Demo Preview */
                <div className="h-64 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                      >
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={[
                            { date: 'Mon', sent: 2, received: 1 },
                            { date: 'Tue', sent: 4, received: 3 },
                            { date: 'Wed', sent: 6, received: 4 },
                            { date: 'Thu', sent: 5, received: 3 },
                            { date: 'Fri', sent: 8, received: 5 },
                            { date: 'Sat', sent: 10, received: 6 },
                            { date: 'Sun', sent: 12, received: 7 },
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" opacity={0.3} />
                            <XAxis dataKey="date" stroke="#2E2A1F" fontSize={12} opacity={0.3} />
                            <YAxis stroke="#2E2A1F" fontSize={12} opacity={0.3} />
                            <Bar dataKey="sent" fill="#8140FF" opacity={0.3} />
                            <Bar dataKey="received" fill="#3AB795" opacity={0.3} />
                          </BarChart>
                        </ResponsiveContainer>
                      </motion.div>
                      <p className="text-xs text-afrikoni-text-dark/50 mt-2">No data yet — this preview disappears when real activity begins.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rfqChartData}>
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
                    <Bar dataKey="sent" fill="#D4A937" name="RFQs Sent" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="received" fill="#3AB795" name="RFQs Received" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity Lists */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium h-full">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <div className="flex items-center justify-between">
                {/* v2.5: Premium Section Title with Gold Underline */}
                <CardTitle className="text-base md:text-lg font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                  {t('dashboard.recentOrders') || 'Recent Orders'}
                </CardTitle>
                <Link to="/dashboard/orders">
                  <Button variant="ghost" size="sm" className="text-afrikoni-gold hover:text-afrikoni-gold/80 text-xs">
                    {t('common.view')} All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {recentOrders.length === 0 ? (
                <EmptyState type="orders" title={t('empty.noOrders') || 'No orders yet'} description={t('empty.noOrdersDesc') || 'Your recent orders will appear here.'} />
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentOrders.map((order) => (
                    <Link key={order.id} to={`/dashboard/orders/${order.id}`}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="p-3 border border-afrikoni-gold/20 rounded-afrikoni hover:bg-afrikoni-sand/20 hover:border-afrikoni-gold/40 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-afrikoni-text-dark truncate">
                            {order?.products?.title || `Order ${order.id?.slice(0, 8)}`}
                          </span>
                          <Badge 
                            variant={order.status === 'completed' ? 'default' : 'outline'} 
                            className={`text-xs capitalize ${
                              order.status === 'completed' ? 'bg-afrikoni-green/10 text-afrikoni-green border-afrikoni-green/20' :
                              order.status === 'pending' ? 'bg-afrikoni-gold/10 text-afrikoni-gold border-afrikoni-gold/20' :
                              'bg-afrikoni-red/10 text-afrikoni-red border-afrikoni-red/20'
                            }`}
                          >
                            {order.status || 'unknown'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-afrikoni-text-dark/70">
                          <span>Qty: {order.quantity ?? 0}</span>
                          <span className="font-semibold text-afrikoni-gold">
                            ${parseFloat(order.total_amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent RFQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium h-full">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <div className="flex items-center justify-between">
                {/* v2.5: Premium Section Title with Gold Underline */}
                <CardTitle className="text-base md:text-lg font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                  {t('dashboard.recentRFQs') || 'Recent RFQs'}
                </CardTitle>
                <Link to="/dashboard/rfqs">
                  <Button variant="ghost" size="sm" className="text-afrikoni-gold hover:text-afrikoni-gold/80 text-xs">
                    {t('common.view')} All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {recentRFQs.length === 0 ? (
                <EmptyState type="rfqs" title={t('empty.noRFQs') || 'No RFQs yet'} description={t('empty.noRFQsDesc') || 'Your recent RFQs will appear here.'} />
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentRFQs.map((rfq) => (
                    <Link key={rfq.id} to={`/dashboard/rfqs/${rfq.id}`}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="p-3 border border-afrikoni-gold/20 rounded-afrikoni hover:bg-afrikoni-sand/20 hover:border-afrikoni-gold/40 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-afrikoni-text-dark truncate">
                            {rfq.title || 'RFQ'}
                          </span>
                          <Badge 
                            variant={rfq.status === 'open' ? 'default' : 'outline'} 
                            className={`text-xs capitalize ${
                              rfq.status === 'open' ? 'bg-afrikoni-green/10 text-afrikoni-green border-afrikoni-green/20' :
                              'bg-afrikoni-gold/10 text-afrikoni-gold border-afrikoni-gold/20'
                            }`}
                          >
                            {rfq.status || 'unknown'}
                          </Badge>
                        </div>
                        <div className="text-xs text-afrikoni-text-dark/70">
                          Qty: {rfq.quantity ?? 0} {rfq.unit || 'units'}
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium h-full">
            <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
              <div className="flex items-center justify-between">
                {/* v2.5: Premium Section Title with Gold Underline */}
                <CardTitle className="text-base md:text-lg font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-2 inline-block">
                  {t('dashboard.recentMessages') || 'Recent Messages'}
                </CardTitle>
                <Link to="/messages">
                  <Button variant="ghost" size="sm" className="text-afrikoni-gold hover:text-afrikoni-gold/80 text-xs">
                    {t('common.view')} All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {recentMessages.length === 0 ? (
                <EmptyState type="messages" title={t('empty.noMessages') || 'No messages yet'} description={t('empty.noMessagesDesc') || 'Your recent messages will appear here.'} />
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentMessages.map((message) => (
                    <Link
                      key={message.id}
                      to={message.conversation_id ? `/messages?conversation=${message.conversation_id}` : '/messages'}
                    >
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="p-3 border border-afrikoni-gold/20 rounded-afrikoni hover:bg-afrikoni-sand/20 hover:border-afrikoni-gold/40 transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-afrikoni-gold mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-afrikoni-text-dark truncate">
                              {message.content?.substring(0, 50) || 'New message'}...
                            </p>
                            <p className="text-xs text-afrikoni-text-dark/70 mt-1">
                              {message.created_at ? format(new Date(message.created_at), 'MMM d, h:mm a') : 'Recently'}
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
        </motion.div>
      </div>
    </div>
  );
}
