import React, { useMemo, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { SignalChip } from '@/components/system/SignalChip';
import { Button } from '@/components/shared/ui/button';
import { Progress } from '@/components/shared/ui/progress';
import EmptyState from '@/components/shared/ui/EmptyState';
import {
  Ship,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Anchor,
  Plane,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

const statusTone = {
  shipped: 'in-progress',
  in_transit: 'in-progress',
  customs_clearance: 'pending',
  delivered: 'verified',
};

export default function ShipmentDetail() {
  const { id } = useParams();
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();
  const [shipment, setShipment] = useState(null);
  const [trackingEvents, setTrackingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!isSystemReady || !canLoadData || !id) {
        return;
      }
      try {
        const { data, error } = await supabase
          .from('shipments')
          .select('id, status, tracking_number, carrier_name, scheduled_delivery_date, actual_delivery_date, scheduled_pickup_date, actual_pickup_date, origin_country, destination_country, current_location, estimated_transit_days, metadata, trade_id, trade:trades(id, product_name, origin_country, destination_country, target_price, price_min, price_max)')
          .eq('id', id)
          .maybeSingle?.() ?? { data: null, error: null };

        if (!active) return;
        if (error || !data) {
          setShipment(null);
        } else {
          setShipment(data);
          const { data: events } = await supabase
            .from('shipment_tracking_events')
            .select('id, event_type, description, location, event_timestamp, shipment_id')
            .eq('shipment_id', data.id)
            .order('event_timestamp', { ascending: true });
          if (active) setTrackingEvents(events || []);
        }
      } catch {
        if (active) setShipment(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id, canLoadData, isSystemReady]);

  if (isLoading) {
    return (
      <div className="os-page os-stagger space-y-4">
        <Surface className="p-6">Loading shipment…</Surface>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="os-page os-stagger space-y-4">
        <Surface className="p-6">
          <EmptyState
            title="Shipment not found"
            description="We couldn’t locate this shipment."
            cta="Back to Shipments"
            ctaLink="/dashboard/shipments"
          />
        </Surface>
      </div>
    );
  }

  const trade = shipment.trade || {};
  const milestones = buildShipmentMilestones(shipment, trackingEvents);
  const completed = milestones.filter((m) => m.status === 'completed').length;
  const progress = milestones.length ? (completed / milestones.length) * 100 : 0;

  return (
    <div className="os-page os-stagger space-y-6">
      <Surface variant="glass" className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="os-label">Shipment</div>
            <h1 className="text-2xl font-semibold text-foreground">{trade?.product_name || 'Shipment'}</h1>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={shipment.status?.replace('_', ' ') || 'In Transit'}
                tone={statusTone[shipment.status] || 'neutral'}
              />
              <BadgeSoft icon={Ship} label={shipment.origin_country || trade.origin_country || 'Origin'} />
              <BadgeSoft icon={Plane} label={shipment.destination_country || trade.destination_country || 'Destination'} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <SignalChip label="Value" value={`$${Number(trade.target_price ?? trade.price_max ?? trade.price_min ?? 0).toLocaleString()}`} tone="gold" />
            <SignalChip label="Risk" value={trade?.metadata?.risk_level || 'medium'} tone="amber" />
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-[10px] text-os-muted mt-1">
            <span>Origin</span>
            <span>{Math.round(progress)}%</span>
            <span>Destination</span>
          </div>
        </div>
      </Surface>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <Surface variant="panel" className="p-5">
          <div className="flex items-center gap-2 text-sm text-os-muted mb-3">
            <Truck className="w-4 h-4" /> Timeline
          </div>
          <div className="space-y-0">
            {milestones.map((m, idx) => {
              const isCompleted = m.status === 'completed';
              const isActive = m.status === 'in_progress';
              return (
                <div key={m.id} className="flex gap-3 py-3 border-b last:border-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      isCompleted
                        ? 'bg-success/20 border-success text-success'
                        : isActive
                        ? 'bg-primary/15 border-primary text-primary'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-os-muted">
                      {m.completedAt
                        ? formatDate(m.completedAt)
                        : m.estimatedAt
                        ? `ETA ${formatDate(m.estimatedAt)}`
                        : 'Pending'}
                    </p>
                    {m.aiConfidence && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        AI confidence {m.aiConfidence}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>

        <Surface variant="panel" className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-os-muted">
            <MapPin className="w-4 h-4" /> Route
          </div>
          <InfoRow label="Origin" value={`${shipment.origin_country || trade.origin_country || ''}`} />
          <InfoRow label="Destination" value={`${shipment.destination_country || trade.destination_country || ''}`} />
          <InfoRow label="Carrier" value={shipment.carrier_name || '—'} />
          <InfoRow label="Tracking" value={shipment.tracking_number || '—'} />
          <InfoRow label="ETA" value={formatDate(shipment.actual_delivery_date || shipment.scheduled_delivery_date)} />
          <InfoRow label="Transit Time" value={`${shipment.estimated_transit_days || '—'} days`} />
        </Surface>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-os-muted">{label}</span>
      <span className="font-semibold text-foreground">{value || '—'}</span>
    </div>
  );
}

function buildShipmentMilestones(shipment, events = []) {
  const base = [
    { id: "pickup", name: "Pickup scheduled", status: "pending" },
    { id: "transit", name: "In transit", status: "pending" },
    { id: "customs", name: "Customs cleared", status: "pending" },
    { id: "delivered", name: "Delivered", status: "pending" },
  ];

  if (!shipment) return base;

  const status = shipment.status;
  const eventTypes = new Set((events || []).map((e) => e.event_type));

  return base.map((step) => {
    let stepStatus = "pending";
    if (step.id === "pickup" && (status !== "pending" || eventTypes.has("picked_up"))) {
      stepStatus = "completed";
    }
    if (step.id === "transit" && (status === "in_transit" || status === "delivery_scheduled" || status === "delivered" || eventTypes.has("in_transit"))) {
      stepStatus = status === "in_transit" ? "in_progress" : "completed";
    }
    if (step.id === "customs" && eventTypes.has("customs_cleared")) {
      stepStatus = "completed";
    }
    if (step.id === "delivered" && (status === "delivered" || eventTypes.has("delivered"))) {
      stepStatus = "completed";
    }
    return {
      ...step,
      status: stepStatus,
      completedAt: stepStatus === "completed" ? shipment.actual_delivery_date || shipment.actual_pickup_date : null,
      estimatedAt: stepStatus !== "completed" ? shipment.scheduled_delivery_date : null,
    };
  });
}

function BadgeSoft({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted text-foreground border border-border">
      {Icon ? <Icon className="w-3 h-3" /> : null}
      {label}
    </span>
  );
}

function formatDate(date) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}
