import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Wallet, Truck, TrendingUp, AlertTriangle, Sparkles, Globe } from 'lucide-react';
import { SignalChip } from './SignalChip';
import { useTradeKernelState } from '@/hooks/useTradeKernelState';

export function OSStatusBar() {
  const {
    trustScore,
    kycStatus,
    escrowLockedValue,
    pipelineValue,
    shipmentsInTransit,
    afcftaReady,
    riskLevel,
    loading,
  } = useTradeKernelState();

  const escrowDisplay = `$${(escrowLockedValue / 1000).toFixed(1)}K`;
  const pipelineDisplay = `$${(pipelineValue / 1000).toFixed(1)}K`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/10 bg-white/5">
        <motion.span
          className="inline-flex items-center justify-center h-2 w-2 rounded-full bg-emerald-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
        <span className="text-[0.65rem] uppercase tracking-[0.28em] text-os-muted">Kernel Live</span>
      </div>

      <SignalChip
        icon={ShieldCheck}
        label="Trust"
        value={loading ? '...' : trustScore}
        tone={trustScore >= 80 ? 'emerald' : trustScore >= 60 ? 'gold' : 'amber'}
      />
      <SignalChip
        icon={Sparkles}
        label="KYC"
        value={kycStatus === 'verified' ? 'VERIFIED' : 'PENDING'}
        tone={kycStatus === 'verified' ? 'emerald' : 'amber'}
      />
      <SignalChip
        icon={Wallet}
        label="Escrow"
        value={loading ? '...' : escrowDisplay}
        tone="gold"
      />
      <SignalChip
        icon={TrendingUp}
        label="Pipeline"
        value={loading ? '...' : pipelineDisplay}
        tone="blue"
      />
      <SignalChip
        icon={Truck}
        label="Transit"
        value={loading ? '...' : shipmentsInTransit}
        tone={shipmentsInTransit > 0 ? 'emerald' : 'neutral'}
      />
      <SignalChip
        icon={Globe}
        label="AfCFTA"
        value={afcftaReady ? 'READY' : 'ALIGN'}
        tone={afcftaReady ? 'emerald' : 'amber'}
      />
      <SignalChip
        icon={AlertTriangle}
        label="Risk"
        value={riskLevel.toUpperCase()}
        tone={riskLevel === 'high' ? 'amber' : riskLevel === 'medium' ? 'gold' : 'emerald'}
      />
    </div>
  );
}
