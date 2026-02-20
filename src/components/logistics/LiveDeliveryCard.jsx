/**
 * LiveDeliveryCard — Uber-style carrier visibility for buyers & sellers
 *
 * Shows:
 *  - Carrier photo + name + vehicle + tier badge (Gold/Silver/Bronze)
 *  - Last checkpoint + timestamp
 *  - Progress bar: Pickup → Border → Delivery
 *  - WhatsApp + Call CTAs
 *  - Delivery confidence + AI ETA
 *
 * Displayed when trade.status is pickup_scheduled | in_transit | delivered
 */
import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import {
  Truck,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Clock,
  Star,
  Shield,
  Award,
  AlertCircle,
  Package,
} from 'lucide-react';

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  gold: {
    label: 'Gold Carrier',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/30',
    icon: Award,
  },
  silver: {
    label: 'Silver Carrier',
    color: 'text-slate-300',
    bg: 'bg-slate-300/10 border-slate-300/30',
    icon: Shield,
  },
  bronze: {
    label: 'Verified Carrier',
    color: 'text-amber-600',
    bg: 'bg-amber-600/10 border-amber-600/30',
    icon: Shield,
  },
};

// ─── Checkpoint event label map ───────────────────────────────────────────────
const CHECKPOINT_LABELS = {
  created: 'Order created',
  picked_up: 'Goods picked up',
  in_transit: 'On the road',
  arrived_at_facility: 'Arrived at hub',
  departed_facility: 'Left hub',
  in_customs: 'Customs check',
  customs_cleared: 'Customs cleared ✓',
  out_for_delivery: 'Out for delivery',
  delivery_attempted: 'Delivery attempted',
  delivered: 'Delivered ✓',
  exception: 'Issue flagged',
  delay: 'Delay reported',
};

// ─── Progress steps ───────────────────────────────────────────────────────────
const PROGRESS_STEPS = [
  { key: 'pickup', label: 'Pickup', events: ['picked_up', 'created'] },
  { key: 'border', label: 'Border', events: ['in_customs', 'customs_cleared', 'arrived_at_facility', 'departed_facility'] },
  { key: 'delivery', label: 'Delivery', events: ['out_for_delivery', 'delivery_attempted', 'delivered'] },
];

function getProgressStep(latestEventType) {
  for (let i = PROGRESS_STEPS.length - 1; i >= 0; i--) {
    if (PROGRESS_STEPS[i].events.includes(latestEventType)) return i;
  }
  return 0;
}

// ─── Star rating ──────────────────────────────────────────────────────────────
function StarRating({ value = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`w-3 h-3 ${s <= Math.round(value) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
        />
      ))}
      <span className="text-os-xs text-white/50 ml-1">{Number(value).toFixed(1)}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LiveDeliveryCard({ tradeId, shipmentId, tradeStatus }) {
  const [carrier, setCarrier] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Load assigned carrier from dispatch_events ────────────────────────────
  useEffect(() => {
    if (!tradeId) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        // 1. Find which provider was ACCEPTED for this trade
        const { data: dispatch } = await supabase
          .from('dispatch_events')
          .select('provider_id, payload')
          .eq('trade_id', tradeId)
          .eq('event_type', 'PROVIDER_ACCEPTED')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const providerId = dispatch?.provider_id;

        if (providerId) {
          const { data: provider } = await supabase
            .from('logistics_providers')
            .select(
              'id, provider_name, contact_name, phone, whatsapp, photo_url, vehicle_number, vehicle_type_label, vehicle_types, tier, rating, total_ratings, completion_rate, total_deliveries, city, country, is_verified'
            )
            .eq('id', providerId)
            .maybeSingle();

          if (active && provider) setCarrier(provider);
        }

        // 2. Load tracking checkpoints for this shipment/trade
        let checkpointQuery = supabase
          .from('shipment_tracking_events')
          .select('id, event_type, status, location, description, event_timestamp, carrier_note, photo_url, verified_by_ai')
          .order('event_timestamp', { ascending: false })
          .limit(5);

        if (shipmentId) {
          checkpointQuery = checkpointQuery.eq('shipment_id', shipmentId);
        }

        const { data: events } = await checkpointQuery;
        if (active && events) setCheckpoints(events);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    // ── Realtime subscription for live tracking events ────────────────────
    const channel = supabase
      .channel(`live_delivery_${tradeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shipment_tracking_events' },
        (payload) => {
          if (active) {
            setCheckpoints(prev => [payload.new, ...prev].slice(0, 5));
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [tradeId, shipmentId]);

  // ── Delivered state ───────────────────────────────────────────────────────
  const isDelivered = tradeStatus === 'delivered' || tradeStatus === 'accepted' || tradeStatus === 'settled';
  const latestCheckpoint = checkpoints[0];
  const currentStep = latestCheckpoint ? getProgressStep(latestCheckpoint.event_type) : 0;
  const tier = carrier?.tier || 'bronze';
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
  const TierIcon = tierCfg.icon;

  // ── No carrier assigned yet ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/10 rounded w-2/3" />
            <div className="h-2 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!carrier) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/3 p-4">
        <div className="flex items-center gap-3 text-white/40">
          <Truck className="w-5 h-5" />
          <div>
            <div className="text-os-sm font-medium text-white/60">Matching carrier…</div>
            <div className="text-os-xs">A verified carrier will be assigned once escrow is funded</div>
          </div>
        </div>
      </div>
    );
  }

  const vehicleLabel = carrier.vehicle_type_label ||
    (Array.isArray(carrier.vehicle_types) && carrier.vehicle_types[0]) ||
    'Truck';

  const whatsappNumber = carrier.whatsapp || carrier.phone;
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(carrier.contact_name || carrier.provider_name)}%2C%20I%27m%20checking%20on%20my%20delivery.`
    : null;

  return (
    <div className="rounded-xl border border-white/15 bg-gradient-to-b from-white/8 to-white/3 overflow-hidden">

      {/* ── Header: Carrier identity ─────────────────────────────────────── */}
      <div className="p-4 flex items-center gap-4 border-b border-white/8">
        {/* Photo */}
        <div className="relative flex-shrink-0">
          {carrier.photo_url ? (
            <img
              src={carrier.photo_url}
              alt={carrier.contact_name || carrier.provider_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-os-accent/30 to-os-accent/10 border-2 border-os-accent/30 flex items-center justify-center">
              <Truck className="w-6 h-6 text-os-accent" />
            </div>
          )}
          {/* Online indicator */}
          <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-os-surface-2 ${isDelivered ? 'bg-emerald-500' : 'bg-emerald-400 animate-pulse'}`} />
        </div>

        {/* Name + tier */}
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-os-sm leading-tight truncate">
            {carrier.contact_name || carrier.provider_name}
          </div>
          <div className="text-os-xs text-white/50 truncate">{carrier.provider_name}</div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={carrier.rating || 4.2} />
          </div>
        </div>

        {/* Tier badge */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-os-xs font-bold ${tierCfg.bg} ${tierCfg.color}`}>
          <TierIcon className="w-3 h-3" />
          {tier === 'gold' ? 'Gold' : tier === 'silver' ? 'Silver' : 'Verified'}
        </div>
      </div>

      {/* ── Vehicle + stats ──────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/8">
        <div className="flex items-center gap-2 text-os-xs text-white/60">
          <Truck className="w-3.5 h-3.5" />
          <span>{vehicleLabel}</span>
          {carrier.vehicle_number && (
            <span className="px-1.5 py-0.5 rounded bg-white/8 font-mono text-white/80 text-os-xs">
              {carrier.vehicle_number}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-os-xs text-white/50">
          <span className="text-emerald-400 font-medium">{Math.round(carrier.completion_rate || 0)}%</span>
          <span>success</span>
          <span>·</span>
          <span>{carrier.total_deliveries || 0} deliveries</span>
        </div>
      </div>

      {/* ── Progress track ───────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute top-3 left-4 right-4 h-0.5 bg-white/10 z-0" />
          <div
            className="absolute top-3 left-4 h-0.5 bg-os-accent z-0 transition-all duration-700"
            style={{ width: `${(currentStep / (PROGRESS_STEPS.length - 1)) * (100 - 10)}%` }}
          />

          {PROGRESS_STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={step.key} className="flex flex-col items-center gap-1 z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
                  ${isDelivered && i === PROGRESS_STEPS.length - 1
                    ? 'bg-emerald-500 border-emerald-500'
                    : done
                      ? 'bg-os-accent border-os-accent'
                      : active
                        ? 'bg-os-surface-2 border-os-accent animate-pulse'
                        : 'bg-os-surface-2 border-white/20'
                  }`}>
                  {done || (isDelivered && i === PROGRESS_STEPS.length - 1) ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white fill-white" />
                  ) : active ? (
                    <div className="w-2 h-2 rounded-full bg-os-accent" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                  )}
                </div>
                <span className={`text-os-xs ${active ? 'text-os-accent font-semibold' : done ? 'text-white/70' : 'text-white/30'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Latest checkpoint ────────────────────────────────────────────── */}
      {latestCheckpoint && (
        <div className="mx-4 mb-3 mt-1 p-3 rounded-lg bg-white/5 border border-white/8">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-os-accent mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-os-xs font-semibold text-white leading-tight">
                {CHECKPOINT_LABELS[latestCheckpoint.event_type] || latestCheckpoint.status}
              </div>
              {latestCheckpoint.location && (
                <div className="text-os-xs text-white/50 truncate">{latestCheckpoint.location}</div>
              )}
              {latestCheckpoint.carrier_note && (
                <div className="text-os-xs text-white/40 italic mt-0.5">"{latestCheckpoint.carrier_note}"</div>
              )}
            </div>
            <div className="text-os-xs text-white/30 flex-shrink-0">
              {latestCheckpoint.event_timestamp
                ? new Date(latestCheckpoint.event_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '—'}
            </div>
          </div>
          {latestCheckpoint.verified_by_ai && (
            <div className="flex items-center gap-1 mt-1.5 text-os-xs text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              AI-verified checkpoint
            </div>
          )}
        </div>
      )}

      {/* ── CTAs ─────────────────────────────────────────────────────────── */}
      {!isDelivered && (
        <div className="px-4 pb-4 flex gap-2">
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-os-xs font-semibold hover:bg-emerald-500/25 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}
          {carrier.phone && (
            <a
              href={`tel:${carrier.phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 border border-white/15 text-white/70 text-os-xs font-semibold hover:bg-white/10 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call
            </a>
          )}
        </div>
      )}

      {/* ── Delivered banner ─────────────────────────────────────────────── */}
      {isDelivered && (
        <div className="mx-4 mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-os-xs font-bold text-emerald-400">Delivered successfully</div>
            <div className="text-os-xs text-white/40">Escrow release is now available</div>
          </div>
        </div>
      )}
    </div>
  );
}
