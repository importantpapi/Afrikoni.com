import { Lock, ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/shared/ui/progress";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/system/Surface";

export default function EscrowWidget({ payment }) {
  // ✅ MOBILE GUARD: Handle missing payment data gracefully
  if (!payment) {
    return (
      <Surface variant="glass" className="p-5 border border-white/5">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-white/10 rounded w-1/2" />
          <div className="h-2 bg-white/10 rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-white/10 rounded" />
            <div className="h-16 bg-white/10 rounded" />
          </div>
        </div>
      </Surface>
    );
  }

  // ✅ DEFENSIVE: Safe numeric calculations with fallbacks
  const totalAmount = Number(payment?.totalAmount) || 0;
  const releasedAmount = Number(payment?.releasedAmount) || 0;
  const heldAmount = Number(payment?.heldAmount) || 0;
  const fxRate = payment?.fxRate || 1.0;
  
  const releasedPercent = totalAmount > 0
    ? (releasedAmount / totalAmount) * 100
    : 0;

  return (
    <Surface variant="glass" className="p-5 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-os-sm font-semibold text-[var(--os-text-primary)]">Escrow Overview</p>
          <p className="text-os-xs text-os-muted">
            Milestone-based release visibility
          </p>
        </div>
        <span className="text-os-xs text-os-muted font-mono">
          FX {fxRate.toFixed(2)}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-os-sm">
          <span className="text-os-muted">Released</span>
          <span className="font-semibold text-[var(--os-text-primary)] tabular-nums">
            ${releasedAmount.toLocaleString()}
          </span>
        </div>
        <Progress value={releasedPercent} className="h-2 bg-white/10" indicatorClassName="bg-[#D4A937]" />
        <div className="flex items-center justify-between text-os-xs text-os-muted">
          <span>{releasedPercent.toFixed(0)}% released</span>
          <span>${totalAmount.toLocaleString()} total</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          {
            label: "Held",
            value: `$${heldAmount.toLocaleString()}`,
            icon: Lock,
            tone: "text-amber-400",
            bg: "bg-amber-400/10",
          },
          {
            label: "Released",
            value: `$${releasedAmount.toLocaleString()}`,
            icon: ArrowUpRight,
            tone: "text-emerald-400",
            bg: "bg-emerald-400/10",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-lg border border-white/5 p-3 bg-white/5"
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.bg)}>
              <item.icon className={cn("h-4 w-4", item.tone)} />
            </div>
            <div>
              <p className="text-os-xs text-os-muted uppercase tracking-wide">
                {item.label}
              </p>
              <p className="text-os-sm font-semibold text-[var(--os-text-primary)] tabular-nums">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
