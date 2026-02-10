/**
 * Returns Dashboard
 * Manage returns for buyers and sellers
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RotateCcw, Package, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { toast } from 'sonner';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import { getReturns, updateReturnStatus } from '@/lib/supabaseQueries/returns';
import { format } from 'date-fns';
import EmptyState from '@/components/shared/ui/EmptyState';
import RequireCapability from '@/guards/RequireCapability';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { Surface } from '@/components/system/Surface';

function ReturnsDashboardInner() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  
  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ FINAL SYNC: Data freshness tracking (30 second threshold)
  const { isStale, markFresh, refresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);
  const abortControllerRef = useRef(null); // ✅ KERNEL MANIFESTO: Rule 4 - AbortController for query cancellation

  // Derive role from capabilities
  const isSeller = capabilities.can_sell === true && capabilities.sell_status === 'approved';
  const userRole = isSeller ? 'seller' : 'buyer';

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading returns..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MANIFESTO: Rule 2 - Logic Gate - Guard with canLoadData
  useEffect(() => {
    // ✅ KERNEL MANIFESTO: Rule 3 - Logic Gate - First line must check canLoadData
    if (!canLoadData) {
      if (!userId) {
        console.log('[ReturnsDashboard] No user → redirecting to login');
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
        console.warn('[ReturnsDashboard] Loading timeout (15s) - aborting queries');
        abortControllerRef.current.abort();
        setIsLoading(false);
        setError('Data loading timed out. Please try again.');
      }
    }, 15000);

    // ✅ FINAL SYNC: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale || 
                         !lastLoadTimeRef.current || 
                         (Date.now() - lastLoadTimeRef.current > 30000);
    
    if (shouldRefresh) {
      console.log('[ReturnsDashboard] Data is stale or first load - refreshing');
      loadData(abortSignal).catch(err => {
        if (err.name !== 'AbortError') {
          console.error('[ReturnsDashboard] Load error:', err);
        }
      });
    } else {
      console.log('[ReturnsDashboard] Data is fresh - skipping reload');
    }

    return () => {
      // ✅ KERNEL MANIFESTO: Rule 4 - Cleanup AbortController on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimeout(timeoutId);
    };
  }, [canLoadData, userId, profileCompanyId, statusFilter, location.pathname, isStale, navigate]);

  const loadData = async (abortSignal) => {
    // ✅ KERNEL MANIFESTO: Rule 2 - Logic Gate - Guard with canLoadData (checked in useEffect)
    if (!profileCompanyId) {
      console.log('[ReturnsDashboard] No company_id - cannot load returns');
      return;
    }

    try {
      setIsLoading(true);
      setError(null); // ✅ KERNEL MANIFESTO: Rule 4 - Clear previous errors

      // ✅ KERNEL MANIFESTO: Rule 4 - Check abort signal before queries
      if (abortSignal?.aborted) return;

      // ✅ KERNEL COMPLIANCE: Use profileCompanyId and capabilities from kernel
      // ✅ KERNEL MANIFESTO: Rule 6 - Use profileCompanyId for all queries
      // Try to load returns - table may not exist yet
      try {
        const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
        const returnsList = await getReturns(profileCompanyId, capabilities, filters);

        // ✅ KERNEL MANIFESTO: Rule 4 - Check abort signal after queries
        if (abortSignal?.aborted) return;

        setReturns(returnsList);
        
        // ✅ FINAL SYNC: Mark fresh ONLY on successful load
        lastLoadTimeRef.current = Date.now();
        markFresh();
      } catch (dataError) {
        if (abortSignal?.aborted) return; // Ignore abort errors
        console.log('Returns table not yet set up:', dataError.message);
        // Set empty data - feature not yet available
        setReturns([]);
        setError(null); // Don't show error for missing table
      }
    } catch (err) {
      // ✅ KERNEL MANIFESTO: Rule 4 - Handle abort errors properly
      if (err.name === 'AbortError' || abortSignal?.aborted) return;
      console.error('[ReturnsDashboard] Error loading returns:', err);
      setError(err.message || 'Failed to load returns'); // ✅ KERNEL MANIFESTO: Rule 4 - Error state
      toast.error('Failed to load returns');
    } finally {
      // ✅ KERNEL MANIFESTO: Rule 5 - The Finally Law - always clean up
      if (!abortSignal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateStatus = async (returnId, status) => {
    try {
      await updateReturnStatus(returnId, status);
      toast.success(`Return ${status} successfully`);
      // Trigger reload via useEffect dependency change
      lastLoadTimeRef.current = null;
    } catch (error) {
      console.error('Error updating return:', error);
      toast.error('Failed to update return status');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'requested': 'outline',
      'approved': 'default',
      'rejected': 'destructive',
      'received': 'default',
      'refunded': 'success',
      'closed': 'outline'
    };
    return variants[status] || 'outline';
  };

  const getStatusIcon = (status) => {
    if (status === 'refunded' || status === 'closed') return <CheckCircle className="w-4 h-4" />;
    if (status === 'rejected') return <XCircle className="w-4 h-4" />;
    if (status === 'requested' || status === 'approved') return <Clock className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

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

  const totalRefunded = returns
    .filter(r => r.status === 'refunded')
    .reduce((sum, r) => sum + (Number(r.refund_amount) || 0), 0);

  return (
    <div className="os-page os-stagger space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-semibold text-[var(--os-text-primary)] mb-2">Returns</h1>
          <p className="text-[var(--os-text-secondary)]">Manage product returns and refunds</p>
        </div>
        {/* ✅ FINAL SYNC: Refresh button for manual cache clearing */}
        <Button
          variant="outline"
          onClick={() => {
            refresh();
            loadData();
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </motion.div>

        {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Surface className="p-4">
          <p className="text-sm text-[var(--os-text-secondary)] mb-1">Total Returns</p>
          <p className="text-2xl font-semibold text-[var(--os-text-primary)]">{returns.length}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-sm text-[var(--os-text-secondary)] mb-1">Pending</p>
          <p className="text-2xl font-semibold">
            {returns.filter(r => r.status === 'requested' || r.status === 'approved').length}
          </p>
        </Surface>
        <Surface className="p-4">
          <p className="text-sm text-[var(--os-text-secondary)] mb-1">Refunded</p>
          <p className="text-2xl font-semibold">
            {returns.filter(r => r.status === 'refunded').length}
          </p>
        </Surface>
        <Surface className="p-4">
          <p className="text-sm text-[var(--os-text-secondary)] mb-1">Refunded Value</p>
          <p className="text-xl font-semibold">
            {totalRefunded.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </Surface>
      </div>

        {/* Filters */}
      <Surface className="p-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="requested">Requested</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </Surface>

        {/* Returns List */}
      <Surface className="p-5">
        <h2 className="text-lg font-semibold text-[var(--os-text-primary)] mb-4">Return Requests</h2>
        {returns.length === 0 ? (
          <EmptyState
            icon={RotateCcw}
            title="No returns yet"
            description={userRole === 'buyer' 
              ? "Your return requests will appear here"
              : "Return requests from buyers will appear here"}
          />
        ) : (
          <div className="space-y-3">
            {returns.map((returnItem) => (
              <motion.div
                key={returnItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-5 h-5" />
                          <p className="font-semibold">
                            {returnItem.products?.name || returnItem.products?.title || 'Product'}
                          </p>
                          <Badge variant={getStatusBadge(returnItem.status)}>
                            {getStatusIcon(returnItem.status)}
                            <span className="ml-1 capitalize">{returnItem.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm">
                          Order: #{returnItem.orders?.order_number || returnItem.order_id?.slice(0, 8)}
                        </p>
                        <p className="text-sm">
                          Requested: {format(new Date(returnItem.requested_at), 'MMM dd, yyyy')}
                        </p>
                        {returnItem.reason && (
                          <p className="text-sm mt-2">
                            Reason: {returnItem.reason}
                          </p>
                        )}
                      </div>
                      {returnItem.refund_amount && (
                        <div className="text-right">
                          <p className="text-sm">Refund Amount</p>
                          <p className="text-xl font-bold">
                            {returnItem.currency} {parseFloat(returnItem.refund_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Link to={`/dashboard/returns/${returnItem.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      {userRole === 'seller' && returnItem.status === 'requested' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-red-50"
                            onClick={() => handleUpdateStatus(returnItem.id, 'rejected')}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="hover:bg-afrikoni-gold/90"
                            onClick={() => handleUpdateStatus(returnItem.id, 'approved')}
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
              </motion.div>
            ))}
          </div>
        )}
      </Surface>
    </div>
  );
}

export default function ReturnsDashboard() {
  return (
    <>
      {/* PHASE 5B: Returns requires buy or sell capability */}
      <RequireCapability canBuy={true} canSell={true}>
        <ReturnsDashboardInner />
      </RequireCapability>
    </>
  );
}
