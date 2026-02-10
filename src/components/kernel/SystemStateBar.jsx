import { Shield, Activity, Globe2, AlertTriangle, Database } from "lucide-react";
import { StatusBadge } from "@/components/system/StatusBadge";
import { Surface } from "@/components/system/Surface";
import { useKernelState } from "@/hooks/useKernelState";
import { Skeleton } from "@/components/shared/ui/skeleton";

export function SystemStateBar() {
  const { data, loading } = useKernelState();

  const items = loading
    ? []
    : [
        {
          label: "Active Trades",
          value: data?.activeTrades ?? 0,
          icon: Activity,
        },
        {
          label: "Capital in Motion",
          value: `$${((data?.capitalInMotion || 0) / 1_000_000).toFixed(1)}M`,
          icon: Database,
        },
        {
          label: "Corridors",
          value: data?.activeCorridors ?? 0,
          icon: Globe2,
        },
        {
          label: "Compliance",
          value: `${data?.complianceReadiness ?? 0}%`,
          icon: Shield,
        },
      ];

  return (
    <Surface variant="glass" className="p-4 flex flex-wrap gap-3 items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Kernel State</div>
        <StatusBadge label={data?.riskSurface?.toUpperCase?.() || "SCANNING"} tone="neutral" />
      </div>
      <div className="flex flex-wrap gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-28" />)
          : items.map((item) => (
              <div
                key={item.label}
                className="glass-card px-3 py-2 flex items-center gap-2 min-w-[140px]"
              >
                <item.icon className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">{item.label}</div>
                  <div className="text-sm font-semibold text-foreground">{item.value}</div>
                </div>
              </div>
            ))}
      </div>
    </Surface>
  );
}
