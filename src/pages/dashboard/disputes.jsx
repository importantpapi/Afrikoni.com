import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { SignalChip } from '@/components/system/SignalChip';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Label } from '@/components/shared/ui/label';
import EmptyState from '@/components/shared/ui/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shared/ui/dialog';
import { FileText, CheckCircle2, AlertCircle, Plus, ShieldAlert } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { toast } from 'sonner';
import HighRiskFallbackCard from '@/components/shared/HighRiskFallbackCard';

const statusTone = {
  in_review: 'pending',
  resolved: 'verified',
  escalated: 'rejected',
};

const DISPUTE_REASONS = [
  'Goods not delivered',
  'Goods damaged on arrival',
  'Wrong goods delivered',
  'Quality does not match description',
  'Partial delivery only',
  'Supplier not responding',
  'Payment not released after delivery',
  'Other',
];

function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

export default function Disputes() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // File dispute modal state
  const [showModal, setShowModal] = useState(false);
  const [filing, setFiling] = useState(false);
  const [searchParams] = useSearchParams();

  // ✅ CRM LINKING: detailed dispute flow
  // If trade_id is passed in URL, open modal immediately
  useEffect(() => {
    const tradeIdParam = searchParams.get('trade_id');
    if (tradeIdParam) {
      setForm(prev => ({ ...prev, trade_id: tradeIdParam }));
      setShowModal(true);
    }
  }, [searchParams]);

  const [form, setForm] = useState({ trade_id: '', reason: '', description: '' });
  const [formError, setFormError] = useState(null);

  const loadDisputes = async () => {
    if (!isSystemReady || !canLoadData || !profileCompanyId) return;
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .or(
          `buyer_company_id.eq.${profileCompanyId},seller_company_id.eq.${profileCompanyId},` +
          `raised_by_company_id.eq.${profileCompanyId},against_company_id.eq.${profileCompanyId}`
        )
        .order('opened_at', { ascending: false });
      if (error) throw error;
      setDisputes(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load disputes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (active) loadDisputes();
    return () => { active = false; };
  }, [profileCompanyId, canLoadData, isSystemReady]);

  const handleFileDispute = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!form.trade_id.trim()) { setFormError('Trade ID is required.'); return; }
    if (!form.reason) { setFormError('Please select a reason.'); return; }
    if (!form.description.trim() || form.description.trim().length < 20) {
      setFormError('Please provide a description of at least 20 characters.'); return;
    }

    setFiling(true);
    try {
      // Verify the trade belongs to this company
      const { data: trade, error: tradeErr } = await supabase
        .from('trades')
        .select('id, buyer_company_id, seller_company_id, total_value, currency')
        .eq('id', form.trade_id.trim())
        .or(`buyer_company_id.eq.${profileCompanyId},seller_company_id.eq.${profileCompanyId}`)
        .single();

      if (tradeErr || !trade) {
        setFormError('Trade not found or you are not a party to this trade.');
        setFiling(false);
        return;
      }

      const { error: insertErr } = await supabase.from('disputes').insert({
        trade_id: trade.id,
        buyer_company_id: trade.buyer_company_id,
        seller_company_id: trade.seller_company_id,
        raised_by_company_id: profileCompanyId,
        against_company_id: trade.buyer_company_id === profileCompanyId
          ? trade.seller_company_id
          : trade.buyer_company_id,
        reason: form.reason,
        summary: form.description,
        description: `${form.reason}: ${form.description}`,
        amount: trade.total_value,
        currency: trade.currency || 'USD',
        status: 'in_review',
        opened_at: new Date().toISOString(),
      });

      if (insertErr) throw insertErr;

      toast.success('Dispute filed successfully. Our team will review within 48 hours.');
      setShowModal(false);
      setForm({ trade_id: '', reason: '', description: '' });
      await loadDisputes();
    } catch (err) {
      setFormError(err?.message || 'Failed to file dispute. Please try again.');
    } finally {
      setFiling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="os-page os-stagger space-y-4">
        <Surface className="p-6">Loading disputes…</Surface>
      </div>
    );
  }

  if (error) {
    return (
      <div className="os-page os-stagger space-y-4">
        <Surface className="p-6 flex items-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-os-sm">Could not load disputes. Please refresh the page or contact support.</p>
        </Surface>
      </div>
    );
  }

  return (
    <div className="os-page os-stagger space-y-6">
      <Surface variant="glass" className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="os-label">Disputes</div>
            <h1 className="text-os-2xl font-semibold text-foreground">Resolution Center</h1>
            <p className="text-os-sm text-os-muted mt-1">
              Track dispute status, evidence, and outcomes across your trades.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SignalChip label="Open" value={disputes.filter(d => d.status !== 'resolved').length} tone="amber" />
            <SignalChip label="Resolved" value={disputes.filter(d => d.status === 'resolved').length} tone="emerald" />
            {/* ✅ FORENSIC FIX: Added "File a Dispute" button — previously missing */}
            <Button
              onClick={() => setShowModal(true)}
              className="bg-os-accent text-os-bg font-bold gap-2"
            >
              <Plus className="w-4 h-4" /> File a Dispute
            </Button>
            <Link to="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </Surface>

      {disputes.length === 0 ? (
        <Surface variant="panel" className="p-6">
          <EmptyState
            icon={CheckCircle2}
            title="No disputes"
            description="Great news — there are no active disputes on your account."
          />
        </Surface>
      ) : (
        <div className="grid gap-4">
          {disputes.map((d) => (
            <Surface key={d.id} variant="panel" className="p-5 border border-border/60">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge label={d.status.replace('_', ' ').toUpperCase()} tone={statusTone[d.status] || 'neutral'} />
                    <span className="text-os-xs text-os-muted">Opened {formatDate(d.opened_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-os-sm text-os-muted">
                    <FileText className="w-4 h-4" /> Trade: {d.trade_id?.substring(0, 8)}…
                  </div>
                  <p className="text-os-sm font-medium text-foreground">{d.reason}</p>
                  <p className="text-os-sm text-os-muted">{d.summary}</p>
                </div>
                <div className="text-right min-w-[120px]">
                  <p className="text-os-xs text-os-muted">Amount</p>
                  <p className="text-os-lg font-semibold text-foreground">
                    {d.currency || '$'}{d.amount?.toLocaleString()}
                  </p>
                  {d.status === 'in_review' && (
                    <p className="text-os-xs text-amber-500 mt-2 font-medium">Under Review</p>
                  )}
                  {d.status === 'resolved' && (
                    <p className="text-os-xs text-emerald-500 mt-2 font-medium">Resolved</p>
                  )}
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}

      <HighRiskFallbackCard
        title="Dispute escalation needs human support?"
        description="If a dispute blocks payment or delivery, contact support and include dispute ID, trade ID, and evidence files."
      />

      {/* ✅ FORENSIC FIX: File Dispute Modal — previously did not exist */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">File a Dispute</DialogTitle>
            <DialogDescription className="text-center">
              Our arbitration team reviews all disputes within 48 hours. Provide as much detail as possible.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFileDispute} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="trade_id">Trade ID *</Label>
              <Input
                id="trade_id"
                value={form.trade_id}
                onChange={(e) => setForm({ ...form, trade_id: e.target.value })}
                placeholder="Paste the Trade ID from your trade workspace"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="reason">Reason *</Label>
              <select
                id="reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a reason…</option>
                {DISPUTE_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the issue in detail. Include dates, amounts, and any evidence you have."
                className="mt-1 min-h-[120px]"
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded">{formError}</p>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={filing} className="bg-destructive hover:bg-destructive/90 text-white font-bold">
                {filing ? 'Filing…' : 'Submit Dispute'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
