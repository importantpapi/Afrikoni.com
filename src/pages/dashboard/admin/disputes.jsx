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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionAction, setResolutionAction] = useState('');
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

  const handleResolveDispute = (dispute) => {
    setSelectedDispute(dispute);
    setResolutionNotes('');
    setResolutionAction('');
  };

  const handleSubmitResolution = async () => {
    if (!selectedDispute || !resolutionAction || !resolutionNotes.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { user } = await getCurrentUserAndRole(supabase);
      
      const { error } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          resolution: resolutionNotes,
          admin_notes: resolutionNotes,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDispute.id);

      if (error) throw error;

      // Send notification to both parties
      try {
        const { createNotification } = await import('@/services/notificationService');
        
        // Notify buyer
        if (selectedDispute.buyer_company_id) {
          await createNotification({
            company_id: selectedDispute.buyer_company_id,
            title: `Dispute Resolved - Order #${selectedDispute.orders?.order_number || selectedDispute.order_id?.slice(0, 8)}`,
            message: `Your dispute has been resolved: ${resolutionNotes.substring(0, 100)}...`,
            type: 'dispute',
            link: `/dashboard/disputes`,
            sendEmail: true
          });
        }

        // Notify seller
        if (selectedDispute.seller_company_id) {
          await createNotification({
            company_id: selectedDispute.seller_company_id,
            title: `Dispute Resolved - Order #${selectedDispute.orders?.order_number || selectedDispute.order_id?.slice(0, 8)}`,
            message: `A dispute on your order has been resolved: ${resolutionNotes.substring(0, 100)}...`,
            type: 'dispute',
            link: `/dashboard/disputes`,
            sendEmail: true
          });
        }
      } catch (notifError) {
        console.error('Failed to send notifications:', notifError);
      }

      toast.success('Dispute resolved successfully');
      setSelectedDispute(null);
      setResolutionNotes('');
      setResolutionAction('');
      await loadData();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error('Failed to resolve dispute');
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
                      <Button 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleResolveDispute(dispute)}
                      >
                        Resolve Dispute
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolve Dispute Dialog */}
        {selectedDispute && (
          <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-afrikoni-chestnut">
                  Resolve Dispute #{selectedDispute.id.slice(0, 8).toUpperCase()}
                </DialogTitle>
                <DialogClose onClose={() => setSelectedDispute(null)} />
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Dispute Info */}
                <Card className="border-afrikoni-gold/20 bg-afrikoni-offwhite">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-afrikoni-deep/70">Order</p>
                        <p className="font-semibold text-afrikoni-chestnut">
                          #{selectedDispute.orders?.order_number || selectedDispute.order_id?.slice(0, 8)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-afrikoni-deep/70">Reason</p>
                        <p className="font-semibold text-afrikoni-chestnut">{selectedDispute.reason}</p>
                      </div>
                      <div>
                        <p className="text-sm text-afrikoni-deep/70">Description</p>
                        <p className="text-afrikoni-deep">{selectedDispute.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resolution Action */}
                <div>
                  <Label htmlFor="resolutionAction" className="font-semibold text-afrikoni-chestnut mb-2 block">
                    Resolution Action <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={resolutionAction}
                    onValueChange={setResolutionAction}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select resolution action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refund_full">Full Refund to Buyer</SelectItem>
                      <SelectItem value="refund_partial">Partial Refund to Buyer</SelectItem>
                      <SelectItem value="reship">Reship Product</SelectItem>
                      <SelectItem value="favor_buyer">Favor Buyer - Issue Resolved</SelectItem>
                      <SelectItem value="favor_seller">Favor Seller - No Action Needed</SelectItem>
                      <SelectItem value="compromise">Compromise Solution</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Resolution Notes */}
                <div>
                  <Label htmlFor="resolutionNotes" className="font-semibold text-afrikoni-chestnut mb-2 block">
                    Resolution Notes <span className="text-red-600">*</span>
                  </Label>
                  <Textarea
                    id="resolutionNotes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Explain the resolution decision. This will be shared with both parties..."
                    rows={6}
                  />
                  <p className="text-xs text-afrikoni-deep/60 mt-1">
                    These notes will be visible to both the buyer and seller.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmitResolution}
                    disabled={!resolutionAction || !resolutionNotes.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Resolve Dispute
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedDispute(null);
                      setResolutionNotes('');
                      setResolutionAction('');
                    }}
                    variant="outline"
                    className="border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-sand/20"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}

