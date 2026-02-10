import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useKernelState } from '@/hooks/useKernelState';
import { useTradeKernelState } from '@/hooks/useTradeKernelState';
import { Surface } from '@/components/system/Surface';
import { LiveTradeFlow } from '@/components/kernel/LiveTradeFlow';
import { SystemStateBar } from '@/components/kernel/SystemStateBar';
import KernelControlPlane from '@/components/kernel/KernelControlPlane';
import { OSStatusBar } from '@/components/system/OSStatusBar';
import AITradeCopilot from '@/components/dashboard/AITradeCopilot';

import {
  Activity, Shield, Wallet, Truck, AlertTriangle, ChevronRight,
  TrendingUp, ArrowUpRight, Clock, MapPin, Anchor,
  CheckCircle2, XCircle
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyConverter';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';

// --- Trade State Panel Component ---
const TradeStatePanel = ({ label, value, subtext, icon: Icon, tone = 'neutral', onClick }) => (
  <Surface
    variant="glass"
    className={`
      p-5 flex flex-col justify-between h-[140px] relative overflow-hidden group cursor-pointer border border-white/5 hover:border-white/10 transition-all
      ${onClick ? 'hover:bg-white/5' : ''}
    `}
    onClick={onClick}
  >
    <div className={`absolute top-0 right-0 p-[50px] bg-gradient-to-br from-transparent to-${tone === 'good' ? 'emerald' : tone === 'bad' ? 'red' : 'amber'}-500/10 blur-[40px] rounded-full translate-x-10 -translate-y-10`} />

    <div className="flex justify-between items-start z-10">
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center
        ${tone === 'good' ? 'bg-emerald-500/20 text-emerald-500' :
          tone === 'bad' ? 'bg-red-500/20 text-red-500' :
            'bg-[#D4A937]/20 text-[#D4A937]'}
      `}>
        <Icon className="w-4 h-4" />
      </div>
      {tone === 'bad' && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
    </div>

    <div className="z-10">
      <div className="text-2xl font-bold tracking-tight text-white/90 font-mono">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider font-semibold text-white/50 mt-1">
        {label}
      </div>
    </div>

    {subtext && (
      <div className="z-10 text-[10px] text-white/40 font-mono mt-2 border-t border-white/5 pt-2 flex items-center gap-1">
        {subtext}
      </div>
    )}
  </Surface>
);

// --- Trade Flow Timeline Component ---
const TradeFlowTimeline = ({ trades }) => {
  const navigate = useNavigate();
  // Mock stages if no real trades yet
  const stages = [
    { label: 'RFQ', count: trades.filter(t => ['draft', 'rfq_open'].includes(t.status)).length },
    { label: 'Quote', count: trades.filter(t => ['quoted'].includes(t.status)).length },
    { label: 'Contract', count: trades.filter(t => ['contracted'].includes(t.status)).length },
    { label: 'Escrow', count: trades.filter(t => ['escrow_required', 'escrow_funded'].includes(t.status)).length },
    { label: 'Shipment', count: trades.filter(t => ['pickup_scheduled', 'in_transit'].includes(t.status)).length },
    { label: 'Delivery', count: trades.filter(t => ['delivered', 'accepted'].includes(t.status)).length },
    { label: 'Settlement', count: trades.filter(t => ['settled', 'closed'].includes(t.status)).length },
  ];

  return (
    <Surface variant="glass" className="p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#D4A937]" />
          Active Trade Pipeline
        </h3>
        <button className="text-[10px] uppercase font-bold text-[#D4A937] hover:underline" onClick={() => navigate('/dashboard/trade-pipeline')}>
          View Full Map
        </button>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className="absolute top-[18px] left-0 right-0 h-[2px] bg-white/5 z-0" />

        <div className="grid grid-cols-7 gap-2 relative z-10">
          {stages.map((stage, i) => {
            const isActive = stage.count > 0;
            return (
              <div key={stage.label} className="flex flex-col items-center gap-3 group cursor-pointer hover:bg-white/5 rounded-lg py-2 transition-colors">
                <div className={`
                  w-9 h-9 rounded-full flex items-center justify-center border-[3px] transition-all
                  ${isActive
                    ? 'bg-[#0E0E0E] border-[#D4A937] text-[#D4A937] shadow-[0_0_15px_rgba(212,169,55,0.3)] scale-110'
                    : 'bg-[#0E0E0E] border-white/10 text-white/20'}
                `}>
                  <span className="text-[10px] font-bold">{stage.count}</span>
                </div>
                <div className="text-center">
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isActive ? 'text-white' : 'text-white/30'}`}>
                    {stage.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Surface>
  );
};

// --- Main Command Center ---
export default function DashboardHome() {
  const { isSystemReady, profileCompanyId } = useDashboardKernel();
  const { data: kernelData, loading: kernelLoading } = useKernelState();
  const { activeTrades, loading: tradesLoading } = useTradeKernelState(); // Assuming activeTrades added to hook
  const navigate = useNavigate();

  // Combine loading states
  const isLoading = !isSystemReady || kernelLoading || tradesLoading;

  // Derive metrics
  const activeCount = activeTrades?.length || 0;
  const complianceScore = kernelData?.complianceReadiness || 0;
  const capitalInMotion = kernelData?.capitalInMotion || 0;
  const activeCorridors = kernelData?.activeCorridors || 0; // Using kernelData from header logic

  // Mock shipments for UI demo if no data
  const shipmentCount = activeTrades?.filter(t => ['in_transit', 'pickup_scheduled'].includes(t.status)).length || 0;
  const riskCount = activeTrades?.filter(t => t.riskLevel === 'high' || t.status === 'disputed').length || 0;

  if (isLoading) {
    return <SpinnerWithTimeout message="Initializing Trade OS Command Center..." ready={isSystemReady} />;
  }

  return (
    <div className="os-page space-y-6">
      {/* 1. Header Area: Welcome + Kernel Status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-[var(--os-text-primary)]">
            Command Center <span className="text-os-muted mx-2">/</span> Overview
          </h1>
          <p className="text-sm text-os-muted mt-1 font-mono">
            System Operational • {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          {/* Actions moved to Sidebar/Header, kept minimal here */}
        </div>
      </div>

      <Surface variant="glass" className="p-4 border border-os-stroke/50">
        <OSStatusBar />
      </Surface>

      {/* 2. Trade State Panels Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TradeStatePanel
          label="Active Trades"
          value={activeCount}
          subtext={`${activeCorridors} Corridors Active`}
          icon={Activity}
          tone="neutral"
          onClick={() => navigate('/dashboard/trade-pipeline')}
        />
        <TradeStatePanel
          label="Capital Flow"
          value={formatCurrency(capitalInMotion)}
          subtext="In Escrow & Settlement"
          icon={Wallet}
          tone="good"
          onClick={() => navigate('/dashboard/payments')}
        />
        <TradeStatePanel
          label="Shipments"
          value={shipmentCount}
          subtext="In Transit"
          icon={Truck}
          tone="neutral"
          onClick={() => navigate('/dashboard/shipments')}
        />
        <TradeStatePanel
          label="System Risk"
          value={riskCount > 0 ? `${riskCount} Alerts` : "Stable"}
          subtext="Kernel Monitoring"
          icon={AlertTriangle}
          tone={riskCount > 0 ? "bad" : "good"}
          onClick={() => navigate('/dashboard/compliance')}
        />
      </div>

      {/* 3. Main Surface: Timeline + Live Flow */}
      <div className="grid lg:grid-cols-3 gap-6 h-auto min-h-[400px]">

        {/* Left: Trade Flow Timeline (Spans 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <TradeFlowTimeline trades={activeTrades || []} />

          {/* Recent Activity / System Log Surface */}
          <div className="flex-1 overflow-hidden h-[400px]">
            <LiveTradeFlow />
          </div>

          <KernelControlPlane companyId={profileCompanyId} />
        </div>

        {/* Right: AI Intelligence & Rapid Actions */}
        <div className="flex flex-col gap-6">
          <Surface variant="glass" className="p-5 border border-white/5 relative overflow-hidden bg-gradient-to-b from-blue-500/5 to-transparent">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-sm font-bold text-blue-100">Kernel Insights</span>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="text-xs text-blue-200 font-medium">Market Opportunity</div>
                <div className="text-[11px] text-blue-200/60 mt-1 leading-relaxed">
                  Cocoa demand in FR-MRS corridor up 15%. You have 2 matching products.
                </div>
                <button className="mt-2 text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  View RFQs <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="text-xs text-white/80 font-medium">Compliance Alert</div>
                <div className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  AfCFTA certificate missing for pending draft. Upload to unlock lower tariffs.
                </div>
              </div>
            </div>
          </Surface>

          {/* Quick Launchpad */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/dashboard/rfqs/new')}
              className="p-3 bg-[#D4A937] hover:bg-[#C09830] text-black rounded-lg flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(212,169,55,0.2)]"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5px]" />
              <span className="text-[10px] font-bold uppercase tracking-wide">New Trade</span>
            </button>
            <button
              onClick={() => navigate('/dashboard/products/new')}
              className="p-3 bg-white/10 hover:bg-white/15 text-white rounded-lg flex flex-col items-center justify-center gap-1 transition-all border border-white/5"
            >
              <Anchor className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Add Product</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. Secondary Surface: Detailed Metric Flow (Optional expansion area) */}
      <div className="grid grid-cols-1">
        {/* Could add specific corridor map here later */}
      </div>

    </div>
  );
}
