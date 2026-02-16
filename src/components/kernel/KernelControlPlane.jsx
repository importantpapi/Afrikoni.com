import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, Wallet, Truck, AlertTriangle, Sparkles, Globe, Radar, Clock, ArrowRight, ChevronRight } from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { Button } from '@/components/shared/ui/button';
import { useKernelState } from '@/hooks/useKernelState';
import { useTradeKernelState } from '@/hooks/useTradeKernelState';
import { useTrades } from '@/hooks/queries/useTrades';
import { useKernelEventStream } from '@/hooks/useKernelEventStream';
import { cn } from '@/lib/utils';

export default function KernelControlPlane({ companyId }) {
  const navigate = useNavigate();
  const { data: kernelData, loading: kernelLoading } = useKernelState();
  
  // ✅ REACT QUERY: Get trade data
  const { data: { activeTrades = [], pipelineValue = 0 } = {}, isLoading: tradesLoading } = useTrades();
  
  // Keep useTradeKernelState for other metrics (trustScore, escrow, etc) until fully migrated
  const {
    trustScore,
    kycStatus,
    escrowLockedValue,
    shipmentsInTransit,
    afcftaReady,
    riskLevel,
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

  // Actionable metric handlers
  const handleTrustScoreClick = () => {
    if (kycStatus !== 'verified') {
      navigate('/dashboard/kyc');
    } else {
      navigate('/dashboard/performance');
    }
  };

  const handleEscrowClick = () => {
    navigate('/dashboard/payments');
  };

  const handleRiskClick = () => {
    if (tradeStats.blocked > 0) {
      navigate('/dashboard/disputes');
    } else {
      navigate('/dashboard/risk');
    }
  };

  const handleComplianceClick = () => {
    navigate('/dashboard/compliance');
  };

  const handleShipmentsClick = () => {
    navigate('/dashboard/shipments');
  };

  return (
    <Surface variant="glass" className="p-6 border border-os-stroke/60">
      <div className="flex items-center justify-between">
        <div>
          <div className="os-label">Kernel Control Plane</div>
          <h3 className="text-os-lg font-semibold text-[var(--os-text-primary)] mt-1">System Integrity</h3>
        </div>
        <StatusBadge label={kernelLoading ? 'SYNCING' : 'LIVE'} tone="neutral" />
      </div>

      {/* Actionable Metrics Grid */}
      <div className="mt-5 grid md:grid-cols-3 gap-4">
        {/* Trust Score - Actionable */}
        <button
          onClick={handleTrustScoreClick}
          className="os-panel-soft p-4 text-left transition-all hover:bg-white/10 hover:border-white/20 border border-transparent group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-os-sm font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Trust Score
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
          </div>
          <div className="text-os-2xl font-semibold mt-2">{kernelLoading ? '…' : trustScore}</div>
          <div className="text-os-xs text-os-muted mt-1">
            KYC: {kycStatus === 'verified' ? 'Verified' : 'Pending'}
          </div>
          {kycStatus !== 'verified' && (
            <div className="mt-2 text-os-xs text-amber-400">
              → Complete KYC to unlock features
            </div>
          )}
        </button>

        {/* Escrow Exposure - Actionable */}
        <button
          onClick={handleEscrowClick}
          className="os-panel-soft p-4 text-left transition-all hover:bg-white/10 hover:border-white/20 border border-transparent group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-os-sm font-semibold">
              <Wallet className="w-4 h-4 text-amber-400" /> Escrow Exposure
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
          </div>
          <div className="text-os-2xl font-semibold mt-2">{kernelLoading ? '…' : escrowDisplay}</div>
          <div className="text-os-xs text-os-muted mt-1">Pipeline: {kernelLoading ? '…' : pipelineDisplay}</div>
          {escrowLockedValue > 0 && (
            <div className="mt-2 text-os-xs text-emerald-400">
              → View payment details
            </div>
          )}
        </button>

        {/* Risk Surface - Actionable */}
        <button
          onClick={handleRiskClick}
          className={cn(
            "os-panel-soft p-4 text-left transition-all hover:bg-white/10 hover:border-white/20 border border-transparent group",
            riskLevel === 'high' && "border-red-500/30"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-os-sm font-semibold">
              <AlertTriangle className={cn(
                "w-4 h-4",
                riskLevel === 'high' ? 'text-red-400' : riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'
              )} /> Risk Surface
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
          </div>
          <div className="text-os-2xl font-semibold mt-2">{riskLevel.toUpperCase()}</div>
          <div className="text-os-xs text-os-muted mt-1">Blocked Trades: {tradeStats.blocked}</div>
          {tradeStats.blocked > 0 && (
            <div className="mt-2 text-os-xs text-red-400">
              → Resolve {tradeStats.blocked} dispute{tradeStats.blocked !== 1 ? 's' : ''}
            </div>
          )}
        </button>
      </div>

      <div className="mt-6 grid lg:grid-cols-[1.2fr_1fr] gap-4">
        {/* Kernel Event Stream - Actionable Events */}
        <div className="os-panel-soft p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-os-sm font-semibold">
              <Radar className="w-4 h-4 text-os-gold" /> Kernel Event Stream
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/trace-center')}
              className="h-auto py-1 px-2 text-os-xs"
            >
              View All
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {(eventLoading ? [] : timeline).slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  // Navigate based on event type
                  if (item.type === 'trade') navigate(`/dashboard/trade/${item.relatedId}`);
                  else if (item.type === 'rfq') navigate(`/dashboard/rfqs/${item.relatedId}`);
                  else if (item.type === 'shipment') navigate(`/dashboard/shipments/${item.relatedId}`);
                }}
                className="w-full flex items-center justify-between text-os-xs hover:bg-white/5 p-2 rounded transition-colors group"
              >
                <span className="text-[var(--os-text-primary)] group-hover:text-white">{item.label}</span>
                <span className="text-os-muted font-mono">{item.time}</span>
              </button>
            ))}
            {!eventLoading && timeline.length === 0 && (
              <div className="text-os-xs text-os-muted">No kernel events yet.</div>
            )}
          </div>
        </div>

        {/* Corridor Health - Actionable Metrics */}
        <div className="os-panel-soft p-4">
          <div className="flex items-center gap-2 text-os-sm font-semibold mb-3">
            <Globe className="w-4 h-4 text-emerald-400" /> Corridor Health
          </div>
          <div className="space-y-2 text-os-xs text-os-muted">
            {/* AfCFTA Readiness - Actionable */}
            <button
              onClick={() => navigate('/dashboard/compliance')}
              className="w-full flex items-center justify-between hover:bg-white/5 p-2 rounded transition-colors group"
            >
              <span>AfCFTA readiness</span>
              <span className={cn(
                "text-[var(--os-text-primary)] group-hover:text-white",
                !afcftaReady && "text-amber-400"
              )}>
                {afcftaReady ? 'READY' : 'ALIGNING →'}
              </span>
            </button>

            {/* In Transit - Actionable */}
            <button
              onClick={handleShipmentsClick}
              className="w-full flex items-center justify-between hover:bg-white/5 p-2 rounded transition-colors group"
            >
              <span>In transit</span>
              <span className="text-[var(--os-text-primary)] group-hover:text-white">
                {shipmentsInTransit} {shipmentsInTransit > 0 && '→'}
              </span>
            </button>

            {/* Compliance Queue - Actionable */}
            <button
              onClick={handleComplianceClick}
              className="w-full flex items-center justify-between hover:bg-white/5 p-2 rounded transition-colors group"
            >
              <span>Compliance queue</span>
              <span className={cn(
                "text-[var(--os-text-primary)] group-hover:text-white",
                tradeStats.inCompliance > 0 && "text-amber-400"
              )}>
                {tradeStats.inCompliance} {tradeStats.inCompliance > 0 && '→'}
              </span>
            </button>

            {/* Live Trades - Actionable */}
            <button
              onClick={() => navigate('/dashboard/trade-pipeline')}
              className="w-full flex items-center justify-between hover:bg-white/5 p-2 rounded transition-colors group"
            >
              <span>Live trades</span>
              <span className="text-[var(--os-text-primary)] group-hover:text-white">
                {activeTrades?.length || 0} →
              </span>
            </button>
          </div>
        </div>
      </div>
    </Surface>
  );
}
