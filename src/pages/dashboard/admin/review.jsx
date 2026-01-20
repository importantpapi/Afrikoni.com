/**
 * Afrikoni Shield™ - Admin Approvals Center
 * Approve / reject suppliers, products, RFQs, and disputes
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Building2,
  Package,
  FileText,
  CheckCircle2,
  XCircle,
  Scale,
} from 'lucide-react';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
// NOTE: Admin check done at route level - removed isAdmin import
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import AccessDenied from '@/components/AccessDenied';
import { toast } from 'sonner';

export default function AdminReview() {
  // ✅ KERNEL COMPLIANCE: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady, isAdmin, user, profile } = useDashboardKernel();
  const [loading, setLoading] = useState(false); // Local loading state
  const [error, setError] = useState(null);
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [openRfqs, setOpenRfqs] = useState([]);
  const [openDisputes, setOpenDisputes] = useState([]);

  useEffect(() => {
    // ✅ KERNEL COMPLIANCE: Use isSystemReady instead of authReady/authLoading
    if (!isSystemReady) {
      console.log('[AdminReview] Waiting for system to be ready...');
      return;
    }

    // ✅ KERNEL COMPLIANCE: Use userId from kernel
    if (!userId) {
      setLoading(false);
      return;
    }

    // ✅ KERNEL COMPLIANCE: Use isAdmin from kernel
    setLoading(false);
    
    if (isAdmin) {
      Promise.all([
        loadSuppliers(),
        loadProducts(),
        loadRFQs(),
        loadDisputes(),
      ]);
    }
  }, [isSystemReady, userId, isAdmin]);

  const loadSuppliers = async () => {
    if (!canLoadData) {
      return;
    }
    
    try {
      setError(null);
      // ✅ Load all unverified/pending suppliers (sellers) awaiting admin approval
      // These suppliers will NOT appear on the verified suppliers page until approved
      // ✅ KERNEL COMPLIANCE: Query by capability instead of role field
      // First get company IDs with can_sell capability
      const { data: sellerCompanies, error: capError } = await supabase
        .from('company_capabilities')
        .select('company_id')
        .eq('can_sell', true);
      
      if (capError) throw capError;
      
      const sellerCompanyIds = sellerCompanies?.map(c => c.company_id) || [];
      
      if (sellerCompanyIds.length === 0) {
        setPendingSuppliers([]);
        return;
      }
      
      // Then query companies with those IDs
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .in('id', sellerCompanyIds)
        .in('verification_status', ['pending', 'unverified'])
        .order('created_at', { ascending: false })
        .limit(100); // Increased limit to show more pending suppliers
      if (!error) {
        setPendingSuppliers(data || []);
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setError(error?.message || 'Failed to load suppliers');
    }
  };

  const loadProducts = async () => {
    if (!canLoadData) {
      return;
    }
    
    try {
      setError(null);
      const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('status', ['pending_review'])
      .order('created_at', { ascending: false })
      .limit(50);
      if (!error) {
        setPendingProducts(data || []);
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error?.message || 'Failed to load products');
    }
  };

  const loadRFQs = async () => {
    if (!canLoadData) {
      return;
    }
    
    try {
      setError(null);
      const { data, error } = await supabase
        .from('rfqs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error) {
        setOpenRfqs(data || []);
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error loading RFQs:', error);
      setError(error?.message || 'Failed to load RFQs');
    }
  };

  const loadDisputes = async () => {
    if (!canLoadData) {
      return;
    }
    
    try {
      setError(null);
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .in('status', ['open', 'under_review'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error) {
        setOpenDisputes(data || []);
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error loading disputes:', error);
      setError(error?.message || 'Failed to load disputes');
    }
  };

  const handleApproveSupplier = async (id) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ verification_status: 'verified', verified: true })
        .eq('id', id);
      if (error) throw error;
      toast.success('Supplier verified');
      setPendingSuppliers((prev) => prev.filter((c) => c.id !== id));
      
      // Send notification to supplier
      try {
        const { notifyVerificationStatusChange } = await import('@/services/notificationService');
        await notifyVerificationStatusChange(id, 'approved');
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    } catch {
      toast.error('Failed to verify supplier');
    }
  };

  const handleRejectSupplier = async (id) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ verification_status: 'rejected' })
        .eq('id', id);
      if (error) throw error;
      toast.success('Supplier rejected');
      setPendingSuppliers((prev) => prev.filter((c) => c.id !== id));
      
      // Send notification to supplier
      try {
        const { notifyVerificationStatusChange } = await import('@/services/notificationService');
        await notifyVerificationStatusChange(id, 'rejected', 'Your verification request was rejected. Please review your documents and resubmit.');
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    } catch {
      toast.error('Failed to reject supplier');
    }
  };

  const handleApproveProduct = async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'active', published_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast.success('Product approved & published');
      setPendingProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error('Failed to approve product');
    }
  };

  const handleRejectProduct = async (id) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'rejected' })
        .eq('id', id);
      if (error) throw error;
      toast.success('Product rejected');
      setPendingProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error('Failed to reject product');
    }
  };

  const handleCloseRFQ = async (id) => {
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
      toast.success('RFQ closed');
      setOpenRfqs((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error('Failed to update RFQ');
    }
  };

  const handleAdvanceDispute = async (id, action) => {
    try {
      const newStatus = action === 'approve' ? 'under_review' : 'closed';
      const { error } = await supabase
        .from('disputes')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success(
        action === 'approve' ? 'Dispute moved to review' : 'Dispute closed'
      );
      setOpenDisputes((prev) => prev.filter((d) => d.id !== id));
    } catch {
      toast.error('Failed to update dispute');
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-afrikoni-text-dark/70">Loading...</div>
        </div>
      </>
    );
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => {
          setError(null);
          Promise.all([
            loadSuppliers(),
            loadProducts(),
            loadRFQs(),
            loadDisputes(),
          ]);
        }}
      />
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            to="/dashboard/risk"
            className="inline-flex items-center gap-2 text-afrikoni-gold hover:text-afrikoni-gold/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Panel
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-afrikoni-gold" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-1 leading-tight">
                Approvals Center
              </h1>
              <p className="text-afrikoni-text-dark/70 text-sm md:text-base">
                Review and approve suppliers, products, RFQs and disputes across Afrikoni OS.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Suppliers */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardHeader className="flex flex-row items-center justify-between border-b border-afrikoni-gold/10">
            <div>
              <CardTitle className="text-base font-semibold">
                Supplier Verification ({pendingSuppliers.length})
              </CardTitle>
              <p className="text-xs text-afrikoni-text-dark/70">
                New supplier accounts awaiting verification status.
              </p>
            </div>
            <Building2 className="w-5 h-5 text-afrikoni-gold" />
          </CardHeader>
          <CardContent className="p-0">
            {pendingSuppliers.length === 0 ? (
              <div className="py-6 text-center text-sm text-afrikoni-text-dark/60">
                No suppliers pending review.
              </div>
            ) : (
              <div className="divide-y divide-afrikoni-gold/10">
                {pendingSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-semibold text-afrikoni-text-dark">
                        {supplier.company_name}
                      </div>
                      <div className="text-xs text-afrikoni-text-dark/70">
                        {supplier.country} • {supplier.business_type || 'Supplier'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleRejectSupplier(supplier.id)}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal text-xs"
                        onClick={() => handleApproveSupplier(supplier.id)}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
          <CardHeader className="flex flex-row items-center justify-between border-b border-afrikoni-gold/10">
            <div>
              <CardTitle className="text-base font-semibold">
                Product Approvals ({pendingProducts.length})
              </CardTitle>
              <p className="text-xs text-afrikoni-text-dark/70">
                Draft products that need review before going live.
              </p>
            </div>
            <Package className="w-5 h-5 text-afrikoni-gold" />
          </CardHeader>
          <CardContent className="p-0">
            {pendingProducts.length === 0 ? (
              <div className="py-6 text-center text-sm text-afrikoni-text-dark/60">
                No products pending approval.
              </div>
            ) : (
              <div className="divide-y divide-afrikoni-gold/10">
                {pendingProducts.map((product) => (
                  <div
                    key={product.id}
                    className="px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-semibold text-afrikoni-text-dark">
                        {product.name || product.title}
                      </div>
                      <div className="text-xs text-afrikoni-text-dark/70">
                        Status: {product.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleRejectProduct(product.id)}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal text-xs"
                        onClick={() => handleApproveProduct(product.id)}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RFQs & Disputes */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardHeader className="flex flex-row items-center justify-between border-b border-afrikoni-gold/10">
              <div>
                <CardTitle className="text-base font-semibold">
                  Open RFQs ({openRfqs.length})
                </CardTitle>
                <p className="text-xs text-afrikoni-text-dark/70">
                  Monitor high-value or sensitive RFQs and close if needed.
                </p>
              </div>
              <FileText className="w-5 h-5 text-afrikoni-gold" />
            </CardHeader>
            <CardContent className="p-0">
              {openRfqs.length === 0 ? (
                <div className="py-6 text-center text-sm text-afrikoni-text-dark/60">
                  No RFQs requiring action.
                </div>
              ) : (
                <div className="divide-y divide-afrikoni-gold/10">
                  {openRfqs.map((rfq) => (
                    <div
                      key={rfq.id}
                      className="px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-semibold text-afrikoni-text-dark">
                          {rfq.title}
                        </div>
                        <div className="text-xs text-afrikoni-text-dark/70">
                          Status: {rfq.status}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleCloseRFQ(rfq.id)}
                      >
                        Close RFQ
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardHeader className="flex flex-row items-center justify-between border-b border-afrikoni-gold/10">
              <div>
                <CardTitle className="text-base font-semibold">
                  Disputes ({openDisputes.length})
                </CardTitle>
                <p className="text-xs text-afrikoni-text-dark/70">
                  Open disputes awaiting admin decision.
                </p>
              </div>
              <Scale className="w-5 h-5 text-afrikoni-gold" />
            </CardHeader>
            <CardContent className="p-0">
              {openDisputes.length === 0 ? (
                <div className="py-6 text-center text-sm text-afrikoni-text-dark/60">
                  No disputes awaiting review.
                </div>
              ) : (
                <div className="divide-y divide-afrikoni-gold/10">
                  {openDisputes.map((dispute) => (
                    <div
                      key={dispute.id}
                      className="px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-semibold text-afrikoni-text-dark">
                          {dispute.reason}
                        </div>
                        <div className="text-xs text-afrikoni-text-dark/70">
                          Status: {dispute.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleAdvanceDispute(dispute.id, 'reject')}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Close
                        </Button>
                        <Button
                          size="sm"
                          className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal text-xs"
                          onClick={() => handleAdvanceDispute(dispute.id, 'approve')}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Move to Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}


