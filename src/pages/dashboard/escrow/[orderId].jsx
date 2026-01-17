/**
 * Escrow Detail Page
 * View escrow payment details and timeline
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, DollarSign, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { 
  getEscrowPayment, 
  getEscrowEvents,
  updateEscrowStatus,
  createEscrowEvent
} from '@/lib/supabaseQueries/payments';
import { format } from 'date-fns';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import { isAdmin } from '@/utils/permissions';
import { assertRowOwnedByCompany } from '@/utils/securityAssertions';

export default function EscrowDetailPage() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [escrow, setEscrow] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[EscrowDetailPage] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect to login
    if (!user) {
      console.log('[EscrowDetailPage] No user → redirecting to login');
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadEscrow();
  }, [orderId, authReady, authLoading, user, profile, role, navigate]);

  const loadEscrow = async () => {
    try {
      setIsLoading(true);
      
      // Use auth from context (no duplicate call)
      setIsUserAdmin(isAdmin(user));
      const companyId = profile?.company_id || null;

      const escrowData = await getEscrowPayment(orderId);
      // SAFETY ASSERTION: Ensure escrow is related to the current company (if available)
      if (escrowData && companyId && !isUserAdmin) {
        await assertRowOwnedByCompany(escrowData, companyId, 'EscrowDetailPage:escrow');
      }

      setEscrow(escrowData);

      if (escrowData) {
        const eventsList = await getEscrowEvents(escrowData.id);
        setEvents(eventsList);
      }
    } catch (error) {
      console.error('Error loading escrow:', error);
      toast.error('Failed to load escrow details');
      navigate('/dashboard/payments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!confirm('Are you sure you want to release this escrow payment to the seller?')) return;
    
    try {
      await updateEscrowStatus(escrow.id, 'released');
      await createEscrowEvent({
        escrow_id: escrow.id,
        event_type: 'release',
        amount: escrow.amount,
        created_by: user.id
      });
      
      toast.success('Escrow released successfully');
      loadEscrow();
    } catch (error) {
      console.error('Error releasing escrow:', error);
      toast.error('Failed to release escrow');
    }
  };

  const handleRefundEscrow = async () => {
    if (!confirm('Are you sure you want to refund this escrow payment to the buyer?')) return;
    
    try {
      await updateEscrowStatus(escrow.id, 'refunded');
      await createEscrowEvent({
        escrow_id: escrow.id,
        event_type: 'refund',
        amount: escrow.amount,
        created_by: user.id
      });
      
      toast.success('Escrow refunded successfully');
      loadEscrow();
    } catch (error) {
      console.error('Error refunding escrow:', error);
      toast.error('Failed to refund escrow');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'held': 'outline',
      'partially_released': 'default',
      'released': 'success',
      'refunded': 'destructive',
      'cancelled': 'outline'
    };
    return variants[status] || 'outline';
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'release':
      case 'partial_release':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'refund':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'hold':
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  if (!escrow) {
    return (
      <div className="text-center py-12">
        <p className="text-afrikoni-text-dark/70">Escrow payment not found</p>
        <Link to="/dashboard/payments">
          <Button variant="outline" className="mt-4">
            Back to Payments
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
            <Link to="/dashboard/payments">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">
                Escrow Payment
              </h1>
              <p className="text-afrikoni-text-dark/70">
                Order #{escrow.orders?.order_number || orderId.slice(0, 8)}
              </p>
            </div>
          </div>
          {(isUserAdmin || escrow.status === 'held') && (
            <div className="flex gap-2">
              {escrow.status === 'held' && (
                <>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={handleRefundEscrow}
                  >
                    Refund to Buyer
                  </Button>
                  <Button
                    className="bg-afrikoni-gold hover:bg-afrikoni-gold/90"
                    onClick={handleReleaseEscrow}
                  >
                    Release to Seller
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Escrow Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Escrow Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-2">Escrow Amount</p>
                  <p className="text-3xl font-bold text-afrikoni-gold">
                    {escrow.currency} {parseFloat(escrow.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                
                {/* Commission & Net Payout (shown when released or about to release) */}
                {(escrow.status === 'released' || escrow.status === 'held') && (
                  <div className="border-t border-afrikoni-gold/20 pt-4 space-y-3">
                    {escrow.commission_amount > 0 && (
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-afrikoni-text-dark/70">Afrikoni Fee ({escrow.commission_rate || 8}%)</p>
                        <p className="text-sm font-semibold text-afrikoni-text-dark">
                          -{escrow.currency} {parseFloat(escrow.commission_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    {escrow.net_payout_amount && (
                      <div className="flex justify-between items-center pt-2 border-t border-afrikoni-gold/10">
                        <p className="text-sm font-semibold text-afrikoni-text-dark">Net Payout to Supplier</p>
                        <p className="text-lg font-bold text-afrikoni-green">
                          {escrow.currency} {parseFloat(escrow.net_payout_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    {escrow.status === 'held' && !escrow.commission_amount && (
                      <div className="bg-afrikoni-gold/5 border border-afrikoni-gold/20 rounded-lg p-3">
                        <p className="text-xs text-afrikoni-text-dark/70">
                          <strong>Note:</strong> An 8% Afrikoni commission will be deducted when escrow is released.
                        </p>
                        <p className="text-xs text-afrikoni-text-dark/70 mt-1">
                          Estimated fee: {escrow.currency} {((parseFloat(escrow.amount) * 0.08).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Companies */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-2">Buyer</p>
                  <p className="font-semibold">{escrow.buyer_company?.name || 'Buyer'}</p>
                </div>
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-2">Seller</p>
                  <p className="font-semibold">{escrow.seller_company?.name || 'Seller'}</p>
                </div>
              </div>

              {/* Order Info */}
              {escrow.orders && (
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-2">Related Order</p>
                  <Link to={`/dashboard/orders/${escrow.orders.id}`}>
                    <p className="text-afrikoni-gold hover:underline">
                      Order #{escrow.orders.order_number || escrow.orders.id.slice(0, 8)}
                    </p>
                  </Link>
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
                  variant={getStatusBadge(escrow.status)}
                  className="text-lg px-4 py-2"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  {escrow.status.charAt(0).toUpperCase() + escrow.status.slice(1).replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-afrikoni-text-dark/70 mb-1">Created</p>
                <p className="font-semibold">
                  {format(new Date(escrow.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
              {escrow.updated_at && (
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-1">Last Updated</p>
                  <p className="font-semibold">
                    {format(new Date(escrow.updated_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Events Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Event Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-afrikoni-text-dark/70 text-center py-8">No events yet</p>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div key={event.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      {getEventIcon(event.event_type)}
                      {index < events.length - 1 && (
                        <div className="w-0.5 h-12 bg-afrikoni-text-dark/20 mt-2" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold capitalize">
                          {event.event_type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-afrikoni-text-dark/60">
                          {format(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      {event.amount && (
                        <p className="text-sm text-afrikoni-text-dark/70">
                          Amount: {event.amount}
                        </p>
                      )}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                          {JSON.stringify(event.metadata)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

