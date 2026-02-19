import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';
import { SignalChip } from '@/components/system/SignalChip';
import { Button } from '@/components/shared/ui/button';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import EmptyState from '@/components/shared/ui/EmptyState';
import EscrowMilestoneProgress from '@/components/dashboard/EscrowMilestoneProgress';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useTradeKernelState } from '@/hooks/useTradeKernelState';
import { useWorkspaceMode } from '@/contexts/WorkspaceModeContext';
import { transitionTrade, TRADE_STATE } from '@/services/tradeKernel';
import TradeOSErrorBoundary from '@/components/shared/TradeOSErrorBoundary';
import { toast } from 'sonner';
import { useTradeEventLedger } from '@/hooks/useTradeEventLedger';
import AfCFTAOriginCheck from '@/components/dashboard/AfCFTAOriginCheck'; // Integrated Compliance
import {
  Activity,
  ArrowRight,
  FileCheck,
  MessageSquare,
  ShieldAlert,
  Ship,
  Sparkles,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useTrustScore } from '@/hooks/useTrustScore';
import TrustBadge from '@/components/trust/TrustBadge';
import { getQuotesForRFQ } from '@/services/quoteService';
import ReviewForm from '@/components/reviews/ReviewForm';
import { Dialog, DialogContent, DialogTrigger } from '@/components/shared/ui/dialog';

const STAGES = [
  { id: 'rfq', label: 'RFQ' },
  { id: 'quote', label: 'Quote' },
  { id: 'contract', label: 'Contract' },
  { id: 'escrow', label: 'Escrow' },
  { id: 'production', label: 'Production' },
  { id: 'shipment', label: 'Shipment' },
  { id: 'settlement', label: 'Settlement' },
];

const mapStatusToStage = (status = '') => {
  const normalized = String(status).toLowerCase();
  if (['draft', 'rfq_open', 'open'].includes(normalized)) return 'rfq';
  if (['quoted', 'quote_sent'].includes(normalized)) return 'quote';
  if (['contracted', 'contract_signed'].includes(normalized)) return 'contract';
  if (['escrow_required', 'escrow_funded', 'escrow_pending'].includes(normalized)) return 'escrow';
  if (['production', 'manufacturing'].includes(normalized)) return 'production';
  if (['pickup_scheduled', 'in_transit', 'shipped', 'delivered'].includes(normalized)) return 'shipment';
  if (['accepted', 'settled', 'closed'].includes(normalized)) return 'settlement';
  return 'rfq';
};

const NEXT_STATE_BY_STAGE = {
  rfq: TRADE_STATE.QUOTED,
  quote: TRADE_STATE.CONTRACTED,
  contract: TRADE_STATE.ESCROW_REQUIRED,
  escrow: TRADE_STATE.ESCROW_FUNDED,
  production: TRADE_STATE.PICKUP_SCHEDULED,
  shipment: TRADE_STATE.DELIVERED,
  settlement: TRADE_STATE.SETTLED,
};

export default function TradeWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canLoadData, isSystemReady } = useDashboardKernel();
  const tradeKernel = useTradeKernelState();
  const { isSimple } = useWorkspaceMode();
  const operatorFrame = isSimple ? '' : 'border-0 bg-transparent shadow-none';
  const operatorSoft = isSimple ? '' : 'border border-os-stroke/30 bg-os-surface-1/40 shadow-none';
  const operatorBleed = isSimple ? '' : 'md:-mx-6 lg:-mx-10';
  const operatorImmersive = isSimple ? '' : 'os-immersive';

  const [trade, setTrade] = useState(null);
  const [tradeType, setTradeType] = useState('order');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [kernelBlock, setKernelBlock] = useState(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const { timeline: kernelTimeline } = useTradeEventLedger(trade?.id);

  // ✅ TRUST SCORE INTEGRATION
  const { trustData } = useTrustScore(trade?.seller_company_id);

  // ✅ QUOTE & REVIEW STATE
  const [quotes, setQuotes] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);

  // Load Quotes for RFQs
  useEffect(() => {
    if (trade?.id && tradeType === 'rfq') {
      getQuotesForRFQ(trade.id).then(res => {
        if (res.success) setQuotes(res.quotes);
      });
    }
  }, [trade?.id, tradeType]);

  // Trigger Review Modal
  useEffect(() => {
    if ((trade?.status === 'delivered' || trade?.status === 'settled') && !trade.metadata?.reviewed_at) {
      // Simple check: show modal if not reviewed and status is complete
      // In production, we'd check 'reviews' table to avoid nagging
      const hasReviewed = localStorage.getItem(`reviewed_${trade.id}`);
      if (!hasReviewed) {
        setShowReviewModal(true);
      }
    }
  }, [trade?.status, trade?.id]);


  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!isSystemReady || !canLoadData || !id) return;
      setIsLoading(true);
      setLoadError(null);

      try {
        const { data: directTrade, error: tradeError } = await supabase
          .from('trades')
          .select('*')
          .eq('id', id)
          .maybeSingle?.() ?? { data: null, error: null };

        if (!active) return;

        if (!tradeError && directTrade) {
          setTrade(directTrade);
          setTradeType(directTrade.trade_type || 'order');
          setIsLoading(false);
          return;
        }

        const { data: linkedTrade, error: linkedError } = await supabase
          .from('trades')
          .select('*')
          .or(`order_id.eq.${id},rfq_id.eq.${id}`)
          .maybeSingle?.() ?? { data: null, error: null };

        if (!active) return;

        if (!linkedError && linkedTrade) {
          setTrade(linkedTrade);
          setTradeType(linkedTrade.trade_type || 'order');
          setIsLoading(false);
          return;
        }

        setTrade(null);
        setLoadError('Trade not found');
      } catch (error) {
        if (!active) return;
        setLoadError(error?.message || 'Failed to load trade workspace');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id, canLoadData, isSystemReady]);

  const stageId = useMemo(() => mapStatusToStage(trade?.status), [trade?.status]);
  const currentStageIndex = STAGES.findIndex((stage) => stage.id === stageId);
  const nextStageIndex = Math.min(currentStageIndex + 1, STAGES.length - 1);
  const currentStageLabel = STAGES[currentStageIndex]?.label || 'RFQ';
  const nextStageLabel = STAGES[nextStageIndex]?.label || 'Quote';
  const tradeValue = Number(trade?.total_amount ?? trade?.totalValue ?? trade?.price_max ?? trade?.price_min ?? 0);
  const escrowHeld = Number(trade?.held_amount ?? trade?.metadata?.escrow_held_amount ?? 0);
  const escrowReleased = Number(trade?.released_amount ?? trade?.metadata?.escrow_released_amount ?? 0);
  const unlockAmount = Number(escrowReleased || tradeValue * 0.3 || 19200);
  const nextState = NEXT_STATE_BY_STAGE[stageId];
  const nextAction = tradeKernel.afcftaReady
    ? {
      title: `Advance to ${nextStageLabel}`,
      consequences: [
        `Validating conditions for ${nextState || 'next stage'}`,
        'Updating trade ledger',
      ],
    }
    : {
      title: 'Upload AfCFTA certificate',
      consequences: [
        'Required for tariff preference',
        'Unlocks escrow release controls',
      ],
    };

  const handleAdvance = async (overrideNextState = null, metadataPayload = {}) => {
    const targetState = overrideNextState || nextState;
    if (!targetState || !trade?.id) return;

    // 🚨 COMPLIANCE GATE
    if (tradeKernel.kycStatus !== 'verified') {
      toast.error('Identity verification required to advance trade.');
      return;
    }

    setIsAdvancing(true);
    setKernelBlock(null);

    // Merge provided metadata (e.g. quote_id) with new DNA
    const result = await transitionTrade(trade.id, targetState, metadataPayload);
    if (!result.success) {
      setKernelBlock({
        message: result.error || 'Kernel blocked transition.',
        reasonCode: result.reasonCode || result.reason_code,
        requiredActions: result.requiredActions || result.required_actions || []
      });
      toast.error(result.error || 'Kernel blocked transition.');
      setIsAdvancing(false);
      return;
    }
    if (result.trade) {
      setTrade(result.trade);
    }
    toast.success(`Kernel advanced trade to ${nextStageLabel}.`);
    setIsAdvancing(false);
  };

  const kernelActions = useMemo(() => {
    const actions = [];
    if (kernelBlock?.message) {
      actions.push({
        tone: 'blocked',
        title: 'Kernel blocked transition',
        detail: kernelBlock.message,
        consequence: kernelBlock.requiredActions?.length
          ? `Required: ${kernelBlock.requiredActions.slice(0, 3).join(', ')}`
          : 'Resolve the block to unlock the next stage.',
        cta: { label: 'View compliance', link: '/dashboard/compliance' },
      });
    }
    if (!tradeKernel.afcftaReady) {
      actions.push({
        tone: 'blocked',
        title: 'Kernel blocked release',
        detail: 'AfCFTA certificate missing. Escrow release remains locked.',
        consequence: 'If not uploaded within 48h → ETA +3 days, buyer SLA risk.',
        cta: { label: 'Upload certificate', link: '/dashboard/compliance' },
      });
    }
    if (tradeType === 'rfq' && trade.status === 'rfq_open') {
      actions.push({
        tone: 'auto',
        title: 'Kernel routing RFQ',
        detail: 'Scanning verified suppliers in active corridors.',
        consequence: 'Updates will appear in the event stream.',
        cta: { label: 'View RFQs', link: '/dashboard/rfqs' },
      });
    }
    if (tradeType === 'order' && trade.status === 'in_transit') {
      actions.push({
        tone: 'recommend',
        title: 'Logistics Monitoring',
        detail: 'Kernel is tracking carrier milestones.',
        consequence: 'Real-time updates enabled.',
        cta: { label: 'Track Shipment', link: '/dashboard/shipments' },
      });
    }

    // 🚨 COMPLIANCE GATE: Block everything if KYC/KYB is missing
    if (tradeKernel.kycStatus !== 'verified') {
      // Clear other actions, this is the only one that matters
      return [{
        tone: 'blocked',
        title: 'Identity verification required',
        detail: 'KYC/KYB check pending. Trading disabled until verified.',
        consequence: 'Account limit: $0.00',
        cta: { label: 'Complete Verification', link: '/dashboard/compliance' },
      }];
    }

    return actions.slice(0, 4);
  }, [kernelBlock?.message, tradeKernel.afcftaReady, tradeType]);

  const kernelConsole = useMemo(() => {
    const blocks = [];
    if (kernelBlock?.message) {
      blocks.push(kernelBlock.message);
    } else if (!tradeKernel.afcftaReady) {
      blocks.push('AfCFTA certificate missing');
    }

    const autoActions = kernelActions
      .filter((action) => action.tone === 'auto')
      .map((action) => action.title);

    const upcoming = [
      `Next trigger: ${nextStageLabel}`,
      `Transition guard: ${nextState || 'unknown'}`
    ];

    const audit = kernelTimeline?.length ? kernelTimeline.slice(0, 6) : [
      { label: 'Kernel initialized', time: 'just now' }
    ];

    return { blocks, autoActions, upcoming, audit };
  }, [kernelBlock?.message, tradeKernel.afcftaReady, kernelActions, nextStageLabel, nextState, currentStageLabel, kernelTimeline]);

  if (isLoading) {
    return <SpinnerWithTimeout message="Loading trade workspace..." ready={isSystemReady} />;
  }

  if (!trade || loadError) {
    return (
      <div className="os-page os-stagger space-y-4">
        <Surface className="p-6">
          <EmptyState
            title="Trade workspace unavailable"
            description={loadError || 'We couldn’t locate this trade.'}
            cta="Back to Dashboard"
            ctaLink="/dashboard"
          />
        </Surface>
      </div>
    );
  }

  return (
    <div className="os-page os-stagger space-y-6 pb-10">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT: Main Dossier */}
        <div className="flex-1 space-y-6">
          <TradeOSErrorBoundary>
            <Surface
              variant="panel"
              className={`p-6 md:p-8 os-rail-glow relative overflow-hidden ${operatorBleed} ${operatorImmersive} ${isSimple ? '' : 'md:px-10 md:py-10'}`}
            >
              {/* Header Content */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <div className="os-label flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-os-accent animate-pulse" />
                    Live Trade Dossier
                  </div>
                  <h1 className="text-3xl font-light mt-2 tracking-tight text-white">
                    {tradeType === 'order' ? 'Order' : 'RFQ'} <span className="font-mono text-white/50">#{trade?.id?.slice?.(-8) || trade?.id}</span>
                  </h1>
                  <p className="text-os-sm text-os-muted mt-2 font-mono">
                    {trade?.title || trade?.product_name || trade?.product || 'Trade mission via ' + (trade?.corridor?.originCountry || 'Origin') + ' -> ' + (trade?.corridor?.destinationCountry || 'Destination')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge label={String(trade?.status || 'ACTIVE').toUpperCase()} tone="neutral" />
                  {tradeKernel.afcftaReady && <StatusBadge label="AfCFTA VERIFIED" tone="good" />}
                  {/* Trust Badge */}
                  {trustData && <TrustBadge score={trustData.total_score} level={trustData.level} size="lg" />}
                </div>
              </div>

              {/* Timeline Visualization */}
              <div className="os-timeline mb-8 relative">
                <div className="grid grid-cols-7 gap-1 relative z-10 w-full">
                  {STAGES.map((stage, index) => {
                    const isActive = index === currentStageIndex;
                    const isComplete = index < currentStageIndex;
                    const isNext = index === nextStageIndex && !isActive;
                    const isLocked = index > nextStageIndex;
                    return (
                      <div
                        key={stage.id}
                        className={`flex flex-col items-center gap-2`}
                      >
                        <div className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${isActive ? 'bg-os-accent border-os-accent shadow-[0_0_10px_#D4A937]' : isComplete ? 'bg-os-accent border-transparent' : 'bg-transparent border-white/20'}`} />
                        <span className={`text-os-xs uppercase font-bold tracking-wider text-center ${isActive ? 'text-os-accent' : 'text-white/30'}`}>{stage.label}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Timeline Line */}
                <div className="absolute top-[5px] left-0 right-0 h-[2px] bg-white/5 z-0" />
                <div className="absolute top-[5px] left-0 h-[2px] bg-os-accent z-0 transition-all duration-1000" style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }} />
              </div>

              {/* Next Action Driver */}
              <div className="grid md:grid-cols-[1.5fr_1fr] gap-6 mt-6 pt-6 border-t border-white/5">
                <div>
                  <div className="text-os-xs uppercase tracking-widest text-os-accent mb-2 font-bold">Recommended Action</div>
                  <h3 className="text-os-xl font-medium text-white mb-2">{nextAction.title}</h3>
                  <div className="space-y-1">
                    {nextAction.consequences.map((item, i) => (
                      <div key={i} className="text-os-sm text-white/60 flex items-center gap-2">
                        <ArrowRight className="w-3 h-3 text-os-accent" /> {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={handleAdvance}
                      disabled={isAdvancing || !nextState}
                      className="bg-os-accent hover:bg-os-accent-dark text-black font-bold uppercase tracking-wide px-8"
                    >
                      {isAdvancing ? 'Processing...' : 'Execute'}
                    </Button>
                  </div>
                </div>

                {/* Mini Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-os-xs uppercase text-white/40 mb-1">Value</div>
                    <div className="text-os-lg font-mono text-white">${tradeValue.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-os-xs uppercase text-white/40 mb-1">ETA</div>
                    <div className="text-os-lg font-mono text-white">{trade?.delivery_date || 'TBD'}</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5 col-span-2">
                    <div className="text-os-xs uppercase text-white/40 mb-1">Compliance</div>
                    <div className={`text-os-sm font-bold ${tradeKernel.afcftaReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {tradeKernel.afcftaReady ? 'AfCFTA CERTIFIED' : 'DOCUMENT PENDING'}
                    </div>
                  </div>
                </div>
              </div>
            </Surface>
          </TradeOSErrorBoundary>

          {/* Document/Logistics Streams */}
          <div className="grid md:grid-cols-2 gap-4">
            <TradeOSErrorBoundary>
              <Surface variant="panel" className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-os-sm font-bold">Trade Documents</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5 text-os-sm">
                    <span className="text-white/70">Commercial Invoice</span>
                    <StatusBadge label="VERIFIED" tone="good" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5 text-os-sm">
                    <span className="text-white/70">Bill of Lading</span>
                    <StatusBadge label="PENDING" tone="neutral" />
                  </div>
                </div>
              </Surface>
            </TradeOSErrorBoundary>

            <TradeOSErrorBoundary>
              <Surface variant="panel" className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Timer className="w-4 h-4 text-emerald-400" />
                  <span className="text-os-sm font-bold">Escrow Release</span>
                </div>
                <EscrowMilestoneProgress
                  totalAmount={tradeValue || 64000}
                  releasedAmount={escrowReleased || 19200}
                  heldAmount={escrowHeld || 44800}
                  currentMilestone={stageId === 'shipment' ? 'shipment_confirmed' : stageId === 'settlement' ? 'delivery_confirmed' : 'order_confirmed'}
                  className="bg-transparent"
                />
              </Surface>
            </TradeOSErrorBoundary>

            {/* ✅ QUOTE SELECTION (For RFQs) */}
            {tradeType === 'rfq' && (trade?.status === 'rfq_open' || trade?.status === 'quoted') && (
              <TradeOSErrorBoundary>
                <Surface variant="panel" className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4 h-4 text-os-accent" />
                    <span className="text-os-sm font-bold">Received Quotes ({quotes.length})</span>
                  </div>

                  {quotes.length === 0 ? (
                    <div className="text-center p-8 border border-dashed border-white/10 rounded-lg">
                      <p className="text-white/40 text-os-sm">Waiting for suppliers to submit quotes...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quotes.map(quote => (
                        <div key={quote.id} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-os-accent/30 transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="text-white font-medium">{quote.companies?.name || 'Verified Supplier'}</div>
                              <div className="text-os-xs text-white/50">{quote.companies?.country}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-os-lg font-mono text-os-accent font-bold">
                                {Number(quote.total_price).toLocaleString()} {quote.currency}
                              </div>
                              <div className="text-os-xs text-white/50">
                                {Number(quote.unit_price).toLocaleString()} / {quote.quantity_unit}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 text-os-xs text-white/70 mb-4">
                            <span className="px-2 py-1 bg-white/5 rounded">Lead Time: {quote.lead_time_days} days</span>
                            <span className="px-2 py-1 bg-white/5 rounded">{quote.incoterms}</span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white"
                              onClick={() => navigate(`/dashboard/messages?recipient=${quote.supplier_company_id}&rfq=${trade.id}&productTitle=${encodeURIComponent(trade.title)}`)}
                            >
                              Message
                            </Button>
                            <Button
                              className="flex-[2] bg-os-accent text-black hover:bg-os-accent-dark font-bold"
                              onClick={() => handleAdvance(TRADE_STATE.CONTRACTED, { quote_id: quote.id })}
                              disabled={isAdvancing}
                            >
                              {isAdvancing ? 'Processing...' : 'Accept & Contract'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Surface>
              </TradeOSErrorBoundary>
            )}

          </div>
        </div>

        {/* RIGHT: Intelligence Rail */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-6">
          {/* AI Copilot Embed */}
          <div className="sticky top-6 space-y-4">

            {/* Compliance Rail */}
            <TradeOSErrorBoundary>
              <AfCFTAOriginCheck trade={trade} />
            </TradeOSErrorBoundary>

            {/* Kernel Ledger */}
            <TradeOSErrorBoundary>
              <Surface variant="panel" className="p-4 border border-os-stroke/40">
                <div className="text-os-xs uppercase tracking-widest text-os-muted mb-3 font-bold border-b border-os-stroke/40 pb-2">Kernel Ledger</div>
                <div className="space-y-3">
                  {kernelConsole.audit.map((item, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <div className="text-os-xs text-[var(--os-text-primary)]">{item.label}</div>
                      <div className="text-os-xs font-mono text-os-muted">{item.time}</div>
                    </div>
                  ))}
                </div>
              </Surface>
            </TradeOSErrorBoundary>
          </div>
        </div>
      </div>

      {/* ✅ REVIEW MODAL */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="bg-os-surface-2 border-os-stroke text-white sm:max-w-[500px]">
          <ReviewForm
            order={trade}
            product={{ id: trade?.product_id, name: trade?.title }}
            company={{ id: trade?.seller_company_id }}
            onSuccess={() => {
              setShowReviewModal(false);
              localStorage.setItem(`reviewed_${trade.id}`, 'true');
              toast.success('Review verified on blockchain ledger');
            }}
            onCancel={() => setShowReviewModal(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
