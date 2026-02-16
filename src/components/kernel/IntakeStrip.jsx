import { Surface } from "@/components/system/Surface";
import { Progress } from "@/components/shared/ui/progress";

const items = [
  { label: "RFQs", value: 5, amount: "$283K" },
  { label: "Contracts", value: 2, amount: "$87K" },
  { label: "Shipments", value: 4, amount: "$75K" },
  { label: "Capital", value: "$293K", amount: "Ahead" },
];

export function IntakeStrip() {
  return (
    <Surface variant="panel" className="p-5 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="absolute inset-x-10 bottom-2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent blur" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-foreground">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="text-os-xs uppercase tracking-wide text-muted-foreground">{item.label}</div>
            <div className="flex items-center justify-between">
              <span className="text-os-xl font-semibold">{item.value}</span>
              <span className="text-os-xs text-muted-foreground">{item.amount}</span>
            </div>
            <Progress value={72} className="h-1" />
          </div>
        ))}
      </div>
    </Surface>
  );
}
