import { Lock, ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/shared/ui/progress";
import { cn } from "@/lib/utils";
import { Surface } from "@/components/system/Surface";

export default function EscrowWidget({ payment }) {
  const releasedPercent = payment.totalAmount
    ? (payment.releasedAmount / payment.totalAmount) * 100
    : 0;

  return (
    <Surface variant="glass" className="p-5 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-[var(--os-text-primary)]">Escrow Overview</p>
          <p className="text-xs text-os-muted">
            Milestone-based release visibility
          </p>
        </div>
        <span className="text-xs text-os-muted font-mono">
          FX {payment.fxRate}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-os-muted">Released</span>
          <span className="font-semibold text-[var(--os-text-primary)] tabular-nums">
            ${payment.releasedAmount.toLocaleString()}
          </span>
        </div>
        <Progress value={releasedPercent} className="h-2 bg-white/10" indicatorClassName="bg-[#D4A937]" />
        <div className="flex items-center justify-between text-xs text-os-muted">
          <span>{releasedPercent.toFixed(0)}% released</span>
          <span>${payment.totalAmount.toLocaleString()} total</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          {
            label: "Held",
            value: `$${payment.heldAmount.toLocaleString()}`,
            icon: Lock,
            tone: "text-amber-400",
            bg: "bg-amber-400/10",
          },
          {
            label: "Released",
            value: `$${payment.releasedAmount.toLocaleString()}`,
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
              <p className="text-[10px] text-os-muted uppercase tracking-wide">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-[var(--os-text-primary)] tabular-nums">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
