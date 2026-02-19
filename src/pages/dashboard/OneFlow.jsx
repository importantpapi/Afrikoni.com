/**
 * ============================================================================
 * ONE FLOW - Trade View
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useTrade } from '@/hooks/queries/useTrade';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import TradeTimeline from '@/components/trade/TradeTimeline';
import { supabase } from '@/api/supabaseClient';
import { useLanguage } from '@/i18n/LanguageContext';
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
import ReviewModal from '@/components/trade/ReviewModal';
import { ArrowLeft, ShieldAlert, Sparkles, Activity, Shield, CheckCircle, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { PageLoader } from '@/components/shared/ui/skeletons';
import { cn } from '@/lib/utils';

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
  const { t } = useLanguage();
  const { isSystemReady, profile, capabilities } = useDashboardKernel();

  const { data: trade, isLoading: loading, error: queryError, refetch } = useTrade(tradeId);
  const [error, setError] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { timeline: tradeTimeline } = useTradeEventLedger(tradeId);

  useEffect(() => {
    if (queryError) setError(queryError.message);
  }, [queryError]);

  if (!isSystemReady) {
    return <PageLoader />;
  }

  const [isExporting, setIsExporting] = useState(false);

  const handleExportAudit = async () => {
    if (!trade || !tradeTimeline) return;
    setIsExporting(true);

    try {
      const profileData = generateForensicProfile(trade, tradeTimeline.map(t => t.raw));
      await generateForensicPDF(profileData.reportHtml, `Trade_Audit_${trade.id.substring(0, 8)}.pdf`);

      toast.success('Report Exported', {
        description: 'Your trade report has been generated.'
      });
    } catch (err) {
      toast.error('Export Failed', { description: 'Could not generate the PDF.' });
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
          toast.success('Trust Score Updated', {
            description: `Trust Score increased by ${result.trustMutation}.`,
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

  useEffect(() => {
    if (trade?.status === TRADE_STATE.SETTLED && !trade.metadata?.has_reviewed) {
      const timer = setTimeout(() => setShowReviewModal(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [trade?.status]);

  async function handleReviewSubmit(reviewData) {
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
        <Surface variant="panel" className="mt-4 p-12 text-center">
          <p className="font-semibold text-os-muted">Trade not found or access denied.</p>
        </Surface>
      </div>
    );
  }

  const PanelComponent = FLOW_PANELS[trade.status] || DefaultPanel;

  return (
    <div className="os-page-layout">
      {/* HEADER */}
      <div className="os-header-group flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="pl-0 hover:bg-transparent text-os-text-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <h1 className="mt-2 tracking-tight text-3xl font-bold">
            {trade.title}
          </h1>
          <p className="text-sm mt-1 text-os-text-secondary font-medium">
            {trade.buyer?.company_name}{trade.seller ? ` · ${trade.seller.company_name}` : ''}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <TrustScoreIndicator mutation={trade.metadata?.trust_mutation || 0} baseScore={profile?.trust_score || 72} />
            <Link to={`/dashboard/disputes?trade_id=${tradeId}`}>
              <Button variant="outline" size="sm" className="h-[34px] text-xs font-medium border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors gap-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                Report Issue
              </Button>
            </Link>
          </div>

          <Surface variant="soft" className="px-3 py-1 border-os-stroke/60 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-os-accent" />
              <p className="text-xs font-bold text-os-text-primary uppercase tracking-wider">
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
            <div className="flex items-center justify-between mb-6 border-b border-os-stroke/40 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-os-bg border border-os-stroke/60 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-os-text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-os-text-primary">Trade Details</h2>
                  <p className="text-xs text-os-text-secondary font-medium">ID: {trade.id.substring(0, 8)}</p>
                </div>
              </div>
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

            {(trade.status !== TRADE_STATE.DRAFT && trade.status !== TRADE_STATE.CLOSED) && (
              <div className="mt-8 pt-6 border-t border-os-stroke/40">
                <MultiSigBridge tradeId={tradeId} status={trade.status} />
              </div>
            )}

            {error && (
              <Surface variant="soft" className="mt-4 border-os-error/20 bg-os-error/5 p-4 text-sm text-os-error rounded-md">
                {error}
              </Surface>
            )}
          </Surface>

          {showReviewModal && (
            <ReviewModal
              isOpen={showReviewModal}
              onClose={() => setShowReviewModal(false)}
              trade={trade}
              onSubmit={handleReviewSubmit}
            />
          )}
        </div>

        {/* SIDEBAR: TIMELINE & ACTIVITY LOG */}
        <div className="lg:col-span-5 space-y-8">
          <TradeTimeline
            tradeId={tradeId}
            currentState={trade.status}
          />

          {/* TRADE ACTIVITY LOG */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2 text-os-text-primary uppercase tracking-wider">
              <Clock className="w-4 h-4 text-os-text-secondary" />
              Activity History
            </h2>
            <Surface variant="panel" className="p-0 overflow-hidden border border-os-stroke/60">
              <div className="px-5 py-3 bg-os-bg border-b border-os-stroke/40 flex items-center justify-between">
                <span className="text-xs font-medium text-os-text-secondary">Recent Events</span>
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Secure</span>
                </div>
              </div>
              <div className="p-0">
                {tradeTimeline?.slice(0, 6).map((item, idx) => (
                  <div key={item.id} className={cn(
                    "flex items-start justify-between p-4 text-sm hover:bg-os-bg/50 transition-colors",
                    idx !== 0 && "border-t border-os-stroke/40"
                  )}>
                    <div className="pr-4">
                      <p className="font-medium text-os-text-primary">{item.label}</p>
                      <p className="text-xs text-os-text-secondary mt-0.5">{item.description || "Status updated"}</p>
                    </div>
                    <span className="shrink-0 text-xs text-os-text-secondary/70 tabular-nums font-medium bg-os-bg px-1.5 py-0.5 rounded border border-os-stroke/40">{item.time}</span>
                  </div>
                ))}
                {(!tradeTimeline || tradeTimeline.length === 0) && (
                  <div className="p-6 text-center text-sm text-os-text-secondary">
                    No activity recorded yet.
                  </div>
                )}
              </div>
              <div className="p-3 bg-os-bg border-t border-os-stroke/40">
                <Button variant="ghost" size="sm" className="w-full text-xs text-os-text-secondary hover:text-os-text-primary h-8" onClick={handleExportAudit}>
                  <FileText className="w-3 h-3 mr-2" />
                  Export Full History
                </Button>
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
    <Surface variant="soft" className="p-12 text-center border-dashed border-os-stroke/60">
      <Activity className="w-10 h-10 text-os-text-secondary/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-os-text-primary">Trade status: {trade.status}</h3>
      <p className="text-sm text-os-text-secondary mt-1">This stage is being prepared. Please check back shortly.</p>
    </Surface>
  );
}

function SettlementPanel({ trade, onExportAudit, isTransitioning, isGeneratingExport }) {
  const { t } = useLanguage();
  const [isClearing, setIsClearing] = useState(false);
  const isPAPSSAvailable = trade.currency !== 'USD' && trade.currency !== 'EUR';
  const isCleared = trade.metadata?.papss_clearing_success || false;

  const handlePAPSSClearing = async () => {
    setIsClearing(true);
    try {
      const result = await clearLocalCurrency(trade.id, trade.total_value, trade.currency);
      if (result.success) {
        toast.success('Clearing Successful');
      } else {
        toast.error('Clearing Failed', { description: result.error });
      }
    } catch (err) {
      toast.error('Clearing Error', { description: err.message });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Surface variant="ivory" className="p-8 text-center border-emerald-500/20 bg-emerald-50/30">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-emerald-700" />
        </div>
        <h2 className="text-xl font-bold text-emerald-900">
          {isCleared ? 'Settlement Cleared' : 'Funds Released'}
        </h2>
        <p className="mt-2 text-emerald-800/80 text-sm">
          {isCleared
            ? 'Payment has been successfully cleared via regional settlement.'
            : 'Escrow funds have been released to the seller.'}
        </p>
      </Surface>

      <div className="grid grid-cols-2 gap-4">
        <Surface variant="soft" className="p-4 bg-white border border-os-stroke/60">
          <p className="text-xs font-bold text-os-text-secondary uppercase tracking-wider mb-1">Quantity</p>
          <p className="text-lg font-bold text-os-text-primary">{trade.quantity} {trade.quantity_unit}</p>
        </Surface>
        <Surface variant="soft" className="p-4 bg-white border border-os-stroke/60">
          <p className="text-xs font-bold text-os-text-secondary uppercase tracking-wider mb-1">Total Value</p>
          <p className="text-lg font-bold text-os-text-primary">{trade.total_value} {trade.currency}</p>
        </Surface>
      </div>

      <div className="space-y-3 pt-2">
        {isPAPSSAvailable && !isCleared && (
          <Button
            onClick={handlePAPSSClearing}
            disabled={isClearing || isTransitioning}
            className="w-full bg-os-accent hover:bg-os-accent-dark text-white font-semibold rounded-md h-12 shadow-sm"
          >
            {isClearing ? 'Processing Clearing...' : 'Initiate Clearing'}
          </Button>
        )}
        {isPAPSSAvailable && !isCleared && (
          <p className="text-center text-xs text-os-text-secondary/70">
            Need help with settlement?{' '}
            <a href="mailto:support@afrikoni.com" className="text-os-accent hover:underline font-medium">
              Contact Support
            </a>
          </p>
        )}
        <ForensicExportButton
          onClick={() => onExportAudit()}
          isGenerating={isGeneratingExport}
          label="Download Trade Report"
          className="w-full border-os-stroke hover:bg-os-bg"
        />
      </div>
    </div>
  );
}

function DisputedPanel({ trade }) {
  const { t } = useLanguage();
  return (
    <Surface variant="panel" className="p-12 text-center border-red-200 bg-red-50/50">
      <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-red-700">Trade Disputed</h2>
      <p className="mt-2 text-red-600/80 text-sm max-w-sm mx-auto">
        This trade has been flagged for review. A support agent will participate in the chat shortly to help resolve the issue.
      </p>
    </Surface>
  );
}

function ClosedPanel({ trade }) {
  const { t } = useLanguage();
  return (
    <Surface variant="panel" className="p-12 text-center border-os-stroke">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-6 h-6 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-os-text-secondary">Trade Archived</h2>
      <p className="mt-2 text-os-text-secondary text-sm">
        This trade successfully completed and has been archived for your records.
      </p>
    </Surface>
  );
}

function TrustScoreIndicator({ mutation, baseScore }) {
  const isPositive = mutation > 0;
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-white border border-os-stroke/60 shadow-sm"
    >
      <Shield className="w-4 h-4 text-emerald-600" />
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold text-os-text-secondary uppercase tracking-wider">Trust Score</p>
        <span className="text-sm font-black text-os-text-primary">{baseScore}</span>
        {mutation !== 0 && (
          <span className={cn("text-[10px] font-bold px-1 py-0.5 rounded ml-1", isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
            {isPositive ? '+' : ''}{mutation}
          </span>
        )}
      </div>
    </motion.div>
  );
}
