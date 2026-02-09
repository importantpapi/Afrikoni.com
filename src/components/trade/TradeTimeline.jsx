/**
 * ============================================================================
 * TRADE TIMELINE - The Visual Projection of Trade Kernel State
 * ============================================================================
 * 
 * Displays the trade as a timeline from RFQ → Delivery → Settlement.
 * Each state is a station on the railroad track.
 * The UI gates actions based on kernel state.
 * This is NOT a dashboard feature - it IS the CORE of the OS.
 * 
 * Design inspiration: Stripe Dashboard, Linear, Palantir Gotham
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Lock,
  Zap
} from 'lucide-react';
import { getTradeTimeline } from '@/services/tradeEvents';
import { TRADE_STATE } from '@/services/tradeKernel';

/**
 * RAILROAD TRACK VISUALIZATION
 * Shows all possible states and where the trade currently is
 */
const RAILROAD_TRACK = [
  { state: TRADE_STATE.DRAFT, label: 'Draft', icon: 'circle', color: 'gray' },
  { state: TRADE_STATE.RFQ_OPEN, label: 'RFQ Open', icon: 'zap', color: 'blue' },
  { state: TRADE_STATE.QUOTED, label: 'Quoted', icon: 'clock', color: 'blue' },
  { state: TRADE_STATE.CONTRACTED, label: 'Contracted', icon: 'check', color: 'green' },
  { state: TRADE_STATE.ESCROW_REQUIRED, label: 'Escrow Required', icon: 'lock', color: 'yellow' },
  { state: TRADE_STATE.ESCROW_FUNDED, label: 'Escrow Funded', icon: 'check', color: 'green' },
  { state: TRADE_STATE.PRODUCTION, label: 'Production', icon: 'clock', color: 'blue' },
  { state: TRADE_STATE.PICKUP_SCHEDULED, label: 'Pickup Scheduled', icon: 'clock', color: 'blue' },
  { state: TRADE_STATE.IN_TRANSIT, label: 'In Transit', icon: 'zap', color: 'blue' },
  { state: TRADE_STATE.DELIVERED, label: 'Delivered', icon: 'check', color: 'green' },
  { state: TRADE_STATE.ACCEPTED, label: 'Accepted', icon: 'check', color: 'green' },
  { state: TRADE_STATE.SETTLED, label: 'Settled', icon: 'check', color: 'green' },
  { state: TRADE_STATE.CLOSED, label: 'Closed', icon: 'check', color: 'gray' }
];

export default function TradeTimeline({ tradeId, currentState, onStateChange }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [tradeId]);

  async function loadTimeline() {
    const result = await getTradeTimeline(tradeId);
    if (result.success) {
      setEvents(result.events || []);
    }
    setLoading(false);
  }

  // Find current position in track
  const currentIndex = RAILROAD_TRACK.findIndex(t => t.state === currentState);

  return (
    <div className="w-full bg-white dark:bg-[#0F0F0F] rounded-afrikoni-lg border border-afrikoni-gold/20 shadow-premium p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-[#F5F0E8]">
          Trade Timeline
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Current state: <span className="font-semibold text-afrikoni-gold">{RAILROAD_TRACK[currentIndex]?.label}</span>
        </p>
      </div>

      {/* RAILROAD TRACK - Horizontal scrollable on mobile */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-0 min-w-max">
          {RAILROAD_TRACK.map((station, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isLocked = index > currentIndex;
            const isDisput = currentState === TRADE_STATE.DISPUTED;

            return (
              <React.Fragment key={station.state}>
                {/* STATION */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex flex-col items-center gap-2 relative z-10`}
                >
                  {/* ICON/CIRCLE */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      transition-all duration-300 ring-2
                      ${isCompleted ? 'bg-green-100 dark:bg-green-900/30 ring-green-300 dark:ring-green-600' : ''}
                      ${isCurrent ? 'bg-afrikoni-gold/20 ring-afrikoni-gold shadow-lg scale-125' : ''}
                      ${isLocked && !isCurrent ? 'bg-gray-100 dark:bg-gray-800 ring-gray-300 dark:ring-gray-600' : ''}
                      ${isDisput ? 'ring-red-500 bg-red-100/30' : ''}
                    `}
                  >
                    {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />}
                    {isCurrent && <Zap className="w-5 h-5 text-afrikoni-gold animate-pulse" />}
                    {isLocked && !isCurrent && <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                    {!isCompleted && !isCurrent && !isLocked && <Circle className="w-4 h-4 text-gray-400" />}
                  </div>

                  {/* LABEL */}
                  <span
                    className={`text-xs font-medium text-center w-20
                      ${isCompleted ? 'text-green-700 dark:text-green-300' : ''}
                      ${isCurrent ? 'text-afrikoni-gold font-bold' : ''}
                      ${isLocked && !isCurrent ? 'text-gray-500 dark:text-gray-400' : ''}
                    `}
                  >
                    {station.label}
                  </span>
                </motion.div>

                {/* CONNECTOR (between stations) */}
                {index < RAILROAD_TRACK.length - 1 && (
                  <div className="flex-1 relative h-10 mx-2 flex items-center justify-center">
                    <div
                      className={`h-1 flex-1 rounded-full transition-all duration-300
                        ${isCompleted ? 'bg-green-300 dark:bg-green-600 shadow-sm' : ''}
                        ${!isCompleted && index + 1 <= currentIndex ? 'bg-green-300 dark:bg-green-600 shadow-sm' : ''}
                        ${index >= currentIndex ? 'bg-gray-300 dark:bg-gray-700' : ''}
                      `}
                    />
                    <ChevronRight className="absolute w-4 h-4 text-afrikoni-gold -right-2 top-1/2 -translate-y-1/2" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* TIMELINE EVENTS (Detailed history in reverse chronological order) */}
      <div className="mt-8 pt-6 border-t border-afrikoni-gold/10">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-[#F5F0E8] mb-4">
          Activity Log
        </h3>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading timeline...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No events yet. RFQ will begin when published.
          </div>
        ) : (
          <div className="space-y-3">
            {[...events].reverse().map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800"
              >
                {/* Event Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full bg-afrikoni-gold mt-1.5" />
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatEventLabel(event.event_type)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {JSON.stringify(event.metadata).substring(0, 100)}...
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* KERNEL STATUS INDICATOR */}
      <div className="mt-8 pt-6 border-t border-afrikoni-gold/10 flex items-center gap-3 text-xs">
        <div
          className={`w-2 h-2 rounded-full ${
            currentState === TRADE_STATE.DISPUTED
              ? 'bg-red-500 animate-pulse'
              : currentState === TRADE_STATE.CLOSED
              ? 'bg-gray-500'
              : 'bg-green-500'
          }`}
        />
        <span className="text-gray-600 dark:text-gray-400">
          {currentState === TRADE_STATE.DISPUTED && '⚠️ Trade under dispute'}
          {currentState === TRADE_STATE.CLOSED && '✓ Trade closed'}
          {!['disputed', 'closed'].includes(currentState) && `Kernel in state: ${currentState}`}
        </span>
      </div>
    </div>
  );
}

/**
 * Format event type to human-readable label
 */
function formatEventLabel(eventType) {
  const labels = {
    state_transition: 'State transition',
    rfq_created: 'RFQ created',
    rfq_published: 'RFQ published',
    quote_received: 'Quote received',
    quote_selected: 'Quote selected',
    contract_generated: 'Contract generated',
    escrow_created: 'Escrow created',
    escrow_funded: 'Escrow funded',
    in_transit: 'Shipment in transit',
    delivered: 'Delivered',
    delivery_accepted: 'Delivery accepted',
    payment_released: 'Payment released',
    dispute_created: 'Dispute created'
  };
  return labels[eventType] || eventType;
}
