import { Surface } from "@/components/system/Surface";
import { ArrowRight, Activity, Clock, CheckCircle2, AlertCircle, Package } from "lucide-react";
import { Progress } from "@/components/shared/ui/progress";
import { useTrades } from "@/hooks/queries/useTrades";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/shared/ui/skeleton";
import { Badge } from "@/components/shared/ui/badge";

export function LiveTradeFlow() {
  const { data: { activeTrades = [] } = {}, isLoading: loading } = useTrades();
  const navigate = useNavigate();

  // Sort trades by most recent activity or ID
  const trades = activeTrades ? [...activeTrades].slice(0, 6) : [];

  if (loading && !trades.length) {
    return (
      <Surface variant="panel" className="p-5 h-full min-h-[300px]">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3 w-32 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </Surface>
    );
  }

  return (
    <Surface variant="panel" className="p-0 h-full overflow-hidden flex flex-col">
      <div className="p-5 pb-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-white/5 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#D4A937]" />
            <span className="text-os-sm font-bold tracking-wide uppercase text-gray-900 dark:text-gray-100">Live Trade Flow</span>
          </div>
          <p className="text-os-xs text-gray-500 dark:text-gray-400 mt-0.5">Real-time kernel process stream</p>
        </div>
        <Badge variant="outline" className="text-os-xs uppercase font-mono border-gray-200 dark:border-gray-800 text-gray-500">
          {trades.length} Active
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center p-4">
            <Package className="w-8 h-8 text-gray-300 dark:text-gray-700 mb-2" />
            <p className="text-os-sm text-gray-500">No active trades</p>
            <p className="text-os-xs text-gray-400 dark:text-gray-600 mt-1">Start a new trade to see activity here</p>
          </div>
        ) : (
          trades.map((t) => {
            const completed = t.milestones.filter((m) => m.status === "completed").length;
            const pct = Math.round((completed / t.milestones.length) * 100) || 0;
            const isStalled = t.status === 'disputed' || t.status === 'blocked';

            return (
              <div
                key={t.id}
                onClick={() => navigate(`/dashboard/trade/${t.id}`)}
                className="group relative flex flex-col gap-2 p-3 rounded-os-sm hover:bg-gray-100/50 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isStalled ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                        pct === 100 ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                          'bg-[#D4A937]/10 text-[#D4A937]'
                      }`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-os-sm text-gray-900 dark:text-gray-200 group-hover:text-[#D4A937] transition-colors line-clamp-1">
                          {t.productName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-os-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                        <span>{t.corridor.originCountry}</span>
                        <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-700" />
                        <span>{t.corridor.destinationCountry}</span>
                        <span className="text-gray-300 dark:text-gray-700 mx-1">•</span>
                        <span>ID: {t.id.slice(0, 6)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-os-xs font-bold uppercase px-1.5 py-0.5 rounded border ${isStalled ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400' :
                        'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
                      }`}>
                      {t.status}
                    </span>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="relative h-1 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mt-1">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isStalled ? 'bg-red-500' : 'bg-[#D4A937]'
                      }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Milestone Indicators */}
                <div className="flex justify-between px-0.5 mt-1">
                  {t.milestones.slice(0, 4).map((m, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'completed' ? (isStalled ? 'bg-red-400' : 'bg-emerald-400') :
                          m.status === 'active' ? 'bg-[#D4A937] animate-pulse' :
                            'bg-gray-200 dark:bg-gray-800'
                        }`} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Surface>
  );
}
