import { useEffect, useMemo, useState } from "react";
import {
  Truck,
  Ship,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  AlertTriangle,
  Anchor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/shared/ui/progress";
import { Surface } from "@/components/system/Surface";
import { supabase } from "@/api/supabaseClient";
import { useDashboardKernel } from "@/hooks/useDashboardKernel";
import { useShipments } from "@/hooks/queries/useShipments";

const Shipments = () => {
  const { canLoadData, isSystemReady } = useDashboardKernel();
  
  // ✅ REACT QUERY: Auto-refresh shipments
  const { data: shipmentsData = [], isLoading } = useShipments();
  const activeShipment = shipmentsData[0] || null;
  
  const [trackingEvents, setTrackingEvents] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!isSystemReady || !canLoadData || !activeShipment?.id) return;
      try {
        const { data: events } = await supabase
          .from("shipment_tracking_events")
          .select("id, event_type, description, location, event_timestamp")
          .eq("shipment_id", activeShipment.id)
          .order("event_timestamp", { ascending: false });
        if (active) setTrackingEvents(events || []);
      } catch {
        if (active) setTrackingEvents([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [canLoadData, isSystemReady, activeShipment?.id]);

  const trade = activeShipment?.trade || activeShipment?.order || {};
  const originCountry = activeShipment?.origin_country || trade?.origin_country || trade?.seller_company?.country || "Origin";
  const destinationCountry = activeShipment?.destination_country || trade?.destination_country || trade?.buyer_company?.country || "Destination";
  const tradeValue = Number(trade?.target_price ?? trade?.price_max ?? trade?.price_min ?? trade?.total_amount ?? 0);

  const milestones = useMemo(
    () => buildShipmentMilestones(activeShipment, trackingEvents),
    [activeShipment, trackingEvents]
  );

  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const progress = milestones.length ? (completedCount / milestones.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="os-page os-stagger space-y-6">
        <Surface variant="glass" className="p-6 md:p-8">Loading shipments…</Surface>
      </div>
    );
  }

  if (!activeShipment) {
    return (
      <div className="os-page os-stagger space-y-6">
        <Surface variant="glass" className="p-6 md:p-8">
          <h1 className="os-title">Shipment Tracking</h1>
          <p className="text-os-sm text-os-muted">No shipments found for your account.</p>
        </Surface>
      </div>
    );
  }

  return (
    <div className="os-page os-stagger space-y-6">
      <Surface variant="glass" className="p-6 md:p-8 mb-6">
        <div>
          <div className="os-label">Logistics Control Tower</div>
          <h1 className="os-title mt-2">Shipment Tracking</h1>
          <p className="text-os-sm text-os-muted">
            Real-time logistics visibility for all active shipments
          </p>
        </div>
      </Surface>

      <Surface variant="panel" className="overflow-hidden p-0">
        <div className="p-6 border-b border-os-stroke bg-gradient-to-r from-blue-500/5 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-os-sm bg-os-blue/10 flex items-center justify-center">
                <Ship className="h-7 w-7 text-os-blue" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-os-lg font-semibold text-[var(--os-text-primary)]">
                    {trade?.product_name || "Active Shipment"}
                  </h2>
                  <span className="bg-os-blue/10 text-os-blue text-os-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {activeShipment.status?.replace("_", " ") || "In Transit"}
                  </span>
                </div>
                <p className="text-os-sm text-os-muted">
                  {activeShipment.carrier_name || "Carrier"} · {activeShipment.tracking_number || "Tracking Pending"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-os-sm text-os-muted">ETA</p>
              <p className="text-os-lg font-semibold text-[var(--os-text-primary)]">
                {(activeShipment.scheduled_delivery_date || activeShipment.actual_delivery_date)
                  ? new Date(activeShipment.actual_delivery_date || activeShipment.scheduled_delivery_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                  : "TBD"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-os-stroke">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-os-sm font-medium text-[var(--os-text-primary)]">
                  {originCountry}
                </p>
                <p className="text-os-xs text-os-muted">
                  Origin
                </p>
              </div>
            </div>
            <div className="flex-1 mx-6">
              <div className="relative">
                <Progress value={progress} className="h-2" />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-[var(--os-surface-2)] shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse-glow"
                  style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-os-xs text-os-muted">Origin</span>
                <span className="text-os-xs text-blue-400 font-medium">{activeShipment.current_location || "—"}</span>
                <span className="text-os-xs text-os-muted">Destination</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <div className="text-right">
                <p className="text-os-sm font-medium text-[var(--os-text-primary)]">
                  {destinationCountry}
                </p>
                <p className="text-os-xs text-os-muted">
                  Destination
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              {
                label: "Transit Time",
                value: activeShipment.estimated_transit_days
                  ? `${activeShipment.estimated_transit_days} days`
                  : "—",
                icon: Clock,
              },
              {
                label: "Current Location",
                value: activeShipment.current_location || "-",
                icon: MapPin,
              },
              {
                label: "Risk Level",
                value: trade?.metadata?.risk_level || "medium",
                icon: AlertTriangle,
              },
              {
                label: "Value",
                value: tradeValue ? `$${tradeValue.toLocaleString()}` : "—",
                icon: Package,
              },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-lg bg-os-surface-1 border border-os-stroke">
                <div className="flex items-center gap-1 mb-1">
                  <stat.icon className="h-3 w-3 text-os-muted" />
                  <span className="text-os-xs uppercase tracking-wider text-os-muted font-semibold">{stat.label}</span>
                </div>
                <p className="text-os-sm font-semibold text-[var(--os-text-primary)] capitalize">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-os-sm font-semibold text-[var(--os-text-primary)] mb-4">
            Shipment Milestones
          </h3>
          <div className="space-y-0">
            {milestones.map((milestone, idx) => {
              const isCompleted = milestone.status === "completed";
              const isActive = milestone.status === "in_progress";
              const isLast = idx === milestones.length - 1;

              return (
                <div key={milestone.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                        isCompleted &&
                        "bg-emerald-500/10 border-emerald-500 text-emerald-500",
                        isActive &&
                        "bg-os-blue/10 border-blue-500 text-os-blue animate-pulse-glow",
                        !isCompleted &&
                        !isActive &&
                        "bg-os-surface-0 border-os-stroke text-os-muted"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-os-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={cn(
                          "w-0.5 h-10 my-1",
                          isCompleted ? "bg-emerald-500/30" : "bg-os-stroke"
                        )}
                      />
                    )}
                  </div>
                  <div className="pb-6">
                    <p
                      className={cn(
                        "text-os-sm font-medium",
                        isCompleted || isActive
                          ? "text-[var(--os-text-primary)]"
                          : "text-os-muted"
                      )}
                    >
                      {milestone.name}
                    </p>
                    <p className="text-os-xs text-os-muted">
                      {milestone.completedAt
                        ? new Date(milestone.completedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                        : milestone.estimatedAt
                          ? `ETA: ${new Date(
                            milestone.estimatedAt
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}`
                          : "Pending"}
                    </p>
                    {milestone.aiConfidence && (
                      <span className="inline-flex items-center gap-1 mt-1 text-os-xs text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                        AI Confidence: {milestone.aiConfidence}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Surface>

      <Surface variant="panel" className="p-6">
        <h3 className="text-os-sm font-semibold text-[var(--os-text-primary)] mb-4">Event Log</h3>
        <div className="space-y-3">
          {trackingEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg bg-os-surface-1 border border-os-stroke">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  event.event_type === "picked_up" && "bg-os-blue/10 text-os-blue",
                  event.event_type === "in_transit" && "bg-blue-400/10 text-blue-400",
                  event.event_type === "in_customs" && "bg-amber-500/10 text-amber-500",
                  event.event_type === "delivered" && "bg-emerald-500/10 text-emerald-500",
                  event.event_type === "exception" && "bg-os-red/10 text-os-red"
                )}
              >
                {event.event_type === "picked_up" ? (
                  <Package className="h-4 w-4" />
                ) : event.event_type === "in_transit" ? (
                  <Ship className="h-4 w-4" />
                ) : event.event_type === "in_customs" ? (
                  <Anchor className="h-4 w-4" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-os-sm font-medium text-[var(--os-text-primary)]">
                  {event.description || event.event_type?.replace(/_/g, " ") || "Shipment update"}
                </p>
                <p className="text-os-xs text-os-muted">
                  {event.location || "—"}
                </p>
              </div>
              <span className="text-os-xs text-os-muted tabular-nums">
                {event.event_timestamp
                  ? new Date(event.event_timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                  : "—"}
              </span>
            </div>
          ))}
          {trackingEvents.length === 0 && (
            <div className="text-os-sm text-os-muted">No tracking events logged yet.</div>
          )}
        </div>
      </Surface>
    </div>
  );
};

export default Shipments;

function buildShipmentMilestones(shipment, events) {
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
