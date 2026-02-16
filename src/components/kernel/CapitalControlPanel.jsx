import { useEffect, useState } from "react";
import { fetchCapitalState } from "@/api/kernelService";
import { Surface } from "@/components/system/Surface";
import { Wallet, Shield, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/shared/ui/progress";

export function CapitalControlPanel() {
  const [state, setState] = useState(null);

  useEffect(() => {
    fetchCapitalState().then(setState).catch(() => setState(null));
  }, []);

  if (!state) return null;

  const releasedPct = state.totalCapitalLocked
    ? Math.round((state.capitalReleased / state.totalCapitalLocked) * 100)
    : 0;

  return (
    <Surface variant="panel" className="p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="os-label">Capital Control</div>
          <p className="text-os-sm text-muted-foreground">Escrow posture & blockers</p>
        </div>
        <Wallet className="h-4 w-4 text-primary" />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-os-sm">
          <span className="text-muted-foreground">Locked</span>
          <span className="font-semibold tabular-nums text-foreground">${state.totalCapitalLocked.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between text-os-sm">
          <span className="text-muted-foreground">Released</span>
          <span className="font-semibold tabular-nums text-success">${state.capitalReleased.toLocaleString()}</span>
        </div>
        <Progress value={releasedPct} className="h-2" />
        <div className="text-os-xs text-muted-foreground">{releasedPct}% of locked capital released</div>
        <div className="border border-border/60 rounded-lg p-3 bg-card/60">
          <div className="flex items-center gap-2 text-os-sm text-warning"><AlertTriangle className="h-4 w-4" />Blockers</div>
          <ul className="mt-2 space-y-1 text-os-xs text-muted-foreground">
            {state.blockers.length === 0 ? <li>No blockers detected</li> : state.blockers.map((b) => <li key={b}>• {b}</li>)}
          </ul>
        </div>
        <div className="flex items-center gap-2 text-os-xs text-muted-foreground">
          <Shield className="h-3 w-3" /> Capital at risk: ${state.capitalAtRisk.toLocaleString()}
        </div>
      </div>
    </Surface>
  );
}
