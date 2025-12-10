/**
 * User Disputes Page
 * Users can view and manage their disputes
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, FileText, Upload, Clock, CheckCircle, XCircle, Plus, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getOrCreateCompany } from '@/utils/companyHelper';
import { format } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/skeletons';
import { logDisputeEvent } from '@/utils/auditLogger';

export default function UserDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [disputeForm, setDisputeForm] = useState({
    reason: '',
    description: '',
    evidence: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { user: userData, profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!userData) {
        navigate('/login');
        return;
      }

      setUser(profile || userData);
      const cid = await getOrCreateCompany(supabase, profile || userData);
      setCompanyId(cid);

      if (!cid) {
        console.warn('No company ID found, cannot load disputes');
        setDisputes([]);
        setOrders([]);
        return;
      }

      // Load user's disputes
      // Note: RLS policy covers raised_by_company_id and against_company_id
      // Also check buyer_company_id and seller_company_id for completeness
      const { data: disputesData, error: disputesError } = await supabase
        .from('disputes')
        .select(`
          *,
          orders (
            id,
            total_amount,
            currency,
            status
          ),
          seller_company:companies!disputes_seller_company_id_fkey (
            id,
            company_name
          ),
          buyer_company:companies!disputes_buyer_company_id_fkey (
            id,
            company_name
          )
        `)
        .or(`raised_by_company_id.eq.${cid},against_company_id.eq.${cid}${cid ? `,buyer_company_id.eq.${cid},seller_company_id.eq.${cid}` : ''}`)
        .order('created_at', { ascending: false });

      if (disputesError) {
        console.error('Error loading disputes:', disputesError);
        // Don't throw - allow page to load with empty disputes
        setDisputes([]);
      } else {
        setDisputes(disputesData || []);
      }

      // Load user's orders for creating new disputes
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .or(`buyer_company_id.eq.${cid},seller_company_id.eq.${cid}`)
        .in('status', ['pending', 'processing', 'shipped', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (ordersError) {
        console.error('Error loading orders:', ordersError);
        // Don't throw - allow page to load with empty orders
        setOrders([]);
      } else {
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error loading disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDispute = async () => {
    if (!disputeForm.reason || !disputeForm.description || !selectedOrder) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      const cid = await getOrCreateCompany(supabase, userData);

      // Determine buyer and seller company IDs
      const isBuyer = selectedOrder.buyer_company_id === cid;
      const buyerCompanyId = isBuyer ? cid : selectedOrder.buyer_company_id;
      const sellerCompanyId = isBuyer ? selectedOrder.seller_company_id : cid;

      // Create dispute
      const { data: newDispute, error } = await supabase
        .from('disputes')
        .insert({
          order_id: selectedOrder.id,
          buyer_company_id: buyerCompanyId,
          seller_company_id: sellerCompanyId,
          reason: disputeForm.reason,
          description: disputeForm.description,
          status: 'open',
          evidence: disputeForm.evidence.length > 0 ? disputeForm.evidence : null,
          created_by: userData.id
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to admin
      try {
        const { createNotification } = await import('@/services/notificationService');
        await createNotification({
          company_id: null, // Admin notification
          user_email: 'hello@afrikoni.com',
          title: `New Dispute - Order #${selectedOrder.order_number || selectedOrder.id.slice(0, 8)}`,
          message: `A new dispute has been opened: ${disputeForm.reason}`,
          type: 'dispute',
          link: `/dashboard/admin/disputes?dispute=${newDispute.id}`,
          sendEmail: true
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      // Log dispute creation to audit log
      await logDisputeEvent({
        action: 'created',
        dispute_id: newDispute.id,
        order_id: selectedOrder.id,
        user: userData,
        profile: user,
        company_id: cid,
        metadata: {
          reason: disputeForm.reason,
          has_evidence: disputeForm.evidence.length > 0
        }
      });

      toast.success('Dispute created successfully. Our team will review it within 48 hours.');
      setShowCreateDialog(false);
      setDisputeForm({ reason: '', description: '', evidence: [] });
      setSelectedOrder(null);
      await loadData();
    } catch (error) {
      console.error('Error creating dispute:', error);
      toast.error('Failed to create dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Open</Badge>;
      case 'under_review':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300">Under Review</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-2">
              Disputes
            </h1>
            <p className="text-afrikoni-deep/70">
              Manage order disputes and track resolution status
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal"
          >
            <Plus className="w-4 h-4 mr-2" />
            Open Dispute
          </Button>
        </div>

        {/* Disputes List */}
        {disputes.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <EmptyState
                icon={AlertTriangle}
                title="No disputes"
                description="You haven't opened any disputes yet. Click 'Open Dispute' to create one."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={`border-2 ${
                  dispute.status === 'open' ? 'border-red-200 bg-red-50/30' :
                  dispute.status === 'under_review' ? 'border-amber-200 bg-amber-50/30' :
                  'border-green-200 bg-green-50/30'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <h3 className="font-bold text-lg text-afrikoni-chestnut">
                            Dispute #{dispute.id.slice(0, 8).toUpperCase()}
                          </h3>
                          {getStatusBadge(dispute.status)}
                        </div>
                        <p className="text-sm text-afrikoni-deep/70 mb-2">
                          Order: #{dispute.order_id?.slice(0, 8) || 'N/A'}
                        </p>
                        <p className="text-sm font-semibold text-afrikoni-deep mb-1">
                          Reason: {dispute.reason}
                        </p>
                        {dispute.description && (
                          <p className="text-sm text-afrikoni-deep/80 mt-2">
                            {dispute.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-afrikoni-gold/20">
                      <div className="text-xs text-afrikoni-deep/60">
                        Created: {format(new Date(dispute.created_at), 'MMM d, yyyy')}
                        {dispute.resolved_at && (
                          <span className="ml-4">
                            Resolved: {format(new Date(dispute.resolved_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/dashboard/orders/${dispute.order_id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Order
                          </Button>
                        </Link>
                      </div>
                    </div>
                    {dispute.admin_notes && (
                      <div className="mt-4 p-3 bg-afrikoni-gold/10 rounded-lg border border-afrikoni-gold/20">
                        <p className="text-xs font-semibold text-afrikoni-chestnut mb-1">Admin Response:</p>
                        <p className="text-sm text-afrikoni-deep">{dispute.admin_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Dispute Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-afrikoni-chestnut">
                Open a Dispute
              </DialogTitle>
              <DialogClose onClose={() => setShowCreateDialog(false)} />
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Order Selection */}
              <div>
                <Label htmlFor="order" className="font-semibold text-afrikoni-chestnut mb-2 block">
                  Select Order <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={selectedOrder?.id || ''}
                  onValueChange={(value) => {
                    const order = orders.find(o => o.id === value);
                    setSelectedOrder(order);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        Order #{order.order_number || order.id.slice(0, 8)} - {order.currency} {parseFloat(order.total_amount || 0).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {orders.length === 0 && (
                  <p className="text-xs text-afrikoni-deep/60 mt-2">
                    No eligible orders found. You can only dispute orders that are pending, processing, shipped, or delivered.
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <Label htmlFor="reason" className="font-semibold text-afrikoni-chestnut mb-2 block">
                  Dispute Reason <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={disputeForm.reason}
                  onValueChange={(value) => setDisputeForm(prev => ({ ...prev, reason: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_not_as_described">Product Not as Described</SelectItem>
                    <SelectItem value="product_damaged">Product Damaged</SelectItem>
                    <SelectItem value="wrong_product">Wrong Product Received</SelectItem>
                    <SelectItem value="late_delivery">Late Delivery</SelectItem>
                    <SelectItem value="non_delivery">Non-Delivery</SelectItem>
                    <SelectItem value="payment_issue">Payment Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="font-semibold text-afrikoni-chestnut mb-2 block">
                  Detailed Description <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={disputeForm.description}
                  onChange={(e) => setDisputeForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the issue in detail. Include any relevant information that will help us resolve this dispute..."
                  rows={6}
                />
                <p className="text-xs text-afrikoni-deep/60 mt-1">
                  Be as detailed as possible. Include dates, order numbers, and any communication with the other party.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreateDispute}
                  disabled={isSubmitting || !disputeForm.reason || !disputeForm.description || !selectedOrder}
                  className="flex-1 bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateDialog(false);
                    setDisputeForm({ reason: '', description: '', evidence: [] });
                    setSelectedOrder(null);
                  }}
                  variant="outline"
                  className="border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-sand/20"
                >
                  Cancel
                </Button>
              </div>

              {/* Info */}
              <div className="p-3 bg-afrikoni-gold/10 rounded-lg border border-afrikoni-gold/20">
                <p className="text-xs text-afrikoni-deep/80">
                  <strong>Note:</strong> Our dispute resolution team will review your case within 48 hours. 
                  You'll receive email notifications about the status of your dispute. 
                  All disputes are handled fairly and transparently.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

