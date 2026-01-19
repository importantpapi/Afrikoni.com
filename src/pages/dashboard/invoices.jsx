/**
 * Invoices Dashboard
 * Manage invoices for buyers and sellers
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDataFreshness } from '@/hooks/useDataFreshness';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { motion } from 'framer-motion';
import { Receipt, FileText, DollarSign, Clock, CheckCircle, XCircle, Download, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { toast } from 'sonner';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { getInvoices, markInvoiceAsPaid } from '@/lib/supabaseQueries/invoices';
import { assertRowOwnedByCompany } from '@/utils/securityAssertions';
import { format } from 'date-fns';
import EmptyState from '@/components/shared/ui/EmptyState';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';

export default function InvoicesDashboard() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ ARCHITECTURAL FIX: Data freshness tracking (30 second threshold)
  const { isStale, markFresh } = useDataFreshness(30000);
  const lastLoadTimeRef = useRef(null);
  
  // Derive role from capabilities for display purposes
  const isSeller = capabilities.can_sell === true && capabilities.sell_status === 'approved';
  const userRole = isSeller ? 'seller' : 'buyer';
  
  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading invoices..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Use canLoadData guard
  useEffect(() => {
    if (!canLoadData) {
      if (!userId) {
        console.log('[InvoicesDashboard] No user → redirecting to login');
        navigate('/login');
      }
      return;
    }

    // ✅ ARCHITECTURAL FIX: Check if data is stale (older than 30 seconds)
    const shouldRefresh = isStale || 
                         !lastLoadTimeRef.current || 
                         (Date.now() - lastLoadTimeRef.current > 30000);
    
    if (shouldRefresh) {
      console.log('[InvoicesDashboard] Data is stale or first load - refreshing');
      loadData();
    } else {
      console.log('[InvoicesDashboard] Data is fresh - skipping reload');
    }
  }, [canLoadData, userId, profileCompanyId, statusFilter, location.pathname, isStale, navigate]);

  const loadData = async () => {
    if (!profileCompanyId) {
      console.log('[InvoicesDashboard] No company_id - cannot load invoices');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel
      // Try to load invoices - table may not exist yet
      try {
        const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
        const invoiceList = await getInvoices(profileCompanyId, userRole, filters);

        // SAFETY ASSERTION: ensure each invoice is scoped to the current company
        for (const invoice of invoiceList || []) {
          await assertRowOwnedByCompany(invoice, profileCompanyId, 'InvoicesDashboard:invoices');
        }

        setInvoices(invoiceList);
        
        // ✅ REACTIVE READINESS FIX: Mark data as fresh ONLY after successful response
        if (invoiceList && Array.isArray(invoiceList)) {
          lastLoadTimeRef.current = Date.now();
          markFresh();
        }
      } catch (dataError) {
        console.log('Invoices table not yet set up:', dataError.message);
        // Set empty data - feature not yet available
        setInvoices([]);
        setError(null); // Don't show error for missing table
        // ❌ DO NOT mark fresh on error - let it retry on next navigation
      }
    } catch (err) {
      console.error('[InvoicesDashboard] Error loading invoices:', err);
      setError(err.message || 'Failed to load invoices');
      toast.error('Failed to load invoices');
      // ❌ DO NOT mark fresh on error - let it retry on next navigation
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId, invoice) => {
    if (!profileCompanyId) {
      toast.error('Company ID not found');
      return;
    }

    try {
      await markInvoiceAsPaid(invoiceId, {
        company_id: profileCompanyId,
        amount: invoice.total_amount,
        currency: invoice.currency,
        invoice_number: invoice.invoice_number,
        metadata: { invoice_id: invoiceId }
      });
      
      toast.success('Invoice paid successfully');
      loadData();
    } catch (error) {
      console.error('Error paying invoice:', error);
      toast.error('Failed to pay invoice');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'draft': 'outline',
      'issued': 'default',
      'paid': 'success',
      'overdue': 'destructive',
      'cancelled': 'outline'
    };
    return variants[status] || 'outline';
  };

  const getStatusIcon = (status) => {
    if (status === 'paid') return <CheckCircle className="w-4 h-4" />;
    if (status === 'overdue') return <XCircle className="w-4 h-4" />;
    if (status === 'issued') return <Clock className="w-4 h-4" />;
    return null;
  };

  const isOverdue = (invoice) => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    if (!invoice.due_date) return false;
    return new Date(invoice.due_date) < new Date();
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
            <h1 className="text-3xl font-bold text-afrikoni-text-dark mb-2">Invoices</h1>
            <p className="text-afrikoni-text-dark/70">Manage your invoices and payments</p>
          </div>
          {userRole === 'seller' && (
            <Link to="/dashboard/orders">
              <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </Link>
          )}
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Total Invoices</p>
              <p className="text-2xl font-bold">{invoices.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {invoices.filter(i => i.status === 'paid').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-600">
                {invoices.filter(i => i.status === 'issued').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-afrikoni-text-dark/70 mb-1">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {invoices.filter(i => isOverdue(i)).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice List</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No invoices yet"
                description={userRole === 'buyer' 
                  ? "Invoices from your orders will appear here"
                  : "Create invoices from your confirmed orders"}
              />
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-lg">{invoice.invoice_number}</p>
                          <Badge variant={getStatusBadge(invoice.status)}>
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1 capitalize">{invoice.status}</span>
                          </Badge>
                          {isOverdue(invoice) && (
                            <Badge variant="destructive">Overdue</Badge>
                          )}
                        </div>
                        <p className="text-sm text-afrikoni-text-dark/60 mt-1">
                          {userRole === 'buyer' 
                            ? `From: ${invoice.seller_company?.name || 'Seller'}`
                            : `To: ${invoice.buyer_company?.name || 'Buyer'}`}
                        </p>
                        <p className="text-sm text-afrikoni-text-dark/60">
                          Issue Date: {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                          {invoice.due_date && (
                            <> • Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}</>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-afrikoni-gold">
                          {invoice.currency} {parseFloat(invoice.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {invoice.tax_amount > 0 && (
                          <p className="text-sm text-afrikoni-text-dark/60">
                            Tax: {invoice.currency} {parseFloat(invoice.tax_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Link to={`/dashboard/invoices/${invoice.id}`}>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <div className="flex gap-2">
                        {userRole === 'buyer' && invoice.status === 'issued' && (
                          <Button
                            size="sm"
                            className="bg-afrikoni-gold hover:bg-afrikoni-gold/90"
                            onClick={() => handlePayInvoice(invoice.id, invoice)}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Pay Invoice
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
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

