/**
 * ============================================================================
 * TRADE KERNEL - The Heart of Afrikoni OS
 * ============================================================================
 * 
 * The Trade Kernel is the state machine and source of truth for every trade.
 * Every trade is a state machine. Every state change:
 * - Emits an event
 * - Triggers automations
 * - Gates payments
 * - Updates trust scores
 * 
 * The UI is ONLY a projection of kernel state.
 * ============================================================================
 */

import { supabase } from '@/api/supabaseClient';

/**
 * TRADE STATE MACHINE
 * 
 * States are strictly ordered. No skipping states.
 * Each state has entry/exit conditions and valid transitions.
 */
export const TRADE_STATE = {
  DRAFT: 'draft',
  RFQ_OPEN: 'rfq_open', // Canonical 2026 name
  QUOTED: 'quoted',
  CONTRACTED: 'contracted',
  ESCROW_REQUIRED: 'escrow_required',
  ESCROW_FUNDED: 'escrow_funded',
  PRODUCTION: 'production',
  PICKUP_SCHEDULED: 'pickup_scheduled',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  ACCEPTED: 'accepted',
  SETTLED: 'settled',
  DISPUTED: 'disputed',
  CLOSED: 'closed'
};

/**
 * Trade state labels for UI
 */
export const TRADE_STATE_LABELS = {
  [TRADE_STATE.DRAFT]: 'Draft',
  [TRADE_STATE.RFQ_OPEN]: 'RFQ Open',
  [TRADE_STATE.QUOTED]: 'Quoted',
  [TRADE_STATE.CONTRACTED]: 'Contracted',
  [TRADE_STATE.ESCROW_REQUIRED]: 'Escrow Funding',
  [TRADE_STATE.ESCROW_FUNDED]: 'Escrow Funded',
  [TRADE_STATE.PRODUCTION]: 'Production',
  [TRADE_STATE.PICKUP_SCHEDULED]: 'Pickup Scheduled',
  [TRADE_STATE.IN_TRANSIT]: 'In Transit',
  [TRADE_STATE.DELIVERED]: 'Delivered',
  [TRADE_STATE.ACCEPTED]: 'Accepted',
  [TRADE_STATE.SETTLED]: 'Settled',
  [TRADE_STATE.DISPUTED]: 'Disputed',
  [TRADE_STATE.CLOSED]: 'Closed'
};

/**
 * Trade state order for timeline projection
 */
export const TRADE_STATE_ORDER = [
  TRADE_STATE.DRAFT,
  TRADE_STATE.RFQ_OPEN,
  TRADE_STATE.QUOTED,
  TRADE_STATE.CONTRACTED,
  TRADE_STATE.ESCROW_REQUIRED,
  TRADE_STATE.ESCROW_FUNDED,
  TRADE_STATE.PRODUCTION,
  TRADE_STATE.PICKUP_SCHEDULED,
  TRADE_STATE.IN_TRANSIT,
  TRADE_STATE.DELIVERED,
  TRADE_STATE.ACCEPTED,
  TRADE_STATE.SETTLED,
  TRADE_STATE.DISPUTED,
  TRADE_STATE.CLOSED
];

/**
 * Get the AUTHORITATIVE next action from the Kernel (Dry Run)
 * @param {string} tradeId 
 * @returns {Promise<Object>} The prediction result (allow/block, consequences, next state)
 */
export async function getKernelNextAction(tradeId) {
  try {
    const { data, error } = await supabase.functions.invoke('trade-transition', {
      body: {
        tradeId,
        dry_run: true
      }
    });

    if (error) {
      console.error('[TradeKernel] Dry run failed:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('[TradeKernel] Dry run exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * KERNEL LEVEL: Transition trade to new state
 * 
 * This is the atomic operation of the Trade OS.
 * Every state change goes through this function which:
 * 1. Validates transition is legal
 * 2. Checks state entry conditions
 * 3. Executes side effects (escrow, payments, etc.)
 * 4. Emits events
 * 5. Updates audit trail
 * 6. Unlocks/locks UI actions
 * 
 * @param {string} tradeId 
 * @param {string} nextState 
 * @param {Object} metadata 
 * @returns {Promise<{success: boolean, trade?: Object, error?: string, decision?: string}>}
 */
export async function transitionTrade(tradeId, nextState, metadata = {}) {
  try {
    const { data, error } = await supabase.functions.invoke('trade-transition', {
      body: {
        tradeId,
        nextState,
        metadata
      }
    });

    if (error) {
      return { success: false, error: error.message, decision: 'BLOCK' };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.reason || 'Kernel blocked transition',
        decision: data?.decision || 'BLOCK',
        reasonCode: data?.reason_code,
        requiredActions: data?.required_actions || [],
        nextState: data?.next_state
      };
    }

    return {
      success: true,
      trade: data.trade,
      decision: data.decision || 'ALLOW',
      settlement: data.settlement
    };
  } catch (err) {
    console.error('[TradeKernel] Transition failed:', err);
    return { success: false, error: err.message, decision: 'BLOCK' };
  }
}

/**
 * Get the immutable event ledger for a trade
 * @param {string} tradeId 
 */
export async function getTradeEvents(tradeId) {
  const { data, error } = await supabase
    .from('trade_events')
    .select('*')
    .eq('trade_id', tradeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[TradeKernel] Failed to fetch events:', error);
    return [];
  }
  return data;
}

export default {
  TRADE_STATE,
  TRADE_STATE_LABELS,
  TRADE_STATE_ORDER,
  getKernelNextAction,
  transitionTrade,
  getTradeEvents
};
