import { useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { DashboardSkeleton } from '@/components/shared/ui/skeletons';
import OneFlow from './OneFlow';
import { useTradeKernelState } from '@/hooks/useTradeKernelState';
import { ArrowRight, Box, CreditCard, Ship } from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { OSStatusBar } from '@/components/system/OSStatusBar';
import TodaysActions from '@/components/dashboard/TodaysActions';
import { Button } from '@/components/shared/ui/button';

export default function DashboardHome() {
  const { isSystemReady } = useDashboardKernel();
  const { activeTrades, loading: tradesLoading } = useTradeKernelState();
  const navigate = useNavigate();

  if (!isSystemReady) {
    return <DashboardSkeleton />;
  }

  // If we have active trades, we can show a summary or the latest one
  // For v1.1, we show a "Command Center" overview if no tradeId is in URL
  return (
    <div className="os-page space-y-6 p-4 md:p-8">
      {/* 1. KERNEL HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight">Trade OS <span className="text-os-muted">/ Command Center</span></h1>
          <p className="text-xs text-os-muted font-mono mt-1 uppercase tracking-widest">Unified Horizon Protocol v1.1</p>
        </div>
        <OSStatusBar />
      </div>

      {/* 2. ACTIONS & INTELLIGENCE */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <TodaysActions />

          {/* ACTIVE FLOWS LIST */}
          <Surface variant="glass" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Box className="w-5 h-5 text-afrikoni-gold" />
                Active Trade Flows
              </h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/rfqs')}>View All</Button>
            </div>

            {tradesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-xl" />)}
              </div>
            ) : activeTrades && activeTrades.length > 0 ? (
              <div className="space-y-3">
                {activeTrades.map(trade => (
                  <div
                    key={trade.id}
                    onClick={() => navigate(`/dashboard/trade/${trade.id}`)}
                    className="group flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-afrikoni-gold/10 flex items-center justify-center">
                        <Ship className="w-5 h-5 text-afrikoni-gold" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{trade.productName}</div>
                        <div className="text-[10px] text-os-muted font-mono uppercase mt-0.5">
                          {trade.corridor.originCountry} → {trade.corridor.destinationCountry}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden md:block text-right">
                        <div className="text-[10px] text-os-muted uppercase">Status</div>
                        <div className="text-xs font-medium text-emerald-400 capitalize">{trade.status.replace(/_/g, ' ')}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-os-muted group-hover:text-afrikoni-gold translate-x-0 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                <p className="text-os-muted text-sm">No active trade flows detected in kernel.</p>
                <Button
                  className="mt-4 bg-afrikoni-gold text-black hover:bg-afrikoni-gold/90"
                  onClick={() => navigate('/dashboard/quick-trade')}
                >
                  Initiate New Trade
                </Button>
              </div>
            )}
          </Surface>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Surface variant="glass" className="p-6 bg-gradient-to-br from-emerald-500/10 to-transparent">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4">Account Integrity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-os-muted">Sovereign Identity</span>
                <span className="text-emerald-400 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Verified</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-os-muted">Escrow Balance</span>
                <span className="text-white font-mono">$0.00</span>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] leading-relaxed text-os-muted italic">
                  "All trade flows are monitored by the Sovereign Sentinel AI for compliance and fraud prevention."
                </p>
              </div>
            </div>
          </Surface>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="surface" className="flex flex-col h-auto py-4 gap-2" onClick={() => navigate('/dashboard/rfqs')}>
              <Box className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase">RFQs</span>
            </Button>
            <Button variant="surface" className="flex flex-col h-auto py-4 gap-2" onClick={() => navigate('/dashboard/payments')}>
              <CreditCard className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase">Payments</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

