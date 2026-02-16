import { Surface } from "@/components/system/Surface";
import { useEffect, useState } from "react";
import { fetchCompliance } from "@/api/kernelService";
import { Progress } from "@/components/shared/ui/progress";
import { BadgeCheck } from "lucide-react";

export function CompliancePanel() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchCompliance().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return null;

  return (
    <Surface variant="panel" className="p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="os-label">Compliance Kernel</div>
          <p className="text-os-sm text-muted-foreground">AfCFTA readiness & Rules of Origin</p>
        </div>
        <BadgeCheck className={`h-5 w-5 ${data.afcftaEligible ? "text-success" : "text-warning"}`} />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-os-sm">
          <span className="text-muted-foreground">Readiness</span>
          <span className="font-semibold text-foreground">{data.readiness}%</span>
        </div>
        <Progress value={data.readiness} className="h-2" />
        <div className="text-os-xs text-muted-foreground">{data.rulesOfOrigin}</div>
        <div className="flex items-center gap-2 text-os-sm">
          <span className={`status-badge ${data.afcftaEligible ? "status-verified" : "status-pending"}`}>
            {data.afcftaEligible ? "AfCFTA Eligible" : "Upload Certificate"}
          </span>
        </div>
      </div>
    </Surface>
  );
}
