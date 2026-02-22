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
import { initiatePAPSSSettlement } from './papssSettlementService';
import { emitTradeEvent } from './tradeEvents';

/**
 * DNA GENERATOR v2
 * Generates a verifiable, immutable hash for a trade state.
 */
function generateTradeDNA(tradeId, state, metadata = {}) {
  // In a real secure system, this would be a hash of the entire trade row
  const salt = Math.random().toString(36).substring(7);
  const content = `${tradeId}-${state}-${JSON.stringify(metadata)}-${salt}`;
  // Simple mock hash for 2026 UI visualization
  return `DNA-${btoa(content).substring(0, 32).toUpperCase()}`;
}

/**
 * TRUST MUTATION ENGINE
 * Returns the % boost/penalty to credit score for each state transition.
 */
function calculateTrustMutation(state) {
  const boosts = {
    [TRADE_STATE.CONTRACTED]: 2,
    [TRADE_STATE.ESCROW_FUNDED]: 5,
    [TRADE_STATE.DELIVERED]: 10,
    [TRADE_STATE.SETTLED]: 15,
    [TRADE_STATE.DISPUTED]: -25
  };
  return boosts[state] || 0;
}

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
  [TRADE_STATE.DRAFT]: 'Preparing Request',
  [TRADE_STATE.RFQ_OPEN]: 'Looking for Sellers',
  [TRADE_STATE.QUOTED]: 'Quote Received',
  [TRADE_STATE.CONTRACTED]: 'Order Confirmed',
  [TRADE_STATE.ESCROW_REQUIRED]: 'Payment Needed',
  [TRADE_STATE.ESCROW_FUNDED]: 'Payment Secured',
  [TRADE_STATE.PRODUCTION]: 'Order in Production',
  [TRADE_STATE.PICKUP_SCHEDULED]: 'Preparing for Shipment',
  [TRADE_STATE.IN_TRANSIT]: 'On the Way',
  [TRADE_STATE.DELIVERED]: 'Arrived at Destination',
  [TRADE_STATE.ACCEPTED]: 'Order Accepted',
  [TRADE_STATE.SETTLED]: 'Trade Completed',
  [TRADE_STATE.DISPUTED]: 'Under Review',
  [TRADE_STATE.CLOSED]: 'Finished'
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
    // ✅ DNA ENFORCEMENT & TRUST MUTATION
    const trustMutation = calculateTrustMutation(nextState);
    const enhancedMetadata = {
      ...metadata,
      trade_dna: metadata.trade_dna || generateTradeDNA(tradeId, nextState, metadata),
      transition_timestamp: new Date().toISOString(),
      trust_mutation: trustMutation
    };

    // 🚀 SEQUENCE ID FETCH (If not provided, we fetch current to maintain rail integrity)
    let sequenceId = metadata.expectedSequenceId;
    if (sequenceId === undefined) {
      const { data: currentTrade } = await supabase
        .from('trades')
        .select('sequence_id')
        .eq('id', tradeId)
        .single();
      sequenceId = currentTrade?.sequence_id;
    }

    const { data, error } = await supabase.functions.invoke('trade-transition', {
      body: {
        tradeId,
        nextState,
        metadata: enhancedMetadata,
        expectedSequenceId: sequenceId
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

    // 🧬 TRUST LOOP: If state changed, update company trust score
    if (trustMutation !== 0) {
      console.log(`[TrustBridge] Mutating Trust DNA: ${trustMutation > 0 ? '+' : ''}${trustMutation}% for state ${nextState}`);
      // In production, this calls the TrustEngineService.ts
    }

    return {
      success: true,
      trade: data.trade,
      decision: data.decision || 'ALLOW',
      settlement: data.settlement,
      trustMutation
    };
  } catch (err) {
    console.error('[TradeKernel] Transition failed:', err);
    return { success: false, error: err.message, decision: 'BLOCK' };
  }
}

/**
 * Handle Phase 2: Instant Local Currency Clearing via PAPSS
 */
export async function clearLocalCurrency(tradeId, amount, currency) {
  try {
    const { data: trade } = await supabase.from('trades').select('buyer_company_id, seller_company_id, seller:companies(currency)').eq('id', tradeId).single();
    if (!trade) throw new Error('Trade not found');

    const result = await initiatePAPSSSettlement(
      tradeId,
      amount,
      currency, // Buyer Currency
      trade.seller?.currency || 'USD' // Final Destination Currency
    );

    if (result.success) {
      await supabase.from('trade_events').insert({
        trade_id: tradeId,
        event_name: 'papss_clearing_success',
        status_to: TRADE_STATE.SETTLED,
        metadata: {
          settlement_id: result.settlementId,
          cleared_at: result.clearedAt,
          rate: result.exchangeRate
        }
      });
    }

    return result;
  } catch (err) {
    console.error('[TradeKernel] PAPSS Clearing failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * CORE: Create a new Trade on the Secure Rail
 * @param {Object} tradeData 
 */
export async function createTrade(tradeData) {
  try {
    console.log('[TradeKernel] Creating trade with data:', {
      type: tradeData.trade_type,
      buyer_id: tradeData.buyer_id,
      created_by: tradeData.created_by,
      title: tradeData.title
    });

    const { buyer_id, seller_id, ...otherData } = tradeData;
    const tradePayload = {
      ...otherData,
      buyer_company_id: buyer_id,
      seller_company_id: seller_id,
      metadata: {
        ...tradeData.metadata,
        created_at_platform: new Date().toISOString(),
        kernel_version: '2026.1'
      }
    };

    // 1. Create Trade and RFQ atomically via RPC
    console.log('[TradeKernel] Calling atomic_create_trade RPC...');
    const { data, error } = await supabase.rpc('atomic_create_trade', {
      p_trade_payload: {
        ...tradeData,
        buyer_company_id: buyer_id,
        seller_company_id: seller_id
      },
      p_rfq_payload: tradeData.trade_type === 'rfq' ? {
        id: null, // Generated by RPC
        buyer_company_id: buyer_id,
        buyer_user_id: tradeData.created_by,
        category_id: tradeData.category_id,
        title: tradeData.title,
        description: tradeData.description,
        quantity: tradeData.quantity,
        unit: tradeData.quantity_unit || 'pieces',
        target_price: tradeData.target_price,
        status: tradeData.status === 'rfq_open' ? 'open' : tradeData.status,
        expires_at: tradeData.expires_at,
        metadata: tradeData.metadata
      } : null
    });

    if (error) {
      console.error('[TradeKernel] Atomic create failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to publish your request. Please try again.'
      };
    }

    console.log('[TradeKernel] Trade and RFQ created atomically:', data.id);
    return { success: true, data };
  } catch (err) {
    console.error('[TradeKernel] Create exception:', err);
    return { success: false, error: err.message };
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

/**
 * LOG: Create a forensic event in the trade ledger
 * @param {string} tradeId 
 * @param {string} eventType 
 * @param {Object} metadata 
 */
export async function logTradeEvent(tradeId, eventType, metadata = {}) {
  return await emitTradeEvent({
    tradeId,
    eventType,
    metadata
  });
}

/**
 * INTELLIGENCE LAYER: Analyze current context and return system advice
 * @param {Object} context - { page, data, user }
 * @returns {Array} - Array of advice objects
 */
export function analyzeContext(context) {
  // INTELLIGENCE V2: Honest Empty State
  // Real intelligence will wait for the Python/RAG backend.
  return [];
}


/**
 * INFRASTRUCTURE LAYER: Get health metrics for trade corridors
 * @returns {Array} - List of corridor health objects
 */
export function getCorridorHealth() {
  // DATA V2: Honest Empty State
  // Waits for live logistics API integration
  return [];
}

/**
 * MULTI-SIG BRIDGE: Request consensus from a party
 * 
 * NOTE: In this version, consensus is a signed event in the forensic ledger.
 * This provides "Forensic Logging" of multi-party approval. 
 * It is NOT yet asymmetric cryptographic signing.
 * 
 * @param {string} tradeId 
 * @param {string} party 'BUYER' | 'SELLER' | 'PROTOCOL' | 'LOGISTICS' | 'AI'
 */
export async function requestConsensus(tradeId, party) {
  // In 2026, consensus is a signed event in the ledger.
  console.log(`[TradeKernel] Consensus requested from ${party} for ${tradeId}`);

  let signatureType = '';
  switch (party) {
    case 'BUYER': signatureType = 'BUYER_SIG_'; break;
    case 'SELLER': signatureType = 'SELLER_SIG_'; break;
    case 'PROTOCOL': signatureType = 'PROTOCOL_SIG_'; break;
    case 'LOGISTICS': signatureType = 'LOGISTICS_ORACLE_SIG_'; break;
    case 'AI': signatureType = 'AI_SENTINEL_SIG_'; break;
    default: signatureType = 'HUMAN_SIG_';
  }

  const signature = `${signatureType}${Date.now().toString(36).toUpperCase()}_${tradeId.slice(0, 4)}`;

  // Update trade metadata via transition (no-op transition to same state to record sig)
  const { data: trade } = await supabase.from('trades').select('status, metadata').eq('id', tradeId).single();

  if (trade) {
    const existingSigs = trade.metadata?.signatures || [];
    if (!existingSigs.includes(signature)) {
      await transitionTrade(tradeId, trade.status, {
        signatures: [signature],
        consensus_event: `${party}_SIGNED`
      });
    }
  }

  return {
    success: true,
    timestamp: new Date().toISOString(),
    signature
  };
}

/**
 * MULTI-SIG BRIDGE: Check if 3-Key Consensus is met
 * @param {string} tradeId 
 */
export async function checkConsensus(tradeId) {
  const { data: trade, error } = await supabase
    .from('trades')
    .select('metadata')
    .eq('id', tradeId)
    .single();

  if (error || !trade) return { consensusReached: false, signatures: [] };

  const sigs = trade.metadata?.signatures || [];

  const hasAI = sigs.some(s => s.startsWith('AI_SENTINEL_'));
  const hasLogistics = sigs.some(s => s.startsWith('LOGISTICS_ORACLE_'));
  const hasBuyer = sigs.some(s => s.startsWith('BUYER_SIG_'));

  return {
    buyerSigned: hasBuyer,
    sellerSigned: sigs.some(s => s.startsWith('SELLER_SIG_')),
    logisticsSigned: hasLogistics,
    aiSigned: hasAI,
    consensusReached: hasAI && hasLogistics && hasBuyer,
    signatures: sigs
  };
}

export default {
  getTradeEvents,
  analyzeContext,
  getCorridorHealth,
  requestConsensus,
  checkConsensus,
  createTrade,
  logTradeEvent
};
