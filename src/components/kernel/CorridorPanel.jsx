import { useEffect, useState } from "react";
import { fetchCorridors } from "@/api/kernelService";
import { Surface } from "@/components/system/Surface";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/shared/ui/progress";

export function CorridorPanel() {
  const [corridors, setCorridors] = useState([]);

  useEffect(() => {
    fetchCorridors().then(setCorridors).catch(() => setCorridors([]));
  }, []);

  return (
    <Surface variant="panel" className="p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="os-label">Corridor Intelligence</div>
          <p className="text-os-sm text-muted-foreground">Delay risk & compliance rate by lane</p>
        </div>
        <AlertTriangle className="h-4 w-4 text-warning" />
      </div>
      <div className="space-y-3">
        {corridors.map((c) => (
          <div key={c.id} className="p-3 rounded-lg border border-border/60 bg-card/80">
            <div className="flex items-center justify-between text-os-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{c.origin}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-semibold text-foreground">{c.destination}</span>
              </div>
              <span className="text-os-xs text-muted-foreground">{c.trades} trades • ${Math.round(c.totalValue/1000)}k</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-os-xs text-muted-foreground">
              <div>
                <div className="font-semibold text-foreground">{c.delayRisk}%</div>
                <div>Delay risk</div>
              </div>
              <div>
                <div className="font-semibold text-foreground">{c.complianceRate}%</div>
                <div>Compliance</div>
              </div>
              <div>
                <div className="font-semibold text-foreground">{c.congestion}%</div>
                <div>Congestion</div>
              </div>
            </div>
            <Progress value={c.complianceRate} className="h-1 mt-2" />
          </div>
        ))}
      </div>
    </Surface>
  );
}
