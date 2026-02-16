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

  // Human-readable translations
  const humanMessages = {
    kernelLive: "System Online – Your trades are being monitored",
    trust: trustScore >= 80 ? "High Trust – Premium rates available" : "Building Trust – Complete verification",
    kyc: kycStatus === 'verified' ? "Identity Verified – Full access enabled" : "Verification Needed – Some features limited",
    escrow: `$${escrowDisplay} Protected – Your payments are secured`,
    afcfta: afcftaReady ? "Cross-border Ready – No extra taxes expected" : "Border Compliance – Some restrictions apply",
    risk: riskLevel === 'low' ? "Low Risk – Escrow protects you" : "Review Required – Check trade details"
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* TRADE IS ACTIVE - Horizon 2026 Calm Status */}
      <div className="health-capsule">
        <div className="health-dot" />
        <span className="text-os-text-primary">Trade is Active</span>
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
