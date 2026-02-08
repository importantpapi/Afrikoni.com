import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, DollarSign, Truck, Activity, TrendingUp,
  AlertTriangle, CheckCircle, Clock
} from 'lucide-react';

/**
 * KernelStatusBar - Trade Kernel real-time status strip
 *
 * Shows the state of all kernel modules at a glance.
 * Inspired by Bloomberg Terminal status bars and Palantir Foundry.
 */

function StatusPill({ icon: Icon, label, value, status = 'normal', className = '' }) {
  const statusColors = {
    good: 'text-emerald-400 border-emerald-900/30 bg-emerald-950/30',
    warning: 'text-amber-400 border-amber-900/30 bg-amber-950/30',
    critical: 'text-red-400 border-red-900/30 bg-red-950/30',
    normal: 'text-gray-300 border-[#2A2A2A] bg-[#141414]',
    gold: 'text-[#D4A937] border-[#D4A937]/20 bg-[#D4A937]/5',
  };

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${statusColors[status]} ${className}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="text-[10px] font-medium text-gray-500 hidden xl:inline">{label}</span>
      <span className="text-[11px] font-mono font-bold">{value}</span>
    </div>
  );
}

export default function KernelStatusBar({
  trustScore = 78,
  verificationStatus = 'verified',
  escrowTotal = 64000,
  escrowReleased = 19200,
  activeShipments = 1,
  complianceReady = true,
  pipelineValue = 100100,
  className = '',
}) {
  const escrowPercent = escrowTotal > 0 ? Math.round((escrowReleased / escrowTotal) * 100) : 0;

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {/* Trust Score */}
      <StatusPill
        icon={ShieldCheck}
        label="Trust"
        value={trustScore}
        status={trustScore >= 70 ? 'good' : trustScore >= 50 ? 'warning' : 'critical'}
      />

      {/* Verification */}
      <StatusPill
        icon={verificationStatus === 'verified' ? CheckCircle : Clock}
        label="KYC"
        value={verificationStatus === 'verified' ? 'VERIFIED' : 'PENDING'}
        status={verificationStatus === 'verified' ? 'good' : 'warning'}
      />

      {/* Escrow */}
      <StatusPill
        icon={DollarSign}
        label="Escrow"
        value={`$${(escrowTotal / 1000).toFixed(0)}K (${escrowPercent}%)`}
        status="gold"
      />

      {/* Pipeline Value */}
      <StatusPill
        icon={TrendingUp}
        label="Pipeline"
        value={`$${(pipelineValue / 1000).toFixed(1)}K`}
        status="normal"
      />

      {/* Shipments */}
      <StatusPill
        icon={Truck}
        label="Transit"
        value={`${activeShipments} active`}
        status={activeShipments > 0 ? 'good' : 'normal'}
      />

      {/* Compliance */}
      <StatusPill
        icon={complianceReady ? Activity : AlertTriangle}
        label="AfCFTA"
        value={complianceReady ? 'READY' : 'ACTION'}
        status={complianceReady ? 'good' : 'warning'}
      />
    </div>
  );
}
