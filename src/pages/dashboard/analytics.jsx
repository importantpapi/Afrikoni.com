import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import {
  BarChart3, TrendingUp, DollarSign, ShoppingCart, Package,
  FileText, CheckCircle, Clock, Sparkles, MapPin, Shield, RefreshCw, Activity, Globe, Target
} from 'lucide-react';

import { toast } from 'sonner';
import EmptyState from '@/components/shared/ui/EmptyState';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';

export default function DashboardAnalytics() {
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  const [analytics, setAnalytics] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();

  const { isStale, markFresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);
  const abortControllerRef = useRef(null);

  const isBuyer = capabilities?.can_buy === true;
  const isSeller = capabilities?.can_sell === true && capabilities?.sell_status === 'approved';
  const currentRole = isBuyer && isSeller ? 'hybrid' : isSeller ? 'seller' : 'buyer';

  useEffect(() => {
    if (!canLoadData || !profileCompanyId) {
      if (!userId && isSystemReady) navigate('/login');
      return;
    }

    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;

    const timeoutId = setTimeout(() => {
      if (!abortSignal.aborted) {
        abortControllerRef.current.abort();
        setIsLoading(false);
        setError('Data loading timed out.');
      }
    }, 15000);

    const shouldRefresh = !lastLoadTimeRef.current || (Date.now() - lastLoadTimeRef.current > 30000);

    if (shouldRefresh) {
      loadAnalytics(abortSignal);
    }

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      clearTimeout(timeoutId);
    };
  }, [canLoadData, profileCompanyId, period, viewMode, isStale]);

  const loadAnalytics = async (abortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const companyId = profileCompanyId;
      const days = parseInt(period);
      const startDate = startOfDay(subDays(new Date(), days)).toISOString();

      const showBuyer = (currentRole === 'buyer') || (currentRole === 'hybrid' && (viewMode === 'all' || viewMode === 'buyer'));
      const showSeller = (currentRole === 'seller') || (currentRole === 'hybrid' && (viewMode === 'all' || viewMode === 'seller'));

      let buyerStats = null;
      let sellerStats = null;

      if (showBuyer && companyId) {
        if (abortSignal?.aborted) return;
        const [ordersRes, rfqsRes, quotesRes] = await Promise.all([
          supabase.from('orders').select('*').eq('buyer_company_id', companyId).gte('created_at', startDate),
          supabase.from('rfqs').select('*').eq('buyer_company_id', companyId).gte('created_at', startDate),
          supabase.from('quotes').select('*, rfqs!inner(buyer_company_id)').eq('rfqs.buyer_company_id', companyId).gte('quotes.created_at', startDate)
        ]);

        const orders = ordersRes.data || [];
        const rfqs = rfqsRes.data || [];
        const quotes = quotesRes.data || [];

        buyerStats = {
          totalOrders: orders.length,
          totalRFQs: rfqs.length,
          totalSpent: orders.reduce((sum, o) => sum + (parseFloat(o?.total_amount) || 0), 0),
          openRfqs: rfqs.filter(r => ['pending_review', 'matched'].includes(r.status)).length,
          chart: orders.map(o => ({ date: format(new Date(o.created_at), 'MMM d'), orders: 1 }))
        };
      }

      if (showSeller && companyId) {
        if (abortSignal?.aborted) return;
        const [ordersRes, rfqsRes, quotesRes] = await Promise.all([
          supabase.from('orders').select('*').eq('seller_company_id', companyId).gte('created_at', startDate),
          supabase.from('rfqs').select('*, matched_supplier_ids').gte('created_at', startDate),
          supabase.from('quotes').select('*, rfqs!inner(*)').eq('supplier_company_id', companyId).gte('created_at', startDate)
        ]);

        const orders = ordersRes.data || [];
        const matchedRfqs = (rfqsRes.data || []).filter(r => r.matched_supplier_ids?.includes(companyId));
        const quotes = quotesRes.data || [];
        const winRate = quotes.length > 0 ? Math.round((quotes.filter(q => q.status === 'accepted').length / quotes.length) * 100) : 0;

        sellerStats = {
          totalSales: orders.length,
          rfqsReceived: matchedRfqs.length,
          quotesSent: quotes.length,
          totalRevenue: orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
          winRate,
          chart: orders.map(o => ({ date: format(new Date(o.created_at), 'MMM d'), revenue: parseFloat(o.total_amount) || 0 }))
        };
      }

      // Combine for hybrid 'all' view
      if (viewMode === 'all' && buyerStats && sellerStats) {
        setAnalytics({ ...buyerStats, ...sellerStats, isHybrid: true });
        setChartData([...buyerStats.chart, ...sellerStats.chart]);
      } else {
        setAnalytics(buyerStats || sellerStats);
        setChartData((buyerStats || sellerStats)?.chart || []);
      }

      lastLoadTimeRef.current = Date.now();
      markFresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSystemReady) return <SpinnerWithTimeout ready={false} />;
  if (error) return <ErrorState message={error} onRetry={() => loadAnalytics()} />;

  return (
    <div className="os-page-layout">
      {/* HEADER */}
      <div className="os-header-group flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="">Intelligence Console</h1>
          <p className="">Real-time trade performance and market synchronization.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markFresh(true)}
            disabled={isLoading}
            className="text-os-text-secondary hover:text-os-accent"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Sync Intelligence
          </Button>
        </div>
      </div>

      {/* FILTERS & ROLE SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {currentRole === 'hybrid' && (
          <Surface variant="soft" className="inline-flex p-1 rounded-full border-os-stroke/30">
            {['all', 'buyer', 'seller'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "relative px-6 py-2 rounded-full text-os-xs font-bold uppercase tracking-widest transition-all z-10",
                  viewMode === mode ? "text-os-bg" : "text-os-text-secondary hover:text-os-text-primary"
                )}
              >
                {viewMode === mode && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-os-text-primary rounded-full -z-10 shadow-os-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {mode}
              </button>
            ))}
          </Surface>
        )}

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px] rounded-full border-os-stroke bg-os-surface-solid/50 backdrop-blur">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent className="rounded-os-md border-os-stroke">
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI GRID */}
      {!analytics ? (
        <EmptyState type="analytics" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Standardized KPI Cards */}
          {(analytics.totalOrders !== undefined || analytics.totalSales !== undefined) && (
            <Surface variant="glass" hover className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Surface variant="soft" className="w-10 h-10 flex items-center justify-center border-os-stroke/30">
                  <ShoppingCart className="w-5 h-5 text-os-accent" />
                </Surface>
                <div className="os-label !text-os-green">Live</div>
              </div>
              <div className="text-3xl font-black font-mono tracking-tighter">
                {analytics.totalOrders || analytics.totalSales}
              </div>
              <div className="os-label mt-1">Total Trade Flows</div>
            </Surface>
          )}

          {(analytics.totalRevenue !== undefined || analytics.totalSpent !== undefined) && (
            <Surface variant="glass" hover className="p-6 border-os-accent/20">
              <div className="flex justify-between items-start mb-4">
                <Surface variant="soft" className="w-10 h-10 flex items-center justify-center border-os-stroke/30">
                  <DollarSign className="w-5 h-5 text-os-accent" />
                </Surface>
                <div className="os-label">Value</div>
              </div>
              <div className="text-3xl font-black font-mono tracking-tighter">
                ${(analytics.totalRevenue || analytics.totalSpent).toLocaleString()}
              </div>
              <div className="os-label mt-1">Verified Volume</div>
            </Surface>
          )}

          {analytics.rfqsReceived !== undefined && (
            <Surface variant="glass" hover className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Surface variant="soft" className="w-10 h-10 flex items-center justify-center border-os-stroke/30">
                  <FileText className="w-5 h-5 text-os-blue" />
                </Surface>
                <div className="os-label">Stream</div>
              </div>
              <div className="text-3xl font-black font-mono tracking-tighter">{analytics.rfqsReceived}</div>
              <div className="os-label mt-1">Market Opportunities</div>
            </Surface>
          )}

          {analytics.winRate !== undefined && (
            <Surface variant="glass" hover className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Surface variant="soft" className="w-10 h-10 flex items-center justify-center border-os-stroke/30">
                  <Target className="w-5 h-5 text-os-green" />
                </Surface>
                <div className="os-label text-os-green">{analytics.winRate}%</div>
              </div>
              <div className="text-3xl font-black font-mono tracking-tighter">{analytics.winRate}%</div>
              <div className="os-label mt-1">Quote Conversion</div>
            </Surface>
          )}
        </div>
      )}

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Surface variant="panel" className="lg:col-span-8 p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-os-accent" />
              <h2 className="text-os-xl font-bold">Volume Trends</h2>
            </div>
            <div className="os-label opacity-40">Frequency: Daily</div>
          </div>

          <div className="h-[350px] w-100%">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'var(--os-text-secondary)' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'var(--os-text-secondary)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--os-surface-solid)',
                    border: '1px solid var(--os-stroke)',
                    borderRadius: 'var(--radius-os-sm)',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={analytics?.totalRevenue !== undefined ? "revenue" : "orders"}
                  stroke="var(--os-accent)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--os-accent)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Surface>

        <div className="lg:col-span-4 space-y-8">
          <Surface variant="panel" className="p-6">
            <h3 className="os-label mb-6 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Trade Integrity
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-os-sm text-os-text-secondary">Health Index</span>
                <span className="text-os-sm font-black text-os-green">98.4%</span>
              </div>
              <div className="h-1.5 w-full bg-os-stroke rounded-full overflow-hidden">
                <div className="h-full bg-os-green w-[98.4%] animate-pulse" />
              </div>
              <p className="text-os-xs text-os-text-secondary leading-relaxed">
                Your trade execution parameters are within the 1st percentile of Verified Reliability.
              </p>
            </div>
          </Surface>

          <Surface variant="glass" className="p-6 border-os-blue/20 bg-os-blue/5">
            <h3 className="os-label !text-os-blue mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Global Reach
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Lagos', 'Accra', 'Durban', 'Abidjan'].map(city => (
                <span key={city} className="px-2 py-1 rounded-full bg-os-blue/10 text-os-blue text-[10px] font-bold border border-os-blue/20">
                  {city}
                </span>
              ))}
            </div>
            <p className="text-os-xs text-os-text-secondary mt-4">
              Expand to East African corridors to unlock advanced clearing presets.
            </p>
          </Surface>
        </div>
      </div>
    </div>
  );
}
