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
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import TradeTimeline from './TradeTimeline';
import RFQCreationPanel from './RFQCreationPanel';
import QuoteReviewPanel from './QuoteReviewPanel';
import ContractSigningPanel from './ContractSigningPanel';
import EscrowFundingPanel from './EscrowFundingPanel';
import ShipmentTrackingPanel from './ShipmentTrackingPanel';
import DeliveryAcceptancePanel from './DeliveryAcceptancePanel';
import { supabase } from '@/api/supabaseClient';
import { transitionTrade, TRADE_STATE } from '@/services/tradeKernel';
import { emitTradeEvent } from '@/services/tradeEvents';
import { ArrowLeft } from 'lucide-react';

/**
 * The ONE FLOW does not show multiple steps at once.
 * It shows ONE thing at a time based on kernel state.
 * This is intentional - it forces focus and prevents confusion.
 */
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
  [TRADE_STATE.CLOSED]: ClosedPanel
};

export default function OneFlow() {
  const { tradeId } = useParams();
  const navigate = useNavigate();

  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    loadTrade();
  }, [tradeId]);

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
      const result = await transitionTrade(
        tradeId,
        trade.status,
        nextState,
        metadata
      );

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
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
        <Card className="border-red-200 bg-red-50/50 mt-4">
          <CardContent className="p-6 text-center">
            <p className="text-red-700 font-semibold">Trade not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get the panel component for current state
  const PanelComponent = FLOW_PANELS[trade.status] || DefaultPanel;

  return (
    <div className="max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#F5F0E8] mt-4">
          {trade.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {trade.buyer?.company_name} {trade.seller ? `→ ${trade.seller.company_name}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN FLOW PANEL (left 2/3) */}
        <div className="lg:col-span-2">
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
              />
            </motion.div>
          </AnimatePresence>

          {error && (
            <Card className="border-red-200 bg-red-50/50 mt-4">
              <CardContent className="p-4 text-sm text-red-700">
                {error}
              </CardContent>
            </Card>
          )}
        </div>

        {/* TRADE TIMELINE (right 1/3, sticky) */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          <TradeTimeline
            tradeId={tradeId}
            currentState={trade.status}
          />
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
    <Card>
      <CardContent className="p-6 text-center">
        <p className="text-gray-500">State: {trade.status}</p>
        <p className="text-sm text-gray-400 mt-2">No action available for this state yet.</p>
      </CardContent>
    </Card>
  );
}

/**
 * Settlement panel (money released, showing confirmation)
 */
function SettlementPanel({ trade }) {
  return (
    <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
      <CardContent className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
          <span className="text-2xl">💰</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-[#F5F0E8]">
          Payment Released
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Escrow funds have been released to the supplier.
        </p>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mt-4 text-left">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Order Summary</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Quantity: {trade.quantity} {trade.quantity_unit}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total: {trade.price_max || trade.price_min} {trade.currency}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Closed panel (trade complete)
 */
function ClosedPanel({ trade }) {
  return (
    <Card className="border-afrikoni-gold/20 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-[#0F0F0F] rounded-afrikoni-lg shadow-premium">
      <CardContent className="p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">
          Trade Closed
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          This trade has been successfully completed.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
          Trade ID: {trade.id}
        </p>
      </CardContent>
    </Card>
  );
}
