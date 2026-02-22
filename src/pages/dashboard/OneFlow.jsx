/**
 * ============================================================================
 * ONE FLOW - The Trade Operating System Core
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useTrade } from '@/hooks/queries/useTrade';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { ArrowLeft, ShieldAlert, Cpu, Sparkles, Terminal, ShieldCheck, CheckCircle, FileText, Download, Lock, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { PageLoader } from '@/components/shared/ui/skeletons';
import { cn } from '@/lib/utils';
import LiveDeliveryCard from '@/components/logistics/LiveDeliveryCard';
import SuccessScreen from '@/components/shared/ui/SuccessScreen';
import { useLocation } from 'react-router-dom';
import { Badge } from '@/components/shared/ui/badge';
import VerificationPanel from '@/components/verification/VerificationPanel';
import { TRADE_STATE, TRADE_STATE_LABELS, transitionTrade, clearLocalCurrency } from '@/services/tradeKernel';
import { useTradeEventLedger } from '@/hooks/useTradeEventLedger';
import { Surface } from '@/components/system/Surface';
import TradeTimeline from '@/components/trade/TradeTimeline';
import ReviewModal from '@/components/trade/ReviewModal';
import ConversationView from '@/components/inbox/ConversationView';

// Trade Panels
import RFQCreationPanel from '@/components/trade/RFQCreationPanel';
import QuoteReviewPanel from '@/components/trade/QuoteReviewPanel';
import ContractSigningPanel from '@/components/trade/ContractSigningPanel';
import EscrowFundingPanel from '@/components/trade/EscrowFundingPanel';
import ShipmentTrackingPanel from '@/components/trade/ShipmentTrackingPanel';
import DeliveryAcceptancePanel from '@/components/trade/DeliveryAcceptancePanel';

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

const CARRIER_STATES = new Set(['pickup_scheduled', 'in_transit', 'delivered', 'accepted', 'settled']);

export default function OneFlow() {
  const params = useParams();
  const tradeId = params.tradeId || params.id;
  const navigate = useNavigate();
  const { isSystemReady, profile } = useDashboardKernel();

  const { data: trade, isLoading: loading, error: queryError, refetch } = useTrade(tradeId);
  const [error, setError] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [kernelHang, setKernelHang] = useState(false);
  const { timeline: kernelTimeline } = useTradeEventLedger(tradeId);
  const location = useLocation();

  // 🛡️ KERNEL RESCUE: If loading takes too long, check for system errors
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSystemReady) {
        setKernelHang(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isSystemReady]);

  // 🛡️ KERNEL RESCUE: If loading takes too long, check for system errors
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && !trade && !queryError) {
        console.warn('[OneFlow] Trade load timeout - force checking fallback');
        // This helps if React Query is silently retrying a 404 or auth error
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, [loading, trade, queryError]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      setShowSuccessState(true);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location]);

  const isBuyer = trade?.buyer_company_id === profile?.company_id;
  const isSeller = trade?.seller_company_id === profile?.company_id;

  if (!isSystemReady) {
    if (kernelHang) {
      return (
        <div className="min-h-screen bg-os-bg flex items-center justify-center p-8">
          <Surface variant="panel" className="max-w-md w-full p-8 text-center border-amber-500/20">
            <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-bold mb-2 text-os-text-primary">System Latency Detected</h2>
            <p className="text-os-text-secondary text-sm mb-6">
              The Trade OS is taking longer than expected to synchronize your profile.
              This usually resolves automatically, but you can try to force-restore the session.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => window.location.reload()} className="w-full bg-amber-600 hover:bg-amber-700">
                Force Restore Session
              </Button>
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-xs">
                Back to Dashboard
              </Button>
            </div>
          </Surface>
        </div>
      );
    }
    return <PageLoader />;
  }

  if (queryError) {
    return (
      <div className="min-h-screen bg-os-bg flex items-center justify-center p-8">
        <Surface variant="panel" className="max-w-md w-full p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-os-error mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Trade Synchronization Failed</h2>
          <p className="text-os-text-secondary text-sm mb-6">
            We couldn't retrieve this trade context. This may be due to a permissions error or an invalid link.
          </p>
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            Return to Dashboard
          </Button>
        </Surface>
      </div>
    );
  }

  if (loading && !trade) {
    return <PageLoader />;
  }

  if (!trade) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center">
        <h2 className="text-os-xl font-bold">Trade Not Found</h2>
        <p className="text-os-text-secondary mt-2 mb-6">This trade may have been deleted or moved.</p>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const ActivePanel = FLOW_PANELS[trade.status] || DefaultPanel;

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

  async function handleReviewSubmit(reviewData) {
    await handleStateTransition(trade.status, { has_reviewed: true });
    setShowReviewModal(false);
  }

  if (showSuccessState) {
    return (
      <div className="min-h-screen bg-os-bg flex items-center justify-center p-8">
        <Surface variant="panel" className="max-w-2xl w-full p-0 overflow-hidden">
          <SuccessScreen
            title="Trade Rail Initiated"
            message={`Your order for ${trade.title} is now active on the Afrikoni Secure rail.`}
            theme="emerald"
            icon={ShieldCheck}
            nextSteps={[
              { label: "Contract is being generated for review", icon: <FileText className="w-4 h-4" /> },
              { label: "Supplier notified for immediate fulfillment", icon: <Sparkles className="w-4 h-4" /> },
              { label: "Trade Shield escrow protection is ACTIVE", icon: <ShieldCheck className="w-4 h-4" /> }
            ]}
            primaryAction={() => setShowSuccessState(false)}
            primaryActionLabel="Enter Workspace"
          />
        </Surface>
      </div>
    );
  }

  return (
    <div className="os-page-layout p-4 md:p-8">
      {/* COMMAND HEADER */}
      <div className="os-header-group flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div className="flex-1">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="pl-0 hover:bg-transparent text-os-text-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <h1 className="mt-2 tracking-tight">
            {trade.title || trade.product_name || 'Trade Workspace'}
          </h1>
          <p className="text-os-xs font-mono mt-1 uppercase tracking-widest text-os-text-secondary">
            {trade.buyer?.company_name} <span className="mx-2 opacity-30">/</span> {trade.seller ? trade.seller.company_name : 'PENDING'}
          </p>
          <div className="mt-3 flex gap-2">
            {isBuyer && <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">BUYER PERSPECTIVE</Badge>}
            {isSeller && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">SELLER PERSPECTIVE</Badge>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500 animate-pulse" />
            <span className="text-os-xs font-bold text-emerald-600 uppercase tracking-widest">Protected by Afrikoni Secure</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          {/* Main Action Panel */}
          <ActivePanel
            trade={trade}
            onTransition={handleStateTransition}
            isTransitioning={isTransitioning}
            isBuyer={isBuyer}
            isSeller={isSeller}
            profile={profile}
          />

          {/* Chat interface */}
          <Surface variant="panel" className="p-0 overflow-hidden min-h-[500px]">
            <ConversationView
              conversationId={trade.id}
              conversation={{
                ...trade,
                otherCompany: trade.seller || trade.buyer,
                id: trade.id
              }}
              currentUser={profile}
              companyId={profile?.company_id || profile?.id}
            />
          </Surface>

          <VerificationPanel country={trade.origin_country || trade.buyer?.country || trade.seller?.country} />

          {showReviewModal && (
            <ReviewModal
              isOpen={showReviewModal}
              onClose={() => setShowReviewModal(false)}
              trade={trade}
              onSubmit={handleReviewSubmit}
            />
          )}
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-5 space-y-8">
          {CARRIER_STATES.has(trade.status) && (
            <LiveDeliveryCard
              tradeId={trade.id}
              shipmentId={trade.metadata?.shipment_id}
              tradeStatus={trade.status}
              compact
            />
          )}

          <TradeTimeline
            tradeId={tradeId}
            currentState={trade.status}
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

function SettlementPanel({ trade, isTransitioning }) {
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

  if (isCleared) {
    return (
      <div className="space-y-6">
        <SuccessScreen
          title="Trade Rail Successfully Closed"
          message={`Institutional settlement for ${trade.title} is complete. All funds have been cleared and released.`}
          theme="emerald"
          icon={CheckCircle}
          nextSteps={[
            { label: "Funds cleared via PAPSS International Gateway", icon: <ShieldCheck className="w-4 h-4" /> },
            { label: "Legal digital twin record stored in Forensic Vault", icon: <Download className="w-4 h-4" /> },
            { label: "Trade participant trust scores updated", icon: <Sparkles className="w-4 h-4" /> }
          ]}
          primaryAction={() => window.location.href = '/dashboard/trades'}
          primaryActionLabel="Back to Pipeline"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Surface variant="glass" className="p-8 text-center border-emerald-500/20">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">💰</span>
        </div>
        <h2 className="text-os-xl font-bold">Funds Released</h2>
        <p className="mt-2 text-os-text-secondary text-os-sm">
          Escrow release confirmed. Funds are now available for clearing.
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

      <SuccessScreen
        title="Institutional Clearing Complete"
        message={`Domestic currency settlement for ${trade.title} is now finalized. Funds have been cleared through the Afrikoni Sovereign Rail.`}
        theme="gold"
        icon={ShieldCheck}
        nextSteps={[
          { label: "Funds released to institutional wallet", icon: <CheckCircle className="w-4 h-4" /> },
          { label: "Immutable Forensic Record stored on Ledger", icon: <FileText className="w-4 h-4" /> },
          { label: "Trade participant trust scores indexed", icon: <Sparkles className="w-4 h-4" /> }
        ]}
        primaryAction={() => window.location.href = '/dashboard/trades'}
        primaryActionLabel="Review Rail Pipeline"
      />
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
    <div className="py-12">
      <SuccessScreen
        title="Trade Vaulted & Archived"
        message={`The institutional lifecycle for ${trade.title} is complete. All forensic markers and compliance records are now immutable.`}
        theme="vault"
        icon={ShieldCheck}
        nextSteps={[
          { label: "Audit trail locked in Forensic Vault", icon: <Lock className="w-4 h-4" /> },
          { label: "Company Institutional DNA updated", icon: <Fingerprint className="w-4 h-4" /> }
        ]}
        primaryAction={() => window.location.href = '/dashboard'}
        primaryActionLabel="Terminal Dashboard"
      />
    </div>
  );
}
