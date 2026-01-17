/**
 * Invoice Detail Page
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Receipt, ArrowLeft, Download, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { getInvoice, markInvoiceAsPaid } from '@/lib/supabaseQueries/invoices';
import { format } from 'date-fns';
import { CardSkeleton } from '@/components/shared/ui/skeletons';

export default function InvoiceDetailPage() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [companyId, setCompanyId] = useState(null);

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[InvoiceDetailPage] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect to login
    if (!user) {
      console.log('[InvoiceDetailPage] No user → redirecting to login');
      navigate('/login');
      return;
    }

    // Now safe to load data
    loadInvoice();
  }, [id, authReady, authLoading, user, profile, role, navigate]);

  const loadInvoice = async () => {
    try {
      setIsLoading(true);
      
      // Use auth from context (no duplicate call)
      const userCompanyId = profile?.company_id || null;
      
      if (!user || !userCompanyId) {
        navigate('/login');
        return;
      }

      setCompanyId(userCompanyId);

      const invoiceData = await getInvoice(id);
      setInvoice(invoiceData);
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast.error('Failed to load invoice');
      navigate('/dashboard/invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayInvoice = async () => {
    try {
      await markInvoiceAsPaid(id, {
        company_id: companyId,
        amount: invoice.total_amount,
        currency: invoice.currency,
        invoice_number: invoice.invoice_number,
        metadata: { invoice_id: id }
      });
      
      toast.success('Invoice paid successfully');
      loadInvoice();
    } catch (error) {
      console.error('Error paying invoice:', error);
      toast.error('Failed to pay invoice');
    }
  };

  // Wait for auth to be ready
  if (!authReady || authLoading) {
    return <SpinnerWithTimeout message="Loading invoice..." />;
  }

  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-afrikoni-text-dark/70">Invoice not found</p>
        <Link to="/dashboard/invoices">
          <Button variant="outline" className="mt-4">
            Back to Invoices
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
            <Link to="/dashboard/invoices">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">
                Invoice {invoice.invoice_number}
              </h1>
              <p className="text-afrikoni-text-dark/70">
                {format(new Date(invoice.issue_date), 'MMMM dd, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {userRole === 'buyer' && invoice.status === 'issued' && (
              <Button
                className="bg-afrikoni-gold hover:bg-afrikoni-gold/90"
                onClick={handlePayInvoice}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Pay Invoice
              </Button>
            )}
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-2">From</p>
                  <p className="font-semibold">{invoice.seller_company?.name || 'Seller'}</p>
                  {invoice.seller_company?.address && (
                    <p className="text-sm text-afrikoni-text-dark/60 mt-1">
                      {invoice.seller_company.address}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-2">To</p>
                  <p className="font-semibold">{invoice.buyer_company?.name || 'Buyer'}</p>
                  {invoice.buyer_company?.address && (
                    <p className="text-sm text-afrikoni-text-dark/60 mt-1">
                      {invoice.buyer_company.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Info */}
              {invoice.orders && (
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-2">Related Order</p>
                  <Link to={`/dashboard/orders/${invoice.orders.id}`}>
                    <p className="text-afrikoni-gold hover:underline">
                      Order #{invoice.orders.order_number || invoice.orders.id.slice(0, 8)}
                    </p>
                  </Link>
                </div>
              )}

              {/* Amount Breakdown */}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <p className="text-afrikoni-text-dark/70">Subtotal</p>
                  <p className="font-semibold">
                    {invoice.currency} {parseFloat(invoice.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between mb-2">
                    <p className="text-afrikoni-text-dark/70">Tax</p>
                    <p className="font-semibold">
                      {invoice.currency} {parseFloat(invoice.tax_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t mt-2">
                  <p className="text-lg font-bold">Total</p>
                  <p className="text-2xl font-bold text-afrikoni-gold">
                    {invoice.currency} {parseFloat(invoice.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
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
                  variant={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'destructive' : 'default'}
                  className="text-lg px-4 py-2"
                >
                  {invoice.status === 'paid' && <CheckCircle className="w-5 h-5 mr-2" />}
                  {invoice.status === 'issued' && <Clock className="w-5 h-5 mr-2" />}
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-afrikoni-text-dark/70 mb-1">Issue Date</p>
                <p className="font-semibold">
                  {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                </p>
              </div>
              {invoice.due_date && (
                <div>
                  <p className="text-sm text-afrikoni-text-dark/70 mb-1">Due Date</p>
                  <p className="font-semibold">
                    {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
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

