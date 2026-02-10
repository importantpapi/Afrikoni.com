import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { DataTable, StatusChip } from '@/components/shared/ui/data-table';
import { ShoppingCart, DollarSign, TrendingUp, Package, Search } from 'lucide-react';
import { toast } from 'sonner';
import EmptyState from '@/components/shared/ui/EmptyState';
import RequireCapability from '@/guards/RequireCapability';

function DashboardSalesInner() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ ARCHITECTURAL FIX: Data freshness tracking (30 second threshold)
  const { isStale, markFresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);
  const abortControllerRef = useRef(null); // ✅ KERNEL MANIFESTO: Rule 4 - AbortController for query cancellation
  
  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading sales..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MANIFESTO: Rule 2 - Logic Gate - Guard with canLoadData
  useEffect(() => {
    // ✅ KERNEL MANIFESTO: Rule 3 - Logic Gate - First line must check canLoadData
    if (!canLoadData) {
      if (!userId) {
        console.log('[DashboardSales] No user → redirecting to login');
        navigate('/login');
      }
      return;
    }

    // ✅ KERNEL MANIFESTO: Rule 4 - AbortController for query cancellation
    abortControllerRef.current = new AbortController();
    const abortSignal = abortControllerRef.current.signal;

    // ✅ KERNEL MANIFESTO: Rule 4 - Timeout with query cancellation
    const timeoutId = setTimeout(() => {
      if (!abortSignal.aborted) {
        console.warn('[DashboardSales] Loading timeout (15s) - aborting queries');
        abortControllerRef.current.abort();
        setIsLoading(false);
        setError('Data loading timed out. Please try again.');
      }
    }, 15000);

    // ✅ ARCHITECTURAL FIX: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale || 
                         !lastLoadTimeRef.current || 
                         (Date.now() - lastLoadTimeRef.current > 30000);
    
    if (shouldRefresh) {
      console.log('[DashboardSales] Data is stale or first load - refreshing');
      loadSales(abortSignal).catch(err => {
        if (err.name !== 'AbortError') {
          console.error('[DashboardSales] Load error:', err);
        }
      });
    } else {
      console.log('[DashboardSales] Data is fresh - skipping reload');
    }

    return () => {
      // ✅ KERNEL MANIFESTO: Rule 4 - Cleanup AbortController on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimeout(timeoutId);
    };
  }, [canLoadData, userId, profileCompanyId, statusFilter, location.pathname, isStale, navigate]);

  const loadSales = async (abortSignal) => {
    // ✅ KERNEL MANIFESTO: Rule 2 - Logic Gate - Guard with canLoadData (checked in useEffect)
    if (!profileCompanyId) {
      console.log('[DashboardSales] No company_id - cannot load sales');
      return;
    }

    try {
      setIsLoading(true);
      setError(null); // ✅ KERNEL MANIFESTO: Rule 4 - Clear previous errors

      // ✅ KERNEL MANIFESTO: Rule 4 - Check abort signal before queries
      if (abortSignal?.aborted) return;
      
      // ✅ KERNEL MANIFESTO: Rule 6 - Use profileCompanyId for all queries
      const { data: salesOrders, error: queryError } = await supabase
        .from('orders')
        .select('*, products(*)')
        .eq('seller_company_id', profileCompanyId)
        .order('created_at', { ascending: false });

      // ✅ KERNEL MANIFESTO: Rule 4 - Check abort signal after queries
      if (abortSignal?.aborted) return;

      if (queryError) throw queryError;

      setOrders(salesOrders || []);
      
      // ✅ REACTIVE READINESS FIX: Mark data as fresh ONLY after successful response
      if (salesOrders && Array.isArray(salesOrders)) {
        lastLoadTimeRef.current = Date.now();
        markFresh();
      }
    } catch (err) {
      // ✅ KERNEL MANIFESTO: Rule 4 - Handle abort errors properly
      if (err.name === 'AbortError' || abortSignal?.aborted) return;
      console.error('[DashboardSales] Error loading sales:', err);
      setError(err.message || 'Failed to load sales'); // ✅ KERNEL MANIFESTO: Rule 4 - Error state
      toast.error('Failed to load sales');
      // ❌ DO NOT mark fresh on error - let it retry on next navigation
    } finally {
      // ✅ KERNEL MANIFESTO: Rule 5 - The Finally Law - always clean up
      if (!abortSignal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchQuery || 
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.products?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const orderColumns = [
    { header: 'Order ID', accessor: 'id', render: (value) => value?.substring(0, 8) || 'N/A' },
    { header: 'Product', accessor: 'products.title', render: (value) => value || 'N/A' },
    { header: 'Buyer', accessor: 'buyer_company_id', render: (value) => value ? `Buyer ${value.substring(0, 8)}` : 'N/A' },
    { header: 'Quantity', accessor: 'quantity', render: (value) => value || '0' },
    { header: 'Amount', accessor: 'total_amount', render: (value) => `$${value?.toLocaleString() || '0'}` },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (value) => <StatusChip status={value} />
    },
    { 
      header: 'Actions',
      accessor: 'id',
      render: (value) => (
        <Link to={`/dashboard/orders/${value}`}>
          <Button variant="outline" size="sm">View</Button>
        </Link>
      )
    }
  ];

  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  const pendingRevenue = orders
    .filter(o => o.payment_status === 'pending')
    .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

  // ✅ KERNEL MANIFESTO: Rule 4 - Three-State UI - Error state checked BEFORE loading state
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          // useEffect will retry automatically when canLoadData is true
        }}
      />
    );
  }

  // ✅ KERNEL MANIFESTO: Rule 4 - Three-State UI - Loading state
  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* v2.5: Premium Header with Improved Spacing */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-h1-mobile md:text-h1 font-bold leading-[1.1] tracking-[-0.02em] mb-6">Sales</h1>
          <p className="text-body font-normal leading-[1.6]">Manage your sales and fulfillments</p>
        </motion.div>

        {/* v2.5: Premium Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <Card className="hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-h1-mobile md:text-h1 font-bold leading-[1.1] mb-2">{orders.length}</div>
                <div className="text-meta font-medium uppercase tracking-[0.02em]">Total Sales</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-2">${totalRevenue.toLocaleString()}</div>
                <div className="text-xs md:text-sm font-medium uppercase tracking-wide">Total Revenue</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-2">${pendingRevenue.toLocaleString()}</div>
                <div className="text-xs md:text-sm font-medium uppercase tracking-wide">Pending Payment</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all rounded-afrikoni-lg">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {Array.isArray(orders) ? orders.filter(o => o?.status === 'pending' || o?.status === 'processing').length : 0}
                </div>
                <div className="text-xs md:text-sm font-medium uppercase tracking-wide">To Fulfill</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* v2.5: Premium Filters */}
        <Card className="rounded-afrikoni-lg shadow-premium">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                <Input
                  placeholder="Search sales..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-afrikoni"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'processing' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('processing')}
                >
                  Processing
                </Button>
                <Button
                  variant={statusFilter === 'shipped' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('shipped')}
                >
                  Shipped
                </Button>
                <Button
                  variant={statusFilter === 'delivered' ? 'primary' : 'outline'}
                  onClick={() => setStatusFilter('delivered')}
                >
                  Delivered
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* v2.5: Premium Orders Table */}
        <Card className="rounded-afrikoni-lg shadow-premium">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg md:text-xl font-bold uppercase tracking-wider border-b-2 pb-3 inline-block">Sales Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <EmptyState 
                type="products"
                title="No sales yet"
                description="Start selling by adding products to your catalog."
                cta="Add Products"
                ctaLink="/dashboard/products/new"
              />
            ) : (
              <DataTable
                data={filteredOrders}
                columns={orderColumns}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function DashboardSales() {
    return (
      <>
        {/* PHASE 5B: Sales page requires sell capability (approved) */}
        <RequireCapability canSell={true} requireApproved={true}>
          <DashboardSalesInner />
        </RequireCapability>
      </>
    );
}

