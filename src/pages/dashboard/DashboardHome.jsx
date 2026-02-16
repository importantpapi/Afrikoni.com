import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { DashboardSkeleton } from '@/components/shared/ui/skeletons';
import OneFlow from './OneFlow';
import { useTrades } from '@/hooks/queries/useTrades';
import {
  ArrowRight, Box, CreditCard, Ship, Sparkles, Activity,
  Globe, ShieldCheck, Zap, TrendingUp, Layers, ChevronRight,
  LayoutDashboard, Shell
} from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { OSStatusBar } from '@/components/system/OSStatusBar';
import TodaysActions from '@/components/dashboard/TodaysActions';
import QuickActionsWidget from '@/components/dashboard/widgets/QuickActionsWidget';
import RecentRFQsWidget from '@/components/dashboard/widgets/RecentRFQsWidget';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NBA, Button } from '@/components/shared/ui';
import { useWorkspaceMode } from '@/contexts/WorkspaceModeContext';

export default function DashboardHome() {
  const {
    isSystemReady,
    profileCompanyId,
    organization
  } = useDashboardKernel();
  const { data: { activeTrades = [] } = {}, isLoading: tradesLoading } = useTrades();
  const { mode, isSimple } = useWorkspaceMode();
  const navigate = useNavigate();

  if (!isSystemReady || !profileCompanyId) {
    return <DashboardSkeleton />;
  }

  const verificationStatus = organization?.verification_status || 'unverified';
  const trustScore = organization?.trust_score ?? 0;

  // TIER CALCULATOR 2026
  const getInstitutionalTier = (score) => {
    if (score >= 96) return { label: 'Sovereign', tier: 4 };
    if (score >= 86) return { label: 'Premier', tier: 3 };
    if (score >= 71) return { label: 'Institutional', tier: 2 };
    if (score >= 51) return { label: 'Standard', tier: 1 };
    return { label: 'Unverified', tier: 0 };
  };

  const currentTier = getInstitutionalTier(trustScore);

  // 🎯 NBA ENGINE: Determines the "Golden Path" for the user
  const getNextBestAction = () => {
    if (verificationStatus === 'unverified') {
      return {
        title: "Verify your Institutional Identity",
        description: "Complete Layer 1 verification to unlock continental trade corridors and premium escrow rates.",
        actionLabel: "Start Verification",
        onAction: () => navigate('/dashboard/verification'),
        icon: ShieldCheck,
        status: "Verification Required"
      };
    }

    const activeDeliveries = activeTrades.filter(t => !['settled', 'closed'].includes(t.status));
    if (activeDeliveries.length > 0) {
      const nextTrade = activeDeliveries[0];
      return {
        title: `Coordinate delivery for ${nextTrade.productName}`,
        description: "One delivery is awaiting logistics synchronization. Confirm the latest tracking update.",
        actionLabel: "Open Workspace",
        onAction: () => navigate(`/dashboard/trade/${nextTrade.id}`),
        icon: Ship,
        status: "Action Required"
      };
    }

    return {
      title: "Initiate your next trade flow",
      description: "Define your requirements and let the kernel match you with verified continental suppliers.",
      actionLabel: "New Order",
      onAction: () => navigate('/dashboard/rfqs/new'),
      icon: Sparkles,
      status: "Ready for Mission"
    };
  };

  const nba = getNextBestAction();

  return (
    <div className="os-page os-stagger space-y-10 max-w-7xl mx-auto pb-24 px-4 py-8">
      {/* 1. CALM HERO - Mission Control 2026 */}
      <div className="pt-8 pb-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="os-title-large">
              Mission Control
            </h1>
            <div className="health-capsule mt-2">
              <div className="health-dot" />
              <span>Trade is Active</span>
            </div>
          </div>
          <p className="text-os-text-secondary text-lg max-w-2xl">
            Welcome back. Your trade orchestration is currently synchronized across all continental corridors.
          </p>
        </div>
      </div>

      {/* 🎯 NEXT BEST ACTION (NBA) - The Golden Path Hero */}
      <NBA
        title={nba.title}
        description={nba.description}
        actionLabel={nba.actionLabel}
        onAction={nba.onAction}
        icon={nba.icon}
        status={nba.status}
      />

      {/* 2. CORE ARCHITECTURE */}
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-10">

          {/* A. TODAY'S AGENDA */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Today's Focus</h2>
            <TodaysActions />
          </div>

          {/* B. ACTIVE FLOWS */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Deliveries in Progress</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/trade-pipeline')} className="text-os-accent font-medium hover:bg-transparent">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="glass-surface p-2 overflow-hidden">
              {tradesLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-os-stroke animate-pulse rounded-2xl" />)}
                </div>
              ) : activeTrades && activeTrades.length > 0 ? (
                <div className="divide-y divide-os-stroke">
                  {activeTrades.map((trade, i) => (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => navigate(`/dashboard/trade/${trade.id}`)}
                      className="group flex items-center justify-between p-6 hover:bg-os-surface transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-os-bg border border-os-stroke flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Ship className="w-7 h-7 text-os-text-secondary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold">{trade.productName}</h3>
                          <div className="flex items-center gap-2 text-sm text-os-text-secondary">
                            <span>Ready for shipment</span>
                            <span className="w-1 h-1 rounded-full bg-os-stroke" />
                            <span>{trade.corridor.originCountry} to {trade.corridor.destinationCountry}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <div className="text-sm font-semibold">{trade.status.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-os-text-secondary">75% Complete</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-os-text-secondary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Box className="w-12 h-12 text-os-stroke mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-1">Horizon Clear</h3>
                  <p className="text-os-text-secondary text-sm mb-6">No active trade flows detected right now.</p>
                  <Button
                    className="bg-os-text-primary text-os-bg hover:opacity-90 rounded-full px-8"
                    onClick={() => navigate('/dashboard/quick-trade/new')}
                  >
                    Start New Trade
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">

          {/* D. MARKET PULSE */}
          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-os-muted flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-afrikoni-gold" />
              Market Pulse
            </h2>
            <div className="h-[430px]">
              <RecentRFQsWidget />
            </div>
          </div>

          {/* E. INTEGRITY & TRUST */}
          <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-os-muted flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Enterprise Trust
            </h2>
            <Surface variant="glass" className="p-8 group relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 p-12 opacity-[0.03] scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <ShieldCheck className="w-32 h-32" />
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <div className="text-2xl font-black">{currentTier.label}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-os-muted">Tier {currentTier.tier} Verification</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-3xl font-black text-emerald-500">{trustScore}<span className="text-xs text-os-muted opacity-50">%</span></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60">Trust Index</span>
                </div>
              </div>

              <div className="space-y-5 relative z-10">
                {[
                  { label: 'Sovereign Identity', status: 'Active', color: 'text-emerald-500' },
                  { label: 'Corporate Integrity', status: verificationStatus === 'verified' ? 'Active' : 'Pending', color: verificationStatus === 'verified' ? 'text-emerald-500' : 'text-amber-500' },
                  { label: 'Financial Escrow', status: organization?.trust_score > 50 ? 'Liquid' : 'Stable', color: 'text-os-muted' }
                ].map((row, i) => (
                  <div key={row.label} className="flex items-center justify-between text-xs pb-3 border-b border-white/5 last:border-0">
                    <span className="text-os-muted font-bold">{row.label}</span>
                    <span className={cn("font-black uppercase tracking-tighter", row.color)}>{row.status}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => navigate('/dashboard/verification')}
                variant="outline"
                className="w-full mt-8 border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl py-6 text-[10px] font-black uppercase tracking-widest group/btn"
              >
                Upgrade Trust Level <ArrowRight className="w-3 h-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Surface>
          </div>

          {/* F. NETWORK STATUS - Layer 2 (Simplified/Conditional) */}
          {!isSimple && (
            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-os-muted flex items-center gap-3">
                <Activity className="w-4 h-4 text-emerald-500" />
                Railway Optimization
              </h2>
              <Surface variant="panel" className="p-6 border-emerald-500/10 bg-emerald-500/[0.02] flex items-center justify-between">
                <div className="flex gap-1.5 h-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                    <div key={i} className="w-1 bg-emerald-500/20 rounded-full relative overflow-hidden">
                      <motion.div
                        animate={{ height: ['20%', '100%', '20%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                        className="absolute bottom-0 left-0 right-0 bg-emerald-500"
                      />
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-emerald-500/70 tracking-tight">Active Rail Sync</span>
              </Surface>
            </div>
          )}
        </div>
      </div >
    </div >
  );
}
