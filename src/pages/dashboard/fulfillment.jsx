import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Warehouse, Package, Truck, CheckCircle, Clock, AlertCircle,
  RefreshCw, Search, ArrowRight, ArrowUpRight, Box, Boxes,
  MapPin, Calendar, ExternalLink, ChevronRight, Activity, Zap
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { toast } from 'sonner';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase, withRetry } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import {
  getOrderFulfillment,
  updateFulfillmentStatus,
  getWarehouseLocations
} from '@/lib/supabaseQueries/logistics';
import { format } from 'date-fns';
import EmptyState from '@/components/shared/ui/EmptyState';
import RequireCapability from '@/guards/RequireCapability';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { logError } from '@/utils/errorLogger';
import { Surface } from '@/components/system/Surface';
import { cn } from '@/lib/utils';

function FulfillmentDashboardInner() {
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();

  const navigate = useNavigate();
  const location = useLocation();
  const [fulfillments, setFulfillments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const { isStale, markFresh, refresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);
  const abortControllerRef = useRef(null);

  const canLogistics = capabilities?.can_logistics === true && capabilities?.logistics_status === 'approved';

  useEffect(() => {
    if (!canLoadData) {
      if (!userId) navigate('/login');
      return;
    }

    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;

    const timeoutId = setTimeout(() => {
      if (!abortSignal.aborted) {
        abortControllerRef.current.abort();
        setIsLoading(false);
        setError('Data loading timed out. Please try again.');
      }
    }, 15000);

    const shouldRefresh = isStale || !lastLoadTimeRef.current || (Date.now() - lastLoadTimeRef.current > 30000);

    if (shouldRefresh) {
      loadData(abortSignal).catch(() => { });
    }

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      clearTimeout(timeoutId);
    };
  }, [canLoadData, userId, profileCompanyId, statusFilter, location.pathname, isStale, navigate, canLogistics]);

  const loadData = async (abortSignal) => {
    if (!profileCompanyId && !canLogistics) {
      toast.info('Complete your company profile to access fulfillment features.');
      setIsLoading(false);
      return;
    }

    try {
      if ((fulfillments || []).length === 0) setIsLoading(true);
      setError(null);

      if (abortSignal?.aborted) return;

      const fetchFulfillmentData = async () => {
        let ordersQuery = supabase
          .from('orders')
          .select(`
              *,
              fulfillment:order_fulfillment(*),
              buyer_company:companies!orders_buyer_company_id_fkey(*)
            `);

        if (canLogistics && profileCompanyId) {
          const { data: shipments, error: shipmentsError } = await supabase
            .from('shipments')
            .select('order_id')
            .eq('logistics_partner_id', profileCompanyId);

          if (shipmentsError) throw shipmentsError;

          if (shipments && shipments.length > 0) {
            const orderIds = shipments.map(s => s.order_id).filter(Boolean);
            if (orderIds.length > 0) ordersQuery = ordersQuery.in('id', orderIds);
            else return { orders: [], warehouses: [] };
          } else return { orders: [], warehouses: [] };
        } else if (profileCompanyId) {
          ordersQuery = ordersQuery.eq('seller_company_id', profileCompanyId);
        } else return { orders: [], warehouses: [] };

        const { data: orders, error: ordersError } = await ordersQuery.order('created_at', { ascending: false });
        if (ordersError) throw ordersError;

        let warehousesList = [];
        if (profileCompanyId && !canLogistics) {
          const wResult = await getWarehouseLocations(profileCompanyId);
          warehousesList = Array.isArray(wResult) ? wResult : [];
        }

        if (abortSignal?.aborted) throw new Error('Aborted');

        return { orders: orders || [], warehouses: warehousesList };
      };

      const { orders, warehouses: warehousesList } = await withRetry(fetchFulfillmentData);

      if (orders && Array.isArray(orders)) {
        const fulfillmentsList = orders
          .filter(order => order.fulfillment)
          .map(order => ({
            ...order.fulfillment,
            order: order
          }))
          .filter(f => statusFilter === 'all' || f.status === statusFilter);

        setFulfillments(fulfillmentsList);
      } else setFulfillments([]);

      setWarehouses(warehousesList);
      lastLoadTimeRef.current = Date.now();
      markFresh();

    } catch (error) {
      if (error.name === 'AbortError' || error.message === 'Aborted' || abortSignal?.aborted) return;
      logError('loadData', error, { companyId: profileCompanyId, userId });

      if ((fulfillments || []).length === 0) {
        toast.error('Failed to load fulfillment data. Please try again.');
        setError('Connection failed. Please retry.');
      } else toast.warning('Connection unstable - showing cached data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (fulfillmentId, newStatus) => {
    try {
      await updateFulfillmentStatus(fulfillmentId, newStatus);
      toast.success(`Fulfillment status updated to ${newStatus.replace('_', ' ')}`);
      loadData();
    } catch (error) {
      toast.error('Failed to update fulfillment status');
    }
  };

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'pending': return 'bg-white/5 border-white/10 text-os-muted';
      case 'picking': return 'bg-os-accent/10 border-os-accent/20 text-os-accent';
      case 'packed': return 'bg-os-blue/10 border-os-blue/20 text-blue-400';
      case 'ready_for_dispatch': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'handed_to_carrier': return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500';
      case 'cancelled': return 'bg-os-red/10 border-os-red/20 text-os-red';
      default: return 'bg-white/5 border-white/10 text-os-muted';
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'handed_to_carrier') return <CheckCircle className="w-4 h-4" />;
    if (status === 'cancelled') return <AlertCircle className="w-4 h-4" />;
    if (status === 'picking' || status === 'packed') return <Box className="w-4 h-4 animate-pulse" />;
    return <Clock className="w-4 h-4" />;
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      'pending': 'picking',
      'picking': 'packed',
      'packed': 'ready_for_dispatch',
      'ready_for_dispatch': 'handed_to_carrier'
    };
    return flow[currentStatus];
  };

  if (isLoading && (fulfillments || []).length === 0) return <CardSkeleton count={3} />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  const stats = [
    { label: 'Awaiting', count: (fulfillments || []).filter(f => f.status === 'pending').length, icon: Clock, color: 'text-os-muted' },
    { label: 'Active Fulfillment', count: (fulfillments || []).filter(f => ['picking', 'packed'].includes(f.status)).length, icon: Box, color: 'text-os-accent' },
    { label: 'Ready to Ship', count: (fulfillments || []).filter(f => f.status === 'ready_for_dispatch').length, icon: Package, color: 'text-emerald-500' },
    { label: 'In Transit', count: (fulfillments || []).filter(f => f.status === 'handed_to_carrier').length, icon: Truck, color: 'text-emerald-400' },
  ];

  return (
    <div className="os-page os-stagger space-y-8 max-w-7xl mx-auto pb-20 px-4 py-8">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-os-accent/10 rounded-os-sm border border-os-accent/30">
              <Warehouse className="w-6 h-6 text-os-accent" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Global Fulfillment</h1>
          </div>
          <p className="text-os-muted text-os-lg max-w-xl">Intelligent warehouse management and logistics orchestration for the Afrikoni ecosystem.</p>
        </div>

        <div className="flex items-center gap-4">
          <Surface variant="panel" className="px-5 py-2.5 flex items-center gap-4 border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-emerald-500 text-os-xs font-black uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Fleet Status: Active
            </div>
            <div className="w-px h-6 bg-white/10" />
            <Button variant="ghost" size="sm" onClick={() => { refresh(); loadData(); }} className="h-8 gap-2 text-os-accent font-bold">
              <RefreshCw className="w-3.5 h-3.5" />
              Sync
            </Button>
          </Surface>
        </div>
      </div>

      {/* Modern Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Surface key={i} variant="panel" className="p-6 group hover:border-os-accent/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black">{stat.count}</div>
              <div className="text-os-xs font-bold uppercase tracking-widest text-os-muted">{stat.label}</div>
            </div>
          </Surface>
        ))}
      </div>

      {/* Control Layer */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-56 h-12 bg-white/[0.03] border-white/10 rounded-os-sm focus:ring-os-accent/20">
              <SelectValue placeholder="Stream: All" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10">
              <SelectItem value="all">Fulfillment Stream: All</SelectItem>
              <SelectItem value="pending">Queued Orders</SelectItem>
              <SelectItem value="picking">Picking Stage</SelectItem>
              <SelectItem value="packed">Packed & Ready</SelectItem>
              <SelectItem value="ready_for_dispatch">Awaiting Carrier</SelectItem>
              <SelectItem value="handed_to_carrier">In Transit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="hidden md:flex items-center gap-6 text-os-xs font-bold uppercase tracking-widest text-os-muted">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-emerald-500" />
            Processing Latency: 4ms
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-os-accent" />
            Capacity: 94%
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Surface variant="glass" className="p-8">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
              <h2 className="text-os-xl font-black tracking-tight flex items-center gap-3">
                Active Shipments
                <Badge variant="outline" className="text-os-xs font-black border-white/10 text-os-muted">
                  {(fulfillments || []).length}
                </Badge>
              </h2>
              <Button variant="ghost" size="sm" className="text-os-muted font-bold text-os-xs gap-2">
                View Manifest <ExternalLink className="w-3 h-3" />
              </Button>
            </div>

            {(fulfillments || []).length === 0 ? (
              <EmptyState
                icon={Package}
                title="Dock Empty"
                description="Incoming orders will prioritize this fulfillment stream."
                className="py-12"
              />
            ) : (
              <div className="space-y-4">
                {(fulfillments || []).map((f) => (
                  <Surface key={f.id} variant="panel" className="p-5 border-white/5 hover:border-os-accent/30 transition-all group/card">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex gap-4">
                        <div className="p-3 bg-white/5 rounded-os-md border border-white/10 group-hover/card:bg-os-accent/10 transition-colors">
                          <Package className="w-6 h-6 text-os-muted group-hover/card:text-os-accent" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-os-lg">Order #{f.order?.order_number || f.order_id?.slice(0, 8)}</h3>
                            <Badge className={cn("text-os-xs font-black uppercase tracking-widest py-1 px-2.5", getStatusBadgeStyles(f.status))}>
                              <span className="flex items-center gap-1.5">
                                {getStatusIcon(f.status)}
                                {f.status.replace('_', ' ')}
                              </span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-os-xs text-os-muted font-medium">
                            <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {f.order?.buyer_company?.name || 'Institutional Buyer'}</div>
                            <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {f.created_at ? format(new Date(f.created_at), 'MMM d, HH:mm') : 'Recently'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link to={`/dashboard/orders/${f.order_id}`}>
                          <Button variant="ghost" size="sm" className="font-bold text-os-xs gap-2 border border-white/10 rounded-os-sm hover:bg-white/5">
                            Audit Order <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>

                        {getNextStatus(f.status) && (
                          <Button
                            size="sm"
                            className="bg-os-accent text-black font-black px-6 rounded-os-sm hover:scale-105 active:scale-95 transition-all text-os-xs"
                            onClick={() => handleUpdateStatus(f.id, getNextStatus(f.status))}
                          >
                            Advance to {getNextStatus(f.status).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            )}
          </Surface>
        </div>

        <div className="space-y-8">
          {/* Warehouse Locations */}
          <Surface variant="glass" className="p-8">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <h3 className="text-os-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-os-muted" />
                Infrastructure
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-os-muted hover:text-os-accent">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {(warehouses || []).length === 0 ? (
              <div className="py-8 text-center space-y-4">
                <Boxes className="w-10 h-10 text-white/5 mx-auto" />
                <p className="text-os-xs text-os-muted italic">No registered warehouses</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(warehouses || []).map((w) => (
                  <div key={w.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-os-md hover:border-white/10 transition-colors group cursor-default">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-os-sm group-hover:text-os-accent transition-colors">{w.name}</p>
                        <p className="text-os-xs text-os-muted font-medium">{w.address || 'Address Restricted'}</p>
                        <p className="text-os-xs text-os-muted font-bold uppercase tracking-tighter opacity-70">
                          {w.city}{w.city && w.country ? ' • ' : ''}{w.country || 'International'}
                        </p>
                      </div>
                      <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button className="w-full mt-8 bg-white/5 border border-white/10 rounded-os-md py-6 text-os-xs font-black uppercase tracking-widest hover:bg-white/10">
              Register New Warehouse
            </Button>
          </Surface>

          {/* Carrier Network */}
          <Surface variant="glass" className="p-8 overflow-hidden relative group">
            <div className="absolute -right-8 -bottom-8 p-12 opacity-[0.02] scale-150 rotate-12 transition-transform group-hover:rotate-0 duration-1000">
              <Truck className="w-32 h-32" />
            </div>

            <h3 className="text-os-sm font-black uppercase tracking-widest mb-6">Logistics Network</h3>
            <div className="space-y-5 relative z-10">
              {[
                { name: 'Pan-African Express', status: 'Optimal', delay: '0ms' },
                { name: 'AfCFTA Global Log', status: 'High Load', delay: '12ms' },
                { name: 'West Dock Int.', status: 'Optimal', delay: '2ms' }
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between text-os-xs">
                  <span className="font-bold text-os-muted">{n.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-os-xs font-mono text-os-muted opacity-50">{n.delay}</span>
                    <span className={cn("font-black uppercase tracking-tighter", n.status === 'Optimal' ? 'text-emerald-500' : 'text-amber-500')}>
                      {n.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}

export default function FulfillmentDashboard() {
  return (
    <RequireCapability canSell={true} canLogistics={true} requireApproved={true}>
      <FulfillmentDashboardInner />
    </RequireCapability>
  );
}
