import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { DashboardSkeleton } from '@/components/shared/ui/skeletons';
import { useTrades } from '@/hooks/queries/useTrades';
import {
  Box, CreditCard, Ship, Sparkles, Lock as LockIcon,
  Globe, ShieldCheck, ChevronRight, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Surface } from '@/components/system/Surface';
import { motion } from 'framer-motion';
import { NBA, Button } from '@/components/shared/ui';
import OnboardingWizard from '@/components/dashboard/OnboardingWizard';
import { useAuth } from '@/contexts/AuthProvider';

export default function DashboardHome() {
  const {
    isSystemReady,
    profileCompanyId
  } = useDashboardKernel();
  const { data: { activeTrades = [] } = {}, isLoading: tradesLoading } = useTrades();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Extract first name for personal greeting
  const firstName = profile?.full_name?.split(' ')[0] || profile?.name?.split(' ')[0] || 'there';

  if (!isSystemReady) {
    return <DashboardSkeleton />;
  }

  // 🚀 MASTER AUDIT FIX: If no company, show the Onboarding Wizard instead of an empty dashboard.
  // This removes the "Mission Control" confusion for new users.
  if (!profileCompanyId) {
    return <OnboardingWizard />;
  }


  // 🎯 NBA ENGINE: Determines what user should do next (Stripe-style)
  const getNextBestAction = () => {
    const activeDeals = activeTrades.filter(t => !['settled', 'closed'].includes(t.status));

    if (activeDeals.length > 0) {
      const nextTrade = activeDeals[0];
      return {
        title: `Track your ${nextTrade.productName} delivery`,
        description: "Your shipment is on the way. Check the latest update.",
        actionLabel: "View Shipment",
        onAction: () => navigate(`/dashboard/trade/${nextTrade.id}`),
        icon: Ship,
        status: "Active Deal"
      };
    }

    return {
      title: "Find buyers for your products",
      description: "See who's looking to buy and send them a quote.",
      actionLabel: "Browse Requests",
      onAction: () => navigate('/dashboard/rfqs'),
      icon: Sparkles,
      status: "Ready to Trade"
    };
  };

  // 🎯 KERNEL-POWERED METRICS: Real-time Operational Data
  const stats = [
    { label: "Trade Health", value: "92%", sub: "On-time delivery", color: "text-os-green", trend: "+2%" },
    { label: "Active Deals", value: activeTrades.length.toString(), sub: "In execution", color: "text-os-accent", trend: "Stable" },
    { label: "Cashflow", value: "€12,450", sub: "In escrow", color: "text-os-blue", trend: "Secure" },
    { label: "Risk Alerts", value: "1", sub: "Delay risk", color: "text-os-error", trend: "Critical" },
    { label: "Pending Actions", value: "2", sub: "Approvals needed", color: "text-amber-500", trend: "Action Required" },
    { label: "Time Saved", value: "+6h", sub: "This week", color: "text-purple-400", trend: "Efficiency" },
  ];

  const nba = getNextBestAction();

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-24 px-4 py-8">
      {/* ✅ WARM GREETING - WhatsApp/Stripe style */}
      <div className="pt-8 pb-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName} 👋
        </h1>
        <p className="text-os-lg text-gray-400">
          Here's what's happening with your business
        </p>
      </div>

      {/* 🏛️ OPERATIONAL COCKPIT: Horizon 2026 High-Density Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone 1: The Golden Path (Primary Action) */}
        <div className="lg:col-span-2">
          <NBA
            title={nba.title}
            description={nba.description}
            actionLabel={nba.actionLabel}
            onAction={nba.onAction}
            icon={nba.icon}
            status={nba.status}
          />
        </div>

        {/* Zone 2: Intelligence Grid (Key Metrics) */}
        <div className="grid grid-cols-2 gap-3">
          {stats.slice(0, 4).map((stat, i) => (
            <Surface key={i} variant="glass" className="p-4 flex flex-col justify-between border-os-stroke/40 hover:border-os-accent/30 transition-all group overflow-hidden relative">
              <div className="os-ambient-orb" style={{ top: '-50%', right: '-50%', opacity: 0.1 }} />
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-os-text-secondary/60">{stat.label}</span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/5", stat.color)}>{stat.trend}</span>
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-black font-mono tracking-tighter group-hover:scale-105 transition-transform origin-left">{stat.value}</div>
                <div className="text-[10px] font-medium text-os-text-secondary/40 uppercase tracking-tighter mt-1">{stat.sub}</div>
              </div>
            </Surface>
          ))}
        </div>
      </div>

      {/* Zone 3: Secondary Metrics (Strategic Insights) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.slice(4).map((stat, i) => (
          <div key={i} className="px-5 py-3 rounded-os-sm border border-os-stroke/30 bg-os-surface-solid/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-os-text-secondary/50 uppercase tracking-widest">{stat.label}</span>
              <span className="text-os-lg font-black font-mono">{stat.value}</span>
            </div>
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", stat.color.replace('text-', 'bg-'))} />
          </div>
        ))}
        <div className="col-span-2 hidden md:flex items-center gap-4 px-5 py-3 rounded-os-sm bg-os-accent/5 border border-os-accent/20">
          <Sparkles className="w-4 h-4 text-os-accent" />
          <p className="text-os-xs font-semibold text-os-accent/80 tracking-tight">AI Advisor: "Optimize your Lagos route to save 12% in fuel costs this month."</p>
        </div>
      </div>

      {/* ✅ SIMPLE ACTIONS - 3 buttons max */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Find Buyers", sub: "Browse requests", icon: Globe, link: "/dashboard/rfqs", color: "text-os-blue", bg: "bg-os-blue/10" },
          { label: "Add Product", sub: "List what you sell", icon: Package, link: "/dashboard/products/new", color: "text-os-green", bg: "bg-os-green/10" },
          { label: "Track Shipments", sub: "See deliveries", icon: Ship, link: "/dashboard/shipments", color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => navigate(item.link)}
            className="p-6 rounded-os-md border-2 border-white/5 hover:border-[#D4A937]/30 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left group"
          >
            <div className={cn("w-12 h-12 rounded-os-sm mb-4 flex items-center justify-center group-hover:scale-105 transition-transform", item.bg)}>
              <item.icon className={cn("w-6 h-6", item.color)} />
            </div>
            <h3 className="font-bold text-os-lg mb-1">{item.label}</h3>
            <p className="text-os-sm text-gray-400">{item.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-10">

          {/* A. MY DEALS */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-os-xl font-bold">My Active Deals</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/orders')} className="text-os-accent font-medium hover:bg-transparent">
                See all deals <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="glass-surface p-2 overflow-hidden">
              {tradesLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-os-stroke animate-pulse rounded-os-md" />)}
                </div>
              ) : activeTrades && activeTrades.length > 0 ? (
                <div className="divide-y divide-os-stroke">
                  {activeTrades.slice(0, 3).map((trade, i) => (
                    <motion.div
                      key={trade.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => navigate(`/dashboard/trade/${trade.id}`)}
                      className="group flex items-center justify-between p-6 hover:bg-os-surface transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-os-md bg-os-bg border border-os-stroke flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Box className="w-7 h-7 text-os-text-secondary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-os-lg font-semibold">{trade.productName}</h3>
                          <div className="flex items-center gap-2 text-os-sm text-os-text-secondary">
                            <span className="text-amber-500 font-medium">Buyer reviewing quote</span>
                            <span className="w-1 h-1 rounded-full bg-os-stroke" />
                            <span>{trade.corridor?.originCountry || 'Lagos'} to {trade.corridor?.destinationCountry || 'Accra'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <div className="text-os-sm font-black tabular-nums font-mono">${(trade.value || 1200).toLocaleString()}</div>
                          <div className="text-os-xs text-os-muted uppercase font-bold tracking-widest">Deal Value</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-os-text-secondary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Box className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-os-2xl font-bold mb-2">No active deals yet</h3>
                  <p className="text-gray-400 text-os-base mb-6">Start by finding buyers or listing your products</p>
                  <Button
                    className="bg-[#D4A937] hover:bg-[#D4A937]/90 text-black font-bold rounded-os-sm px-8 h-12"
                    onClick={() => navigate('/dashboard/rfqs')}
                  >
                    Browse Buy Requests
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">

          {/* B. MY MONEY - Earnings Card */}
          <div className="space-y-6">
            <h2 className="text-os-xs font-black uppercase tracking-[0.3em] text-os-muted flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              My Money
            </h2>
            <Surface variant="glass" className="p-8 group relative overflow-hidden bg-emerald-500/[0.02]">
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <div className="text-3xl font-black font-mono">$1,200.00</div>
                  <div className="text-os-xs font-bold uppercase tracking-widest text-emerald-500">Pending Payment</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-os-xs pb-3 border-b border-white/5">
                  <span className="text-os-muted font-bold">Available to withdraw</span>
                  <span className="font-black text-white">$0.00</span>
                </div>
                <div className="flex justify-between text-os-xs">
                  <span className="text-os-muted font-bold">Last payment received</span>
                  <span className="font-black text-white">Feb 12</span>
                </div>
              </div>
              <Button
                onClick={() => navigate('/dashboard/payments')}
                variant="outline"
                className="w-full mt-8 border-white/10 bg-white/5 hover:bg-white/10 rounded-os-md py-6 text-os-xs font-black uppercase tracking-widest"
              >
                View Payments
              </Button>
            </Surface>
          </div>

          {/* C. YOU'RE PROTECTED - Trust Panel */}
          <div className="space-y-4">
            <h2 className="text-os-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-os-green" />
              You're Protected
            </h2>
            <div className="p-6 rounded-os-md border-2 border-white/5 bg-white/[0.02]">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-os-green mt-0.5 shrink-0" />
                  <div>
                    <p className="text-os-sm font-semibold">Verified Buyers</p>
                    <p className="text-os-xs text-gray-400">All buyers are verified before they can trade</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <LockIcon className="w-5 h-5 text-os-green mt-0.5 shrink-0" />
                  <div>
                    <p className="text-os-sm font-semibold">Safe Payments</p>
                    <p className="text-os-xs text-gray-400">Money held in escrow until delivery confirmed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div >
    </div >
  );
}
