/**
 * Return Detail Page
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowLeft, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import { getReturn, updateReturnStatus } from '@/lib/supabaseQueries/returns';
import { format } from 'date-fns';

export default function ReturnDetailPage() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  
  const { id } = useParams();
  const navigate = useNavigate();
  const [returnItem, setReturnItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Derive role from capabilities
  const isSeller = capabilities.can_sell === true && capabilities.sell_status === 'approved';
  const userRole = isSeller ? 'seller' : 'buyer';

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading return details..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Use canLoadData guard
  useEffect(() => {
    if (!canLoadData) {
      if (!userId) {
        console.log('[ReturnDetailPage] No user → redirecting to login');
        navigate('/login');
      }
      return;
    }

    loadReturn();
  }, [id, canLoadData, userId, profileCompanyId, navigate]);

  const loadReturn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // ✅ KERNEL MIGRATION: Use kernel values
      const returnData = await getReturn(id);
      setReturnItem(returnData);
    } catch (err) {
      console.error('[ReturnDetailPage] Error loading return:', err);
      setError(err.message || 'Failed to load return');
      toast.error('Failed to load return');
      navigate('/dashboard/returns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await updateReturnStatus(id, status);
      toast.success(`Return ${status} successfully`);
      loadReturn();
    } catch (error) {
      console.error('Error updating return:', error);
      toast.error('Failed to update return status');
    }
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
        onRetry={loadReturn}
      />
    );
  }

  if (!returnItem) {
    return (
      <div className="text-center py-12">
        <p className="text-afrikoni-text-dark/70">Return not found</p>
        <Link to="/dashboard/returns">
          <Button variant="outline" className="mt-4">
            Back to Returns
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard/returns">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">
                Return Request
              </h1>
              <p className="text-afrikoni-text-dark/70">
                {format(new Date(returnItem.requested_at), 'MMMM dd, yyyy')}
              </p>
            </div>
          </div>
          {userRole === 'seller' && returnItem.status === 'requested' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => handleUpdateStatus('rejected')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                className="bg-afrikoni-gold hover:bg-afrikoni-gold/90"
                onClick={() => handleUpdateStatus('approved')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </div>

        {/* Return Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Return Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Info */}
              <div>
                <p className="text-sm text-afrikoni-text-dark/70 mb-2">Product</p>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-afrikoni-gold" />
                  <div>
                    <p className="font-semibold">
                      {returnItem.products?.title || 'Product'}
                    </p>
                    {returnItem.products?.sku && (
                      <p className="text-sm text-afrikoni-text-dark/60">
                        SKU: {returnItem.products.sku}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Info */}
              {returnItem.orders && (
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-2">Related Order</p>
                  <Link to={`/dashboard/orders/${returnItem.orders.id}`}>
                    <p className="text-afrikoni-gold hover:underline">
                      Order #{returnItem.orders.order_number || returnItem.orders.id.slice(0, 8)}
                    </p>
                  </Link>
                </div>
              )}

              {/* Reason */}
              <div>
                <p className="text-sm text-afrikoni-text-dark/70 mb-2">Return Reason</p>
                <p className="font-semibold">{returnItem.reason}</p>
              </div>

              {/* Notes */}
              {returnItem.notes && (
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-2">Notes</p>
                  <p className="text-afrikoni-text-dark/80">{returnItem.notes}</p>
                </div>
              )}

              {/* Refund Info */}
              {returnItem.refund_amount && (
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <p className="text-lg font-bold">Refund Amount</p>
                    <p className="text-2xl font-bold text-afrikoni-gold">
                      {returnItem.currency} {parseFloat(returnItem.refund_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge 
                  variant={returnItem.status === 'refunded' ? 'success' : returnItem.status === 'rejected' ? 'destructive' : 'default'}
                  className="text-lg px-4 py-2"
                >
                  {returnItem.status === 'refunded' && <CheckCircle className="w-5 h-5 mr-2" />}
                  {returnItem.status === 'rejected' && <XCircle className="w-5 h-5 mr-2" />}
                  {returnItem.status === 'requested' && <Clock className="w-5 h-5 mr-2" />}
                  {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-afrikoni-text-dark/70 mb-1">Requested</p>
                <p className="font-semibold">
                  {format(new Date(returnItem.requested_at), 'MMM dd, yyyy')}
                </p>
              </div>
              {returnItem.resolved_at && (
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-1">Resolved</p>
                  <p className="font-semibold">
                    {format(new Date(returnItem.resolved_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

