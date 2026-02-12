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
 * CORE: Create a new Trade on the Sovereign Rail
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
    
    const tradePayload = {
      ...tradeData,
      metadata: {
        ...tradeData.metadata,
        created_at_platform: new Date().toISOString(),
        kernel_version: '2026.1'
      }
    };

    // 1. Create entry in TRADES (Canonical Kernel)
    console.log('[TradeKernel] Inserting into trades table...');
    const { data, error } = await supabase
      .from('trades')
      .insert(tradePayload)
      .select()
      .single();

    if (error) {
      console.error('[TradeKernel] Create failed in trades:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[TradeKernel] Successfully created trade:', data.id);

    // 2. SOVEREIGN BRIDGE: If it's an RFQ, sync to legacy RFQS table
    if (tradeData.trade_type === 'rfq') {
      console.log('[TradeKernel] Syncing to rfqs table...');
      const rfqPayload = {
        id: data.id, // SAME UUID for both tables
        buyer_company_id: tradeData.buyer_id,
        buyer_user_id: tradeData.created_by, // 🔥 CRITICAL FIX: Required by RLS policy
        category_id: tradeData.category_id,
        title: tradeData.title,
        description: tradeData.description,
        quantity: tradeData.quantity,
        unit: tradeData.quantity_unit || 'pieces',
        target_price: tradeData.target_price,
        status: tradeData.status === 'rfq_open' ? 'open' : tradeData.status, // Map kernel -> legacy
        expires_at: tradeData.expires_at,
        metadata: tradeData.metadata
      };

      const { error: rfqError } = await supabase
        .from('rfqs')
        .insert(rfqPayload);

      if (rfqError) {
        console.error('[TradeKernel] 🚨 CRITICAL: Bridge sync to rfqs failed:', rfqError);
        console.error('[TradeKernel] Failed RFQ Payload:', JSON.stringify(rfqPayload, null, 2));
        // We don't fail the whole operation, but this means RFQ won't appear in list
      } else {
        console.log('[TradeKernel] ✅ Successfully synced to rfqs table:', data.id);
      }
    }

    console.log('[TradeKernel] Trade creation completed successfully');
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
  createTrade
};
