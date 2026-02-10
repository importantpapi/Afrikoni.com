import { Surface } from "@/components/system/Surface";
import { fetchCorridors } from "@/api/kernelService";
import { useEffect, useState } from "react";
import { Progress } from "@/components/shared/ui/progress";

export function CorridorProfilesPanel() {
  const [corridors, setCorridors] = useState([]);

  useEffect(() => {
    fetchCorridors().then(setCorridors).catch(() => setCorridors([]));
  }, []);

  return (
    <Surface variant="panel" className="p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="os-label">Corridor Profiles</div>
        <span className="text-[11px] text-muted-foreground">Mocked</span>
      </div>
      <div className="space-y-3">
        {corridors.map((c) => (
          <div key={c.id} className="p-3 rounded-lg border border-border/60 bg-card/70">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">{c.origin} → {c.destination}</span>
              <span className="text-xs text-muted-foreground">{c.risk} risk</span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Compliance</span>
                <span className="text-foreground font-semibold">{c.complianceRate}%</span>
              </div>
              <Progress value={c.complianceRate} className="h-1" />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Delay Risk</span>
                <span className="text-warning font-semibold">{c.delayRisk}%</span>
              </div>
              <Progress value={c.delayRisk} className="h-1" />
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
