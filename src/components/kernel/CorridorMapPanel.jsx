import { Surface } from "@/components/system/Surface";

export function CorridorMapPanel() {
  return (
    <Surface variant="panel" className="p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="os-label">Corridor Map</div>
        <span className="text-os-xs text-muted-foreground">Medium Risk: 89%</span>
      </div>
      <div className="relative overflow-hidden rounded-os-sm border border-border/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 h-64">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_40%,rgba(255,215,128,0.35),transparent_45%),radial-gradient(circle_at_70%_60%,rgba(103,178,111,0.28),transparent_40%)]" />
        <div className="absolute inset-0 mix-blend-screen opacity-60 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/86/Africa_satellite_image.png')] bg-cover bg-center" />
        <div className="absolute inset-0 flex items-center justify-center text-os-xs text-muted-foreground">
          Corridor map placeholder (replace with real map)
        </div>
      </div>
    </Surface>
  );
}
