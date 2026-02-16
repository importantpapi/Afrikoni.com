import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { SignalChip } from '@/components/system/SignalChip';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import EmptyState from '@/components/shared/ui/EmptyState';
import { MessageSquare, FileText, DollarSign, MapPin, Calendar, RefreshCw } from 'lucide-react';

/**
 * Rebuilt RFQ detail view with kernel-safe data access.
 * Keeps Afrikoni brand colors; focuses on structure and stability.
 */
export default function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profileCompanyId, userId, canLoadData, isSystemReady, capabilities } = useDashboardKernel();

  const [rfq, setRfq] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isBuyer = capabilities?.can_buy === true;
  const isSeller = capabilities?.can_sell === true && capabilities?.sell_status === 'approved';

  useEffect(() => {
    if (!isSystemReady || !canLoadData || !id) return;
    if (!profileCompanyId || !userId) {
      navigate('/login');
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isSystemReady, canLoadData, profileCompanyId, userId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select('*, categories(*)')
        .eq('id', id)
        .single();

      if (rfqError) throw rfqError;
      setRfq(rfqData);

      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('rfq_id', id);

      if (quoteError) {
        console.warn('[RFQDetail] quotes fetch warning:', quoteError);
      } else {
        setQuotes(quoteData || []);
      }
    } catch (err) {
      console.error('[RFQDetail] load error', err);
      setError(err.message || 'Failed to load RFQ');
    } finally {
      setIsLoading(false);
    }
  };

  const chips = useMemo(() => {
    if (!rfq) return [];
    return [
      { label: 'Status', value: rfq.status?.toUpperCase() || 'OPEN', tone: 'amber' },
      { label: 'Qty', value: rfq.quantity ? rfq.quantity.toLocaleString() : '—', tone: 'neutral' },
      { label: 'Unit', value: rfq.unit || '—', tone: 'neutral' },
      { label: 'Target', value: rfq.target_price ? `$${rfq.target_price}` : 'N/A', tone: 'gold' },
    ];
  }, [rfq]);

  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Loading RFQ..." ready={isSystemReady} />;
  }

  if (isLoading) {
    return <SpinnerWithTimeout message="Loading RFQ..." ready={!isLoading} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  if (!rfq) {
    return <EmptyState title="RFQ not found" description="The requested RFQ could not be located." />;
  }

  return (
    <div className="os-page os-stagger space-y-6">
      <Surface variant="glass" className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="os-label">RFQ Detail</div>
            <h1 className="text-os-2xl font-semibold text-foreground">{rfq.title}</h1>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label={rfq.status?.toUpperCase() || 'OPEN'} tone="neutral" />
              {rfq.categories?.name && <Badge variant="outline">{rfq.categories.name}</Badge>}
              {rfq.expires_at && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Closes {format(new Date(rfq.expires_at), 'MMM d, yyyy')}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={loadData}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            {isBuyer && (
              <Link to="/dashboard/rfqs">
                <Button variant="outline">Back to RFQs</Button>
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {chips.map((chip) => (
            <SignalChip key={chip.label} label={chip.label} value={chip.value} tone={chip.tone} />
          ))}
        </div>
      </Surface>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <Surface variant="panel" className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-os-sm text-os-muted">
            <FileText className="w-4 h-4" />
            RFQ Details
          </div>
          <p className="text-os-sm leading-6 whitespace-pre-line">{rfq.description}</p>

          <div className="grid sm:grid-cols-2 gap-3 text-os-sm">
            <InfoRow label="Quantity" value={rfq.quantity ? rfq.quantity.toLocaleString() : '—'} />
            <InfoRow label="Unit" value={rfq.unit || '—'} />
            <InfoRow label="Target Price" value={rfq.target_price ? `$${rfq.target_price}` : 'N/A'} />
            <InfoRow label="Delivery Location" value={rfq.delivery_location || '—'} icon={MapPin} />
            <InfoRow
              label="Created"
              value={rfq.created_at ? format(new Date(rfq.created_at), 'MMM d, yyyy') : '—'}
              icon={Calendar}
            />
            <InfoRow
              label="Closes"
              value={rfq.expires_at ? format(new Date(rfq.expires_at), 'MMM d, yyyy') : '—'}
              icon={Calendar}
            />
          </div>
        </Surface>

        <Surface variant="panel" className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-os-sm text-os-muted">
            <DollarSign className="w-4 h-4" />
            Quotes
          </div>
          {quotes.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No quotes yet"
              description="Suppliers will appear here once they respond."
            />
          ) : (
            <div className="space-y-3">
              {quotes.map((quote) => (
                <Surface key={quote.id} variant="soft" className="p-4 border border-border/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">${quote.total_price?.toLocaleString() || '—'}</p>
                      <p className="text-os-xs text-os-muted">Unit: {quote.price_per_unit || '—'} | Lead: {quote.lead_time || '—'}</p>
                    </div>
                    {quote.currency && <Badge variant="outline">{quote.currency}</Badge>}
                  </div>
                  {quote.notes && <p className="text-os-sm text-os-muted mt-2">{quote.notes}</p>}
                </Surface>
              ))}
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-2">
      {Icon ? <Icon className="w-4 h-4 text-os-muted" /> : null}
      <span className="text-[var(--os-text-secondary)] text-os-xs uppercase tracking-wide">{label}</span>
      <span className="text-os-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
