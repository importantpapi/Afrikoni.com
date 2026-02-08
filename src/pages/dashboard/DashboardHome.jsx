import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
// NOTE: Admin check done at route level - removed isAdmin import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import EmptyState from '@/components/shared/ui/EmptyState';
import {
  ShoppingCart, FileText, Package, MessageSquare, Wallet, Truck,
  Users, Plus, TrendingUp, ArrowRight, Clock, CheckCircle, XCircle, Building2,
  Shield, AlertTriangle, GraduationCap, HelpCircle, RefreshCw, BarChart3
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, subDays } from 'date-fns';
import { StatCardSkeleton, CardSkeleton } from '@/components/shared/ui/skeletons';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import OnboardingProgressTracker from '@/components/dashboard/OnboardingProgressTracker';
import QuickRFQBar from '@/components/dashboard/QuickRFQBar';
import { getActivityMetrics, getSearchAppearanceCount } from '@/services/activityTracking';
import { toast } from 'sonner';
import { getUserDisplayName } from '@/utils/userHelpers';
import { useTranslation } from 'react-i18next';
// REMOVED: Realtime is now owned by WorkspaceDashboard via DashboardRealtimeManager
// import { useRealTimeDashboardData } from '@/hooks/useRealTimeData';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import TradeCorridorWidget from '@/components/dashboard/TradeCorridorWidget';
import EscrowMilestoneProgress from '@/components/dashboard/EscrowMilestoneProgress';

// ============================================================================
// CONSTANTS & HELPERS (Section 2)
// Pure functions with no hooks - defined outside component for stability
// ============================================================================

/**
 * Determines if buyer-specific data should be loaded based on capabilities
 * @param {object} caps - Capabilities object
 * @param {string} view - Current active view ('all', 'buyer', 'seller')
 */
const shouldLoadBuyerData = (caps, view) => {
  if (!caps) return false;
  if (caps.can_buy && caps.can_sell) {
    return view === 'all' || view === 'buyer';
  }
  return caps.can_buy;
};

/**
 * Determines if seller-specific data should be loaded based on capabilities
 * @param {object} caps - Capabilities object  
 * @param {string} view - Current active view ('all', 'buyer', 'seller')
 */
const shouldLoadSellerData = (caps, view) => {
  if (!caps) return false;
  if (caps.can_buy && caps.can_sell) {
    return view === 'all' || view === 'seller';
  }
  return caps.can_sell && caps.sell_status === 'approved';
};

/**
 * Parses numeric value from KPI display string (handles "0", "1,234", etc.)
 */
const parseKPINumber = (value) => {
  if (!value) return 0;
  const cleaned = String(value).replace(/,/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

// ============================================================================
// COMPONENT (Section 3)
// ============================================================================

/**
 * DashboardHome - Main dashboard component
 * 
 * ARCHITECTURE:
 * 1. All hooks called first (no conditionals before hooks)
 * 2. Memoized derived state (prevents object identity changes)
 * 3. Data loaders (defined once, used by effects)
 * 4. Single orchestrator useEffect
 * 5. Idempotent realtime subscription
 * 6. Single hard render gate
 * 7. Pure JSX return
 */
export default function DashboardHome({ activeView = 'all', capabilities: capabilitiesProp = null }) {
  // ==========================================================================
  // SECTION 3.1: ALL HOOKS FIRST (Rules of Hooks compliance)
  // ==========================================================================
  
  const { t } = useTranslation();
  // ✅ KERNEL MANIFESTO: Rule 1 - Use Kernel exclusively
  const { profileCompanyId, userId, canLoadData, capabilities: kernelCapabilities, isSystemReady } = useDashboardKernel();
  // ✅ KERNEL MANIFESTO: Rule 1 - Use capabilities.ready from Kernel (not useCapability())
  const ready = kernelCapabilities?.ready || false;
  const navigate = useNavigate();
  
  // State hooks
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // ✅ KERNEL MANIFESTO: Rule 4 - Error state
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [kpis, setKpis] = useState([]);
  const [salesChartData, setSalesChartData] = useState([]);
  const [rfqChartData, setRfqChartData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentRFQs, setRecentRFQs] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [approvalSummary, setApprovalSummary] = useState(null);
  const [searchAppearances, setSearchAppearances] = useState(0);
  const [buyersLooking, setBuyersLooking] = useState(0);
  
  // Refs for idempotency guards
  const hasLoadedRef = useRef(false);
  const loadingCompanyIdRef = useRef(null);
  const abortControllerRef = useRef(null); // ✅ KERNEL MANIFESTO FIX: AbortController for query cancellation
  
  // ==========================================================================
  // SECTION 3.2: MEMOIZED DERIVED STATE
  // CRITICAL: These MUST be memoized to prevent object identity changes
  // ==========================================================================
  
  // ✅ KERNEL MIGRATION: Use capabilities from kernel
  const capabilities = useMemo(() => {
    if (capabilitiesProp) return capabilitiesProp;
    return kernelCapabilities || {};
  }, [capabilitiesProp, kernelCapabilities]);
  
  // ✅ FIX #3: Derive primitive flags (these are stable booleans)
  const isBuyer = capabilities?.can_buy === true;
  const isSeller = capabilities?.can_sell === true && capabilities?.sell_status === 'approved';
  const isLogistics = capabilities?.can_logistics === true && capabilities?.logistics_status === 'approved';
  const isHybrid = isBuyer && isSeller;

  // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel
  // ✅ FIX #4: Memoize company_id as primitive (prevents object in deps)
  const companyId = profileCompanyId || null;
  const userIdFromKernel = userId || null;
  
  // ✅ FIX #5: Memoize default KPIs (prevents recreation each render)
  const defaultKPIs = useMemo(() => [
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
  ], [t]);
  
  // ==========================================================================
  // SECTION 3.3: DATA LOADERS (defined ONCE)
  // These are useCallback-wrapped to maintain stable references
  // ==========================================================================
  
  // ✅ FIXED: Loaders accept primitive flags, not objects
  // This prevents object identity issues in the dependency array
  const loadKPIs = useCallback(async (caps, cid) => {
    // HARD GUARD: Never run with invalid companyId
      if (!cid || typeof cid !== 'string' || cid.trim() === '') {
      console.log('[loadKPIs] Invalid companyId - skipping');
      setKpis(defaultKPIs);
        return;
      }

    // ✅ VALIDATION: Ensure companyId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cid.trim())) {
      console.warn('[loadKPIs] Invalid UUID format for companyId:', cid);
      setKpis(defaultKPIs);
      return;
    }

    try {
      const loadBuyerData = shouldLoadBuyerData(caps, activeView);
      const loadSellerData = shouldLoadSellerData(caps, activeView);

      const queries = [];
      
      // Orders query
      if (loadBuyerData || loadSellerData) {
        if (caps.can_buy && caps.can_sell && activeView === 'all') {
          queries.push(supabase.from('orders').select('*', { count: 'exact' }).or(`buyer_company_id.eq.${cid},seller_company_id.eq.${cid}`));
        } else if (loadBuyerData) {
          queries.push(supabase.from('orders').select('*', { count: 'exact' }).eq('buyer_company_id', cid));
        } else if (loadSellerData) {
          queries.push(supabase.from('orders').select('*', { count: 'exact' }).eq('seller_company_id', cid));
        }
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { count: 0 } }));
      }
      
      // RFQs query (buyers only)
      if (loadBuyerData && cid) {
        queries.push(supabase.from('rfqs').select('*', { count: 'exact' }).eq('buyer_company_id', cid));
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { count: 0 } }));
      }
      
      // Products query (sellers only)
      if (loadSellerData && cid) {
        queries.push(supabase.from('products').select('*', { count: 'exact' }).eq('company_id', cid));
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { count: 0 } }));
      }
      
      // Messages query (always)
        queries.push(supabase.from('messages').select('*', { count: 'exact' }).eq('receiver_company_id', cid).eq('read', false));
      
      // Suppliers queries (buyers only)
      if (loadBuyerData && cid) {
        queries.push(
          supabase.from('orders').select('seller_company_id').eq('buyer_company_id', cid).not('seller_company_id', 'is', null)
        );
        queries.push(
          supabase.from('companies').select('id', { count: 'exact' }).or('verified.eq.true,verification_status.eq.verified')
        );
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { data: [] } }));
        queries.push(Promise.resolve({ status: 'fulfilled', value: { count: 0 } }));
      }
      
      // Payouts query (sellers only)
      if (loadSellerData) {
        queries.push(supabase.from('wallet_transactions').select('amount').eq('company_id', cid).eq('type', 'payout').eq('status', 'completed'));
      } else {
        queries.push(Promise.resolve({ status: 'fulfilled', value: { data: [] } }));
      }

      const results = await Promise.allSettled(queries);
      
      const ordersRes = results[0];
      const rfqsRes = results[1];
      const productsRes = results[2];
      const messagesRes = results[3];
      const supplierInteractionsRes = results[4];
      const verifiedSuppliersRes = results[5];
      const payoutsRes = results[6];

      // ✅ ENHANCED: Better error handling with logging
      const totalOrders = ordersRes.status === 'fulfilled' && !ordersRes.value?.error 
        ? (ordersRes.value?.count || 0) 
        : (ordersRes.status === 'rejected' ? (console.warn('[loadKPIs] Orders query failed:', ordersRes.reason), 0) : 0);
      
      const totalRFQs = rfqsRes.status === 'fulfilled' && !rfqsRes.value?.error
        ? (rfqsRes.value?.count || 0)
        : (rfqsRes.status === 'rejected' ? (console.warn('[loadKPIs] RFQs query failed:', rfqsRes.reason), 0) : 0);
      
      const totalProducts = productsRes.status === 'fulfilled' && !productsRes.value?.error
        ? (productsRes.value?.count || 0)
        : (productsRes.status === 'rejected' ? (console.warn('[loadKPIs] Products query failed:', productsRes.reason), 0) : 0);
      
      const unreadMessages = messagesRes.status === 'fulfilled' && !messagesRes.value?.error
        ? (messagesRes.value?.count || 0)
        : (messagesRes.status === 'rejected' ? (console.warn('[loadKPIs] Messages query failed:', messagesRes.reason), 0) : 0);
      
      let supplierCount = 0;
      if (loadBuyerData && supplierInteractionsRes.status === 'fulfilled') {
        const interactions = supplierInteractionsRes.value?.data || [];
        const uniqueSuppliers = new Set(interactions.map(o => o.seller_company_id).filter(Boolean));
        supplierCount = uniqueSuppliers.size;
        
        if (supplierCount === 0 && verifiedSuppliersRes.status === 'fulfilled') {
          supplierCount = verifiedSuppliersRes.value?.count || 0;
        }
      } else if (loadBuyerData && verifiedSuppliersRes.status === 'fulfilled') {
        supplierCount = verifiedSuppliersRes.value?.count || 0;
      }
      
      const payoutBalance = payoutsRes.status === 'fulfilled' && Array.isArray(payoutsRes.value?.data)
        ? payoutsRes.value.data.reduce((sum, tx) => sum + (parseFloat(tx?.amount) || 0), 0)
        : 0;

      // Build KPI list based on capabilities
      const kpiList = [];
      
      if (loadBuyerData) {
        kpiList.push({
          icon: ShoppingCart,
          label: t('dashboard.totalOrders') || 'Total Orders',
          value: totalOrders.toLocaleString(),
          change: null,
          color: 'bg-afrikoni-gold/15 text-afrikoni-gold',
          iconBg: 'bg-afrikoni-gold/20'
        });
      } else if (loadSellerData) {
        kpiList.push({
          icon: ShoppingCart,
          label: t('dashboard.totalOrders') || 'Total Orders',
          value: totalOrders.toLocaleString(),
          change: null,
          color: 'bg-afrikoni-gold/15 text-afrikoni-gold',
          iconBg: 'bg-afrikoni-gold/20'
        });
      }
      
      if (loadBuyerData) {
        kpiList.push({
          icon: FileText,
          label: t('dashboard.totalRFQs') || 'Total RFQs',
          value: totalRFQs.toLocaleString(),
          change: null,
          color: 'bg-afrikoni-purple/15 text-afrikoni-purple',
          iconBg: 'bg-afrikoni-purple/20'
        });
      }
      
      if (loadSellerData) {
        kpiList.push({
          icon: Package,
          label: t('dashboard.products') || 'Products',
          value: totalProducts.toLocaleString(),
          change: null,
          color: 'bg-afrikoni-green/15 text-afrikoni-green',
          iconBg: 'bg-afrikoni-green/20'
        });
      }
      
      kpiList.push({
        icon: MessageSquare,
        label: t('dashboard.unreadMessages') || 'Unread Messages',
        value: unreadMessages.toLocaleString(),
        change: unreadMessages > 0 ? 'New' : null,
        color: 'bg-afrikoni-red/15 text-afrikoni-red',
        iconBg: 'bg-afrikoni-red/20'
      });

      if (loadBuyerData) {
        kpiList.push({
          icon: Users,
          label: t('dashboard.suppliers') || 'Suppliers',
          value: supplierCount.toLocaleString(),
          change: null,
          color: 'bg-afrikoni-clay/10 text-afrikoni-clay',
          iconBg: 'bg-afrikoni-clay/20'
        });
      }

      if (loadSellerData) {
        kpiList.push({
          icon: Wallet,
          label: t('dashboard.payoutBalance') || 'Payout Balance',
          value: `$${payoutBalance.toLocaleString()}`,
          change: null,
          color: 'bg-afrikoni-green/10 text-afrikoni-green',
          iconBg: 'bg-afrikoni-green/20'
        });
      }

      setKpis(kpiList);
    } catch (error) {
      console.error('[Dashboard] Error loading KPIs:', error);
      setKpis(defaultKPIs);
    }
  }, [activeView, defaultKPIs, t]);

  const loadChartData = useCallback(async (caps, cid) => {
    // HARD GUARD: Never run with invalid companyId
      if (!cid || typeof cid !== 'string' || cid.trim() === '') {
      console.log('[loadChartData] Invalid companyId - skipping');
        setSalesChartData([]);
        setRfqChartData([]);
      return;
    }

    // ✅ VALIDATION: Ensure companyId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cid.trim())) {
      console.warn('[loadChartData] Invalid UUID format for companyId:', cid);
      setSalesChartData([]);
      setRfqChartData([]);
      return;
    }

    try {
      const days = 30;
      const startDate = subDays(new Date(), days).toISOString();
      const loadBuyerData = shouldLoadBuyerData(caps, activeView);
      const loadSellerData = shouldLoadSellerData(caps, activeView);

      const queries = [];

      // Orders query
      if (loadBuyerData || loadSellerData) {
        if (caps.can_buy && caps.can_sell && activeView === 'all') {
          queries.push(
            supabase.from('orders').select('created_at, total_amount, status')
              .or(`buyer_company_id.eq.${cid},seller_company_id.eq.${cid}`)
              .gte('created_at', startDate)
          );
        } else if (loadBuyerData) {
          queries.push(
            supabase.from('orders').select('created_at, total_amount, status')
              .eq('buyer_company_id', cid).gte('created_at', startDate)
          );
        } else if (loadSellerData) {
          queries.push(
            supabase.from('orders').select('created_at, total_amount, status')
              .eq('seller_company_id', cid).gte('created_at', startDate)
          );
        } else {
          queries.push(Promise.resolve({ data: [] }));
        }
      } else {
        queries.push(Promise.resolve({ data: [] }));
      }

      // Sent RFQs (buyer only)
      if (loadBuyerData && cid) {
        queries.push(
          supabase.from('rfqs').select('created_at, status')
            .eq('buyer_company_id', cid).gte('created_at', startDate)
        );
      } else {
        queries.push(Promise.resolve({ data: [] }));
      }

      // Received RFQs (seller only) - ✅ FIXED: Query all RFQs and filter client-side
      // This avoids RLS issues with array contains queries
      if (loadSellerData && cid) {
        queries.push(
          supabase.from('rfqs')
            .select('created_at, matched_supplier_ids, status')
            .gte('created_at', startDate)
            .limit(1000) // Reasonable limit for client-side filtering
        );
      } else {
        queries.push(Promise.resolve({ data: [] }));
      }

      const results = await Promise.allSettled(queries);
      const ordersRes = results[0];
      const sentRfqsRes = results[1];
      const receivedRfqsRes = results[2];

      // ✅ ENHANCED: Better error handling
      const orders = ordersRes.status === 'fulfilled' && !ordersRes.value?.error
        ? (ordersRes.value?.data || [])
        : (ordersRes.status === 'rejected' ? (console.warn('[loadChartData] Orders query failed:', ordersRes.reason), []) : []);
      
      const sentRfqs = sentRfqsRes.status === 'fulfilled' && !sentRfqsRes.value?.error
        ? (sentRfqsRes.value?.data || [])
        : (sentRfqsRes.status === 'rejected' ? (console.warn('[loadChartData] Sent RFQs query failed:', sentRfqsRes.reason), []) : []);
      
      const allRfqs = receivedRfqsRes.status === 'fulfilled' && !receivedRfqsRes.value?.error
        ? (receivedRfqsRes.value?.data || [])
        : (receivedRfqsRes.status === 'rejected' ? (console.warn('[loadChartData] Received RFQs query failed:', receivedRfqsRes.reason), []) : []);
      
      // ✅ FIXED: Filter RFQs where this company is in matched_supplier_ids array (client-side)
      const receivedRfqs = allRfqs.filter(rfq => {
        if (!rfq || !rfq.matched_supplier_ids) return false;
        if (Array.isArray(rfq.matched_supplier_ids)) {
          return rfq.matched_supplier_ids.includes(cid);
        }
        // Handle case where matched_supplier_ids might be a string or other format
        return false;
      });

      // Build chart data
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
  }, [activeView]);

  const loadRecentOrders = useCallback(async (cid) => {
      if (!cid || typeof cid !== 'string' || cid.trim() === '') {
        setRecentOrders([]);
      return;
    }

    // ✅ VALIDATION: Ensure companyId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cid.trim())) {
      console.warn('[loadRecentOrders] Invalid UUID format for companyId:', cid);
      setRecentOrders([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, quantity, created_at, buyer_company_id, seller_company_id')
        .or(`buyer_company_id.eq.${cid},seller_company_id.eq.${cid}`)
        .order('created_at', { ascending: false })
        .limit(5);

      // ✅ VIBRANIUM STABILIZATION: Ignore PGRST204/205 errors - UI stays alive
      if (error) {
        if (error.code === 'PGRST204' || error.code === 'PGRST205') {
          console.warn('[DashboardHome] Schema mismatch (PGRST204/205) - continuing with empty orders');
          setRecentOrders([]);
          return;
        }
        throw error;
      }
      setRecentOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      // ✅ VIBRANIUM STABILIZATION: Ignore PGRST204/205 errors - UI stays alive
      if (error?.code === 'PGRST204' || error?.code === 'PGRST205') {
        console.warn('[DashboardHome] Schema mismatch (PGRST204/205) - ignoring error');
        setRecentOrders([]);
        return;
      }
      console.error('[Dashboard] Error loading recent orders:', error);
      setRecentOrders([]);
    }
  }, []);

  const loadApprovalSummary = useCallback(async (cid, canSell) => {
    if (!cid || typeof cid !== 'string' || cid.trim() === '' || !canSell) {
        setApprovalSummary(null);
        return;
      }

    try {
      const [companyRes, productsRes] = await Promise.allSettled([
        supabase.from('companies').select('verification_status, verified').eq('id', cid).single(),
        supabase.from('products').select('status', { count: 'exact' }).eq('company_id', cid)
      ]);

      // ✅ QUERY REFACTOR: Handle PGRST116 (No Rows) error for companies
      let company = null;
      if (companyRes.status === 'fulfilled') {
        if (companyRes.value?.error) {
          if (companyRes.value.error.code === 'PGRST116') {
            console.warn('[DashboardHome] Company not found (PGRST116)');
            toast.error('Company not found or access denied');
            navigate('/dashboard');
            return;
          } else {
            console.error('[DashboardHome] Company fetch error:', companyRes.value.error);
            toast.error('Failed to load company information');
          }
        } else {
          company = companyRes.value?.data || null;
        }
      }
      
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
  }, []);

  const loadRecentRFQs = useCallback(async (cid) => {
      if (!cid || typeof cid !== 'string' || cid.trim() === '') {
        setRecentRFQs([]);
        return;
      }

    // ✅ VALIDATION: Ensure companyId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cid.trim())) {
      console.warn('[loadRecentRFQs] Invalid UUID format for companyId:', cid);
      setRecentRFQs([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rfqs')
        .select('*')
        .eq('buyer_company_id', cid)
        .order('created_at', { ascending: false })
        .limit(5);

      // ✅ VIBRANIUM STABILIZATION: Ignore PGRST204/205 errors - UI stays alive
      if (error) {
        if (error.code === 'PGRST204' || error.code === 'PGRST205') {
          console.warn('[DashboardHome] Schema mismatch (PGRST204/205) - continuing with empty RFQs');
          setRecentRFQs([]);
          return;
        }
        throw error;
      }
      setRecentRFQs(Array.isArray(data) ? data : []);
    } catch (error) {
      // ✅ VIBRANIUM STABILIZATION: Ignore PGRST204/205 errors - UI stays alive
      if (error?.code === 'PGRST204' || error?.code === 'PGRST205') {
        console.warn('[DashboardHome] Schema mismatch (PGRST204/205) - ignoring error');
        setRecentRFQs([]);
        return;
      }
      console.error('[DashboardHome] Error loading recent RFQs:', error);
      setRecentRFQs([]);
    }
  }, []);

  const loadActivityMetrics = useCallback(async (uid, cid) => {
    if (!uid || !cid || typeof cid !== 'string' || cid.trim() === '') {
        setSearchAppearances(0);
        setBuyersLooking(0);
        return;
      }
      
    // ✅ VALIDATION: Ensure companyId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cid.trim())) {
      console.warn('[loadActivityMetrics] Invalid UUID format for companyId:', cid);
      setSearchAppearances(0);
      setBuyersLooking(0);
      return;
    }
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // ✅ FIXED: Only select fields that exist (category_id, not category)
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, category_id')
          .eq('company_id', cid);
        
        // ✅ Handle query errors gracefully
        if (productsError) {
          console.warn('[loadActivityMetrics] Products query error:', productsError.message);
          setSearchAppearances(0);
          setBuyersLooking(0);
          return;
        }
        
        if (products && products.length > 0) {
          const productIds = products.map(p => p.id).filter(Boolean);
          
          if (productIds.length === 0) {
            setSearchAppearances(0);
            setBuyersLooking(0);
            return;
          }
          
          // Count product views today
          const { count, error: viewsError } = await supabase
            .from('activity_logs')
            .select('*', { count: 'exact', head: true })
            .eq('activity_type', 'product_view')
            .in('entity_id', productIds)
            .gte('created_at', today.toISOString());
          
          // ✅ VIBRANIUM STABILIZATION: Ignore PGRST204/205 errors - UI stays alive
          if (viewsError) {
            if (viewsError.code === 'PGRST204' || viewsError.code === 'PGRST205') {
              console.warn('[loadActivityMetrics] Schema mismatch (PGRST204/205) - continuing with empty metrics');
              setSearchAppearances(0);
            } else {
              console.warn('[loadActivityMetrics] Activity logs query error:', viewsError.message);
              setSearchAppearances(0);
            }
          } else {
            setSearchAppearances(count || 0);
          }
          
          // Count matching RFQs
          const categories = [...new Set(products.map(p => p.category_id).filter(Boolean))];
        const now = new Date().toISOString();
        
          if (categories.length > 0) {
            const { count: rfqCount, error: rfqError } = await supabase
            .from('rfqs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'open')
              .in('category_id', categories)
              .or(`expires_at.gte.${now},expires_at.is.null`);
            
            // ✅ Handle errors gracefully
            if (rfqError) {
              console.warn('[loadActivityMetrics] RFQs query error:', rfqError.message);
              setBuyersLooking(0);
            } else {
              setBuyersLooking(rfqCount || 0);
            }
          } else {
            setBuyersLooking(0);
          }
        } else {
          setSearchAppearances(0);
          setBuyersLooking(0);
        }
      } catch (error) {
      // ✅ VIBRANIUM STABILIZATION: Ignore PGRST204/205 errors - UI stays alive
      if (error?.code === 'PGRST204' || error?.code === 'PGRST205') {
        console.warn('[loadActivityMetrics] Schema mismatch (PGRST204/205) - ignoring error');
        setSearchAppearances(0);
        setBuyersLooking(0);
        return;
      }
      console.error('[loadActivityMetrics] Exception:', error);
      setSearchAppearances(0);
      setBuyersLooking(0);
    }
  }, []);

  const loadRecentMessages = useCallback(async (cid) => {
      if (!cid || typeof cid !== 'string' || cid.trim() === '') {
        setRecentMessages([]);
        return;
      }

    // ✅ VALIDATION: Ensure companyId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cid.trim())) {
      console.warn('[loadRecentMessages] Invalid UUID format for companyId:', cid);
      setRecentMessages([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, read, created_at, receiver_company_id, conversation_id')
        .eq('receiver_company_id', cid)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[Dashboard] Error loading recent messages:', error);
      setRecentMessages([]);
    }
  }, []);

  // ==========================================================================
  // SECTION 3.4: SINGLE ORCHESTRATOR useEffect
  // ==========================================================================
  // 
  // STABILITY RULES (NON-NEGOTIABLE):
  // 1. Dependencies MUST be primitives only (booleans, strings, numbers)
  // 2. Objects (user, profile, capabilities) MUST NOT be in dependency array
  // 3. Idempotency guard prevents duplicate loads for same companyId
  // 4. Token refresh MUST NOT trigger data reload
  //
  // WHY THIS CANNOT LOOP:
  // - authReady: boolean, only changes from false→true once
  // - capabilitiesReady: boolean, only changes from false→true once  
  // - companyId: string primitive, only changes on company switch
  // - userId: string primitive, only changes on user switch
  // - can_buy/can_sell: boolean primitives, stable after capabilities load
  // - Loaders: useCallback with stable deps, never change identity
  // ==========================================================================
  
  // ✅ CRITICAL: Extract PRIMITIVE capability flags for dependency array
  // These will NOT change identity during token refresh
  const canBuy = capabilities?.can_buy === true;
  const canSell = capabilities?.can_sell === true;
  
  useEffect(() => {
    // =========================================================================
    // GUARD 1: Wait for all prerequisites (primitives only)
    // =========================================================================
    // ✅ SCHEMA ALIGNMENT: Strict guard using profileCompanyId from Kernel
    // ✅ KERNEL GUARD REINFORCEMENT: Ensure canLoadData AND profileCompanyId before fetching
    // ✅ FIX DASHBOARD SYNC: Also wait for capabilities.ready
    if (!canLoadData || !profileCompanyId || !userIdFromKernel || !ready) {
      // Not ready yet - don't set loading, just wait
      return;
    }
    
    // ✅ SCHEMA ALIGNMENT: Use profileCompanyId from Kernel (not local state)
    const companyId = profileCompanyId;

    // =========================================================================
    // GUARD 2: IDEMPOTENCY - Don't reload for same company_id
    // This is the CRITICAL guard that prevents reload loops
    // =========================================================================
    if (hasLoadedRef.current && loadingCompanyIdRef.current === companyId) {
      console.log('[DashboardHome] Already loaded for this companyId - skipping');
      return;
    }

    let isMounted = true;
    let timeoutId = null;

    // ✅ KERNEL MANIFESTO FIX: Create AbortController for query cancellation
    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;

    // ✅ KERNEL MANIFESTO FIX: Timeout with query cancellation and error state
    timeoutId = setTimeout(() => {
      if (isMounted && !abortSignal.aborted) {
        console.warn('[DashboardHome] Loading timeout (15s) - aborting queries');
        abortControllerRef.current.abort(); // ✅ Cancel all pending queries
        setIsLoading(false);
        setError('Data loading timed out. Please try again.'); // ✅ KERNEL MANIFESTO: Rule 4 - Error state
      }
    }, 15000);

    const load = async () => {
      // ✅ KERNEL MANIFESTO: Rule 5 - The Finally Law - wrap in try/catch/finally
      try {
        console.log('[DashboardHome] Starting data load for companyId:', companyId);
        setIsLoading(true);
        setError(null); // ✅ KERNEL MANIFESTO: Rule 4 - Clear previous errors
        loadingCompanyIdRef.current = companyId;

        if (!isMounted || abortSignal.aborted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
          return;
        }

        // ✅ KERNEL MIGRATION: Check admin status from kernel
        // Route-level protection ensures admin - check capabilities for consistency
        setIsUserAdmin(kernelCapabilities?.is_admin === true);
        setSearchAppearances(0);
        setBuyersLooking(0);

        // ✅ Build capabilities object here (not in deps)
        const caps = {
          can_buy: canBuy,
          can_sell: canSell,
        };

        // ✅ KERNEL MANIFESTO FIX: Check if aborted before and after queries
        const checkAborted = () => {
          if (abortSignal.aborted) {
            throw new Error('Query aborted');
          }
        };

        // Load all data in parallel with abort checks
        const results = await Promise.allSettled([
          loadKPIs(caps, companyId).then(() => checkAborted()),
          loadChartData(caps, companyId).then(() => checkAborted()),
          loadRecentOrders(companyId).then(() => checkAborted()),
          loadRecentRFQs(companyId).then(() => checkAborted()),
          loadRecentMessages(companyId).then(() => checkAborted()),
          loadApprovalSummary(companyId, canSell).then(() => checkAborted()),
          loadActivityMetrics(userId, companyId).then(() => checkAborted())
        ]);
        
        // ✅ KERNEL MANIFESTO FIX: Check if aborted before updating state
        if (abortSignal.aborted) {
          return; // Don't update state if aborted
        }
        
        const failedCount = results.filter(r => r.status === 'rejected').length;
        if (failedCount > 0 && isMounted) {
          console.warn('[Dashboard] Some data loads failed:', failedCount);
          // ✅ KERNEL MANIFESTO: Rule 4 - Set error if critical failures
          if (failedCount === results.length) {
            setError('Failed to load dashboard data. Please try again.');
          }
        }

        if (isMounted && !abortSignal.aborted) {
          hasLoadedRef.current = true;
          console.log('[DashboardHome] Data load complete');
        }
      } catch (error) {
        // ✅ KERNEL MANIFESTO FIX: Handle abort errors properly
        if (error.message === 'Query aborted') {
          return; // Ignore abort errors
        }
        console.error('[DashboardHome] Load error:', error);
        if (isMounted && !abortSignal.aborted) {
          setError('Failed to load dashboard data. Please try again.'); // ✅ KERNEL MANIFESTO: Rule 4 - Error state
        }
      } finally {
        // ✅ KERNEL MANIFESTO: Rule 5 - The Finally Law - setLoading(false) MUST be in finally block
        if (isMounted && !abortSignal.aborted) {
          setIsLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };

      load();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    // =======================================================================
    // DEPENDENCY ARRAY - PRIMITIVES ONLY
    // =======================================================================
    // ✅ KERNEL MIGRATION: Use canLoadData instead of authReady/capabilitiesReady
    // ✅ SCHEMA ALIGNMENT: Use profileCompanyId from Kernel (not local companyId)
    // ✅ KERNEL MANIFESTO: Use capabilities.ready from Kernel (not useCapability())
    canLoadData,
    profileCompanyId, // ✅ SCHEMA ALIGNMENT: Use Kernel's profileCompanyId
    ready, // ✅ KERNEL MANIFESTO: Wait for capabilities.ready from Kernel
    canBuy,
    canSell,
    // ✅ String primitives - only change on actual user/company switch
    userIdFromKernel,
    // ✅ Stable useCallback references (empty or primitive deps)
    loadKPIs,
    loadChartData,
    loadRecentOrders,
    loadRecentRFQs,
    loadRecentMessages,
    loadApprovalSummary,
    loadActivityMetrics,
    // ❌ REMOVED: user, profile, capabilities - OBJECTS cause identity changes
    // These are accessed via closure when needed, not as dependencies
  ]);

  // ==========================================================================
  // SECTION 3.5: REALTIME - REMOVED (Owned by WorkspaceDashboard)
  // ==========================================================================
  // 
  // ARCHITECTURAL NOTE:
  // Realtime subscriptions are NOW owned by DashboardRealtimeManager
  // which is rendered in WorkspaceDashboard (the layout component).
  // This component (DashboardHome) may unmount on tab changes, but
  // realtime subscriptions survive because they live in the layout.
  //
  // DO NOT ADD REALTIME HERE - IT WILL CAUSE SUBSCRIPTION STORMS
  // ==========================================================================

  // ==========================================================================
  // SECTION 3.6: SINGLE HARD RENDER GATE
  // ✅ FIX #9: One gate, no other early returns below this point
  // ✅ FIX #12: Do NOT use authLoading - once authReady is true, stay mounted
  // This prevents unmounting during token refresh (which sets loading briefly)
  // ==========================================================================
  
  // ✅ KERNEL-CENTRIC: Check ready state from Kernel - ONLY navigate when ready === true
  if (!ready) {
    return (
      <SpinnerWithTimeout 
        message="Loading dashboard..." 
        ready={ready}
      />
    );
  }
  
  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <SpinnerWithTimeout 
        message="Loading dashboard..." 
        ready={isSystemReady}
      />
    );
  }
  
  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userIdFromKernel) {
    navigate('/login');
    return null;
  }
  
  // ✅ KERNEL MIGRATION: Check if company ID is available
  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <EmptyState 
          type="default"
          title="Company Required"
          description="Please complete your company profile to access the dashboard."
          cta="Go to Company Info"
          ctaLink="/dashboard/company-info"
        />
      </div>
    );
  }

  // ==========================================================================
  // SECTION 3.7: DERIVED RENDER STATE (computed once before JSX)
  // ✅ FIX #10: All logic extracted from JSX into variables
  // ==========================================================================
  
  // ✅ KERNEL MIGRATION: Welcome message derivation
  // Note: User display name can be fetched from Supabase if needed, but for now use generic welcome
  // This avoids blocking on user fetch and keeps the component simple
  let welcomeMessage = `${t('dashboard.welcome') || 'Welcome back'}!`;

  // Subtitle derivation
  let subtitle = t('dashboard.buyerSubtitle') || 'Source products and connect with verified suppliers across Africa.';
  if (isHybrid) {
    subtitle = t('dashboard.hybridSubtitle') || 'Handle both buying and selling from one powerful dashboard.';
  } else if (isSeller && !isBuyer) {
    subtitle = t('dashboard.sellerSubtitle') || 'Manage your products, RFQs, and grow your business.';
  } else if (isLogistics && !isBuyer && !isSeller) {
    subtitle = t('dashboard.logisticsSubtitle') || 'Track shipments and manage logistics operations.';
  }

  // CTA banner state derivation
  const rfqKPI = kpis.find(k => k.label?.includes('RFQ') || k.label?.includes('rfq'));
  const productKPI = kpis.find(k => k.label?.includes('Product') || k.label?.includes('product'));
  const rfqCount = parseKPINumber(rfqKPI?.value) || 0;
  const productCount = parseKPINumber(productKPI?.value) || 0;
  const buyerHasRFQs = recentRFQs.length > 0 || rfqCount > 0;
  const sellerHasProducts = productCount > 0;
  const isNewBuyer = isBuyer && !isSeller && !buyerHasRFQs;
  const isNewSeller = isSeller && !isBuyer && !sellerHasProducts;
  const isNewHybrid = isHybrid && !buyerHasRFQs && !sellerHasProducts;

  // Quick actions derivation
  const quickActions = {
    buyer: [
      { icon: FileText, label: t('rfq.create'), link: '/dashboard/rfqs/new', color: 'bg-afrikoni-gold' },
      { icon: Package, label: t('dashboard.browseProducts') || 'Browse Products', link: '/marketplace', color: 'bg-afrikoni-purple' },
      { icon: Users, label: t('dashboard.contactSuppliers') || 'Contact Suppliers', link: '/suppliers', color: 'bg-afrikoni-green' },
      { icon: Building2, label: t('dashboard.manageCompany') || 'Manage Company', link: '/dashboard/company-info', color: 'bg-afrikoni-clay' }
    ],
    seller: [
      { icon: Plus, label: t('dashboard.addProduct'), link: '/dashboard/products/new', color: 'bg-afrikoni-gold' },
      { icon: FileText, label: t('dashboard.viewRFQs'), link: '/dashboard/supplier-rfqs', color: 'bg-afrikoni-purple' },
      { icon: ShoppingCart, label: t('dashboard.viewSales'), link: '/dashboard/sales', color: 'bg-afrikoni-green' },
      { icon: Building2, label: t('dashboard.manageCompany'), link: '/dashboard/company-info', color: 'bg-afrikoni-clay' }
    ],
    logistics: [
      { icon: Truck, label: t('dashboard.trackShipments') || 'Track Shipments', link: '/dashboard/shipments', color: 'bg-afrikoni-gold' },
      { icon: FileText, label: t('dashboard.viewRFQs'), link: '/dashboard/supplier-rfqs', color: 'bg-afrikoni-purple' },
      { icon: MessageSquare, label: t('dashboard.messages'), link: '/dashboard/notifications', color: 'bg-afrikoni-green' }
    ]
  };

  let actions = [];
  if (isBuyer) actions.push(...quickActions.buyer);
  if (isSeller) actions.push(...quickActions.seller);
  if (isLogistics) actions.push(...quickActions.logistics);
  if (actions.length === 0) actions = quickActions.buyer;

  // ==========================================================================
  // SECTION 3.7: PURE JSX RETURN
  // ✅ FIX #11: No executable logic inside JSX - only variables and components
  // ==========================================================================

  // ✅ KERNEL MANIFESTO: Rule 4 - Three-State UI - Error state
  if (error) {
    return (
      <ErrorState 
        message={error}
        onRetry={() => {
          setError(null);
          hasLoadedRef.current = false; // ✅ Allow retry
          loadingCompanyIdRef.current = null;
          // useEffect will retry automatically when canLoadData is true
        }}
      />
    );
  }

  // ✅ KERNEL MANIFESTO: Rule 4 - Three-State UI - Loading state (single, non-duplicated)
  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-10 w-64 bg-afrikoni-cream rounded mb-3 animate-pulse" />
            <div className="h-5 w-96 bg-afrikoni-cream rounded animate-pulse" />
          </div>
        </div>
        <StatCardSkeleton count={5} />
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-xl">
            <CardContent className="p-6">
              <div className="h-6 w-32 bg-gray-100 dark:bg-afrikoni-cream rounded mb-4 animate-pulse" />
              <div className="h-64 bg-gray-100 dark:bg-afrikoni-cream rounded animate-pulse" />
            </CardContent>
          </Card>
          <Card className="border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-xl">
            <CardContent className="p-6">
              <div className="h-6 w-32 bg-gray-100 dark:bg-afrikoni-cream rounded mb-4 animate-pulse" />
              <div className="h-64 bg-gray-100 dark:bg-afrikoni-cream rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
        <CardSkeleton count={2} />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Trade OS Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#F5F0E8] mb-1 leading-tight">
            {welcomeMessage}
          </h1>
          <p className="text-sm text-gray-500">
            {subtitle}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 dark:text-gray-600">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-[#1A1A1A] rounded border border-gray-200 dark:border-[#2A2A2A] font-mono text-[11px] text-gray-500">
            {navigator.platform?.includes('Mac') ? '\u2318' : 'Ctrl'}+K
          </kbd>
          <span>Quick actions</span>
        </div>
      </div>

      {/* Smart CTA Banner - Shows contextual action for new users */}
      {(isNewBuyer || isNewSeller || isNewHybrid) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border border-[#D4A937]/30 bg-gradient-to-r from-[#D4A937]/10 via-[#D4A937]/5 to-[#8140FF]/5 rounded-xl shadow-lg dark:shadow-xl mb-5">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-afrikoni-gold rounded-full flex items-center justify-center">
                      {isNewSeller ? <Package className="w-6 h-6 text-[#0A0A0A]" /> : <FileText className="w-6 h-6 text-[#0A0A0A]" />}
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                        {isNewHybrid ? 'Get Started' : isNewSeller ? 'Add Your First Product' : 'Post Your First RFQ'}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                        {isNewHybrid
                          ? 'Add products to sell or post RFQs to buy. You can do both!'
                          : isNewSeller
                          ? 'List your products to start receiving RFQs from buyers.'
                          : "Tell suppliers what you need. We'll match you with verified African suppliers."}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  {(isNewHybrid || isNewSeller) && (
                    <Link to="/dashboard/products/quick-add" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        variant={isNewHybrid ? 'outline' : 'default'}
                        className={`w-full sm:w-auto px-6 py-4 text-base font-bold ${
                          isNewHybrid ? 'border-2 border-afrikoni-gold text-[#0A0A0A]' : 'bg-afrikoni-gold hover:bg-afrikoni-goldDark text-[#0A0A0A] shadow-xl'
                        }`}
                      >
                        Add Product
                        {!isNewHybrid && <ArrowRight className="w-5 h-5 ml-2" />}
                      </Button>
                    </Link>
                  )}
                  {(isNewHybrid || isNewBuyer) && (
                    <Link to="/dashboard/rfqs/new" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        className="w-full sm:w-auto bg-afrikoni-gold hover:bg-afrikoni-goldDark text-[#0A0A0A] px-6 py-4 text-base font-bold shadow-xl"
                      >
                        Post RFQ
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick RFQ Bar - AI Speed Layer for buyers */}
      {isBuyer && (
        <Card className="border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-xl">
          <CardContent className="p-4">
            <QuickRFQBar />
          </CardContent>
        </Card>
      )}

      {/* KPI Cards - Trade OS Dark */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpis.map((kpi, index) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Card className="border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-xl hover:border-[#D4A937]/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] flex items-center justify-center">
                      <kpi.icon className="w-4 h-4 text-[#D4A937]" />
                    </div>
                    {kpi.change && (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded">
                        {kpi.change}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-[#F5F0E8] font-mono">{kpi.value}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{kpi.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Onboarding Progress Tracker - For Suppliers */}
      {isSeller && companyId && (
        <OnboardingProgressTracker companyId={companyId} userId={userId} />
      )}

      {/* Charts Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sales/Orders Chart */}
        <Card className="border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-[#F5F0E8] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-afrikoni-gold" />
              {isSeller ? 'Sales Activity' : 'Order Activity'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={salesChartData.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#D4A853"
                    fill="#D4A853"
                    fillOpacity={0.3}
                    name="Orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No data yet"
                description="Order activity will appear here once you start trading."
              />
            )}
          </CardContent>
        </Card>

        {/* RFQ Chart */}
        <Card className="border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-[#F5F0E8] flex items-center gap-2">
              <FileText className="w-5 h-5 text-afrikoni-purple" />
              RFQ Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rfqChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={rfqChartData.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="sent" fill="#7C3AED" name="Sent" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="received" fill="#D4A853" name="Received" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={FileText}
                title="No RFQs yet"
                description={isBuyer ? "Post your first RFQ to get started." : "RFQs matched to you will appear here."}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trade Corridor + Escrow Milestone Widgets */}
      <div className="grid md:grid-cols-2 gap-6">
        <TradeCorridorWidget />
        <EscrowMilestoneProgress
          totalAmount={64000}
          releasedAmount={19200}
          heldAmount={44800}
          currentMilestone="order_confirmed"
          fxRate="1 USD = 1.08 EUR"
        />
      </div>

      {/* Quick Actions */}
      <Card className="border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-[#F5F0E8]">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actions.slice(0, 4).map((action, index) => (
              <Link key={action.link + index} to={action.link}>
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col items-center gap-2 border-gray-200 dark:border-[#2A2A2A] hover:border-[#D4A937]/40 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] bg-gray-50 dark:bg-[#0E0E0E] transition-all"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.color}`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-[#F5F0E8]">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity - Unified feed */}
      {(recentOrders.length > 0 || recentRFQs.length > 0 || recentMessages.length > 0) && (
        <Card className="border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-[#F5F0E8] flex items-center gap-2">
              <Clock className="w-5 h-5 text-afrikoni-gold" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Orders */}
              {recentOrders.slice(0, 3).map((order) => (
                <Link
                  key={`order-${order.id}`}
                  to="/dashboard/orders"
                  className="flex items-center justify-between p-3 bg-afrikoni-cream/30 rounded-lg hover:bg-afrikoni-cream/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-afrikoni-gold/20 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-afrikoni-gold" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-[#F5F0E8] text-sm">
                        Order #{order.id?.slice(-8)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[#F5F0E8]/60">
                        {order.created_at ? format(new Date(order.created_at), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-[#F5F0E8] text-sm">
                      ${parseFloat(order.total_amount || 0).toLocaleString()}
                    </p>
                    <Badge variant={order.status === 'completed' ? 'success' : order.status === 'pending' ? 'warning' : 'default'}>
                      {order.status}
                    </Badge>
                  </div>
                </Link>
              ))}

              {/* RFQs */}
              {isBuyer && recentRFQs.slice(0, 3).map((rfq) => (
                <Link
                  key={`rfq-${rfq.id}`}
                  to="/dashboard/rfqs"
                  className="flex items-center justify-between p-3 bg-afrikoni-cream/30 rounded-lg hover:bg-afrikoni-cream/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-afrikoni-purple/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-afrikoni-purple" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-[#F5F0E8] text-sm">
                        {rfq.title || `RFQ #${rfq.id?.slice(-8)}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[#F5F0E8]/60">
                        {rfq.created_at ? format(new Date(rfq.created_at), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={rfq.status === 'open' ? 'success' : rfq.status === 'closed' ? 'default' : 'warning'}>
                    {rfq.status}
                  </Badge>
                </Link>
              ))}

              {/* Messages */}
              {recentMessages.slice(0, 3).map((message) => (
                <Link
                  key={`msg-${message.id}`}
                  to="/dashboard/notifications"
                  className="flex items-center justify-between p-3 bg-afrikoni-cream/30 rounded-lg hover:bg-afrikoni-cream/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-afrikoni-green/20 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-afrikoni-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-gray-900 dark:text-[#F5F0E8] text-sm truncate ${!message.read ? 'font-bold' : ''}`}>
                        {message.content?.slice(0, 50)}...
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[#F5F0E8]/60">
                        {message.created_at ? format(new Date(message.created_at), 'MMM dd, h:mm a') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {!message.read && (
                    <div className="w-2 h-2 bg-afrikoni-gold rounded-full ml-2" />
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
