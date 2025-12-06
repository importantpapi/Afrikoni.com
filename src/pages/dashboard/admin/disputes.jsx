/**
 * Disputes & Escrow Management Dashboard
 * Admin page for managing disputes and escrow payments
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { supabase } from '@/api/supabaseClient';
import { 
  getEscrowPaymentsByCompany,
  updateEscrowStatus,
  createEscrowEvent
} from '@/lib/supabaseQueries/payments';
import { format } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/skeletons';
import { isAdmin } from '@/utils/permissions';

export default function AdminDisputes() {
  const [escrowPayments, setEscrowPayments] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { user } = await getCurrentUserAndRole(supabase);
      
      if (!user || !isAdmin(user)) {
        navigate('/dashboard');
        return;
      }

      // Load all escrow payments
      const { data: allEscrows } = await supabase
        .from('escrow_payments')
        .select(`
          *,
          orders(*),
          buyer_company:companies!escrow_payments_buyer_company_id_fkey(*),
          seller_company:companies!escrow_payments_seller_company_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (allEscrows) {
        const filtered = statusFilter !== 'all' 
          ? allEscrows.filter(e => e.status === statusFilter)
          : allEscrows;
        setEscrowPayments(filtered);
      }

      // Load disputes
      const { data: disputesData } = await supabase
        .from('disputes')
        .select(`
          *,
          orders(*),
          buyer_company:companies!disputes_buyer_company_id_fkey(*),
          seller_company:companies!disputes_seller_company_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (disputesData) {
        setDisputes(disputesData);
      }
    } catch (error) {
      console.error('Error loading disputes data:', error);
      toast.error('Failed to load disputes data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscrowAction = async (escrowId, action, amount = null) => {
    try {
      const { user } = await getCurrentUserAndRole(supabase);
      
      if (action === 'release') {
        await updateEscrowStatus(escrowId, 'released', amount);
        await createEscrowEvent({
          escrow_id: escrowId,
          event_type: 'release',
          amount: amount,
          created_by: user.id,
          metadata: { admin_action: true }
        });
        toast.success('Escrow released to seller');
      } else if (action === 'refund') {
        await updateEscrowStatus(escrowId, 'refunded', amount);
        await createEscrowEvent({
          escrow_id: escrowId,
          event_type: 'refund',
          amount: amount,
          created_by: user.id,
          metadata: { admin_action: true }
        });
        toast.success('Escrow refunded to buyer');
      }
      
      loadData();
    } catch (error) {
      console.error('Error processing escrow:', error);
      toast.error('Failed to process escrow');
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <CardSkeleton count={3} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">Disputes & Escrow</h1>
          <p className="text-afrikoni-text-dark/70">Manage disputes and escrow payments</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Held Escrow</p>
              <p className="text-2xl font-bold text-amber-600">
                {escrowPayments.filter(e => e.status === 'held').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Active Disputes</p>
              <p className="text-2xl font-bold text-red-600">
                {disputes.filter(d => d.status === 'open').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Released</p>
              <p className="text-2xl font-bold text-green-600">
                {escrowPayments.filter(e => e.status === 'released').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Refunded</p>
              <p className="text-2xl font-bold text-purple-600">
                {escrowPayments.filter(e => e.status === 'refunded').length}
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
                <SelectItem value="held">Held</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Escrow Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Escrow Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {escrowPayments.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No escrow payments"
                description="Escrow payments will appear here"
              />
            ) : (
              <div className="space-y-3">
                {escrowPayments.map((escrow) => (
                  <motion.div
                    key={escrow.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <DollarSign className="w-5 h-5 text-afrikoni-gold" />
                          <p className="font-semibold">
                            Order #{escrow.orders?.order_number || escrow.order_id?.slice(0, 8)}
                          </p>
                          <Badge variant={getStatusBadge(escrow.status)}>
                            {escrow.status.charAt(0).toUpperCase() + escrow.status.slice(1).replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-afrikoni-text-dark/60">
                          Buyer: {escrow.buyer_company?.name || 'Buyer'} • Seller: {escrow.seller_company?.name || 'Seller'}
                        </p>
                        <p className="text-xs text-afrikoni-text-dark/50 mt-1">
                          Created: {format(new Date(escrow.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-afrikoni-gold">
                          {escrow.currency} {parseFloat(escrow.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Link to={`/dashboard/escrow/${escrow.order_id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      {escrow.status === 'held' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleEscrowAction(escrow.id, 'refund', escrow.amount)}
                          >
                            Refund to Buyer
                          </Button>
                          <Button
                            size="sm"
                            className="bg-afrikoni-gold hover:bg-afrikoni-gold/90"
                            onClick={() => handleEscrowAction(escrow.id, 'release', escrow.amount)}
                          >
                            Release to Seller
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

        {/* Disputes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Active Disputes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {disputes.filter(d => d.status === 'open').length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="No active disputes"
                description="Open disputes will appear here"
              />
            ) : (
              <div className="space-y-3">
                {disputes.filter(d => d.status === 'open').map((dispute) => (
                  <motion.div
                    key={dispute.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 border-red-200 bg-red-50/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <p className="font-semibold">Dispute #{dispute.id.slice(0, 8)}</p>
                          <Badge variant="destructive">Open</Badge>
                        </div>
                        <p className="text-sm text-afrikoni-text-dark/60">
                          Order: #{dispute.orders?.order_number || dispute.order_id?.slice(0, 8)}
                        </p>
                        {dispute.description && (
                          <p className="text-sm text-afrikoni-text-dark/70 mt-2">
                            {dispute.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Link to={`/dashboard/orders/${dispute.order_id}`}>
                        <Button variant="outline" size="sm">
                          View Order
                        </Button>
                      </Link>
                      <Link to={`/disputes/${dispute.id}`}>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          Resolve Dispute
                        </Button>
                      </Link>
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

