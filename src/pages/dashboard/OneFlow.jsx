/**
 * ============================================================================
 * ONE FLOW - The Trade Operating System Core
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useTrade } from '@/hooks/queries/useTrade';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import TradeTimeline from '@/components/trade/TradeTimeline';
import { supabase } from '@/api/supabaseClient';
import { transitionTrade, clearLocalCurrency, TRADE_STATE, TRADE_STATE_LABELS } from '@/services/tradeKernel';
import { useTradeEventLedger } from '@/hooks/useTradeEventLedger';
import { generateForensicProfile } from '@/utils/auditReportGenerator';
import RFQCreationPanel from '@/components/trade/RFQCreationPanel';
import QuoteReviewPanel from '@/components/trade/QuoteReviewPanel';
import ContractSigningPanel from '@/components/trade/ContractSigningPanel';
import EscrowFundingPanel from '@/components/trade/EscrowFundingPanel';
import ShipmentTrackingPanel from '@/components/trade/ShipmentTrackingPanel';
import DeliveryAcceptancePanel from '@/components/trade/DeliveryAcceptancePanel';
import MultiSigBridge from '@/components/trade/MultiSigBridge';
import { Surface } from '@/components/system/Surface';
import { ForensicExportButton } from '@/components/shared/ui/ForensicExportButton';
import { generateForensicPDF } from '@/utils/pdfGenerator';
import { ArrowLeft, Fingerprint, ShieldAlert, Cpu, Sparkles, Terminal, Activity, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { PageLoader } from '@/components/shared/ui/skeletons';

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
  const { isSystemReady, profile, capabilities } = useDashboardKernel();

  const { data: trade, isLoading: loading, error: queryError, refetch } = useTrade(tradeId);
  const [error, setError] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { timeline: kernelTimeline } = useTradeEventLedger(tradeId);

  useEffect(() => {
    if (queryError) setError(queryError.message);
  }, [queryError]);

  if (!isSystemReady) {
    return <PageLoader />;
  }

  const [isExporting, setIsExporting] = useState(false);

  const handleExportAudit = async () => {
    if (!trade || !kernelTimeline) return;
    setIsExporting(true);

    try {
      const profileData = generateForensicProfile(trade, kernelTimeline.map(t => t.raw));
      await generateForensicPDF(profileData.reportHtml, `Forensic_Audit_${trade.id.substring(0, 8)}.pdf`);

      toast.success('Institutional Audit Exported', {
        description: 'Your bankable trade profile has been generated.'
      });
    } catch (err) {
      toast.error('Export Failed', { description: 'Could not generate institutional PDF.' });
    } finally {
      setIsExporting(false);
    }
  };

  async function handleStateTransition(nextState, metadata = {}) {
    setIsTransitioning(true);
    try {
      const result = await transitionTrade(tradeId, nextState, metadata);
      if (result.success) {
        await refetch();
        if (result.trustMutation > 0) {
          toast.success('Trust DNA Mutated', {
            description: `Sovereign Reliability increased by ${result.trustMutation}%.`,
            icon: <Sparkles className="w-4 h-4 text-os-accent" />
          });
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTransitioning(false);
    }
  }

  if (loading) return <PageLoader />;

  if (!trade) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Command Center
        </Button>
        <Surface variant="panel" className="mt-4 p-12 text-center">
          <p className="font-semibold text-os-muted">Trade DNA not found or access denied.</p>
        </Surface>
      </div>
    );
  }

  const PanelComponent = FLOW_PANELS[trade.status] || DefaultPanel;

  return (
    <div className="os-page-layout">
      {/* COMMAND HEADER */}
      <div className="os-header-group flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="pl-0 hover:bg-transparent text-os-text-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Command Center
          </Button>
          <h1 className="mt-2 tracking-tight">
            {trade.title}
          </h1>
          <p className="text-os-xs font-mono mt-1 uppercase tracking-widest text-os-text-secondary">
            {trade.buyer?.company_name} <span className="mx-2 opacity-30">/</span> {trade.seller ? trade.seller.company_name : 'PENDING'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <TrustDNAIndex mutation={trade.metadata?.trust_mutation || 0} baseScore={profile?.trust_score || 72} />
          <Surface variant="soft" className="px-4 py-2 border-os-stroke/40">
            <div className="flex items-center justify-end gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-os-accent animate-pulse" />
              <p className="os-label !text-os-accent">
                {TRADE_STATE_LABELS[trade.status] || trade.status}
              </p>
            </div>
          </Surface>
        </div>
      </div>

      {/* CORE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MAIN FLOW PANEL */}
        <div className="lg:col-span-7 space-y-8">
          <Surface variant="panel" className="p-4 md:p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Surface variant="soft" className="w-12 h-12 flex items-center justify-center border-os-stroke/30">
                  <Activity className="w-6 h-6 text-os-accent" />
                </Surface>
                <div>
                  <h2 className="text-os-lg font-bold">Execution Engine</h2>
                  <p className="os-label">Kernel v8.0.21</p>
                </div>
              </div>
              <div className="text-os-xs text-os-text-secondary font-mono">ID: {trade.id.substring(0, 8)}</div>
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
                  onExportAudit={handleExportAudit}
                  isGeneratingExport={isExporting}
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
              <Surface variant="soft" className="mt-4 border-os-error/20 bg-os-error/5 p-4 text-os-sm text-os-error">
                {error}
              </Surface>
            )}
          </Surface>
        </div>

        {/* SIDEBAR: CONSOLE & LEDGER */}
        <div className="lg:col-span-5 space-y-8">
          <TradeTimeline
            tradeId={tradeId}
            currentState={trade.status}
          />

          {/* 🔧 KERNEL CONSOLE */}
          <div className="space-y-4">
            <h2 className="os-label flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Kernel Console
            </h2>
            <Surface variant="panel" className="p-0 border-os-stroke bg-black/40 overflow-hidden">
              <div className="p-3 border-b border-os-stroke/50 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                </div>
                <span className="os-label opacity-40 lowercase">ssh: kernel-prod-8</span>
              </div>
              <div className="p-4 font-mono text-[10px] space-y-2 h-[200px] overflow-y-auto">
                {kernelTimeline?.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-os-text-secondary/70">
                    <span className="truncate pr-4">&gt; {item.label}</span>
                    <span className="shrink-0 opacity-40">{item.time}</span>
                  </div>
                ))}
                {!kernelTimeline?.length && (
                  <div className="text-os-text-secondary/40 italic">Waiting for kernel signals...</div>
                )}
              </div>
            </Surface>
          </div>

          {/* 📁 FORENSIC LEDGER */}
          <div className="space-y-4">
            <h2 className="os-label flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Forensic Ledger
            </h2>
            <Surface variant="panel" className="p-6 border-emerald-500/20 bg-emerald-500/5">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-os-sm font-medium">Immutability Locked</p>
                </div>
                <p className="text-os-xs text-os-text-secondary leading-relaxed">
                  Every transition generates a unique hash, cryptographically linked to your Trust DNA. Tampering voids Sovereign Insurance.
                </p>
                {trade.metadata?.trade_dna && (
                  <div className="p-2 bg-black/20 rounded border border-white/5 overflow-hidden">
                    <p className="text-[9px] font-mono text-emerald-500/50 break-all select-all">
                      SHA-256: {trade.metadata.trade_dna}
                    </p>
                  </div>
                )}
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </div>
  );
}

function DefaultPanel({ trade }) {
  return (
    <Surface variant="soft" className="p-12 text-center border-dashed">
      <Cpu className="w-10 h-10 text-os-text-secondary/20 mx-auto mb-4" />
      <h3 className="text-os-lg font-bold">State: {trade.status}</h3>
      <p className="text-os-sm text-os-text-secondary mt-1">No execution logic defined for this kernel state.</p>
    </Surface>
  );
}

function SettlementPanel({ trade, onExportAudit, isTransitioning, isGeneratingExport }) {
  const [isClearing, setIsClearing] = useState(false);
  const isPAPSSAvailable = trade.currency !== 'USD' && trade.currency !== 'EUR';
  const isCleared = trade.metadata?.papss_clearing_success || false;

  const handlePAPSSClearing = async () => {
    setIsClearing(true);
    try {
      const result = await clearLocalCurrency(trade.id, trade.total_value, trade.currency);
      if (result.success) {
        toast.success('PAPSS Clearing Successful');
      } else {
        toast.error('PAPSS Clearing Failed', { description: result.error });
      }
    } catch (err) {
      toast.error('Clearing Error', { description: err.message });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Surface variant="glass" className="p-8 text-center border-emerald-500/20">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">{isCleared ? '✅' : '💰'}</span>
        </div>
        <h2 className="text-os-xl font-bold">
          {isCleared ? 'Settlement Cleared' : 'Funds Released'}
        </h2>
        <p className="mt-2 text-os-text-secondary text-os-sm">
          {isCleared
            ? 'International local-currency settlement via PAPSS complete.'
            : 'Multi-sig escrow release confirmed. Funds are now available for clearing.'}
        </p>
      </Surface>

      <div className="grid grid-cols-2 gap-4">
        <Surface variant="soft" className="p-4">
          <p className="os-label">Quantity</p>
          <p className="text-os-lg font-bold">{trade.quantity} {trade.quantity_unit}</p>
        </Surface>
        <Surface variant="soft" className="p-4">
          <p className="os-label">Value</p>
          <p className="text-os-lg font-bold">{trade.total_value} {trade.currency}</p>
        </Surface>
      </div>

      <div className="space-y-3">
        {isPAPSSAvailable && !isCleared && (
          <Button
            onClick={handlePAPSSClearing}
            disabled={isClearing || isTransitioning}
            className="w-full bg-os-accent text-os-bg font-black uppercase tracking-widest rounded-os-sm h-12"
          >
            {isClearing ? 'Clearing via PAPSS...' : 'Initiate PAPSS Clearing'}
          </Button>
        )}
        <ForensicExportButton
          onClick={() => onExportAudit()}
          isGenerating={isGeneratingExport}
          className="w-full"
        />
      </div>
    </div>
  );
}

function DisputedPanel({ trade }) {
  return (
    <Surface variant="glass" className="p-12 text-center border-os-error/20 bg-os-error/5">
      <ShieldAlert className="w-16 h-16 text-os-error mx-auto mb-6 opacity-80" />
      <h2 className="text-os-2xl font-bold text-os-error">Trade Disputed</h2>
      <p className="mt-2 text-os-text-secondary">
        Sovereign execution frozen. Awaiting resolution from Afrikoni Arbitration Council.
      </p>
    </Surface>
  );
}

function ClosedPanel({ trade }) {
  return (
    <Surface variant="glass" className="p-12 text-center border-os-stroke">
      <div className="w-16 h-16 rounded-full bg-os-stroke flex items-center justify-center mx-auto mb-6">
        <span className="text-2xl text-os-text-secondary">✓</span>
      </div>
      <h2 className="text-os-2xl font-bold text-os-text-secondary">Trade Archived</h2>
      <p className="mt-2 text-os-text-secondary">
        Flow complete. Forensic records stored in sovereign vault.
      </p>
    </Surface>
  );
}

function TrustDNAIndex({ mutation, baseScore }) {
  const isPositive = mutation > 0;
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="group relative overflow-hidden flex items-center gap-4 px-4 py-2 rounded-os-sm bg-os-accent/5 border border-os-accent/20 backdrop-blur-md"
    >
      <div className="relative">
        <p className="os-label !text-os-accent !opacity-100">Trust DNA Index</p>
        <div className="flex items-center gap-2">
          <span className="text-os-xl font-black">{baseScore}%</span>
          {mutation !== 0 && (
            <motion.span
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn("text-os-xs font-bold px-1.5 py-0.5 rounded", isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-os-error')}
            >
              {isPositive ? '+' : ''}{mutation}%
            </motion.span>
          )}
        </div>
      </div>
      <Cpu className={cn("w-5 h-5", mutation !== 0 ? 'text-os-accent animate-spin-slow' : 'text-os-text-secondary opacity-40')} />
    </motion.div>
  );
}
