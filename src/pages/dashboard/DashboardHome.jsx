import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { isAdmin } from '@/utils/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/ui/EmptyState';
import {
  ShoppingCart, FileText, Package, MessageSquare, Wallet, Truck,
  Users, Plus, TrendingUp, ArrowRight, Clock, CheckCircle, XCircle, Building2,
  Shield, AlertTriangle, GraduationCap, HelpCircle, RefreshCw, BarChart3
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, subDays } from 'date-fns';
import { StatCardSkeleton, CardSkeleton } from '@/components/ui/skeletons';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';
import OnboardingProgressTracker from '@/components/dashboard/OnboardingProgressTracker';
import { getActivityMetrics, getSearchAppearanceCount } from '@/services/activityTracking';
import { toast } from 'sonner';
import { getUserDisplayName } from '@/utils/userHelpers';
import { useTranslation } from 'react-i18next';
import { useRealTimeDashboardData } from '@/hooks/useRealTimeData';

export default function DashboardHome({ currentRole = 'buyer', activeView = 'all' }) {
  const { t } = useTranslation();
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false); // Local loading state for data fetching
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

  // Helper functions to determine which data to load
  const shouldLoadBuyerData = (role, view) => {
    return role === 'buyer' || (role === 'hybrid' && (view === 'all' || view === 'buyer'));
  };

  const shouldLoadSellerData = (role, view) => {
    return role === 'seller' || (role === 'hybrid' && (view === 'all' || view === 'seller'));
  };

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
    let timeoutId = null;

    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[DashboardHome] Waiting for auth to be ready...');
      setIsLoading(false); // Don't show spinner while waiting for auth
      return;
    }

    // GUARD: No user → redirect to login
    if (!user) {
      console.log('[DashboardHome] No user → redirecting to login');
      setIsLoading(false);
      navigate('/login');
      return;
    }

    // Safety timeout: Force loading to false after 15 seconds
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[DashboardHome] Loading timeout - forcing loading to false');
        setIsLoading(false);
      }
    }, 15000);

    const load = async () => {
      try {
        setIsLoading(true);

        // Use auth from context (no duplicate call)
        const cid = profile?.company_id || null;

        if (!isMounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
          return;
        }

        setIsUserAdmin(isAdmin(user, profile));
        setCompanyId(cid);

        // ✅ Initialize activity metrics to 0 (will be updated with real data)
        setSearchAppearances(0);
        setBuyersLooking(0);

        // Load all data in parallel (GUARDED: auth is ready, user exists)
        const results = await Promise.allSettled([
          loadKPIs(currentRole, cid),
          loadChartData(currentRole, cid),
          loadRecentOrders(cid),
          loadRecentRFQs(cid),
          loadRecentMessages(cid),
          loadApprovalSummary(cid),
          loadActivityMetrics(user?.id, cid)
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
          clearTimeout(timeoutId);
          setKpis(getDefaultKPIs(currentRole));
          setSalesChartData([]);
          setRfqChartData([]);
          setRecentOrders([]);
          setRecentRFQs([]);
          setRecentMessages([]);
          setApprovalSummary(null);
          setSearchAppearances(0);
          setBuyersLooking(0);
          setIsLoading(false);
          // Don't show error toast - defaults are acceptable
        }
      } finally {
        // Safety net: Always clear timeout and set loading to false
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }
    };

    // Only load data when auth is ready
    if (authReady && !authLoading && user) {
      load();
    }

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [authReady, authLoading, user, profile?.company_id, role, currentRole, navigate]); // Use profile?.company_id to prevent re-renders on profile updates

  // Real-time data updates
  const handleRealTimeUpdate = useCallback((payload) => {
    console.log('[Dashboard] Real-time update:', payload.table, payload.event);
    
    // Reload specific data based on what changed
    if (payload.table === 'orders') {
      loadKPIs(currentRole, companyId);
      loadChartData(currentRole, companyId);
      loadRecentOrders(companyId);
    } else if (payload.table === 'rfqs') {
      loadKPIs(currentRole, companyId);
      loadChartData(currentRole, companyId);
      loadRecentRFQs(companyId);
    } else if (payload.table === 'products') {
      loadKPIs(currentRole, companyId);
    } else if (payload.table === 'notifications') {
      // Notification bell will handle its own updates
    } else if (payload.table === 'messages') {
      loadKPIs(currentRole, companyId);
      loadRecentMessages(companyId);
    }
  }, [currentRole, companyId]);

  // Subscribe to real-time updates (only if companyId is valid)
  const { subscriptions } = useRealTimeDashboardData(
    companyId && typeof companyId === 'string' && companyId.trim() !== '' ? companyId : null,
    user?.id,
    handleRealTimeUpdate
  );

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
      
      // RFQs: only for buyers (with null check)
      if (loadBuyerData && cid) {
        queries.push(supabase.from('rfqs').select('*', { count: 'exact' }).eq('buyer_company_id', cid));
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { count: 0 } }));
      }
      
      // Products: only for sellers (with null check)
      if (loadSellerData && cid) {
        queries.push(supabase.from('products').select('*', { count: 'exact' }).eq('company_id', cid));
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { count: 0 } }));
      }
      
      // Messages: always load (with null check)
      if (cid) {
        queries.push(supabase.from('messages').select('*', { count: 'exact' }).eq('receiver_company_id', cid).eq('read', false));
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { count: 0 } }));
      }
      
      // Suppliers: only for buyers - count verified suppliers or suppliers buyer has interacted with
      if (loadBuyerData && cid) {
        // Count unique suppliers from orders and RFQs the buyer has interacted with
        // This shows real, relevant suppliers, not all companies
        queries.push(
          supabase
            .from('orders')
            .select('seller_company_id')
            .eq('buyer_company_id', cid)
            .not('seller_company_id', 'is', null)
        );
        // Also get verified suppliers count as fallback
        queries.push(
          supabase
            .from('companies')
            .select('id', { count: 'exact' })
            .or('verified.eq.true,verification_status.eq.verified')
        );
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { data: [] } }));
        queries.push(Promise.resolve({ status: 'fulfilled', value: { count: 0 } }));
      }
      
      // Payouts: only for sellers
      if (loadSellerData) {
        queries.push(supabase.from('wallet_transactions').select('amount').eq('company_id', cid).eq('type', 'payout').eq('status', 'completed'));
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { data: [] } }));
      }

      const results = await Promise.allSettled(queries);
      
      // Extract results (first query is orders, then rfqs, products, messages, supplierInteractions, verifiedSuppliers, payouts)
      const ordersRes = results[0];
      const rfqsRes = results[1];
      const productsRes = results[2];
      const messagesRes = results[3];
      const supplierInteractionsRes = results[4];
      const verifiedSuppliersRes = results[5];
      const payoutsRes = results[6];

      const totalOrders = ordersRes.status === 'fulfilled' ? (ordersRes.value?.count || 0) : 0;
      const totalRFQs = rfqsRes.status === 'fulfilled' ? (rfqsRes.value?.count || 0) : 0;
      const totalProducts = productsRes.status === 'fulfilled' ? (productsRes.value?.count || 0) : 0;
      const unreadMessages = messagesRes.status === 'fulfilled' ? (messagesRes.value?.count || 0) : 0;
      
      // Calculate real supplier count: unique suppliers from orders, or verified suppliers count
      let supplierCount = 0;
      if (loadBuyerData && supplierInteractionsRes.status === 'fulfilled') {
        const interactions = supplierInteractionsRes.value?.data || [];
        const uniqueSuppliers = new Set(interactions.map(o => o.seller_company_id).filter(Boolean));
        supplierCount = uniqueSuppliers.size;
        
        // If no interactions yet, fall back to verified suppliers count
        if (supplierCount === 0 && verifiedSuppliersRes.status === 'fulfilled') {
          supplierCount = verifiedSuppliersRes.value?.count || 0;
        }
      } else if (loadBuyerData && verifiedSuppliersRes.status === 'fulfilled') {
        supplierCount = verifiedSuppliersRes.value?.count || 0;
      }
      const payoutBalance = payoutsRes.status === 'fulfilled' && Array.isArray(payoutsRes.value?.data)
        ? payoutsRes.value.data.reduce((sum, tx) => sum + (parseFloat(tx?.amount) || 0), 0)
        : 0;

      // v2.5: Brand-consistent KPI icon colors
      // Role-based KPI filtering: buyers don't see seller-specific metrics
      const kpiList = [];
      
      // Orders: only show for buyers if > 0, always show for sellers
      if (role === 'buyer') {
        // For buyers: only add if > 0 (will be filtered in render)
        kpiList.push({
          icon: ShoppingCart,
          label: t('dashboard.totalOrders') || 'Total Orders',
          value: totalOrders.toLocaleString(),
          change: totalOrders > 0 ? '+12.5%' : null,
          color: 'bg-afrikoni-gold/15 text-afrikoni-gold',
          iconBg: 'bg-afrikoni-gold/20'
        });
      } else if (role === 'seller' || role === 'hybrid') {
        // Sellers/hybrid: always show orders
        kpiList.push({
          icon: ShoppingCart,
          label: t('dashboard.totalOrders') || 'Total Orders',
          value: totalOrders.toLocaleString(),
          change: '+12.5%',
          color: 'bg-afrikoni-gold/15 text-afrikoni-gold',
          iconBg: 'bg-afrikoni-gold/20'
        });
      }
      
      // RFQs: always show for buyers, only for sellers if they receive RFQs
      if (role === 'buyer' || role === 'hybrid') {
        kpiList.push({
          icon: FileText,
          label: t('dashboard.totalRFQs') || 'Total RFQs',
          value: totalRFQs.toLocaleString(),
          change: totalRFQs > 0 ? '+8.2%' : null,
          color: 'bg-afrikoni-purple/15 text-afrikoni-purple',
          iconBg: 'bg-afrikoni-purple/20'
        });
      }
      
      // Products: ONLY for sellers/hybrid (buyers never see this)
      if (role === 'seller' || role === 'hybrid') {
        kpiList.push({
          icon: Package,
          label: t('dashboard.products') || 'Products',
          value: totalProducts.toLocaleString(),
          change: '+5.1%',
          color: 'bg-afrikoni-green/15 text-afrikoni-green',
          iconBg: 'bg-afrikoni-green/20'
        });
      }
      
      // Messages: always show
      kpiList.push({
        icon: MessageSquare,
        label: t('dashboard.unreadMessages') || 'Unread Messages',
        value: unreadMessages.toLocaleString(),
        change: unreadMessages > 0 ? 'New' : null,
        color: 'bg-afrikoni-red/15 text-afrikoni-red',
        iconBg: 'bg-afrikoni-red/20'
      });

      // Suppliers: ONLY for buyers (sellers never see this)
      if (role === 'buyer') {
        kpiList.push({
          icon: Users,
          label: t('dashboard.suppliers') || 'Suppliers',
          value: supplierCount.toLocaleString(),
          change: supplierCount > 0 ? '+3.2%' : null,
          color: 'bg-afrikoni-clay/10 text-afrikoni-clay',
          iconBg: 'bg-afrikoni-clay/20'
        });
      }

      // Payouts: ONLY for sellers/hybrid (buyers never see this)
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

      // Load real data from last 30 days
      const days = 30;
      const startDate = subDays(new Date(), days).toISOString();

      // Determine which data to load based on role
      const loadBuyerData = shouldLoadBuyerData(role, activeView);
      const loadSellerData = shouldLoadSellerData(role, activeView);

      const queries = [];

      // Load orders (buyer or seller)
      if (loadBuyerData || loadSellerData) {
        if (role === 'hybrid' && activeView === 'all') {
          queries.push(
            supabase
              .from('orders')
              .select('created_at, total_amount, status')
              .or(`buyer_company_id.eq.${cid},seller_company_id.eq.${cid}`)
              .gte('created_at', startDate)
          );
        } else if (loadBuyerData) {
          queries.push(
            supabase
              .from('orders')
              .select('created_at, total_amount, status')
              .eq('buyer_company_id', cid)
              .gte('created_at', startDate)
          );
        } else if (loadSellerData) {
          queries.push(
            supabase
              .from('orders')
              .select('created_at, total_amount, status')
              .eq('seller_company_id', cid)
              .gte('created_at', startDate)
          );
        } else {
          queries.push(Promise.resolve({ data: [] }));
        }
      } else {
        queries.push(Promise.resolve({ data: [] }));
      }

      // Load RFQs (buyer only)
      if (loadBuyerData && cid) {
        queries.push(
          supabase
            .from('rfqs')
            .select('created_at, status')
            .eq('buyer_company_id', cid)
            .gte('created_at', startDate)
        );
      } else {
        queries.push(Promise.resolve({ data: [] }));
      }

      // Load received RFQs (for suppliers - RFQs matched to them)
      if (loadSellerData && cid) {
        queries.push(
          supabase
            .from('rfqs')
            .select('created_at, matched_supplier_ids, status')
            .gte('created_at', startDate)
        );
      } else {
        queries.push(Promise.resolve({ data: [] }));
      }

      const results = await Promise.allSettled(queries);
      const ordersRes = results[0];
      const sentRfqsRes = results[1];
      const receivedRfqsRes = results[2];

      const orders = ordersRes.status === 'fulfilled' ? (ordersRes.value?.data || []) : [];
      const sentRfqs = sentRfqsRes.status === 'fulfilled' ? (sentRfqsRes.value?.data || []) : [];
      const allRfqs = receivedRfqsRes.status === 'fulfilled' ? (receivedRfqsRes.value?.data || []) : [];
      
      // Filter received RFQs to only those matched to this supplier
      const receivedRfqs = allRfqs.filter(rfq => 
        rfq.matched_supplier_ids && 
        Array.isArray(rfq.matched_supplier_ids) && 
        rfq.matched_supplier_ids.includes(cid)
      );

      // Build sales chart data from real orders
      const salesByDate = {};
      const ordersByDate = {};
      
      orders.forEach(order => {
        if (order && order.created_at) {
          const date = format(new Date(order.created_at), 'MMM dd');
          if (!salesByDate[date]) {
            salesByDate[date] = 0;
            ordersByDate[date] = 0;
          }
          salesByDate[date] += parseFloat(order.total_amount) || 0;
          ordersByDate[date] += 1;
        }
      });

      // Build RFQ chart data from real RFQs
      const sentRfqsByDate = {};
      const receivedRfqsByDate = {};

      sentRfqs.forEach(rfq => {
        if (rfq && rfq.created_at) {
          const date = format(new Date(rfq.created_at), 'MMM dd');
          sentRfqsByDate[date] = (sentRfqsByDate[date] || 0) + 1;
        }
      });

      receivedRfqs.forEach(rfq => {
        if (rfq && rfq.created_at) {
          const date = format(new Date(rfq.created_at), 'MMM dd');
          receivedRfqsByDate[date] = (receivedRfqsByDate[date] || 0) + 1;
        }
      });

      // Create arrays with all dates from last 30 days, filling missing dates with 0
      const allDates = [];
      for (let i = days - 1; i >= 0; i--) {
        allDates.push(format(subDays(new Date(), i), 'MMM dd'));
      }

      const salesData = allDates.map(date => ({
        date,
        orders: ordersByDate[date] || 0,
        revenue: Math.round(salesByDate[date] || 0)
      }));

      const rfqData = allDates.map(date => ({
        date,
        sent: sentRfqsByDate[date] || 0,
        received: receivedRfqsByDate[date] || 0
      }));

      setSalesChartData(salesData);
      setRfqChartData(rfqData);
    } catch (error) {
      console.error('Error loading chart data:', error);
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

      const statusCounts = (Array.isArray(productsData) ? productsData : []).reduce(
        (acc, p) => {
          if (p && p.status) {
            acc[p.status] = (acc[p.status] || 0) + 1;
          }
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
        setSearchAppearances(0);
        setBuyersLooking(0);
        return;
      }
      
      // Get search appearances - count today's product views from activity_logs
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Count how many times seller's products appeared in searches/views today
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('company_id', cid);
        
        if (products && products.length > 0) {
          const productIds = products.map(p => p.id);
          
          // Count product views today
          const { count, error: activityError } = await supabase
            .from('activity_logs')
            .select('*', { count: 'exact', head: true })
            .eq('activity_type', 'product_view')
            .in('entity_id', productIds)
            .gte('created_at', today.toISOString());
          
          if (!activityError && count !== null) {
            setSearchAppearances(count);
          } else {
            setSearchAppearances(0); // No views today for THIS client
          }
        } else {
          setSearchAppearances(0); // No products yet for THIS client
        }
      } catch (error) {
        console.warn('Error getting search appearances:', error);
        setSearchAppearances(0); // No data for THIS client
      }
      
      // Get buyers looking for similar products - count all open RFQs that match seller's product categories
      try {
        const now = new Date().toISOString();
        
        // Get seller's product categories
        const { data: products } = await supabase
          .from('products')
          .select('category_id, category')
          .eq('company_id', cid)
          .limit(100);
        
        if (products && products.length > 0) {
          // Get unique categories
          const categories = [...new Set(products.map(p => p.category_id || p.category).filter(Boolean))];
          
          // Count RFQs matching these categories
          let rfqQuery = supabase
            .from('rfqs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'open')
            .or(`expires_at.gte.${encodeURIComponent(now)},expires_at.is.null`);
          
          // If we have categories, filter by them
          if (categories.length > 0) {
            rfqQuery = rfqQuery.in('category_id', categories);
          }
          
          const { count, error: rfqError } = await rfqQuery;
          
          if (!rfqError && count !== null) {
            setBuyersLooking(count);
          } else {
            setBuyersLooking(0); // No matching RFQs for THIS client's categories
          }
        } else {
          // No products yet, show 0 (don't show other clients' RFQs)
          setBuyersLooking(0);
        }
      } catch (error) {
        console.warn('Error loading RFQs for buyer interest:', error);
        setBuyersLooking(0); // No data for THIS client
      }
    } catch (error) {
      console.error('Error loading activity metrics:', error);
      setSearchAppearances(0);
      setBuyersLooking(0);
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

  // If auth isn't ready, Dashboard.jsx will handle it - just return null here
  // This prevents cascading spinners (Dashboard shows one spinner for auth)
  if (!authReady || authLoading) {
    return null;
  }

  // Only show loading skeleton if we're actively loading data (not auth)
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
    <div className="space-y-6 pb-8">
      {/* Welcome Header - v2.5 Improved Spacing */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-3 leading-tight">
            {(() => {
              try {
                // Use centralized utility for display name
                const displayName = getUserDisplayName(user || null, null);
                
                if (displayName && displayName !== 'User' && displayName.length > 1) {
                  // Get first name (first word) from full name
                  const firstName = displayName.trim().split(/\s+/)[0];
                  if (firstName.length > 1) {
                    // Capitalize first letter, lowercase rest
                    const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
                    return `${t('dashboard.welcome') || 'Welcome back'}, ${formattedName}!`;
                  }
                }
              } catch (error) {
                console.warn('Error getting display name:', error);
              }
              
              // Fallback: extract name from email if available
              const email = user?.email || user?.user_email;
              if (email && typeof email === 'string') {
                const emailName = email.split('@')[0];
                if (emailName && emailName.length > 1) {
                  const capitalizedName = emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase();
                  return `${t('dashboard.welcome') || 'Welcome back'}, ${capitalizedName}!`;
                }
              }
              
              // Final fallback
              return `${t('dashboard.welcome') || 'Welcome back'}!`;
            })()}
          </h1>
          <p className="text-body font-normal leading-[1.6] text-afrikoni-text-dark/70">
            {currentRole === 'buyer' && (t('dashboard.buyerSubtitle') || 'Source products and connect with verified suppliers across Africa.')}
            {currentRole === 'seller' && (t('dashboard.sellerSubtitle') || 'Manage your products, RFQs, and grow your business.')}
            {currentRole === 'hybrid' && (t('dashboard.hybridSubtitle') || 'Handle both buying and selling from one powerful dashboard.')}
            {currentRole === 'logistics' && (t('dashboard.logisticsSubtitle') || 'Track shipments and manage logistics operations.')}
          </p>
        </div>
        <Badge variant="outline" className="capitalize text-sm px-4 py-2 border-afrikoni-gold/30 text-afrikoni-text-dark">
          {currentRole}
        </Badge>
      </div>

      {/* Primary CTA Banner - "What do I do now?" for new users */}
      {(() => {
        // Don't show CTA while loading
        if (isLoading) return null;
        
        // Check if user is new (no activity yet)
        // Use both recentRFQs array and KPI data for accurate check
        const rfqKPI = kpis.find(k => k.label?.includes('RFQ') || k.label?.includes('rfq'));
        const productKPI = kpis.find(k => k.label?.includes('Product') || k.label?.includes('product'));
        
        // Parse numeric value from KPI (handles strings like "0", "1,234", etc.)
        const parseKPINumber = (value) => {
          if (!value) return 0;
          // Remove commas and parse
          const cleaned = String(value).replace(/,/g, '');
          const parsed = parseInt(cleaned, 10);
          return isNaN(parsed) ? 0 : parsed;
        };
        
        const rfqCount = parseKPINumber(rfqKPI?.value) || 0;
        const productCount = parseKPINumber(productKPI?.value) || 0;
        
        const buyerHasRFQs = recentRFQs.length > 0 || rfqCount > 0;
        const sellerHasProducts = productCount > 0;
        const isNewBuyer = currentRole === 'buyer' && !buyerHasRFQs;
        const isNewSeller = currentRole === 'seller' && !sellerHasProducts;
        const isNewHybrid = currentRole === 'hybrid' && !buyerHasRFQs && !sellerHasProducts;

        if (isNewBuyer) {
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-2 border-afrikoni-gold bg-gradient-to-r from-afrikoni-gold/20 via-afrikoni-gold/10 to-afrikoni-purple/10 rounded-afrikoni-lg shadow-xl mb-6">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-afrikoni-gold rounded-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-afrikoni-chestnut" />
                        </div>
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-1">
                            Post Your First RFQ
                          </h2>
                          <p className="text-afrikoni-deep/80 text-sm md:text-base">
                            Tell suppliers what you need. We'll match you with verified African suppliers who can deliver.
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-afrikoni-deep/70 mt-2">
                        💰 <strong>Success fee only when deal closes</strong> - No upfront costs
                      </p>
                    </div>
                    <Link to="/dashboard/rfqs/new" className="w-full md:w-auto">
                      <Button
                        size="lg"
                        className="w-full md:w-auto bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all min-h-[52px]"
                      >
                        Post RFQ Now
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        }

        if (isNewSeller) {
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-2 border-afrikoni-gold bg-gradient-to-r from-afrikoni-gold/20 via-afrikoni-gold/10 to-afrikoni-purple/10 rounded-afrikoni-lg shadow-xl mb-6">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-afrikoni-gold rounded-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-afrikoni-chestnut" />
                        </div>
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-1">
                            Add Your First Product
                          </h2>
                          <p className="text-afrikoni-deep/80 text-sm md:text-base">
                            List your products to start receiving RFQs from buyers. Verified suppliers get priority matching.
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-afrikoni-deep/70 mt-2">
                        💰 <strong>Success fee only when deal closes</strong> - No listing fees
                      </p>
                    </div>
                    <Link to="/dashboard/products/new" className="w-full md:w-auto">
                      <Button
                        size="lg"
                        className="w-full md:w-auto bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all min-h-[52px]"
                      >
                        Add Product Now
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        }

        if (isNewHybrid) {
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-2 border-afrikoni-gold bg-gradient-to-r from-afrikoni-gold/20 via-afrikoni-gold/10 to-afrikoni-purple/10 rounded-afrikoni-lg shadow-xl mb-6">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-afrikoni-gold rounded-full flex items-center justify-center">
                          <Plus className="w-6 h-6 text-afrikoni-chestnut" />
                        </div>
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-1">
                            Get Started
                          </h2>
                          <p className="text-afrikoni-deep/80 text-sm md:text-base">
                            Add products to sell or post RFQs to buy. You can do both!
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-afrikoni-deep/70 mt-2">
                        💰 <strong>Success fee only when deal closes</strong> - No upfront costs
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <Link to="/dashboard/products/new" className="w-full sm:w-auto">
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full sm:w-auto border-2 border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 px-6 py-4 text-base font-bold"
                        >
                          Add Product
                        </Button>
                      </Link>
                      <Link to="/dashboard/rfqs/new" className="w-full sm:w-auto">
                        <Button
                          size="lg"
                          className="w-full sm:w-auto bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-6 py-4 text-base font-bold shadow-xl"
                        >
                          Post RFQ
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        }

        return null;
      })()}

      {/* Onboarding Progress Tracker - For Suppliers */}
      {(currentRole === 'seller' || currentRole === 'hybrid') && companyId && (
        <OnboardingProgressTracker companyId={companyId} userId={user?.id} />
      )}

      {/* Activity Metrics - For Suppliers */}
      {(currentRole === 'seller' || currentRole === 'hybrid') && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
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
        </div>
      )}

      {/* Afrikoni Academy: Guided learning for buyers & sellers - Hidden for now */}
      {false && (currentRole === 'buyer' || currentRole === 'seller' || currentRole === 'hybrid') && (
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
                  <h2 className="text-h3 font-semibold leading-[1.3] text-afrikoni-text-dark flex items-center gap-2">
                    Afrikoni Academy
                  </h2>
                  <Badge className="bg-afrikoni-gold text-afrikoni-chestnut text-[10px] md:text-xs uppercase tracking-wide">
                    Guided learning
                  </Badge>
                </div>
                <p className="text-meta font-medium text-afrikoni-text-dark/80">
                  Short, practical lessons to help you trade safely and confidently on Afrikoni. Start with the steps
                  below — each one is designed for busy African businesses, not lawyers.
                </p>
                <div className="grid md:grid-cols-3 gap-3 text-meta">
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

      {/* Primary CTA for Sellers - Add Products */}
      {(currentRole === 'seller' || (currentRole === 'hybrid' && (activeView === 'seller' || activeView === 'all'))) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-6"
        >
          <Card className="border-2 border-afrikoni-gold bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-purple/10 rounded-afrikoni-lg shadow-premium-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-h3 font-semibold leading-[1.3] text-afrikoni-text-dark mb-3 flex items-center gap-2">
                    <Package className="w-6 h-6 text-afrikoni-gold" />
                    List Your Products
                  </h2>
                  <p className="text-body font-normal leading-[1.6] text-afrikoni-text-dark/70 mb-2">
                    Add products to your catalog to start receiving RFQs from buyers. Verified suppliers get priority matching.
                  </p>
                  {/* Subtle first-time guidance - only show if no products yet */}
                  {(() => {
                    const productsKPI = kpis.find(k => k.label.includes('Product'));
                    return productsKPI && parseInt(productsKPI.value) === 0;
                  })() && (
                    <p className="text-meta font-medium text-afrikoni-text-dark/60 italic">
                      Start by adding your first product — buyers will find you through RFQs.
                    </p>
                  )}
                </div>
                <Link to="/dashboard/products/new" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal px-6 md:px-8 py-3 md:py-4 text-body font-bold shadow-xl hover:shadow-2xl transition-all min-h-[44px]"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Product
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Primary CTA for Hybrid Buyers - Post New RFQ */}
      {(currentRole === 'buyer' || (currentRole === 'hybrid' && (activeView === 'buyer' || activeView === 'all'))) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-6"
        >
          <Card className="border-2 border-afrikoni-gold bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-purple/10 rounded-afrikoni-lg shadow-premium-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-h3 font-semibold leading-[1.3] text-afrikoni-text-dark mb-3 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-afrikoni-gold" />
                    Post a Trade Request (RFQ)
                  </h2>
                  <p className="text-body font-normal leading-[1.6] text-afrikoni-text-dark/70 mb-2">
                    Describe what you need and get matched with verified suppliers. Your request is live and suppliers will respond with quotes.
                  </p>
                  {/* Subtle first-time guidance - only show if no RFQs yet */}
                  {recentRFQs.length === 0 && (
                    <p className="text-meta font-medium text-afrikoni-text-dark/60 italic">
                      Start by posting an RFQ — suppliers will respond here.
                    </p>
                  )}
                </div>
                <Link to="/rfq/create" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal px-6 md:px-8 py-3 md:py-4 text-body font-bold shadow-xl hover:shadow-2xl transition-all min-h-[44px]"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Post New RFQ
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* KPI Bar - Premium Cards with Role-Based Zero-Metric Handling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        {(() => {
          // For buyers: filter out zero metrics and replace with guidance
          if (currentRole === 'buyer') {
            const visibleKPIs = kpis.filter(kpi => {
              // Always show RFQs and Messages (actionable)
              if (kpi.label.includes('RFQ') || kpi.label.includes('Message')) return true;
              // Hide zero metrics that aren't actionable yet
              const numericValue = parseInt(kpi.value) || 0;
              return numericValue > 0;
            });
            
            // Add guidance cards for hidden zero metrics
            const guidanceCards = [];
            
            // Orders guidance
            const ordersKPI = kpis.find(k => k.label.includes('Order'));
            if (!ordersKPI || parseInt(ordersKPI.value) === 0) {
              guidanceCards.push({
                icon: ShoppingCart,
                label: 'Orders',
                guidance: 'Orders will appear once a supplier accepts your RFQ',
                color: 'bg-afrikoni-gold/15 text-afrikoni-gold',
                iconBg: 'bg-afrikoni-gold/20',
                isGuidance: true
              });
            }
            
            // Suppliers guidance
            const suppliersKPI = kpis.find(k => k.label.includes('Supplier'));
            if (!suppliersKPI || parseInt(suppliersKPI.value) === 0) {
              guidanceCards.push({
                icon: Users,
                label: 'Suppliers',
                guidance: 'Suppliers respond after you post an RFQ',
                color: 'bg-afrikoni-clay/10 text-afrikoni-clay',
                iconBg: 'bg-afrikoni-clay/20',
                isGuidance: true
              });
            }
            
            // Combine visible KPIs with guidance cards
            const allCards = [...visibleKPIs, ...guidanceCards];
            
            return allCards.map((kpi, idx) => {
              const Icon = kpi.icon;
              const iconColorClass =
                typeof kpi?.color === 'string'
                  ? (kpi.color.split(' ')[1] || '')
                  : '';
              
              // Render guidance card differently
              if (kpi.isGuidance) {
                return (
                  <motion.div
                    key={`guidance-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                  >
                    <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg overflow-hidden">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 ${kpi.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColorClass}`} />
                          </div>
                        </div>
                        <div className="text-h3 font-semibold leading-[1.3] text-afrikoni-text-dark mb-2">
                          {kpi.label}
                        </div>
                        <div className="text-meta font-medium text-afrikoni-text-dark/70 leading-relaxed">
                          {kpi.guidance}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              }
              
              // Regular KPI card
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
                      <div className="text-h1-mobile md:text-h1 font-bold leading-[1.1] text-afrikoni-text-dark mb-2">
                        {kpi.value}
                      </div>
                      <div className="text-meta font-medium text-afrikoni-text-dark/70 uppercase tracking-[0.02em]">
                        {kpi.label}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            });
          }
          
          // For sellers: show all KPIs but add guidance for critical zero metrics
          if (currentRole === 'seller' || (currentRole === 'hybrid' && activeView === 'seller')) {
            const allKPIs = [...kpis];
            const guidanceCards = [];
            
            // Products guidance (critical for sellers)
            const productsKPI = kpis.find(k => k.label.includes('Product'));
            if (!productsKPI || parseInt(productsKPI.value) === 0) {
              guidanceCards.push({
                icon: Package,
                label: 'Products',
                guidance: 'Add your first product to start receiving RFQs',
                color: 'bg-afrikoni-green/15 text-afrikoni-green',
                iconBg: 'bg-afrikoni-green/20',
                isGuidance: true,
                actionPath: '/dashboard/products/new'
              });
            }
            
            // Combine KPIs with guidance (guidance appears after regular KPIs)
            const allCards = [...allKPIs, ...guidanceCards];
            
            return allCards.map((kpi, idx) => {
              const Icon = kpi.icon;
              const iconColorClass =
                typeof kpi?.color === 'string'
                  ? (kpi.color.split(' ')[1] || '')
                  : '';
              
              // Render guidance card with action
              if (kpi.isGuidance && kpi.actionPath) {
                return (
                  <motion.div
                    key={`seller-guidance-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                  >
                    <Link to={kpi.actionPath} className="block min-h-[44px]">
                      <Card className="border-afrikoni-gold/30 hover:border-afrikoni-gold/60 hover:shadow-premium-lg transition-all bg-gradient-to-br from-afrikoni-gold/5 to-white rounded-afrikoni-lg overflow-hidden cursor-pointer touch-manipulation active:scale-[0.98]">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${kpi.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColorClass}`} />
                            </div>
                            <ArrowRight className="w-4 h-4 text-afrikoni-gold flex-shrink-0" />
                          </div>
                          <div className="text-h3 font-semibold leading-[1.3] text-afrikoni-text-dark mb-2">
                            {kpi.label}
                          </div>
                          <div className="text-meta font-medium text-afrikoni-text-dark/70 leading-relaxed">
                            {kpi.guidance}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              }
              
              // Regular KPI card
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
                      <div className="text-h1-mobile md:text-h1 font-bold leading-[1.1] text-afrikoni-text-dark mb-2">
                        {kpi.value}
                      </div>
                      <div className="text-meta font-medium text-afrikoni-text-dark/70 uppercase tracking-[0.02em]">
                        {kpi.label}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            });
          }
          
          // For logistics: show all KPIs as before
          return kpis.map((kpi, idx) => {
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
                    <div className="text-h1-mobile md:text-h1 font-bold leading-[1.1] text-afrikoni-text-dark mb-2">
                      {kpi.value}
                    </div>
                    <div className="text-meta font-medium text-afrikoni-text-dark/70 uppercase tracking-[0.02em]">
                      {kpi.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          });
        })()}
      </div>

      {/* Verification & Approvals (Seller / Hybrid) */}
      {(currentRole === 'seller' || currentRole === 'hybrid') && approvalSummary && (
        <div>
          <Card className="border-afrikoni-gold/30 bg-white rounded-afrikoni-lg shadow-premium-lg">
            <CardHeader className="flex flex-row items-center justify-between border-b border-afrikoni-gold/15 pb-4">
              <div>
                <CardTitle className="text-h3 font-semibold leading-[1.3] text-afrikoni-text-dark flex items-center gap-2">
                  <Shield className="w-5 h-5 text-afrikoni-gold" />
                  Verification & Approvals
                </CardTitle>
                <p className="text-meta font-medium text-afrikoni-text-dark/70 mt-1">
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
        </div>
      )}

      {/* Active Buyer Requests - Supplier Dashboard */}
      {(currentRole === 'seller' || currentRole === 'hybrid') && (
        <div className="mb-6">
          <Card className="border-2 border-afrikoni-purple bg-gradient-to-r from-afrikoni-purple/10 to-afrikoni-gold/10 rounded-afrikoni-lg shadow-premium-lg">
            <CardHeader className="flex flex-row items-center justify-between border-b border-afrikoni-gold/15 pb-4">
              <div>
                <CardTitle className="text-h3 font-semibold leading-[1.3] text-afrikoni-text-dark flex items-center gap-2">
                  <FileText className="w-6 h-6 text-afrikoni-purple" />
                  Active Buyer Requests
                </CardTitle>
                <p className="text-body font-normal leading-[1.6] text-afrikoni-text-dark/70 mt-1">
                  Respond to real buyer demand. Suppliers respond to RFQs, not browse aimlessly.
                </p>
              </div>
              <Link to="/dashboard/rfqs">
                <Button
                  size="sm"
                  className="bg-afrikoni-purple hover:bg-afrikoni-purple/90 text-white"
                >
                  View All RFQs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              {recentRFQs && recentRFQs.length > 0 ? (
                <div className="space-y-3">
                  {(Array.isArray(recentRFQs) ? recentRFQs.slice(0, 3) : []).map((rfq) => (
                    <Link
                      key={rfq.id}
                      to={`/dashboard/rfqs/${rfq.id}`}
                      className="block p-4 border border-afrikoni-gold/20 rounded-lg hover:border-afrikoni-gold/40 hover:bg-afrikoni-gold/5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-h3 font-semibold leading-[1.3] text-afrikoni-text-dark mb-2">{rfq.title}</h3>
                          <p className="text-body font-normal leading-[1.6] text-afrikoni-text-dark/70 line-clamp-2 mb-2">
                            {rfq.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-afrikoni-text-dark/60">
                            {rfq.quantity && (
                              <span>Qty: {rfq.quantity} {rfq.unit || 'pieces'}</span>
                            )}
                            {rfq.delivery_location && (
                              <span>📍 {rfq.delivery_location}</span>
                            )}
                          </div>
                        </div>
                        <Badge
                          className={
                            rfq.status === 'open'
                              ? 'bg-green-50 text-green-700 border-green-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }
                        >
                          {rfq.status === 'open' ? 'Open' : rfq.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  type="rfqs"
                  title="No active buyer requests yet"
                  description="When buyers post RFQs matching your products, they'll appear here. Focus on getting verified to increase your visibility."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        {/* v2.5: Premium Section Title with Gold Underline */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-h3 font-semibold leading-[1.3] text-afrikoni-text-dark uppercase tracking-[0.02em] border-b-2 border-afrikoni-gold pb-3">
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
                      <span className="text-body font-semibold text-afrikoni-text-dark">{action.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Risk & Compliance Center Card - Admin Only */}
      {isUserAdmin && (
        <div>
          <Link to="/dashboard/risk">
            <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-gradient-to-r from-afrikoni-gold/10 to-afrikoni-purple/10 rounded-afrikoni-lg cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-afrikoni-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-h3 font-semibold leading-[1.3] text-afrikoni-text-dark mb-2">
                      Risk & Compliance Center
                    </h3>
                    <p className="text-body font-normal leading-[1.6] text-afrikoni-text-dark/70">
                      Monitor fraud, logistics, and compliance risks across Africa
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-afrikoni-gold" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
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
                <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-afrikoni-gold/10 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="w-8 h-8 text-afrikoni-gold/60" />
                  </div>
                  <h3 className="text-lg font-semibold text-afrikoni-text-dark mb-2">
                    No orders yet
                  </h3>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-4 max-w-sm">
                    Start by posting an RFQ or browsing products. Your sales and orders data will appear here once you make your first transaction.
                  </p>
                  <div className="flex gap-3">
                    <Link to="/dashboard/rfqs/new">
                      <Button size="sm" className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Post RFQ
                      </Button>
                    </Link>
                    <Link to="/marketplace">
                      <Button size="sm" variant="outline" className="border-afrikoni-gold/30 text-afrikoni-chestnut hover:bg-afrikoni-gold/10">
                        Browse Products
                      </Button>
                    </Link>
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
                <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-afrikoni-purple/10 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-afrikoni-purple/60" />
                  </div>
                  <h3 className="text-lg font-semibold text-afrikoni-text-dark mb-2">
                    No RFQ activity yet
                  </h3>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-4 max-w-sm">
                    Start by posting an RFQ or browsing products. Your RFQ activity will appear here once you create or receive your first request.
                  </p>
                  <div className="flex gap-3">
                    <Link to="/dashboard/rfqs/new">
                      <Button size="sm" className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Create RFQ
                      </Button>
                    </Link>
                    <Link to="/rfq-marketplace">
                      <Button size="sm" variant="outline" className="border-afrikoni-gold/30 text-afrikoni-chestnut hover:bg-afrikoni-gold/10">
                        Browse RFQs
                      </Button>
                    </Link>
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
                  {(Array.isArray(recentOrders) ? recentOrders : []).map((order) => (
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
                  My Trade Requests
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
                  {(Array.isArray(recentRFQs) ? recentRFQs : []).map((rfq) => (
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
                              rfq.status === 'awarded' ? 'bg-afrikoni-purple/10 text-afrikoni-purple border-afrikoni-purple/20' :
                              rfq.status === 'closed' ? 'bg-afrikoni-deep/10 text-afrikoni-deep border-afrikoni-deep/20' :
                              'bg-afrikoni-gold/10 text-afrikoni-gold border-afrikoni-gold/20'
                            }`}
                          >
                            {rfq.status === 'open' ? 'Posted' : 
                             rfq.status === 'pending' ? 'Matched' :
                             rfq.status === 'awarded' ? 'In Discussion' :
                             rfq.status === 'closed' ? 'Closed' :
                             rfq.status || 'unknown'}
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
                  {(Array.isArray(recentMessages) ? recentMessages : []).map((message) => (
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
