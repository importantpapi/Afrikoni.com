import { Surface } from "@/components/system/Surface";
import { useTradeCopilot } from "@/hooks/useTradeCopilot";
import { Sparkles, ArrowRight } from "lucide-react";

export function TradeCopilotPanel() {
  const { actions, loading } = useTradeCopilot();

  return (
    <Surface variant="panel" className="p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="os-label">AI Trade Co-Pilot</div>
          <p className="text-os-sm text-muted-foreground">Operational intelligence to unblock flows</p>
        </div>
        <Sparkles className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-3">
        {loading && <p className="text-os-xs text-muted-foreground">Scanning trades…</p>}
        {!loading && actions.map((action) => (
          <div key={action.id} className="p-3 rounded-lg border border-border/60 bg-card/80 flex items-start gap-3">
            <div className={`status-badge ${action.priority === "high" ? "status-rejected" : "status-pending"}`}>
              {action.priority.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-os-sm font-semibold text-foreground">{action.title}</p>
              <p className="text-os-xs text-muted-foreground">{action.impact}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>
    </Surface>
  );
}
