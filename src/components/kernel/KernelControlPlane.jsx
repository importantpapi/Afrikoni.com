import React, { useMemo } from 'react';
import { Activity, ShieldCheck, Wallet, Truck, AlertTriangle, Sparkles, Globe, Radar, Clock } from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { useKernelState } from '@/hooks/useKernelState';
import { useTradeKernelState } from '@/hooks/useTradeKernelState';
import { useKernelEventStream } from '@/hooks/useKernelEventStream';

export default function KernelControlPlane({ companyId }) {
  const { data: kernelData, loading: kernelLoading } = useKernelState();
  const {
    trustScore,
    kycStatus,
    escrowLockedValue,
    pipelineValue,
    shipmentsInTransit,
    afcftaReady,
    riskLevel,
    activeTrades,
    loading: tradeLoading,
  } = useTradeKernelState();
  const { timeline, loading: eventLoading } = useKernelEventStream({ companyId, limit: 10 });

  const escrowDisplay = `$${(escrowLockedValue / 1000).toFixed(1)}K`;
  const pipelineDisplay = `$${(pipelineValue / 1000).toFixed(1)}K`;
  const riskTone = riskLevel === 'high' ? 'danger' : riskLevel === 'medium' ? 'warning' : 'good';

  const tradeStats = useMemo(() => {
    const trades = Array.isArray(activeTrades) ? activeTrades : [];
    const inCompliance = trades.filter((t) => t.status === 'escrow_required').length;
    const blocked = trades.filter((t) => t.status === 'disputed').length;
    const inTransit = trades.filter((t) => t.status === 'in_transit').length;
    return { inCompliance, blocked, inTransit };
  }, [activeTrades]);

  return (
    <Surface variant="glass" className="p-6 border border-os-stroke/60">
      <div className="flex items-center justify-between">
        <div>
          <div className="os-label">Kernel Control Plane</div>
          <h3 className="text-lg font-semibold text-[var(--os-text-primary)] mt-1">System Integrity</h3>
        </div>
        <StatusBadge label={kernelLoading ? 'SYNCING' : 'LIVE'} tone="neutral" />
      </div>

      <div className="mt-5 grid md:grid-cols-3 gap-4">
        <div className="os-panel-soft p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Trust Score
          </div>
          <div className="text-2xl font-semibold mt-2">{kernelLoading ? '…' : trustScore}</div>
          <div className="text-xs text-os-muted mt-1">KYC: {kycStatus === 'verified' ? 'Verified' : 'Pending'}</div>
        </div>
        <div className="os-panel-soft p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Wallet className="w-4 h-4 text-amber-400" /> Escrow Exposure
          </div>
          <div className="text-2xl font-semibold mt-2">{kernelLoading ? '…' : escrowDisplay}</div>
          <div className="text-xs text-os-muted mt-1">Pipeline: {kernelLoading ? '…' : pipelineDisplay}</div>
        </div>
        <div className="os-panel-soft p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Risk Surface
          </div>
          <div className="text-2xl font-semibold mt-2">{riskLevel.toUpperCase()}</div>
          <div className="text-xs text-os-muted mt-1">Blocked Trades: {tradeStats.blocked}</div>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-[1.2fr_1fr] gap-4">
        <div className="os-panel-soft p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Radar className="w-4 h-4 text-os-gold" /> Kernel Event Stream
          </div>
          <div className="mt-3 space-y-3">
            {(eventLoading ? [] : timeline).slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="text-[var(--os-text-primary)]">{item.label}</span>
                <span className="text-os-muted font-mono">{item.time}</span>
              </div>
            ))}
            {!eventLoading && timeline.length === 0 && (
              <div className="text-xs text-os-muted">No kernel events yet.</div>
            )}
          </div>
        </div>

        <div className="os-panel-soft p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="w-4 h-4 text-emerald-400" /> Corridor Health
          </div>
          <div className="mt-3 space-y-2 text-xs text-os-muted">
            <div className="flex items-center justify-between">
              <span>AfCFTA readiness</span>
              <span className="text-[var(--os-text-primary)]">{afcftaReady ? 'READY' : 'ALIGNING'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>In transit</span>
              <span className="text-[var(--os-text-primary)]">{shipmentsInTransit}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Compliance queue</span>
              <span className="text-[var(--os-text-primary)]">{tradeStats.inCompliance}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Live trades</span>
              <span className="text-[var(--os-text-primary)]">{activeTrades?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Surface>
  );
}
