import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { motion } from 'framer-motion';
import {
  Receipt, FileText, DollarSign, Clock, CheckCircle, XCircle,
  Download, Plus, Search, Filter, ArrowRight,
  Shield, AlertCircle, Layers, Lock
} from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { toast } from 'sonner';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { markInvoiceAsPaid } from '@/lib/supabaseQueries/invoices';
import { format } from 'date-fns';
import EmptyState from '@/components/shared/ui/EmptyState';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useInvoices } from '@/hooks/queries/useInvoices';

export default function InvoicesDashboard() {
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();

  const {
    data: invoices = [],
    isLoading,
    error,
    refetch
  } = useInvoices(statusFilter !== 'all' ? { status: statusFilter } : {});

  const isSeller = capabilities.can_sell === true && capabilities.sell_status === 'approved';
  const userRole = isSeller ? 'seller' : 'buyer';

  // ✅ DATA SYNC: Allow rendering if system is ready OR primed
  if (!isSystemReady && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Synchronizing Ledger..." ready={isSystemReady} />
      </div>
    );
  }

  // Effect for auth guard only
  useEffect(() => {
    if (isSystemReady && !canLoadData && !userId) {
      navigate('/login');
    }
  }, [isSystemReady, canLoadData, userId, navigate]);

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

      toast.success('Invoice payment initialized');
      refetch(); // Trigger refresh
    } catch (error) {
      toast.error('Failed to pay invoice');
    }
  };

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
      case 'issued': return 'bg-os-accent/10 border-os-accent/20 text-os-accent';
      case 'overdue': return 'bg-os-red/10 border-os-red/20 text-os-red';
      case 'cancelled': return 'bg-white/5 border-white/10 text-os-muted';
      default: return 'bg-white/5 border-white/10 text-os-muted';
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'paid') return <CheckCircle className="w-4 h-4" />;
    if (status === 'overdue') return <XCircle className="w-4 h-4" />;
    if (status === 'issued') return <Clock className="w-4 h-4 animate-pulse" />;
    return <FileText className="w-4 h-4" />;
  };

  const isOverdue = (invoice) => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    if (!invoice.due_date) return false;
    return new Date(invoice.due_date) < new Date();
  };

  if (error) return <ErrorState message={error.message || "Ledger sync error"} onRetry={() => refetch()} />;
  if (isLoading) return <CardSkeleton count={3} />;

  const stats = [
    { label: 'Total Volume', value: invoices.length, icon: Layers, color: 'text-os-muted' },
    { label: 'Settled', value: invoices.filter(i => i.status === 'paid').length, icon: CheckCircle, color: 'text-emerald-500' },
    { label: 'Outstanding', value: invoices.filter(i => i.status === 'issued').length, icon: Clock, color: 'text-os-accent' },
    { label: 'Risk Factor', value: invoices.filter(i => isOverdue(i)).length, icon: AlertCircle, color: 'text-os-red' }
  ];

  return (
    <div className="os-page os-stagger space-y-8 max-w-7xl mx-auto pb-20 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-os-accent/10 rounded-os-sm border border-os-accent/30">
              <Receipt className="w-6 h-6 text-os-accent" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Fiscal Clearing</h1>
          </div>
          <p className="text-os-muted text-os-lg max-w-xl">Manage cross-border invoicing, institutional settlements, and automated tax reconciliation.</p>
        </div>

        <div className="flex items-center gap-4">
          {userRole === 'seller' && (
            <Link to="/dashboard/orders">
              <Button className="bg-os-accent text-black font-black px-6 rounded-os-sm hover:scale-105 transition-all gap-2">
                <Plus className="w-4 h-4" />
                Generate Invoice
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Layer */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Surface key={i} variant="panel" className="p-6 group hover:border-os-accent/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              {null}
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black">{stat.value}</div>
              <div className="text-os-xs font-bold uppercase tracking-widest text-os-muted">{stat.label}</div>
            </div>
          </Surface>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Surface variant="panel" className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
              <h2 className="text-os-2xl font-black tracking-tight flex items-center gap-3">
                Ledger Journal
                <Badge variant="outline" className="text-os-xs font-black border-white/10 text-os-muted">
                  {invoices.length} Entries
                </Badge>
              </h2>

              <div className="flex items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 h-10 bg-white/[0.03] border-white/10 rounded-os-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 backdrop-blur-xl border-white/10">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Drafts</SelectItem>
                    <SelectItem value="issued">Outstanding</SelectItem>
                    <SelectItem value="paid">Settled</SelectItem>
                    <SelectItem value="overdue">High Alert</SelectItem>
                    <SelectItem value="cancelled">Voided</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-10 w-10 border border-white/10 rounded-os-sm">
                  <Filter className="w-4 h-4 text-os-muted" />
                </Button>
              </div>
            </div>

            {invoices.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Ledger Empty"
                description={userRole === 'buyer'
                  ? "Incoming trade invoices will materialize here."
                  : "Initialize a trade to generate your first fiscal entry."}
                className="py-12"
              />
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <Surface key={invoice.id} variant="panel" className="p-6 border-white/5 hover:border-os-accent/30 transition-all group/card">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="p-3 bg-white/5 rounded-os-md border border-white/10 group-hover/card:bg-os-accent/10 transition-colors">
                            <FileText className="w-6 h-6 text-os-muted group-hover/card:text-os-accent" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-os-lg">{invoice.invoice_number}</h3>
                              <Badge className={cn("text-os-xs font-black uppercase tracking-widest py-1 px-2.5", getStatusBadgeStyles(invoice.status))}>
                                <span className="flex items-center gap-1.5">
                                  {getStatusIcon(invoice.status)}
                                  {invoice.status}
                                </span>
                              </Badge>
                              {isOverdue(invoice) && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                            </div>
                            <p className="text-os-xs text-os-muted font-medium">
                              {userRole === 'buyer' ? 'Issuer: ' : 'Counterparty: '}
                              <span className="text-white font-bold">{userRole === 'buyer' ? invoice.seller_company?.name : invoice.buyer_company?.name || 'Institutional Member'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-os-2xl font-black flex items-baseline gap-1.5 justify-end">
                            <span className="text-os-xs text-os-muted font-bold">{invoice.currency}</span>
                            {parseFloat(invoice.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-os-xs text-os-muted font-bold uppercase tracking-widest mt-1">
                            Due {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-5 border-t border-white/5">
                        <div className="flex items-center gap-6">
                          <Link to={`/dashboard/invoices/${invoice.id}`} className="text-os-xs font-black uppercase tracking-[0.2em] text-os-muted hover:text-os-accent transition-colors flex items-center gap-2">
                            Audit Trail <ArrowRight className="w-3 h-3" />
                          </Link>
                          <button className="text-os-xs font-black uppercase tracking-[0.2em] text-os-muted hover:text-white transition-colors flex items-center gap-2">
                            PDF Manifest <Download className="w-3 h-3" />
                          </button>
                        </div>

                        {userRole === 'buyer' && invoice.status === 'issued' && (
                          <Button
                            size="sm"
                            className="bg-emerald-500 text-black font-black px-8 rounded-os-sm hover:scale-105 active:scale-95 transition-all text-os-xs shadow-os-md shadow-emerald-500/20"
                            onClick={() => handlePayInvoice(invoice.id, invoice)}
                          >
                            Initialize Settlement
                          </Button>
                        )}
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            )}
          </Surface>
        </div>

        <div className="space-y-8">
          {/* Fiscal Identity */}
          <Surface variant="panel" className="p-8 relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 p-12 opacity-[0.02] scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
              <Shield className="w-32 h-32" />
            </div>

            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <h3 className="text-os-xs font-black uppercase tracking-widest">Fiscal Clarity</h3>
              <Lock className="w-3.5 h-3.5 text-os-muted" />
            </div>

            <div className="space-y-6 relative z-10">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-os-md">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-os-xs font-bold">Tax Compliance Check</span>
                </div>
                <p className="text-os-xs text-os-muted">Your institutional profile is currently in good standing with all regional trade authorities.</p>
              </div>
            </div>
          </Surface>

          {/* Inbound/Outbound Mix */}
          <Surface variant="panel" className="p-8">
            <h3 className="text-os-xs font-black uppercase tracking-widest mb-6">Settlement Velocity</h3>
            {invoices.length > 0 ? (() => {
              const paid = invoices.filter(inv => inv.status === 'paid');
              const unpaid = invoices.filter(inv => inv.status !== 'paid');
              const total = invoices.length;
              const paidPct = Math.round((paid.length / total) * 100);
              const unpaidPct = 100 - paidPct;
              return (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-os-xs font-bold uppercase tracking-widest">
                      <span className="text-os-muted">Settled</span>
                      <span className="text-emerald-500">{paidPct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${paidPct}%` }} className="h-full bg-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-os-xs font-bold uppercase tracking-widest">
                      <span className="text-os-muted">Outstanding</span>
                      <span className="text-os-accent">{unpaidPct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${unpaidPct}%` }} className="h-full bg-os-accent" />
                    </div>
                  </div>
                </div>
              );
            })() : (
              <p className="text-os-xs text-os-muted">Settlement data will appear once you have invoices.</p>
            )}
          </Surface>
        </div>
      </div>
    </div>
  );
}
