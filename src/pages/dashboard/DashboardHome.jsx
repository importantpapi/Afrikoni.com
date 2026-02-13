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
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DashboardHome() {
  const { isSystemReady, profileCompanyId, userId, organization } = useDashboardKernel();
  const { data: { activeTrades = [] } = {}, isLoading: tradesLoading } = useTrades();
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

  return (
    <div className="os-page os-stagger space-y-10 max-w-7xl mx-auto pb-24 px-4 py-8">
      {/* 1. KERNEL HEADER - Redesigned for 2026 Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-afrikoni-gold/10 rounded-lg border border-afrikoni-gold/20">
              <Shell className="w-5 h-5 text-afrikoni-gold" />
            </div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              Trade OS <span className="text-os-muted">/ Command Center</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-os-muted">
              Unified Horizon Protocol v10.0
            </div>
            <div className="hidden md:flex items-center gap-2 text-emerald-500/60 text-[10px] font-bold uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Kernel Synchronized
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <OSStatusBar />
        </div>
      </div>

      {/* 2. CORE ARCHITECTURE */}
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-10">

          {/* A. INTELLIGENT ACTIONS */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-os-muted flex items-center gap-3">
                <Zap className="w-4 h-4 text-afrikoni-gold" />
                Intelligent Orchestration
              </h2>
            </div>
            <QuickActionsWidget />
          </div>

          {/* B. TODAY'S AGENDA */}
          <div className="space-y-6">
            <TodaysActions />
          </div>

          {/* C. ACTIVE FLOWS - Modernized with Surface and Better Visuals */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-os-muted flex items-center gap-3">
                <Activity className="w-4 h-4 text-emerald-500" />
                Live Logistics Pipeline
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/trade-pipeline')} className="text-os-muted hover:text-afrikoni-gold font-bold text-[10px] uppercase tracking-widest gap-2">
                Full Spectrum <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            <Surface variant="glass" className="p-1 overflow-hidden">
              {tradesLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />)}
                </div>
              ) : activeTrades && activeTrades.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {activeTrades.map((trade, i) => (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => navigate(`/dashboard/trade/${trade.id}`)}
                      className="group flex items-center justify-between p-6 hover:bg-white/[0.03] transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-afrikoni-gold opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="flex items-center gap-6 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-afrikoni-gold/10 group-hover:border-afrikoni-gold/20 transition-all">
                          <Ship className="w-7 h-7 text-os-muted group-hover:text-afrikoni-gold transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-black text-lg group-hover:text-afrikoni-gold transition-colors">{trade.productName}</h3>
                            <Badge className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              {trade.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-os-muted font-bold uppercase tracking-widest">
                            <Globe className="w-3 h-3" />
                            {trade.corridor.originCountry} <ArrowRight className="w-2.5 h-2.5 mx-1" /> {trade.corridor.destinationCountry}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 text-right pr-4">
                        <div className="hidden md:block">
                          <div className="text-[10px] text-os-muted font-black uppercase tracking-widest opacity-40">Progress</div>
                          <div className="flex items-center gap-1.5 justify-end mt-1">
                            <span className="text-sm font-black font-mono">75%</span>
                            <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 w-3/4" />
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-os-muted group-hover:text-afrikoni-gold group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-white/[0.01]">
                  <Box className="w-16 h-16 text-white/5 mx-auto mb-6" />
                  <h3 className="text-xl font-black mb-2 italic">Horizon Clear</h3>
                  <p className="text-os-muted text-sm max-w-xs mx-auto mb-8">No active trade flows detected in the current orchestration window.</p>
                  <Button
                    className="bg-afrikoni-gold text-black font-black px-10 py-6 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-afrikoni-gold/10"
                    onClick={() => navigate('/dashboard/quick-trade/new')}
                  >
                    Initiate Prime Trade
                  </Button>
                </div>
              )}
            </Surface>
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

          {/* F. NETWORK STATUS */}
          <Surface variant="panel" className="p-6 border-emerald-500/10 bg-emerald-500/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70 text-center mx-auto">Continental Rail: Optimized</span>
            </div>
            <div className="flex gap-1 items-center justify-center">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="w-1.5 h-4 bg-emerald-500/20 rounded-full relative overflow-hidden">
                  <motion.div
                    animate={{ height: ['20%', '100%', '20%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="absolute bottom-0 left-0 right-0 bg-emerald-500"
                  />
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div >
    </div >
  );
}
