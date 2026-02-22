import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Surface } from '@/components/system/Surface';
import { supabase } from '@/api/supabaseClient';
import HighRiskFallbackCard from '@/components/shared/HighRiskFallbackCard';

function normalizeStatus(rawStatus) {
  const status = String(rawStatus || '').toLowerCase();
  if (['successful', 'success', 'paid', 'completed'].includes(status)) return 'successful';
  if (['failed', 'cancelled', 'canceled', 'error'].includes(status)) return 'failed';
  return 'pending';
}

export default function PaymentCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(normalizeStatus(searchParams.get('status')));
  const [isResolving, setIsResolving] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const txRef = searchParams.get('tx_ref') || '';
  const provider = (searchParams.get('provider') || 'flutterwave').toLowerCase();

  const lang = useMemo(() => {
    const firstSegment = location.pathname.split('/').filter(Boolean)[0];
    return ['en', 'fr', 'pt', 'ar'].includes(firstSegment) ? firstSegment : 'en';
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;

    const resolvePaymentStatus = async () => {
      if (!txRef) return;
      setIsResolving(true);

      try {
        const { data, error } = await supabase
          .from('billing_history')
          .select('status')
          .eq('provider_reference', txRef)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cancelled && !error && data?.status) {
          setStatus(normalizeStatus(data.status));
        }

        const { data: receiptData } = await supabase
          .from('trust_receipts')
          .select('receipt_code, issued_at, milestone_type')
          .contains('metadata', { tx_ref: txRef })
          .order('issued_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cancelled && receiptData) {
          setReceipt(receiptData);
        }
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    };

    resolvePaymentStatus();
    return () => {
      cancelled = true;
    };
  }, [txRef]);

  useEffect(() => {
    if (status !== 'successful') return;
    const timer = window.setTimeout(() => {
      navigate(`/${lang}/dashboard/payments`, { replace: true });
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [status, navigate, lang]);

  const statusUI = {
    successful: {
      title: 'Payment Confirmed',
      description: 'Your payment was received and is being reconciled in Afrikoni rails.',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />
    },
    failed: {
      title: 'Payment Failed',
      description: 'The payment did not complete. Please retry or use another method.',
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />
    },
    pending: {
      title: 'Payment Processing',
      description: 'We are waiting for provider confirmation. This can take a few moments.',
      icon: <Clock3 className="w-6 h-6 text-amber-500" />
    }
  }[status];

  return (
    <div className="os-page max-w-2xl mx-auto py-12">
      <Surface className="p-8 space-y-5">
        <div className="flex items-center gap-3">
          {statusUI.icon}
          <h1 className="text-os-2xl font-semibold text-[var(--os-text-primary)]">{statusUI.title}</h1>
        </div>

        <p className="text-os-muted">{statusUI.description}</p>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-os-md border border-os-stroke p-3">
            <div className="text-os-muted mb-1">Provider</div>
            <div className="font-medium uppercase">{provider}</div>
          </div>
          <div className="rounded-os-md border border-os-stroke p-3">
            <div className="text-os-muted mb-1">Reference</div>
            <div className="font-mono text-xs break-all">{txRef || 'N/A'}</div>
          </div>
        </div>

        {receipt?.receipt_code && (
          <div className="rounded-os-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
            <div className="text-emerald-700 font-medium">Trust receipt issued</div>
            <div className="font-mono text-xs mt-1 break-all">{receipt.receipt_code}</div>
          </div>
        )}

        {isResolving && (
          <div className="text-sm text-os-muted">Verifying latest status...</div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={() => navigate(`/${lang}/dashboard/payments`)}>
            Open Wallet
          </Button>
          <Button variant="outline" onClick={() => navigate(`/${lang}/dashboard/orders`)}>
            Open Orders
          </Button>
        </div>

        <HighRiskFallbackCard
          title="Need help with this payment?"
          description="If status is delayed or unclear, contact support now with your payment reference."
        />
      </Surface>
    </div>
  );
}
