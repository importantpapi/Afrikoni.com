/**
 * Returns Dashboard
 * Manage returns for buyers and sellers
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RotateCcw, Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';
import { getReturns, updateReturnStatus } from '@/lib/supabaseQueries/returns';
import { format } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/skeletons';
import RequireDashboardRole from '@/guards/RequireDashboardRole';

function ReturnsDashboardInner() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyId, setCompanyId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[ReturnsDashboard] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect to login
    if (!user) {
      console.log('[ReturnsDashboard] No user → redirecting to login');
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadData();
  }, [authReady, authLoading, user, profile, role, statusFilter, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Use auth from context (no duplicate call)
      const userCompanyId = profile?.company_id || null;
      
      if (!user || !userCompanyId) {
        navigate('/login');
        return;
      }

      setCompanyId(userCompanyId);

      // Try to load returns - table may not exist yet
      try {
        const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
        const returnsList = await getReturns(userCompanyId, role, filters);
        setReturns(returnsList);
      } catch (dataError) {
        console.log('Returns table not yet set up:', dataError.message);
        // Set empty data - feature not yet available
        setReturns([]);
      }
    } catch (error) {
      console.error('Error loading returns:', error);
      navigate('/dashboard');
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

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading returns..." />;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <CardSkeleton count={3} />
      </DashboardLayout>
    );
  }

  const totalRefunded = returns
    .filter(r => r.status === 'refunded')
    .reduce((sum, r) => sum + (Number(r.refund_amount) || 0), 0);

  return (
    <DashboardLayout currentRole={userRole === 'seller' ? 'seller' : 'buyer'}>
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
                            {returnItem.products?.title || 'Product'}
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
    </DashboardLayout>
  );
}

export default function ReturnsDashboard() {
  return (
    <RequireDashboardRole allow={['buyer', 'seller', 'hybrid']}>
      <ReturnsDashboardInner />
    </RequireDashboardRole>
  );
}

