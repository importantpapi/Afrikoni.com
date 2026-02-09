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
import { emitTradeEvent } from './tradeEvents';

/**
 * TRADE STATE MACHINE
 * 
 * States are strictly ordered. No skipping states.
 * Each state has entry/exit conditions and valid transitions.
 */
export const TRADE_STATE = {
  DRAFT: 'draft',                    // RFQ created but not published
  RFQ_OPEN: 'rfq_open',            // RFQ published, waiting for quotes
  QUOTED: 'quoted',                  // At least one quote received
  CONTRACTED: 'contracted',          // Quote accepted, contract generated
  ESCROW_REQUIRED: 'escrow_required', // Waiting for buyer to fund escrow
  ESCROW_FUNDED: 'escrow_funded',   // Escrow received from buyer
  PRODUCTION: 'production',          // Supplier producing goods
  PICKUP_SCHEDULED: 'pickup_scheduled', // Logistics scheduled pickup
  IN_TRANSIT: 'in_transit',         // Goods in transit
  DELIVERED: 'delivered',            // Goods delivered to buyer
  ACCEPTED: 'accepted',              // Buyer accepts delivery
  SETTLED: 'settled',                // Payment released to supplier
  DISPUTED: 'disputed',              // Trade under dispute
  CLOSED: 'closed'                   // Trade completed or cancelled
};

/**
 * Trade State Transitions
 * Keys: current state, Values: array of allowed next states
 */
export const TRADE_TRANSITIONS = {
  [TRADE_STATE.DRAFT]: [TRADE_STATE.RFQ_OPEN, TRADE_STATE.CLOSED],
  [TRADE_STATE.RFQ_OPEN]: [TRADE_STATE.QUOTED, TRADE_STATE.CLOSED],
  [TRADE_STATE.QUOTED]: [TRADE_STATE.CONTRACTED, TRADE_STATE.CLOSED],
  [TRADE_STATE.CONTRACTED]: [TRADE_STATE.ESCROW_REQUIRED, TRADE_STATE.CLOSED],
  [TRADE_STATE.ESCROW_REQUIRED]: [TRADE_STATE.ESCROW_FUNDED, TRADE_STATE.CLOSED],
  [TRADE_STATE.ESCROW_FUNDED]: [TRADE_STATE.PRODUCTION, TRADE_STATE.DISPUTED],
  [TRADE_STATE.PRODUCTION]: [TRADE_STATE.PICKUP_SCHEDULED, TRADE_STATE.DISPUTED],
  [TRADE_STATE.PICKUP_SCHEDULED]: [TRADE_STATE.IN_TRANSIT, TRADE_STATE.DISPUTED],
  [TRADE_STATE.IN_TRANSIT]: [TRADE_STATE.DELIVERED, TRADE_STATE.DISPUTED],
  [TRADE_STATE.DELIVERED]: [TRADE_STATE.ACCEPTED, TRADE_STATE.DISPUTED],
  [TRADE_STATE.ACCEPTED]: [TRADE_STATE.SETTLED, TRADE_STATE.DISPUTED],
  [TRADE_STATE.SETTLED]: [TRADE_STATE.CLOSED],
  [TRADE_STATE.DISPUTED]: [TRADE_STATE.SETTLED, TRADE_STATE.CLOSED],
  [TRADE_STATE.CLOSED]: []
};

/**
 * Get valid next states for current state
 */
export function getValidTransitions(currentState) {
  return TRADE_TRANSITIONS[currentState] || [];
}

/**
 * Check if transition is valid
 */
export function isValidTransition(fromState, toState) {
  const validStates = TRADE_TRANSITIONS[fromState];
  return validStates && validStates.includes(toState);
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
 * @param {string} tradeId - The trade ID (RFQ or Order)
 * @param {string} currentState - Current trade state
 * @param {string} nextState - Desired next state
 * @param {Object} metadata - Additional data for the transition (quotes, shipment info, etc.)
 * @returns {Promise<{success: boolean, trade?: Object, error?: string}>}
 */
export async function transitionTrade(
  tradeId,
  currentState,
  nextState,
  metadata = {}
) {
  try {
    // KERNEL: Validate transition is legal
    if (!isValidTransition(currentState, nextState)) {
      return {
        success: false,
        error: `Invalid transition: cannot go from ${currentState} to ${nextState}`
      };
    }

    // KERNEL: Validate entry conditions for the next state
    const validationResult = await validateStateEntryConditions(
      tradeId,
      nextState,
      metadata
    );
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.reason
      };
    }

    // KERNEL: Execute state entry side effects
    const sideEffectResult = await executeStateSideEffects(
      tradeId,
      nextState,
      metadata
    );
    if (!sideEffectResult.success) {
      return { success: false, error: sideEffectResult.error };
    }

    // KERNEL: Update trade in database
    const { data: trade, error } = await supabase
      .from('trades')
      .update({
        status: nextState,
        updated_at: new Date(),
        metadata: { ...metadata, previous_state: currentState }
      })
      .eq('id', tradeId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // KERNEL: Emit event for this state transition
    await emitTradeEvent({
      tradeId,
      eventType: 'STATE_TRANSITION',
      fromState: currentState,
      toState: nextState,
      metadata
    });

    // KERNEL: Log to audit trail
    await auditTradeTransition(tradeId, currentState, nextState, metadata);

    return { success: true, trade };
  } catch (err) {
    console.error('[tradeKernel] Transition failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Validate entry conditions for specific states
 */
async function validateStateEntryConditions(tradeId, nextState, metadata) {
  const trade = await getTradeById(tradeId);
  if (!trade) {
    return { valid: false, reason: 'Trade not found' };
  }

  switch (nextState) {
    case TRADE_STATE.RFQ_OPEN: {
      // RFQ must have title, description, quantity
      if (
        !trade.title ||
        !trade.description ||
        !trade.quantity
      ) {
        return { valid: false, reason: 'RFQ must have title, description, and quantity' };
      }
      return { valid: true };
    }

    case TRADE_STATE.QUOTED: {
      // Must have at least one quote received
      const quotes = await getQuotesForTrade(tradeId);
      if (!quotes || quotes.length === 0) {
        return { valid: false, reason: 'No quotes received yet' };
      }
      return { valid: true };
    }

    case TRADE_STATE.CONTRACTED: {
      // Must have selected quote and contract generated
      if (!metadata.selectedQuoteId) {
        return { valid: false, reason: 'Must select a quote' };
      }
      const contract = await getContractForTrade(tradeId);
      if (!contract || !contract.id) {
        return { valid: false, reason: 'Contract not generated' };
      }
      return { valid: true };
    }

    case TRADE_STATE.ESCROW_FUNDED: {
      // Escrow must be funded
      const escrow = await getEscrowForTrade(tradeId);
      if (!escrow || escrow.status !== 'funded') {
        return { valid: false, reason: 'Escrow not funded' };
      }
      return { valid: true };
    }

    case TRADE_STATE.DELIVERED: {
      // Shipment must exist and be marked delivered
      const shipment = await getShipmentForTrade(tradeId);
      if (!shipment || shipment.status !== 'delivered') {
        return { valid: false, reason: 'Shipment not marked delivered' };
      }
      return { valid: true };
    }

    case TRADE_STATE.ACCEPTED: {
      // Buyer must accept delivery
      if (!metadata.buyerAccepted) {
        return { valid: false, reason: 'Buyer has not accepted delivery' };
      }
      return { valid: true };
    }

    case TRADE_STATE.SETTLED: {
      // Payment must be released from escrow
      const escrow = await getEscrowForTrade(tradeId);
      if (!escrow || escrow.status !== 'released') {
        return { valid: false, reason: 'Escrow not released' };
      }
      return { valid: true };
    }

    default:
      return { valid: true };
  }
}

/**
 * Execute side effects when entering a state
 * (e.g., create escrow, send notifications, etc.)
 */
async function executeStateSideEffects(tradeId, nextState, metadata) {
  try {
    switch (nextState) {
      case TRADE_STATE.ESCROW_REQUIRED: {
        // Create escrow record
        const { error } = await supabase
          .from('escrows')
          .insert({
            trade_id: tradeId,
            buyer_id: metadata.buyerId,
            seller_id: metadata.sellerId,
            amount: metadata.escrowAmount,
            currency: metadata.currency || 'USD',
            status: 'pending'
          });
        if (error) return { success: false, error: error.message };
        break;
      }

      case TRADE_STATE.SETTLED: {
        // Release payment from escrow to supplier
        const { error } = await supabase
          .from('escrows')
          .update({ status: 'released', released_at: new Date() })
          .eq('trade_id', tradeId);
        if (error) return { success: false, error: error.message };
        break;
      }

      case TRADE_STATE.CLOSED: {
        // Update trust scores
        await updateTrustScores(tradeId);
        break;
      }

      default:
        break;
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Helper functions to retrieve related entities
 */
async function getTradeById(tradeId) {
  const { data } = await supabase
    .from('trades')
    .select('*')
    .eq('id', tradeId)
    .single();
  return data;
}

async function getQuotesForTrade(tradeId) {
  const { data } = await supabase
    .from('quotes')
    .select('*')
    .eq('trade_id', tradeId);
  return data;
}

async function getContractForTrade(tradeId) {
  const { data } = await supabase
    .from('contracts')
    .select('*')
    .eq('trade_id', tradeId)
    .single();
  return data;
}

async function getEscrowForTrade(tradeId) {
  const { data } = await supabase
    .from('escrows')
    .select('*')
    .eq('trade_id', tradeId)
    .single();
  return data;
}

async function getShipmentForTrade(tradeId) {
  const { data } = await supabase
    .from('shipments')
    .select('*')
    .eq('trade_id', tradeId)
    .single();
  return data;
}

async function auditTradeTransition(tradeId, fromState, toState, metadata) {
  await supabase
    .from('audit_log')
    .insert({
      entity_type: 'trade',
      entity_id: tradeId,
      action: 'state_transition',
      details: {
        from_state: fromState,
        to_state: toState,
        metadata
      },
      timestamp: new Date()
    });
}

async function updateTrustScores(tradeId) {
  // TODO: Calculate and update trust scores based on trade completion
  console.log('[tradeKernel] Updating trust scores for trade:', tradeId);
}

export default {
  TRADE_STATE,
  TRADE_TRANSITIONS,
  transitionTrade,
  getValidTransitions,
  isValidTransition
};
