import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { SignalChip } from '@/components/system/SignalChip';
import { Button } from '@/components/shared/ui/button';
import EmptyState from '@/components/shared/ui/EmptyState';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

const statusTone = {
  in_review: 'pending',
  resolved: 'verified',
  escalated: 'rejected',
};

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

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!isSystemReady || !canLoadData || !profileCompanyId) return;
      try {
        const { data, error } = await supabase
          .from('disputes')
          .select('*')
          .or(`buyer_company_id.eq.${profileCompanyId},seller_company_id.eq.${profileCompanyId}`);
        if (!active) return;
        if (error) throw error;
        setDisputes(data || []);
      } catch (err) {
        if (active) setError(err?.message || 'Failed to load disputes');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [profileCompanyId, canLoadData, isSystemReady]);

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
                    <FileText className="w-4 h-4" /> {d.id} · Order {d.order}
                  </div>
                  <p className="text-os-sm text-foreground">{d.summary}</p>
                </div>
                <div className="text-right min-w-[120px]">
                  <p className="text-os-xs text-os-muted">Amount</p>
                  <p className="text-os-lg font-semibold text-foreground">${d.amount?.toLocaleString()}</p>
                  <p className="text-os-xs text-os-muted mt-3">Contact support to manage this dispute.</p>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
