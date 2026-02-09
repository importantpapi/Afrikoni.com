/**
 * ============================================================================
 * TRADE EVENTS - Event emission system for Trade OS
 * ============================================================================
 * 
 * Every significant action in a trade emits an event.
 * Events are the source of truth for automations, notifications, and integrations.
 * 
 * Event types:
 * - STATE_TRANSITION: Trade moved to new state
 * - QUOTE_RECEIVED: New quote submitted
 * - PAYMENT_RECEIVED: Payment received in escrow
 * - SHIPMENT_UPDATED: Logistics milestone hit
 * - DISPUTE_CREATED: Dispute filed
 * - etc.
 * ============================================================================
 */

import { supabase } from '@/api/supabaseClient';

/**
 * Trade Event Types
 */
export const TRADE_EVENT_TYPE = {
  // Core lifecycle events
  STATE_TRANSITION: 'state_transition',
  
  // RFQ events
  RFQ_CREATED: 'rfq_created',
  RFQ_PUBLISHED: 'rfq_published',
  RFQ_CLOSED: 'rfq_closed',
  
  // Quote events
  QUOTE_RECEIVED: 'quote_received',
  QUOTE_SELECTED: 'quote_selected',
  QUOTE_REJECTED: 'quote_rejected',
  
  // Contract events
  CONTRACT_GENERATED: 'contract_generated',
  CONTRACT_SIGNED: 'contract_signed',
  
  // Payment events
  ESCROW_CREATED: 'escrow_created',
  ESCROW_FUNDED: 'escrow_funded',
  PAYMENT_RELEASED: 'payment_released',
  REFUND_INITIATED: 'refund_initiated',
  
  // Logistics events
  SHIPMENT_CREATED: 'shipment_created',
  PICKUP_SCHEDULED: 'pickup_scheduled',
  PICKUP_CONFIRMED: 'pickup_confirmed',
  IN_TRANSIT: 'in_transit',
  DELIVERY_SCHEDULED: 'delivery_scheduled',
  DELIVERED: 'delivered',
  DELIVERY_ACCEPTED: 'delivery_accepted',
  
  // Dispute events
  DISPUTE_CREATED: 'dispute_created',
  DISPUTE_RESOLVED: 'dispute_resolved',
  
  // Compliance events
  COMPLIANCE_CHECK_PASSED: 'compliance_check_passed',
  COMPLIANCE_CHECK_FAILED: 'compliance_check_failed',
  
  // System events
  ERROR_OCCURRED: 'error_occurred',
  AUTOMATION_TRIGGERED: 'automation_triggered'
};

/**
 * Emit a trade event
 * 
 * @param {Object} params
 * @param {string} params.tradeId - The trade ID
 * @param {string} params.eventType - Type of event (from TRADE_EVENT_TYPE)
 * @param {Object} params.metadata - Additional event data
 * @param {string} params.userId - User who triggered the event (optional)
 * @returns {Promise<{success: boolean, event?: Object, error?: string}>}
 */
export async function emitTradeEvent({
  tradeId,
  eventType,
  metadata = {},
  userId = null
}) {
  try {
    // If userId not provided, get from current user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    // Create event record
    const { data: event, error } = await supabase
      .from('trade_events')
      .insert({
        trade_id: tradeId,
        event_type: eventType,
        metadata,
        triggered_by: userId,
        created_at: new Date()
      })
      .select()
      .single();

    if (error) {
      console.error('[tradeEvents] Failed to emit event:', error);
      return { success: false, error: error.message };
    }

    // Trigger any automations based on this event
    await triggerAutomations(tradeId, eventType, metadata);

    // Broadcast event in real-time
    broadcastTradeEvent(tradeId, eventType, metadata);

    return { success: true, event };
  } catch (err) {
    console.error('[tradeEvents] Error emitting event:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all events for a trade (for timeline view)
 */
export async function getTradeTimeline(tradeId) {
  try {
    const { data: events, error } = await supabase
      .from('trade_events')
      .select('*')
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, events };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Subscribe to real-time trade events
 * (Used by UI components to show live updates)
 */
export function subscribeToTradeEvents(tradeId, onEventReceived) {
  const subscription = supabase
    .from(`trades:id=eq.${tradeId}`)
    .on('*', (payload) => {
      onEventReceived(payload);
    })
    .subscribe();

  return () => {
    // Unsubscribe when component unmounts
    subscription.unsubscribe();
  };
}

/**
 * Trigger automations based on events
 * (Connected to automation service)
 */
async function triggerAutomations(tradeId, eventType, metadata) {
  try {
    // Get applicable automation rules
    const { data: automations, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('trigger_event', eventType)
      .eq('enabled', true);

    if (error || !automations) return;

    // Execute each automation
    for (const automation of automations) {
      console.log('[tradeEvents] Triggering automation:', automation.id);
      
      // Execute based on automation type
      switch (automation.action) {
        case 'send_notification':
          // Notify parties
          await notifyParties(tradeId, automation.recipients, automation.message_template);
          break;

        case 'create_contract':
          // Generate contract from template
          await createContractFromTemplate(tradeId, automation.template_id);
          break;

        case 'release_escrow':
          // Release payment from escrow
          await releaseEscrow(tradeId);
          break;

        case 'request_inspection':
          // Create inspection request
          await createInspectionRequest(tradeId);
          break;

        default:
          console.log('[tradeEvents] Unknown automation action:', automation.action);
      }
    }
  } catch (err) {
    console.error('[tradeEvents] Error triggering automations:', err);
  }
}

/**
 * Broadcast event to connected clients via WebSocket
 */
function broadcastTradeEvent(tradeId, eventType, metadata) {
  // This integrates with Supabase real-time:
  // Components listening to this trade will get live updates
  supabase.channel(`trade:${tradeId}`).send({
    type: 'broadcast',
    event: eventType,
    payload: { tradeId, metadata }
  });
}

// ============================================================================
// PLACEHOLDER AUTOMATION HELPERS (to be implemented)
// ============================================================================

async function notifyParties(tradeId, recipients, messageTemplate) {
  console.log('[tradeEvents] Notify parties:', tradeId, recipients);
  // TODO: Use notification service
}

async function createContractFromTemplate(tradeId, templateId) {
  console.log('[tradeEvents] Create contract from template:', templateId);
  // TODO: Use document engine
}

async function releaseEscrow(tradeId) {
  console.log('[tradeEvents] Release escrow:', tradeId);
  // TODO: Use payment service
}

async function createInspectionRequest(tradeId) {
  console.log('[tradeEvents] Create inspection request:', tradeId);
  // TODO: Use quality/logistics service
}

export default {
  TRADE_EVENT_TYPE,
  emitTradeEvent,
  getTradeTimeline,
  subscribeToTradeEvents
};
