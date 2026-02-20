/**
 * ============================================================================
 * ONE FLOW - The Trade Operating System Core
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel'; // system state, not shown to user
import { useTrade } from '@/hooks/queries/useTrade';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import TradeTimeline from '@/components/trade/TradeTimeline';
import { supabase } from '@/api/supabaseClient';
import { transitionTrade, clearLocalCurrency, TRADE_STATE, TRADE_STATE_LABELS } from '@/services/tradeKernel'; // internal only
import { useTradeEventLedger } from '@/hooks/useTradeEventLedger';
// import { generateForensicProfile } from '@/utils/auditReportGenerator'; // Forensic audit hidden from user
import RFQCreationPanel from '@/components/trade/RFQCreationPanel';
import QuoteReviewPanel from '@/components/trade/QuoteReviewPanel';
import ContractSigningPanel from '@/components/trade/ContractSigningPanel';
import EscrowFundingPanel from '@/components/trade/EscrowFundingPanel';
import ShipmentTrackingPanel from '@/components/trade/ShipmentTrackingPanel';
import DeliveryAcceptancePanel from '@/components/trade/DeliveryAcceptancePanel';
import ConversationList from '@/components/inbox/ConversationList';
import ConversationView from '@/components/inbox/ConversationView';
// import MultiSigBridge from '@/components/trade/MultiSigBridge'; // Hide Multi-Sig Bridge from UI
import { Surface } from '@/components/system/Surface';
import VerificationPanel from '@/components/verification/VerificationPanel';
// import { ForensicExportButton } from '@/components/shared/ui/ForensicExportButton'; // Hide forensic export from UI
// import { generateForensicPDF } from '@/utils/pdfGenerator';
import ReviewModal from '@/components/trade/ReviewModal';
import { ArrowLeft, Fingerprint, ShieldAlert, Cpu, Sparkles, Terminal, Activity, Shield, MessageCircle, ShieldCheck, Ship } from 'lucide-react';
import { toast } from 'sonner';
import { PageLoader } from '@/components/shared/ui/skeletons';
import { cn } from '@/lib/utils';
import LiveDeliveryCard from '@/components/logistics/LiveDeliveryCard';
// DeliveryConfidenceBadge removed: trust/confidence now ambient only

const FLOW_PANELS = {
  [TRADE_STATE.DRAFT]: RFQCreationPanel,
  [TRADE_STATE.RFQ_OPEN]: RFQCreationPanel,
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

// Transit states where carrier tracking is relevant
const CARRIER_STATES = new Set(['pickup_scheduled', 'in_transit', 'delivered', 'accepted', 'settled']);

export default function OneFlow() {
  // Route may pass param as :id (trade/:id, orders/:id, rfqs/:id) or :tradeId — handle both
  const params = useParams();
  const tradeId = params.tradeId || params.id;
  const navigate = useNavigate();
  const { isSystemReady, profile, capabilities } = useDashboardKernel();

  const { data: trade, isLoading: loading, error: queryError, refetch } = useTrade(tradeId);
  const [error, setError] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { timeline: kernelTimeline } = useTradeEventLedger(tradeId);

  useEffect(() => {
    if (queryError) setError(queryError.message);
  }, [queryError]);

  if (!isSystemReady) {
    return <PageLoader />;
  }

  const [isExporting, setIsExporting] = useState(false);

  // Forensic export hidden from user

  async function handleStateTransition(nextState, metadata = {}) {
    setIsTransitioning(true);
    try {
      const result = await transitionTrade(tradeId, nextState, metadata);
      if (result.success) {
        await refetch();
        if (result.trustMutation > 0) {
          toast.success('Trust Score Updated', {
            description: `Trust Score increased by ${result.trustMutation}%.`,
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

  // Auto-trigger review modal when settled
  useEffect(() => {
    if (trade?.status === TRADE_STATE.SETTLED && !trade.metadata?.has_reviewed) {
      // Small delay for better UX
      const timer = setTimeout(() => setShowReviewModal(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [trade?.status]);

  async function handleReviewSubmit(reviewData) {
    // In real app, this would be a separate API call. 
    // For now we update metadata to prevent re-triggering.
    await handleStateTransition(trade.status, { has_reviewed: true });
    setShowReviewModal(false);
  }

  if (loading) return <PageLoader />;

  if (!trade) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="os-page-layout">
          {/* COMMAND HEADER */}
          <div className="os-header-group flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="pl-0 hover:bg-transparent text-os-text-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <h1 className="mt-2 tracking-tight">
                {trade?.title}
              </h1>
              <p className="text-os-xs font-mono mt-1 uppercase tracking-widest text-os-text-secondary">
                {trade?.buyer?.company_name} <span className="mx-2 opacity-30">/</span> {trade?.seller ? trade.seller.company_name : 'PENDING'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              {/* Ambient Secure Shield: always visible */}
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-500 animate-pulse" />
                <span className="text-os-xs font-bold text-emerald-600 uppercase tracking-widest">Protected by Afrikoni Secure</span>
              </div>
            </div>
          </div>
          {/* MAIN CHAT PANEL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
              {/* WhatsApp-style chat interface for this trade */}
              <Surface variant="panel" className="p-0 md:p-0 overflow-hidden">
                <ConversationView
                  conversationId={trade?.id}
                  conversation={{
                    ...trade,
                    otherCompany: trade?.seller || trade?.buyer,
                    id: trade?.id
                  }}
                  currentUser={profile}
                  companyId={profile?.company_id || profile?.id}
                  onBack={() => navigate('/dashboard')}
                />
              </Surface>
              {/* Unified Verification & Compliance Panel: only show if not fully verified */}
              <VerificationPanel />
              {/* Review Modal */}
              {showReviewModal && (
                <ReviewModal
                  isOpen={showReviewModal}
                  onClose={() => setShowReviewModal(false)}
                  trade={trade}
                  onSubmit={handleReviewSubmit}
                />
              )}
            </div>
            {/* SIDEBAR: Trade Timeline, Live Delivery, Activity Log */}
            <div className="lg:col-span-5 space-y-8">
              {CARRIER_STATES.has(trade?.status) && (
                <LiveDeliveryCard
                  tradeId={trade?.id}
                  shipmentId={trade?.metadata?.shipment_id}
                  tradeStatus={trade?.status}
                  compact
                />
              )}
              <TradeTimeline
                tradeId={tradeId}
                currentState={trade?.status}
              />
              <div className="space-y-4">
                <h2 className="os-label flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Activity Log
                </h2>
                <Surface variant="panel" className="p-0 border-os-stroke bg-black/40 overflow-hidden">
                  <div className="p-3 border-b border-os-stroke/50 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                    </div>
                    <span className="os-label opacity-40 lowercase">trade-activity</span>
                  </div>
                  <div className="p-4 font-mono text-[10px] space-y-2 h-[200px] overflow-y-auto">
                    {kernelTimeline?.slice(0, 8).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-os-text-secondary/70">
                        <span className="truncate pr-4">&gt; {item.label}</span>
                        <span className="shrink-0 opacity-40">{item.time}</span>
                      </div>
                    ))}
                    {!kernelTimeline?.length && (
                      <div className="text-os-text-secondary/40 italic">No recent activity.</div>
                    )}
                  </div>
                </Surface>
              </div>
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
      <h3 className="text-os-lg font-bold">Status: {TRADE_STATE_LABELS[trade.status] || trade.status}</h3>
      <p className="text-os-sm text-os-text-secondary mt-1">No further actions are required at this stage.</p>
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
        {isPAPSSAvailable && !isCleared && (
          <p className="text-center text-os-xs text-os-text-secondary/40">
            Cross-border settlement via PAPSS. Need help?{' '}
            <a href="mailto:support@afrikoni.com" className="text-os-accent underline">
              Contact support
            </a>
          </p>
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
        Secure execution frozen. Awaiting resolution from Afrikoni Arbitration Council.
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
        Flow complete. Forensic records stored in secure vault.
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
        <p className="os-label !text-os-accent !opacity-100">Trust Score</p>
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
