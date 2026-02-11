/**
 * Logistics Dashboard - Comprehensive dashboard for logistics partners and 3PL providers
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import RequireCapability from '@/guards/RequireCapability';

import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { logError } from '@/utils/errorLogger';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import EmptyState from '@/components/shared/ui/EmptyState';
import RealTimeTracking from '@/components/logistics/RealTimeTracking';
import ShipmentRiskVisualizer from '@/components/risk/ShipmentRiskVisualizer';

import {
  Truck,
  MapPin,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  BarChart3,
  Plus,
  Eye,
  ArrowRight,
  Activity
} from 'lucide-react';

import { toast } from 'sonner';
import { format } from 'date-fns';

function LogisticsDashboardInner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // ✅ KERNEL COMPLIANCE: Use useDashboardKernel as single source of truth
  const { user, profile, userId, profileCompanyId, capabilities, isSystemReady, canLoadData } = useDashboardKernel();

  // ✅ GLOBAL HARDENING: Data freshness tracking (30 second threshold)
  const { isStale, markFresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);

  // ✅ KERNEL MIGRATION: Derive role from capabilities
  const canLogistics = capabilities?.can_logistics === true && capabilities?.logistics_status === 'approved';
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  const [kpis, setKpis] = useState({
    activeShipments: 0,
    inTransit: 0,
    delivered: 0,
    pendingPickup: 0,
    totalRevenue: 0,
    onTimeDelivery: 0,
    avgDeliveryTime: 0,
    activePartners: 0
  });

  const [shipments, setShipments] = useState([]);
  const [recentShipments, setRecentShipments] = useState([]);
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('all');
  const [partners, setPartners] = useState([]);

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading logistics dashboard..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    // ✅ KERNEL MIGRATION: Use canLoadData guard
    if (!canLoadData || !profileCompanyId) {
      return;
    }

    // GUARD: Check logistics capability
    if (!canLogistics) {
      console.warn('[LogisticsDashboard] No logistics capability → redirecting to dashboard');
      navigate('/dashboard');
      return;
    }


    // ✅ GLOBAL HARDENING: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale ||
      !lastLoadTimeRef.current ||
      (Date.now() - lastLoadTimeRef.current > 30000);

    if (!shouldRefresh) {
      console.log('[LogisticsDashboard] Data is fresh - skipping reload');
      return;
    }

    console.log('[LogisticsDashboard] Data is stale or first load - refreshing');

    // Safety timeout: Force loading to false after 15 seconds
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[LogisticsDashboard] Loading timeout - forcing loading to false');
        setIsLoading(false);
      }
    }, 15000);

    const loadDashboardData = async () => {
      try {
        console.log('[LogisticsDashboard] Starting loadDashboardData...');
        setIsLoading(true);

        // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel
        const cid = profileCompanyId;
        console.log('[LogisticsDashboard] Company ID:', cid);

        setError(null);

        if (!isMounted) {
          console.warn('[LogisticsDashboard] Component unmounted during load');
          clearTimeout(timeoutId);
          setIsLoading(false);
          return;
        }


        if (!cid) {
          console.warn('[LogisticsDashboard] No company ID found');
          if (isMounted) {
            clearTimeout(timeoutId);
            setIsLoading(false);
            toast.info('Complete your company profile to access logistics features.');
          }
          return;
        }

        console.log('[LogisticsDashboard] Loading data in parallel for company:', cid);
        const dataStartTime = Date.now();
        // Load data in parallel with error handling for each
        const results = await Promise.allSettled([
          loadKPIs(cid).catch(err => {
            logError('loadKPIs', err, { companyId: cid, userId: userId });
            return null;
          }),
          loadRecentShipments(cid).catch(err => {
            logError('loadRecentShipments', err, { companyId: cid, userId: userId });
            return null;
          }),
          loadPartners(cid).catch(err => {
            logError('loadPartners', err, { companyId: cid, userId: userId });
            return null;
          })
        ]);
        const dataLoadTime = Date.now() - dataStartTime;
        console.log(`[LogisticsDashboard] Data loading completed in ${dataLoadTime}ms`, {
          kpis: results[0].status,
          shipments: results[1].status,
          partners: results[2].status
        });

        // ✅ GLOBAL HARDENING: Mark fresh ONLY on successful load
        lastLoadTimeRef.current = Date.now();
        markFresh();
      } catch (err) {
        logError('loadDashboardData', err, { companyId: cid, userId: userId });
        if (isMounted) {
          clearTimeout(timeoutId);
          setError(err?.message || 'Failed to load logistics dashboard');
          setIsLoading(false);
          toast.error('Failed to load logistics dashboard. Please refresh the page.');
        }
      } finally {
        // Safety net: Always clear timeout and set loading to false
        console.log('[LogisticsDashboard] Setting isLoading to false in finally block');
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [canLoadData, profileCompanyId, userId, canLogistics, location.pathname, isStale, navigate]);

  const loadKPIs = async (cid) => {
    const { data } = await supabase
      .from('shipments')
      .select('*, orders(*)')
      .eq('logistics_partner_id', cid);

    if (!data) return;

    const delivered = data.filter(s => s.status === 'delivered');
    const active = data.filter(s =>
      ['pending_pickup', 'picked_up', 'in_transit', 'customs', 'out_for_delivery'].includes(s.status)
    );

    const revenue = data.reduce(
      (sum, s) => sum + (parseFloat(s.orders?.total_amount) || 0),
      0
    );

    setKpis({
      activeShipments: active.length,
      inTransit: data.filter(s => s.status === 'in_transit').length,
      delivered: delivered.length,
      pendingPickup: data.filter(s => s.status === 'pending_pickup').length,
      totalRevenue: revenue,
      onTimeDelivery: delivered.length
        ? Math.round(
          (delivered.filter(s =>
            new Date(s.updated_at) <= new Date(s.estimated_delivery)
          ).length /
            delivered.length) *
          100
        )
        : 0,
      avgDeliveryTime: delivered.length
        ? Math.round(
          delivered.reduce((sum, s) => {
            return (
              sum +
              (new Date(s.updated_at) - new Date(s.created_at)) /
              (1000 * 60 * 60 * 24)
            );
          }, 0) / delivered.length
        )
        : 0,
      activePartners: new Set(
        data.flatMap(s => [s.orders?.buyer_company_id, s.orders?.seller_company_id])
      ).size
    });
  };

  const loadRecentShipments = async (cid) => {
    let query = supabase
      .from('shipments')
      .select('*, orders(products(name), total_amount)')
      .eq('logistics_partner_id', cid)
      .order('created_at', { ascending: false })
      .limit(10);

    if (shipmentStatusFilter !== 'all') {
      query = query.eq('status', shipmentStatusFilter);
    }

    const { data } = await query;
    setShipments(data || []);
    setRecentShipments(data || []);
  };

  const loadPartners = async (cid) => {
    const { data: orders } = await supabase
      .from('orders')
      .select('buyer_company_id, seller_company_id');

    if (!orders) return;

    const ids = Array.from(
      new Set(
        orders.flatMap(o => [o.buyer_company_id, o.seller_company_id]).filter(Boolean)
      )
    );

    const { data } = await supabase
      .from('companies')
      .select('id, company_name, country, city, verified')
      .in('id', ids);

    setPartners(data || []);
  };

  const handleFilterChange = (value) => {
    setShipmentStatusFilter(value);
  };

  const formatRoute = (s) => {
    const origin = s.origin_city || s.origin_port || s.origin_country || 'Unknown';
    const dest = s.destination_city || s.destination_port || s.destination_country || 'Unknown';
    return `${origin} → ${dest}`;
  };

  const statusBadge = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'pending_pickup') {
      return (
        <Badge variant="outline" className="">
          Pending pickup
        </Badge>
      );
    }
    if (['in_transit', 'picked_up', 'out_for_delivery'].includes(normalized)) {
      return (
        <Badge variant="outline" className="">
          In transit
        </Badge>
      );
    }
    if (normalized === 'delayed') {
      return (
        <Badge variant="outline" className="">
          Delayed
        </Badge>
      );
    }
    if (normalized === 'delivered') {
      return (
        <Badge variant="outline" className="">
          Delivered
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="capitalize">
        {status || 'Unknown'}
      </Badge>
    );
  };

  const riskBadge = (shipment) => {
    if (!shipment) return null;
    const status = (shipment.status || '').toLowerCase();

    if (status === 'delayed') {
      return (
        <Badge className="border gap-1">
          <AlertCircle className="h-3 w-3" />
          At risk
        </Badge>
      );
    }

    if (['in_transit', 'picked_up', 'out_for_delivery'].includes(status)) {
      return (
        <Badge className="border gap-1">
          <Clock className="h-3 w-3" />
          Monitor
        </Badge>
      );
    }

    if (status === 'delivered') {
      return (
        <Badge className="border gap-1">
          <CheckCircle className="h-3 w-3" />
          On time
        </Badge>
      );
    }

    return (
      <Badge className="border">
        Normal
      </Badge>
    );
  };

  const pendingPickupShipments = recentShipments.filter(
    s => (s.status || '').toLowerCase() === 'pending_pickup'
  );
  const delayedShipments = recentShipments.filter(
    s => (s.status || '').toLowerCase() === 'delayed'
  );
  const inMotionShipments = shipments.filter(s =>
    ['in_transit', 'picked_up', 'out_for_delivery'].includes(
      (s.status || '').toLowerCase()
    )
  );

  const quotesAwaitingCount = 0; // placeholder until wired to real data
  const commissionMTD = kpis.totalRevenue || 0; // placeholder using existing metric

  // Show loading state with timeout protection
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          const shouldRefresh = isStale || !lastLoadTimeRef.current || (Date.now() - lastLoadTimeRef.current > 30000);
          if (shouldRefresh) {
            // Trigger reload by updating a dependency
            setIsLoading(true);
          }
        }}
      />
    );
  }

  if (!profileCompanyId) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-12 w-12 border-b-2 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold">
            Logistics Control Tower
          </h1>
          <p className="text-sm">
            Shipments, risk, and Afrikoni commission at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            className="hover:bg-afrikoni-deep/90"
            onClick={() => setActiveTab('shipments')}
          >
            View Shipments
          </Button>
        </div>
      </div>

      {/* Primary CTA Banner - "What do I do now?" for new logistics users */}
      {kpis.activeShipments === 0 && recentShipments.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-2 bg-gradient-to-r rounded-lg shadow-xl mb-6">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-1">
                        Register Your Services
                      </h2>
                      <p className="text-sm md:text-base">
                        Set up your logistics profile to start receiving shipment requests from buyers and sellers. Verified logistics partners get priority matching.
                      </p>
                    </div>
                  </div>
                  <p className="text-sm mt-2">
                    💰 <strong>Success fee only when deal closes</strong> - No upfront costs
                  </p>
                </div>
                <Link to="/dashboard/company-info" className="w-full md:w-auto">
                  <Button
                    size="lg"
                    className="w-full md:w-auto hover:bg-afrikoni-goldDark px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all min-h-[52px]"
                  >
                    Complete Profile
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide">
                Active Shipments
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {kpis.activeShipments}
              </div>
            </div>
            <Truck className="h-5 w-5" />
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide">
                At Risk
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {delayedShipments.length}
              </div>
            </div>
            <AlertCircle className="h-5 w-5" />
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide">
                Pending Pickup
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {pendingPickupShipments.length}
              </div>
            </div>
            <Package className="h-5 w-5" />
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide">
                Quotes Awaiting Action
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {quotesAwaitingCount}
              </div>
            </div>
            <FileText className="h-5 w-5" />
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide">
                Afrikoni Commission (MTD)
              </div>
              <div className="mt-1 text-2xl font-semibold">
                ${commissionMTD.toLocaleString()}
              </div>
            </div>
            <DollarSign className="h-5 w-5" />
          </CardContent>
        </Card>
      </div>

      {/* Revenue snapshot */}
      <Card className="">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Revenue Snapshot
          </CardTitle>
          <CardDescription className="text-xs">
            Afrikoni commission from logistics activity (placeholders until fully wired).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-0">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide">
              Today
            </div>
            <div className="text-xl font-semibold">
              $0
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide">
              Last 7 Days
            </div>
            <div className="text-xl font-semibold">
              $0
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide">
              Month to Date
            </div>
            <div className="text-xl font-semibold">
              ${commissionMTD.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Risk Visualizer - New Column */}
            <div className="lg:col-span-1 h-full min-h-[420px]">
              <ShipmentRiskVisualizer shipments={shipments} />
            </div>


            <Card className="lg:col-span-1 max-h-[420px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Needs Action
                </CardTitle>
                <CardDescription className="text-xs">
                  Shipments and quotes that require attention.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 space-y-4 overflow-y-auto">
                {/* Pending pickups */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Pending pickups
                    </span>
                    <span className="text-xs">
                      {pendingPickupShipments.length}
                    </span>
                  </div>
                  {pendingPickupShipments.length === 0 ? (
                    <p className="text-xs">
                      No shipments need pickup right now.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {pendingPickupShipments.slice(0, 5).map(s => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between rounded-md border px-2 py-1.5"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">
                              {s.orders?.products?.title || 'Shipment'}
                            </span>
                            <span className="text-[11px]">
                              {formatRoute(s)}
                            </span>
                          </div>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => navigate(`/dashboard/shipments/${s.id}`)}
                          >
                            View
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Delayed */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Delayed shipments
                    </span>
                    <span className="text-xs">
                      {delayedShipments.length}
                    </span>
                  </div>
                  {delayedShipments.length === 0 ? (
                    <p className="text-xs">
                      No shipments are delayed at the moment.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {delayedShipments.slice(0, 5).map(s => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between rounded-md border px-2 py-1.5"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">
                              {s.orders?.products?.title || 'Shipment'}
                            </span>
                            <span className="text-[11px]">
                              {formatRoute(s)}
                            </span>
                          </div>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => navigate(`/dashboard/shipments/${s.id}`)}
                          >
                            Investigate
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Quotes placeholder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Quotes awaiting acceptance
                    </span>
                    <span className="text-xs">
                      {quotesAwaitingCount}
                    </span>
                  </div>
                  <p className="text-xs">
                    No logistics quotes need action right now.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Moving Now */}
            <Card className="lg:col-span-1 max-h-[420px] flex flex-col">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">
                    Moving Now
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Shipments currently in motion.
                  </CardDescription>
                </div>
                <Select value={shipmentStatusFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="h-8 w-[160px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending_pickup">Pending pickup</SelectItem>
                    <SelectItem value="in_transit">In transit</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="pt-0 overflow-x-auto overflow-y-auto">
                {inMotionShipments.length === 0 ? (
                  <p className="text-xs">
                    No shipments are moving right now.
                  </p>
                ) : (
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b text-[11px] uppercase">
                        <th className="py-2 pr-3 text-left">Tracking</th>
                        <th className="py-2 pr-3 text-left">Route</th>
                        <th className="py-2 pr-3 text-left">Status</th>
                        <th className="py-2 pr-3 text-left">ETA</th>
                        <th className="py-2 pr-3 text-left">Risk</th>
                        <th className="py-2 pl-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inMotionShipments.slice(0, 10).map(s => (
                        <tr
                          key={s.id}
                          className="border-b last:border-0 odd:bg-slate-50/40"
                        >
                          <td className="py-2 pr-3 align-middle">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">
                                {s.tracking_id || s.id}
                              </span>
                              <span className="text-[11px]">
                                {s.orders?.products?.name || s.orders?.products?.title || 'Shipment'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 pr-3 align-middle">
                            {formatRoute(s)}
                          </td>
                          <td className="py-2 pr-3 align-middle">
                            {statusBadge(s.status)}
                          </td>
                          <td className="py-2 pr-3 align-middle">
                            {s.estimated_delivery
                              ? format(new Date(s.estimated_delivery), 'dd MMM, HH:mm')
                              : '—'}
                          </td>
                          <td className="py-2 pr-3 align-middle">
                            {riskBadge(s)}
                          </td>
                          <td className="py-2 pl-3 align-middle text-right">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => navigate(`/dashboard/shipments/${s.id}`)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SHIPMENTS */}
        <TabsContent value="shipments" className="mt-4">
          <Card className="">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-medium">
                  Shipments
                </CardTitle>
                <CardDescription className="text-xs">
                  Operational view of all shipments.
                </CardDescription>
              </div>
              <Select value={shipmentStatusFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending_pickup">Pending pickup</SelectItem>
                  <SelectItem value="in_transit">In transit</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {shipments.length === 0 ? (
                <EmptyState
                  title="No shipments yet"
                  description="When shipments are created, they will appear in this table."
                />
              ) : (
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b text-[11px] uppercase">
                      <th className="py-2 pr-3 text-left">Tracking</th>
                      <th className="py-2 pr-3 text-left">Route</th>
                      <th className="py-2 pr-3 text-left">Status</th>
                      <th className="py-2 pr-3 text-left">ETA</th>
                      <th className="py-2 pl-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map(s => (
                      <tr
                        key={s.id}
                        className="border-b last:border-0 odd:bg-slate-50/40"
                      >
                        <td className="py-2 pr-3 align-middle">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">
                              {s.tracking_id || s.id}
                            </span>
                            <span className="text-[11px]">
                              {s.orders?.products?.title || 'Shipment'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 pr-3 align-middle">
                          {formatRoute(s)}
                        </td>
                        <td className="py-2 pr-3 align-middle">
                          {statusBadge(s.status)}
                        </td>
                        <td className="py-2 pr-3 align-middle">
                          {s.estimated_delivery
                            ? format(new Date(s.estimated_delivery), 'dd MMM, HH:mm')
                            : '—'}
                        </td>
                        <td className="py-2 pl-3 align-middle text-right">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => navigate(`/dashboard/shipments/${s.id}`)}
                          >
                            View details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* QUOTES */}
      <TabsContent value="quotes" className="mt-4">
        <Card className="">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Quotes
            </CardTitle>
            <CardDescription className="text-xs">
              Logistics quotes will appear here once connected to quote data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No logistics quotes to manage"
              description="When buyers request logistics quotes, they will be listed here for follow-up."
            />
          </CardContent>
        </Card>
      </TabsContent>

      {/* TRACKING */}
      <TabsContent value="tracking" className="mt-4">
        <Card className="">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Tracking
            </CardTitle>
            <CardDescription className="text-xs">
              Geographic view of active shipments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RealTimeTracking shipments={shipments} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* REVENUE */}
      <TabsContent value="revenue" className="mt-4">
        <Card className="">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Revenue
            </CardTitle>
            <CardDescription className="text-xs">
              High-level view of Afrikoni commission from logistics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide">
                  Today
                </div>
                <div className="text-xl font-semibold">
                  $0
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide">
                  Last 7 Days
                </div>
                <div className="text-xl font-semibold">
                  $0
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide">
                  Month to Date
                </div>
                <div className="text-xl font-semibold">
                  ${commissionMTD.toLocaleString()}
                </div>
              </div>
            </div>
            <p className="text-xs">
              Detailed revenue analytics will be connected to live shipment and quote data.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </div >
  );
}

export default function LogisticsDashboard() {
  // Note: This component is wrapped by DashboardLayout in Dashboard component
  // when accessed through LogisticsHome -> Dashboard component
  return (
    <>
      {/* PHASE 5B: Logistics dashboard requires logistics capability (approved) */}
      <RequireCapability canLogistics={true} requireApproved={true}>
        <LogisticsDashboardInner />
      </RequireCapability>
    </>
  );
}
