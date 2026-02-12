/**
 * ============================================================================
 * ONE FLOW - The Trade Operating System Core
 * ============================================================================
 * 
 * This is the ONLY flow that matters in v1.0:
 * RFQ → Supplier Match → Quote → Contract → Escrow → Shipment → Delivery → Settlement → Close
 * 
 * Everything else is locked until this works perfectly.
 * This is the "railroad track" view where every step is a decision.
 * No dashboards. No extra features. Just the flow.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import TradeTimeline from '@/components/trade/TradeTimeline';
import { supabase } from '@/api/supabaseClient';
import { transitionTrade, TRADE_STATE, TRADE_STATE_LABELS } from '@/services/tradeKernel';
import { useTradeEventLedger } from '@/hooks/useTradeEventLedger';
import RFQCreationPanel from '@/components/trade/RFQCreationPanel';
import QuoteReviewPanel from '@/components/trade/QuoteReviewPanel';
import ContractSigningPanel from '@/components/trade/ContractSigningPanel';
import EscrowFundingPanel from '@/components/trade/EscrowFundingPanel';
import ShipmentTrackingPanel from '@/components/trade/ShipmentTrackingPanel';
import DeliveryAcceptancePanel from '@/components/trade/DeliveryAcceptancePanel';
import MultiSigBridge from '@/components/trade/MultiSigBridge';
import { Surface } from '@/components/system/Surface';
import { OSStatusBar } from '@/components/system/OSStatusBar';
import { ArrowLeft, Fingerprint, ShieldAlert, Cpu } from 'lucide-react';

/**
 * The ONE FLOW does not show multiple steps at once.
 * It shows ONE thing at a time based on kernel state.
 * This is intentional - it forces focus and prevents confusion.
 */
const FLOW_PANELS = {
  [TRADE_STATE.DRAFT]: RFQCreationPanel,
  [TRADE_STATE.RFQ_CREATED]: RFQCreationPanel,
  [TRADE_STATE.QUOTED]: QuoteReviewPanel,
  [TRADE_STATE.CONTRACTED]: ContractSigningPanel,
  [TRADE_STATE.ESCROW_REQUIRED]: EscrowFundingPanel,
  [TRADE_STATE.ESCROW_FUNDED]: ShipmentTrackingPanel,
  [TRADE_STATE.PRODUCTION]: ShipmentTrackingPanel,
  [TRADE_STATE.PICKUP_SCHEDULED]: ShipmentTrackingPanel,
  [TRADE_STATE.IN_TRANSIT]: ShipmentTrackingPanel,
  [TRADE_STATE.DELIVERED]: DeliveryAcceptancePanel,
  [TRADE_STATE.ACCEPTED]: DeliveryAcceptancePanel,
  [TRADE_STATE.SETTLED]: SettlementPanel,
  [TRADE_STATE.DISPUTED]: DisputedPanel,
  [TRADE_STATE.CLOSED]: ClosedPanel
};

export default function OneFlow() {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const { isSystemReady, canLoadData, profile, capabilities } = useDashboardKernel();

  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { timeline: kernelTimeline } = useTradeEventLedger(tradeId);

  if (!isSystemReady) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const nextActionHints = {
    [TRADE_STATE.DRAFT]: 'Publish RFQ to open supplier responses',
    [TRADE_STATE.RFQ_CREATED]: 'Review quotes and select supplier',
    [TRADE_STATE.QUOTED]: 'Select the best quote',
    [TRADE_STATE.CONTRACTED]: 'Sign contract to unlock escrow',
    [TRADE_STATE.ESCROW_REQUIRED]: 'Fund escrow to start production',
    [TRADE_STATE.ESCROW_FUNDED]: 'Monitor production and pickup scheduling',
    [TRADE_STATE.PRODUCTION]: 'Confirm pickup scheduling',
    [TRADE_STATE.PICKUP_SCHEDULED]: 'Track shipment in transit',
    [TRADE_STATE.IN_TRANSIT]: 'Confirm delivery upon arrival',
    [TRADE_STATE.DELIVERED]: 'Accept delivery and release payment',
    [TRADE_STATE.ACCEPTED]: 'Release escrow and settle trade',
    [TRADE_STATE.SETTLED]: 'Close trade and update trust',
    [TRADE_STATE.DISPUTED]: 'Provide evidence and resolve dispute',
    [TRADE_STATE.CLOSED]: 'Trade complete'
  };

  useEffect(() => {
    if (!canLoadData) return;
    loadTrade();
  }, [canLoadData, tradeId]);

  useEffect(() => {
    if (!tradeId || !canLoadData) return;

    // ✅ KERNEL CONSOLIDATION: Listen for unified realtime events
    const handleRealtimeUpdate = (e) => {
      const { table, event, new: newData } = e.detail || {};
      if (table === 'trades' && newData?.id === tradeId) {
        console.log(`[OneFlow] 🔄 Realtime update for trade ${tradeId}`);
        setTrade(newData);
      }
    };

    window.addEventListener('dashboard-realtime-update', handleRealtimeUpdate);
    return () => window.removeEventListener('dashboard-realtime-update', handleRealtimeUpdate);
  }, [tradeId, canLoadData]);

  async function loadTrade() {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          buyer:companies!buyer_id(*),
          seller:companies!seller_id(*)
        `)
        .eq('id', tradeId)
        .single();

      if (error) throw error;
      setTrade(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load trade:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStateTransition(nextState, metadata = {}) {
    setIsTransitioning(true);
    try {
      const result = await transitionTrade(tradeId, nextState, metadata);

      if (result.success) {
        setTrade(result.trade);
        // Show success toast
      } else {
        setError(result.error);
      }
    } finally {
      setIsTransitioning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card className="mt-4">
          <CardContent className="p-6 text-center">
            <p className="font-semibold">Trade not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get the panel component for current state
  const PanelComponent = FLOW_PANELS[trade.status] || DefaultPanel;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C0F] via-[#0E1218] to-[#10141C]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* COMMAND HEADER */}
        <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="pl-0 hover:bg-transparent text-os-muted">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Command Center
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight bg-gradient-to-r from-white via-white/80 to-afrikoni-gold bg-clip-text text-transparent">
              {trade.title}
            </h1>
            <p className="text-xs text-os-muted font-mono mt-1 uppercase tracking-widest">
              {trade.buyer?.company_name} <span className="mx-2 opacity-30">/</span> {trade.seller ? trade.seller.company_name : 'PENDING'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <OSStatusBar />
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur px-4 py-2 text-right">
              <p className="text-[10px] uppercase tracking-[0.25em] text-os-muted">Kernel State</p>
              <div className="flex items-center justify-end gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-afrikoni-gold animate-pulse shadow-[0_0_8px_rgba(212,169,55,0.5)]" />
                <p className="text-sm font-semibold text-afrikoni-gold uppercase tracking-tight">
                  {TRADE_STATE_LABELS[trade.status] || trade.status}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CORE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* MAIN FLOW PANEL */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border p-4 md:p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em]">One-Flow</p>
                  <p className="text-sm">Single path. No detours.</p>
                </div>
                <div className="text-xs">Trade ID: {trade.id}</div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={trade.status}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <PanelComponent
                    trade={trade}
                    onNextStep={handleStateTransition}
                    isTransitioning={isTransitioning}
                    capabilities={capabilities}
                    profile={profile}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Multi-Sig Bridge Visualization */}
              {(trade.status !== TRADE_STATE.DRAFT && trade.status !== TRADE_STATE.CLOSED) && (
                <div className="mt-8">
                  <MultiSigBridge tradeId={tradeId} status={trade.status} />
                </div>
              )}

              {error && (
                <Card className="mt-4">
                  <CardContent className="p-4 text-sm">
                    {error}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* KERNEL RAIL + EVENT STREAM */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 lg:h-fit">
            <TradeTimeline
              tradeId={tradeId}
              currentState={trade.status}
            />

            <div className="mt-4 rounded-2xl border p-4 backdrop-blur">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Kernel Console</p>
              <div className="mt-3 space-y-2 text-sm">
                {kernelTimeline?.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span>{item.label}</span>
                    <span className="text-muted-foreground font-mono">{item.time}</span>
                  </div>
                ))}
                {!kernelTimeline?.length && (
                  <div className="text-xs text-muted-foreground">No kernel events yet.</div>
                )}
              </div>
            </div>

            {/* FORENSIC LEDGER DNA RAIL */}
            <div className="mt-4 rounded-2xl border p-4 backdrop-blur bg-emerald-500/5 border-emerald-500/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-500 font-bold">Forensic Ledger</p>
                <Fingerprint className="w-3 h-3 text-emerald-500 opacity-50" />
              </div>

              {trade.metadata?.trade_dna ? (
                <div className="space-y-3">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase font-mono">Current State Hash</p>
                    <p className="text-[11px] font-mono text-emerald-400 mt-1 break-all">
                      {trade.metadata.trade_dna}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-500 uppercase font-mono px-1">Audit Trace</p>
                    {kernelTimeline?.filter(e => e.raw?.metadata?.trade_dna).map((event, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded transition-colors group">
                        <div className="w-1 h-1 rounded-full bg-emerald-500/30"></div>
                        <span className="text-[9px] font-mono text-gray-400 group-hover:text-emerald-300 transition-colors">
                          {event.raw.metadata.trade_dna.substring(0, 16)}...
                        </span>
                        <span className="text-[8px] text-gray-600 ml-auto">
                          {event.raw.metadata.previous_state} → {event.raw.status_to}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed rounded-xl border-white/5">
                  <Cpu className="w-5 h-5 text-gray-600 mx-auto mb-2 opacity-20" />
                  <p className="text-[10px] text-gray-500">Forensic DNA trace initialization pending next transition...</p>
                </div>
              )}

              <div className="mt-4 p-2 bg-black/20 rounded-lg flex items-start gap-2 border border-white/5">
                <ShieldAlert className="w-3 h-3 text-amber-500 mt-0.5" />
                <p className="text-[9px] text-gray-500 italic">
                  Immutable hashes are generated on every transition. Any tampering voids the Sovereign Insurance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Default panel (should not reach here with proper routing)
 */
function DefaultPanel({ trade }) {
  return (
    <Card className="border rounded-2xl">
      <CardContent className="p-6 text-center">
        <p className="">State: {trade.status}</p>
        <p className="text-sm mt-2">No action available for this state yet.</p>
      </CardContent>
    </Card>
  );
}

/**
 * Settlement panel (money released, showing confirmation)
 */
function SettlementPanel({ trade }) {
  return (
    <Card className="border bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <CardContent className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 border">
          <span className="text-2xl">💰</span>
        </div>
        <h2 className="text-xl font-semibold">
          Payment Released
        </h2>
        <p className="mt-2">
          Escrow funds have been released to the supplier.
        </p>
        <div className="border rounded-xl p-4 mt-4 text-left">
          <p className="text-sm font-semibold">Order Summary</p>
          <p className="text-sm mt-2">
            Quantity: {trade.quantity} {trade.quantity_unit}
          </p>
          <p className="text-sm">
            Total: {trade.price_max || trade.price_min} {trade.currency}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Disputed panel (trade frozen, awaiting resolution)
 */
function DisputedPanel({ trade }) {
  return (
    <Card className="border rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <CardContent className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 border">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-semibold">
          Trade Disputed
        </h2>
        <p className="mt-2">
          This trade is under dispute. Escrow is frozen until resolution.
        </p>
        <p className="text-xs mt-4">
          Trade ID: {trade.id}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Closed panel (trade complete)
 */
function ClosedPanel({ trade }) {
  return (
    <Card className="border bg-gradient-to-br to-[#0F1117] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <CardContent className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 border">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="text-2xl font-semibold">
          Trade Closed
        </h2>
        <p className="mt-2">
          This trade has been successfully completed.
        </p>
        <p className="text-xs mt-4">
          Trade ID: {trade.id}
        </p>
      </CardContent>
    </Card>
  );
}
