import { Surface } from "@/components/system/Surface";
import { AlertTriangle, Clock } from "lucide-react";

const alerts = [
  {
    id: "al-1",
    title: "Shipment stuck in Lagos, missing AfCFTA Certificate of Origin",
    level: "critical",
    eta: "4h",
  },
  {
    id: "al-2",
    title: "Risk rising: Côte d’Ivoire → Germany corridor congestion up 12% this week",
    level: "warning",
    eta: "12h",
  },
  {
    id: "al-3",
    title: "Quote expiry approaching for cocoa contract TRD-2026-0042",
    level: "info",
    eta: "2h",
  },
];

export function KernelAlertsPanel() {
  return (
    <Surface variant="panel" className="p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="os-label">Kernel Alerts</div>
        <button className="text-os-xs text-muted-foreground hover:text-foreground">View All</button>
      </div>
      <div className="space-y-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="p-3 rounded-lg border border-border/60 bg-card/70 flex items-start gap-3"
          >
            <AlertTriangle
              className={`h-4 w-4 ${a.level === "critical" ? "text-destructive" : a.level === "warning" ? "text-warning" : "text-info"}`}
            />
            <div className="flex-1">
              <p className="text-os-sm font-medium text-foreground leading-tight">{a.title}</p>
              <div className="text-os-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {a.eta}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
