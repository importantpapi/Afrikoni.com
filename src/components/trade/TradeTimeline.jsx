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
import { getTradeTimeline, subscribeToTradeEvents } from '@/services/tradeEvents';
import { TRADE_STATE, TRADE_STATE_LABELS, TRADE_STATE_ORDER } from '@/services/tradeKernel';

/**
 * RAILROAD TRACK VISUALIZATION
 * Shows all possible states and where the trade currently is
 */
const TRACK_META = {
  [TRADE_STATE.DRAFT]: { icon: 'circle', color: 'gray' },
  [TRADE_STATE.RFQ_CREATED]: { icon: 'zap', color: 'blue' },
  [TRADE_STATE.QUOTED]: { icon: 'clock', color: 'blue' },
  [TRADE_STATE.CONTRACTED]: { icon: 'check', color: 'green' },
  [TRADE_STATE.ESCROW_REQUIRED]: { icon: 'lock', color: 'yellow' },
  [TRADE_STATE.ESCROW_FUNDED]: { icon: 'check', color: 'green' },
  [TRADE_STATE.PRODUCTION]: { icon: 'clock', color: 'blue' },
  [TRADE_STATE.PICKUP_SCHEDULED]: { icon: 'clock', color: 'blue' },
  [TRADE_STATE.IN_TRANSIT]: { icon: 'zap', color: 'blue' },
  [TRADE_STATE.DELIVERED]: { icon: 'check', color: 'green' },
  [TRADE_STATE.ACCEPTED]: { icon: 'check', color: 'green' },
  [TRADE_STATE.SETTLED]: { icon: 'check', color: 'green' },
  [TRADE_STATE.DISPUTED]: { icon: 'lock', color: 'red' },
  [TRADE_STATE.CLOSED]: { icon: 'check', color: 'gray' }
};

const RAILROAD_TRACK = TRADE_STATE_ORDER.map((state) => ({
  state,
  label: TRADE_STATE_LABELS[state] || state,
  ...(TRACK_META[state] || { icon: 'circle', color: 'gray' })
}));

export default function TradeTimeline({ tradeId, currentState, onStateChange }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [tradeId]);

  useEffect(() => {
    if (!tradeId) return;
    const unsubscribe = subscribeToTradeEvents(tradeId, (payload) => {
      if (payload?.eventType === 'INSERT' && payload?.new) {
        setEvents((prev) => [...prev, payload.new]);
      }
    });
    return () => unsubscribe && unsubscribe();
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
  const nextState = RAILROAD_TRACK[currentIndex + 1]?.state || null;
  const nextLabel = nextState ? (TRADE_STATE_LABELS[nextState] || nextState) : 'None';

  return (
    <div className="w-full bg-gradient-to-br from-[#0E1016] to-[#141B24] rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.35)] p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(circle_at_top_left,rgba(201,156,78,0.25),transparent_55%)]" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              Kernel Rail
            </h2>
            <p className="text-sm mt-1">
              Current state: <span className="font-semibold">{RAILROAD_TRACK[currentIndex]?.label || currentState}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em]">Next Action</p>
            <p className="text-sm font-semibold">{nextLabel}</p>
          </div>
        </div>
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
                      ${isCompleted ? 'bg-emerald-400/10 ring-emerald-400/40' : ''}
                      ${isCurrent ? 'bg-afrikoni-gold/20 ring-afrikoni-gold shadow-lg scale-125' : ''}
                      ${isLocked && !isCurrent ? 'bg-white/5 ring-white/20' : ''}
                      ${isDisput ? 'ring-red-500 bg-red-500/10' : ''}
                    `}
                  >
                    {isCompleted && <CheckCircle2 className="w-5 h-5" />}
                    {isCurrent && <Zap className="w-5 h-5 animate-pulse" />}
                    {isLocked && !isCurrent && <Lock className="w-4 h-4" />}
                    {!isCompleted && !isCurrent && !isLocked && <Circle className="w-4 h-4" />}
                  </div>

                  {/* LABEL */}
                  <span
                    className={`text-xs font-medium text-center w-20
                      ${isCompleted ? 'text-emerald-200' : ''}
                      ${isCurrent ? 'text-afrikoni-gold font-bold' : ''}
                      ${isLocked && !isCurrent ? 'text-white/45' : ''}
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
                        ${isCompleted ? 'bg-emerald-400/60 shadow-sm' : ''}
                        ${!isCompleted && index + 1 <= currentIndex ? 'bg-emerald-400/60 shadow-sm' : ''}
                        ${index >= currentIndex ? 'bg-white/10' : ''}
                      `}
                    />
                    <ChevronRight className="absolute w-4 h-4 -right-2 top-1/2 -translate-y-1/2" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* TIMELINE EVENTS (Detailed history in reverse chronological order) */}
      <div className="mt-8 pt-6 border-t">
        <h3 className="text-sm font-semibold mb-4">
          Event Stream
        </h3>

        {loading ? (
          <div className="text-center py-8">Loading timeline...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-sm">
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
                className="flex gap-4 p-3 rounded-xl border cv-auto"
              >
                {/* Event Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full mt-1.5" />
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {formatEventLabel(event.event_type)}
                  </p>
                  <p className="text-xs mt-0.5">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <p className="text-xs mt-1">
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
      <div className="mt-8 pt-6 border-t flex items-center gap-3 text-xs">
        <div
          className={`w-2 h-2 rounded-full ${currentState === TRADE_STATE.DISPUTED
              ? 'bg-red-500 animate-pulse'
              : currentState === TRADE_STATE.CLOSED
                ? 'bg-gray-500'
                : 'bg-green-500'
            }`}
        />
        <span className="">
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
