/**
 * Returns Dashboard
 * Manage returns for buyers and sellers
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RotateCcw, Package, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
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

  // ✅ KERNEL MIGRATION: Use canLoadData guard
  // ✅ FINAL SYNC: Check data freshness before loading
  useEffect(() => {
    if (!canLoadData) {
      if (!userId) {
        console.log('[ReturnsDashboard] No user → redirecting to login');
        navigate('/login');
      }
      return;
    }

    // ✅ FINAL SYNC: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale || 
                         !lastLoadTimeRef.current || 
                         (Date.now() - lastLoadTimeRef.current > 30000);
    
    if (shouldRefresh) {
      console.log('[ReturnsDashboard] Data is stale or first load - refreshing');
      loadData();
    } else {
      console.log('[ReturnsDashboard] Data is fresh - skipping reload');
    }
  }, [canLoadData, userId, profileCompanyId, statusFilter, location.pathname, isStale, navigate]);

  const loadData = async () => {
    if (!profileCompanyId) {
      console.log('[ReturnsDashboard] No company_id - cannot load returns');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // ✅ KERNEL COMPLIANCE: Use profileCompanyId and capabilities from kernel
      // Try to load returns - table may not exist yet
      try {
        const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
        const returnsList = await getReturns(profileCompanyId, capabilities, filters);
        setReturns(returnsList);
      } catch (dataError) {
        console.log('Returns table not yet set up:', dataError.message);
        // Set empty data - feature not yet available
        setReturns([]);
        setError(null); // Don't show error for missing table
      }
      
      // ✅ FINAL SYNC: Mark fresh ONLY on successful load
      lastLoadTimeRef.current = Date.now();
      markFresh();
    } catch (err) {
      console.error('[ReturnsDashboard] Error loading returns:', err);
      setError(err.message || 'Failed to load returns');
      toast.error('Failed to load returns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (returnId, status) => {
    try {
      await updateReturnStatus(returnId, status);
      toast.success(`Return ${status} successfully`);
      loadData();
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

  // ✅ KERNEL MIGRATION: Use unified loading state
  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={loadData}
      />
    );
  }

  const totalRefunded = returns
    .filter(r => r.status === 'refunded')
    .reduce((sum, r) => sum + (Number(r.refund_amount) || 0), 0);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">Returns</h1>
            <p className="text-afrikoni-text-dark/70">Manage product returns and refunds</p>
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
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Total Returns</p>
              <p className="text-2xl font-bold">{returns.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-600">
                {returns.filter(r => r.status === 'requested' || r.status === 'approved').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Refunded</p>
              <p className="text-2xl font-bold text-green-600">
                {returns.filter(r => r.status === 'refunded').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Refunded Value</p>
              <p className="text-xl font-bold text-afrikoni-gold">
                {totalRefunded.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        {/* Returns List */}
        <Card>
          <CardHeader>
            <CardTitle>Return Requests</CardTitle>
          </CardHeader>
          <CardContent>
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
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Package className="w-5 h-5 text-afrikoni-gold" />
                          <p className="font-semibold">
                            {returnItem.products?.name || returnItem.products?.title || 'Product'}
                          </p>
                          <Badge variant={getStatusBadge(returnItem.status)}>
                            {getStatusIcon(returnItem.status)}
                            <span className="ml-1 capitalize">{returnItem.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-afrikoni-text-dark/60">
                          Order: #{returnItem.orders?.order_number || returnItem.order_id?.slice(0, 8)}
                        </p>
                        <p className="text-sm text-afrikoni-text-dark/60">
                          Requested: {format(new Date(returnItem.requested_at), 'MMM dd, yyyy')}
                        </p>
                        {returnItem.reason && (
                          <p className="text-sm text-afrikoni-text-dark/70 mt-2">
                            Reason: {returnItem.reason}
                          </p>
                        )}
                      </div>
                      {returnItem.refund_amount && (
                        <div className="text-right">
                          <p className="text-sm text-afrikoni-text-dark/70">Refund Amount</p>
                          <p className="text-xl font-bold text-afrikoni-gold">
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
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleUpdateStatus(returnItem.id, 'rejected')}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-afrikoni-gold hover:bg-afrikoni-gold/90"
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
          </CardContent>
        </Card>
      </div>
    </>
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

