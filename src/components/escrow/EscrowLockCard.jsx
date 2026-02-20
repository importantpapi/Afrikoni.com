/**
 * EscrowLockCard — Afrikoni Supply Truth OS
 * ==========================================
 * Shows the escrow status for a trade.
 *
 * BUYER sees:  "Your payment is secured — release after delivery"
 * SELLER sees: "Funds locked and ready — ship to unlock"
 *
 * Data source: escrows table (status, amount, currency)
 * Falls back gracefully if no escrow row exists yet.
 */
import React, { useEffect, useState } from 'react';
import { Lock, Unlock, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: 'Awaiting Payment',
    bg: 'bg-amber-500/10 border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    detail: 'Buyer must fund escrow before shipping can begin.',
  },
  funded: {
    icon: Lock,
    label: 'Funds Secured',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400 animate-pulse',
    detail: 'Funds are locked in Afrikoni escrow. Release after delivery confirmation.',
  },
  released: {
    icon: Unlock,
    label: 'Funds Released',
    bg: 'bg-blue-500/10 border-blue-500/30',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    detail: 'Escrow has been released to the seller.',
  },
  refunded: {
    icon: AlertTriangle,
    label: 'Refunded to Buyer',
    bg: 'bg-red-500/10 border-red-500/30',
    text: 'text-red-400',
    dot: 'bg-red-400',
    detail: 'Escrow was refunded. Trade did not complete.',
  },
  disputed: {
    icon: AlertTriangle,
    label: 'Under Dispute',
    bg: 'bg-orange-500/10 border-orange-500/30',
    text: 'text-orange-400',
    dot: 'bg-orange-400 animate-pulse',
    detail: 'Escrow is frozen pending dispute resolution.',
  },
  expired: {
    icon: AlertTriangle,
    label: 'Escrow Expired',
    bg: 'bg-white/5 border-white/10',
    text: 'text-white/40',
    dot: 'bg-white/20',
    detail: 'Escrow window has closed.',
  },
};

export default function EscrowLockCard({ tradeId, tradeAmount, currency = 'USD', viewerRole = 'seller' }) {
  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tradeId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('escrows')
        .select('id, amount, currency, status, funded_at, released_at, expires_at, balance')
        .eq('trade_id', tradeId)
        .maybeSingle();
      if (active) {
        setEscrow(data);
        setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [tradeId]);

  // If no escrow row yet, infer from trade
  const status = escrow?.status ?? (tradeAmount > 0 ? 'pending' : null);
  const amount = escrow?.amount ?? tradeAmount ?? 0;
  const cur = escrow?.currency ?? currency;

  if (!status) return null;

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const isFunded = status === 'funded';
  const isReleased = status === 'released';

  const sellerMessage = isFunded
    ? 'Ship now — funds release automatically after buyer confirms delivery.'
    : isReleased
    ? 'Payment has been transferred to your account.'
    : cfg.detail;

  const buyerMessage = isFunded
    ? 'Your payment is protected. Afrikoni releases it only after delivery is confirmed.'
    : cfg.detail;

  const displayMessage = viewerRole === 'seller' ? sellerMessage : buyerMessage;

  return (
    <div className={`rounded-xl border p-4 ${cfg.bg}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-black/30`}>
          <Icon className={`w-4 h-4 ${cfg.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${cfg.text}`}>
              Afrikoni Escrow
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          </div>
          <div className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</div>
        </div>
        {/* Amount pill */}
        <div className="text-right shrink-0">
          <div className={`text-lg font-mono font-bold ${cfg.text}`}>
            {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0 })}{' '}
            <span className="text-xs font-normal opacity-70">{cur}</span>
          </div>
          {isFunded && (
            <div className="text-xs opacity-60 mt-0.5">🔒 locked</div>
          )}
        </div>
      </div>

      {/* Message */}
      <p className="text-xs leading-relaxed opacity-80 text-white/70">
        {displayMessage}
      </p>

      {/* Milestone hint when funded */}
      {isFunded && (
        <div className="mt-3 grid grid-cols-3 gap-1 text-center">
          {[
            { label: 'Pickup', done: true },
            { label: 'Transit', done: false },
            { label: 'Delivery', done: false },
          ].map((m, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${m.done ? 'bg-emerald-400' : 'bg-white/15'}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider ${m.done ? 'text-emerald-400' : 'text-white/30'}`}>
                {m.label}
              </span>
            </div>
          ))}
          <div className="col-span-3 relative mt-1">
            <div className="h-px bg-white/10 w-full" />
            <div className="h-px bg-emerald-400/60 absolute top-0 left-0 w-1/3 transition-all" />
          </div>
        </div>
      )}

      {/* Proof-of-funds footer */}
      {isFunded && escrow?.funded_at && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-[10px] text-white/40">
          <ShieldCheck className="w-3 h-3" />
          Secured {new Date(escrow.funded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '}Ref: {escrow.id?.slice(-8) ?? '—'}
        </div>
      )}
    </div>
  );
}
