import React, { useMemo, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { SignalChip } from '@/components/system/SignalChip';
import { Button } from '@/components/shared/ui/button';
import { Progress } from '@/components/shared/ui/progress';
import EmptyState from '@/components/shared/ui/EmptyState';
import { Wallet, Lock, ArrowUpRight, Clock } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function EscrowDetail() {
  const { orderId } = useParams();
  const { canLoadData, isSystemReady } = useDashboardKernel();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState({
    totalAmount: 0,
    releasedAmount: 0,
    heldAmount: 0,
    fxRate: 1.0,
    status: 'pending',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!isSystemReady || !canLoadData || !orderId) return;
      try {
        const { data, error } = await supabase
          .from('trades')
          .select('id, status, product_name, buyer_id, seller_id')
          .eq('id', orderId)
          .maybeSingle?.() ?? { data: null, error: null };

        if (!active) return;
        if (error || !data) {
          setOrder(null);
        } else {
          setOrder(data);
          const { data: escrow } = await supabase
            .from('escrows')
            .select('amount, balance, status, currency')
            .eq('trade_id', orderId)
            .maybeSingle?.() ?? { data: null };

          if (escrow) {
            const totalAmount = Number(escrow.amount || 0);
            const heldAmount = Number(escrow.balance ?? escrow.amount ?? 0);
            const releasedAmount = Math.max(0, totalAmount - heldAmount);
            setPayment({
              totalAmount,
              releasedAmount,
              heldAmount,
              fxRate: 1.0,
              status: escrow.status || 'pending',
            });
          }
        }
      } catch {
        if (active) setOrder(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [orderId, canLoadData, isSystemReady]);

  if (isLoading) {
    return (
      <div className="os-page os-stagger space-y-4">
        <Surface className="p-6">Loading escrow…</Surface>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="os-page os-stagger space-y-4">
        <Surface className="p-6">
          <EmptyState
            title="Escrow not found"
            description="We couldn’t locate this escrow."
            cta="Back to Dashboard"
            ctaLink="/dashboard"
          />
        </Surface>
      </div>
    );
  }

  const releasedPercent = payment.totalAmount
    ? (payment.releasedAmount / payment.totalAmount) * 100
    : 0;
  const heldPercent = payment.totalAmount
    ? (payment.heldAmount / payment.totalAmount) * 100
    : 0;

  const handlePayment = async () => {
    setIsPaying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-flutterwave-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          amount: payment.totalAmount,
          currency: payment.currency || 'USD',
          orderId: orderId,
          orderType: 'order',
          customerEmail: session?.user?.email,
          customerName: session?.user?.user_metadata?.full_name || 'Afrikoni Trader'
        })
      });

      const data = await response.json();
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
      console.error('Payment Error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsPaying(false);
    }
  };

  const handleSharePaymentLink = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: payment.totalAmount,
          currency: payment.currency || 'USD'
        })
      });
      const data = await response.json();
      if (data.paymentLink) {
        const message = `Hello, please use this link to pay for Order ${orderId} on Afrikoni: ${data.paymentLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      }
    } catch (err) {
      toast.error('Failed to generate sharing link');
    }
  };

  return (
    <div className="os-page os-stagger space-y-6">
      <Surface variant="glass" className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="os-label">Escrow</div>
            <h1 className="text-os-2xl font-semibold text-foreground">Order {order.id}</h1>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label={payment.status?.toUpperCase() || 'LOCKED'} tone="neutral" />
              <BadgeSoft icon={Clock} label={payment.fxRate ? `FX ${payment.fxRate}` : 'FX'} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <SignalChip label="Total" value={`$${payment.totalAmount.toLocaleString()}`} tone="gold" />
            <SignalChip label="Released" value={`$${payment.releasedAmount.toLocaleString()}`} tone="emerald" />
            <SignalChip label="Held" value={`$${payment.heldAmount.toLocaleString()}`} tone="amber" />
          </div>
        </div>
      </Surface>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <Surface variant="panel" className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-os-sm text-os-muted">
            <Wallet className="w-4 h-4" /> Milestones
          </div>
          <Progress value={releasedPercent} className="h-2" />
          <div className="flex justify-between text-os-xs text-os-muted">
            <span>Released</span>
            <span>{Math.round(releasedPercent)}%</span>
            <span>Remaining</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <Metric label="Total in Escrow" value={`$${payment.totalAmount.toLocaleString()}`} />
            <Metric label="Released" value={`$${payment.releasedAmount.toLocaleString()}`} />
            <Metric label="Held" value={`$${payment.heldAmount.toLocaleString()}`} />
          </div>

          <div className="space-y-2">
            <Milestone label="Funded" status="done" amount={payment.totalAmount} />
            <Milestone label="Milestone Releases" status="in_progress" amount={payment.releasedAmount} />
            <Milestone label="Final Settlement" status="pending" amount={payment.heldAmount} />
          </div>
        </Surface>

        <Surface variant="panel" className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-os-sm text-os-muted">
            <Lock className="w-4 h-4" /> Quick Actions
          </div>
          <div className="space-y-2">
            {payment.status === 'pending' && (
              <Button
                onClick={handlePayment}
                disabled={isPaying}
                className="w-full gap-2 bg-os-accent hover:bg-os-accent-dark"
              >
                {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                Pay with Mobile Money / Card
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full gap-2 text-os-sm py-2"
              onClick={handleSharePaymentLink}
            >
              Share payment link (WhatsApp)
            </Button>
            <Button variant="ghost" className="w-full gap-2 text-os-muted">
              Request amendment
            </Button>
          </div>
          <div className="text-os-xs text-os-muted">
            Funds are held in escrow until both sides approve milestones or final settlement is confirmed.
          </div>
        </Surface>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="p-3 rounded-lg bg-muted/60 border border-border/60">
      <p className="text-os-xs uppercase tracking-wide text-os-muted">{label}</p>
      <p className="text-os-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Milestone({ label, status, amount }) {
  const tone =
    status === 'done'
      ? 'status-verified'
      : status === 'in_progress'
        ? 'status-in-progress'
        : 'status-pending';
  return (
    <div className="flex items-center justify-between border rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`status-badge ${tone}`}>{label}</span>
      </div>
      <span className="text-os-sm font-semibold text-foreground">${amount?.toLocaleString() || '0'}</span>
    </div>
  );
}

function BadgeSoft({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-os-xs bg-muted text-foreground border border-border">
      {Icon ? <Icon className="w-3 h-3" /> : null}
      {label}
    </span>
  );
}
