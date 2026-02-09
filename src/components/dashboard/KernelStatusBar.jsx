import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, DollarSign, Truck, Activity, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Cpu
} from 'lucide-react';

function StatusPill({ icon: Icon, label, value, status = 'normal', className = '' }) {
  const statusColors = {
    good: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/30',
    warning: 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/30',
    critical: 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/30',
    normal: 'text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#141414]',
    gold: 'text-[#D4A937] border-[#D4A937]/20 bg-[#D4A937]/5',
  };

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${statusColors[status]} ${className}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 hidden xl:inline">{label}</span>
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
      {/* System Brain Indicator */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#D4A937]/20 bg-[#D4A937]/5 mr-1">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <Cpu className="w-3.5 h-3.5 text-[#D4A937]" />
        </motion.div>
        <span className="text-[10px] font-mono font-bold text-[#D4A937] uppercase tracking-wider">KERNEL</span>
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
      </div>

      <StatusPill
        icon={ShieldCheck}
        label="Trust"
        value={trustScore}
        status={trustScore >= 70 ? 'good' : trustScore >= 50 ? 'warning' : 'critical'}
      />
      <StatusPill
        icon={verificationStatus === 'verified' ? CheckCircle : Clock}
        label="KYC"
        value={verificationStatus === 'verified' ? 'VERIFIED' : 'PENDING'}
        status={verificationStatus === 'verified' ? 'good' : 'warning'}
      />
      <StatusPill
        icon={DollarSign}
        label="Escrow"
        value={`$${(escrowTotal / 1000).toFixed(0)}K (${escrowPercent}%)`}
        status="gold"
      />
      <StatusPill
        icon={TrendingUp}
        label="Pipeline"
        value={`$${(pipelineValue / 1000).toFixed(1)}K`}
        status="normal"
      />
      <StatusPill
        icon={Truck}
        label="Transit"
        value={`${activeShipments} active`}
        status={activeShipments > 0 ? 'good' : 'normal'}
      />
      <StatusPill
        icon={complianceReady ? Activity : AlertTriangle}
        label="AfCFTA"
        value={complianceReady ? 'READY' : 'ACTION'}
        status={complianceReady ? 'good' : 'warning'}
      />
    </div>
  );
}
