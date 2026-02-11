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
      {/* KERNEL LIVE - Premium 2026 Design */}
      <div className="relative group">
        {/* Animated gradient border */}
        <motion.div
          className="absolute -inset-[1px] rounded-full bg-gradient-to-r from-emerald-500 via-[#D4A937] to-emerald-500 opacity-75 blur-sm"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ backgroundSize: '200% 200%' }}
        />

        {/* Main container */}
        <div className="relative flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-lg">
          {/* Animated pulse indicator */}
          <div className="relative flex items-center justify-center">
            <motion.span
              className="absolute h-3 w-3 rounded-full bg-emerald-400/30"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.span
              className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>

          {/* Text with gradient */}
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.25em] bg-gradient-to-r from-emerald-400 via-white to-[#D4A937] bg-clip-text text-transparent">
            Kernel Live
          </span>

          {/* Subtle glow effect on hover */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        </div>
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
