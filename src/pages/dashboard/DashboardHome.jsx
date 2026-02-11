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
import TodaysActions from '@/components/dashboard/TodaysActions';
import TradeOSErrorBoundary from '@/components/shared/TradeOSErrorBoundary';
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';

import {
  Activity, Shield, Wallet, Truck, AlertTriangle, ChevronRight,
  TrendingUp, ArrowUpRight, Clock, MapPin, Anchor,
  CheckCircle2, XCircle
} from 'lucide-react';
import { formatCurrency } from '@/utils/currencyConverter';
// SpinnerWithTimeout removed as we now use Skeleton

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
      <div className="text-2xl font-bold tracking-tight text-afrikoni-deep font-mono">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider font-semibold text-gray-600 mt-1">
        {label}
      </div>
    </div>

    {subtext && (
      <div className="z-10 text-[10px] text-gray-500 font-mono mt-2 border-t border-afrikoni-gold/10 pt-2 flex items-center gap-1">
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
    <Surface variant="glass" className="p-6 border border-afrikoni-gold/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#D4A937]" />
          Active Trade Pipeline
        </h3>
        <button className="text-[10px] uppercase font-bold text-[#D4A937] hover:underline" onClick={() => navigate('/dashboard/trade-pipeline')}>
          View Full Map
        </button>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className="absolute top-[18px] left-0 right-0 h-[2px] bg-afrikoni-gold/20 z-0" />

        <div className="grid grid-cols-7 gap-2 relative z-10">
          {stages.map((stage, i) => {
            const isActive = stage.count > 0;
            return (
              <div key={stage.label} className="flex flex-col items-center gap-3 group cursor-pointer hover:bg-afrikoni-cream/20 rounded-lg py-2 transition-colors">
                <div className={`
                  w-9 h-9 rounded-full flex items-center justify-center border-[3px] transition-all
                  ${isActive
                    ? 'bg-white dark:bg-[#D4A937]/10 border-[#D4A937] text-[#D4A937] shadow-[0_0_15px_rgba(212,169,55,0.3)] scale-110'
                    : 'bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-gray-400'}
                `}>
                  <span className="text-[10px] font-bold">{stage.count}</span>
                </div>
                <div className="text-center">
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isActive ? 'text-afrikoni-deep' : 'text-gray-400'}`}>
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
    // Show premium skeleton loader instead of spinner
    return <DashboardSkeleton />;
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
        <TradeOSErrorBoundary>
          <OSStatusBar />
        </TradeOSErrorBoundary>
      </Surface>

      {/* Today's Actions - AI Co-Pilot */}
      <TradeOSErrorBoundary>
        <TodaysActions compact={true} />
      </TradeOSErrorBoundary>

      {/* 2. Trade State Panels Grid */}
      <TradeOSErrorBoundary>
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
      </TradeOSErrorBoundary>

      {/* 3. Main Surface: Timeline + Live Flow OR Empty State */}
      {activeCount === 0 ? (
        <TradeOSErrorBoundary>
          <DashboardEmptyState />
        </TradeOSErrorBoundary>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 h-auto min-h-[400px]">

          {/* Left: Trade Flow Timeline (Spans 2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <TradeOSErrorBoundary>
              <TradeFlowTimeline trades={activeTrades || []} />
            </TradeOSErrorBoundary>

            {/* Recent Activity / System Log Surface */}
            <div className="flex-1 overflow-hidden h-[400px]">
              <TradeOSErrorBoundary>
                <LiveTradeFlow />
              </TradeOSErrorBoundary>
            </div>

            <TradeOSErrorBoundary>
              <KernelControlPlane companyId={profileCompanyId} />
            </TradeOSErrorBoundary>
          </div>

          {/* Right: AI Intelligence & Rapid Actions */}
          <div className="flex flex-col gap-6">
            <TradeOSErrorBoundary>
              <Surface variant="glass" className="p-5 border border-afrikoni-gold/10 relative overflow-hidden bg-gradient-to-b from-blue-500/5 to-transparent">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-sm font-bold text-blue-600">Kernel Insights</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Market Opportunity</div>
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 leading-relaxed">
                      Cocoa demand in FR-MRS corridor up 15%. You have 2 matching products.
                    </div>
                    <button className="mt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
                      View RFQs <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="p-3 bg-afrikoni-cream/20 border border-afrikoni-gold/20 rounded-lg">
                    <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">Compliance Alert</div>
                    <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                      AfCFTA certificate missing for pending draft. Upload to unlock lower tariffs.
                    </div>
                  </div>
                </div>
              </Surface>
            </TradeOSErrorBoundary>

            {/* Quick Launchpad */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/dashboard/quick-trade')}
                className="p-3 bg-[#D4A937] hover:bg-[#C09830] text-black rounded-lg flex flex-col items-center justify-center gap-1 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(212,169,55,0.2)]"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5px]" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Quick Trade</span>
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
      )}

      {/* 4. Secondary Surface: Detailed Metric Flow (Optional expansion area) */}
      <div className="grid grid-cols-1">
        {/* Could add specific corridor map here later */}
      </div>

    </div>
  );
}
