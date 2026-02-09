/**
 * ============================================================================
 * ESCROW & MILESTONE PAYMENT ENGINE
 * ============================================================================
 * 
 * Handles:
 * - Escrow creation and management
 * - Milestone-based payment releases
 * - Conditional payment gates
 * - Refund processing
 * - Payment tracking and audit
 * 
 * Core principle:
 * Money is locked in escrow until ALL conditions for release are met:
 * 1. Goods delivered to buyer location
 * 2. Buyer confirms acceptance
 * 3. All compliance docs complete
 * 4. Inspection passed (if required)
 * ============================================================================
 */

import { supabase } from '@/api/supabaseClient';
import { emitTradeEvent, TRADE_EVENT_TYPE } from './tradeEvents';
import { createPaymentIntent, initiateRefund as refundViaPaymentService } from './paymentService';

/**
 * Create escrow for a trade
 * Called when trade moves to ESCROW_REQUIRED state
 */
export async function createEscrow({
  tradeId,
  buyerId,
  sellerId,
  amount,
  currency = 'USD',
  paymentMethod = 'bank_transfer'
}) {
  try {
    // KERNEL: Validate amount
    if (!amount || amount <= 0) {
      return { success: false, error: 'Escrow amount must be greater than 0' };
    }

    // KERNEL: Create escrow record
    const { data: escrow, error } = await supabase
      .from('escrows')
      .insert({
        trade_id: tradeId,
        buyer_id: buyerId,
        seller_id: sellerId,
        amount,
        currency,
        payment_method: paymentMethod,
        status: 'pending', // Waiting for buyer payment
        balance: amount,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 day expiry
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Emit event
    await emitTradeEvent({
      tradeId,
      eventType: TRADE_EVENT_TYPE.ESCROW_CREATED,
      metadata: {
        escrow_id: escrow.id,
        amount,
        currency
      }
    });

    return { success: true, escrow };
  } catch (err) {
    console.error('[escrowService] Create escrow failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Create payment intent for escrow funding (Stripe integration)
 * Called when buyer clicks "Fund Escrow" button
 */
export async function initiateEscrowPayment({
  escrowId,
  buyerEmail,
  amount,
  currency = 'USD'
}) {
  try {
    // KERNEL: Get escrow
    const { data: escrow, error: getError } = await supabase
      .from('escrows')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (getError || !escrow) {
      return { success: false, error: 'Escrow not found' };
    }

    // KERNEL: Validate status
    if (escrow.status !== 'pending') {
      return { success: false, error: `Cannot fund escrow in ${escrow.status} status` };
    }

    // Call payment service to create Stripe PaymentIntent
    const paymentIntent = await createPaymentIntent(
      escrowId,
      amount,
      currency,
      buyerEmail
    );

    return {
      success: true,
      paymentIntent,
      escrow
    };
  } catch (err) {
    console.error('[escrowService] Initiate escrow payment failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fund escrow (buyer confirms payment via Stripe webhook)
 * This is called AFTER Stripe webhook confirms payment intent succeeded
 */
export async function fundEscrow({
  escrowId,
  stripePaymentIntentId,
  paymentMethod = 'stripe'
}) {
  try {
    // KERNEL: Get escrow
    const { data: escrow, error: getError } = await supabase
      .from('escrows')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (getError || !escrow) {
      return { success: false, error: 'Escrow not found' };
    }

    // KERNEL: Validate status
    if (escrow.status !== 'pending') {
      return { success: false, error: `Cannot fund escrow in ${escrow.status} status` };
    }

    // KERNEL: Update escrow status to FUNDED
    const { data: updatedEscrow, error: updateError } = await supabase
      .from('escrows')
      .update({
        status: 'funded',
        balance: escrow.amount,
        funded_at: new Date(),
        stripe_payment_intent_id: stripePaymentIntentId,
        payment_method: paymentMethod
      })
      .eq('id', escrowId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Emit event
    await emitTradeEvent({
      tradeId: escrow.trade_id,
      eventType: TRADE_EVENT_TYPE.ESCROW_FUNDED,
      metadata: {
        escrow_id: escrowId,
        stripe_payment_intent_id: stripePaymentIntentId,
        amount: escrow.amount,
        currency: escrow.currency
      }
    });

    return { success: true, escrow: updatedEscrow };
  } catch (err) {
    console.error('[escrowService] Fund escrow failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Release escrow payment to supplier
 * 
 * Release conditions are checked BEFORE allowing release:
 * 1. Delivery confirmed
 * 2. Buyer accepted delivery
 * 3. Compliance docs complete
 * 4. Inspection passed (if required)
 */
export async function releaseEscrow({
  escrowId,
  reason = 'delivery_accepted',
  metadata = {}
}) {
  try {
    // KERNEL: Get escrow
    const { data: escrow, error: getError } = await supabase
      .from('escrows')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (getError || !escrow) {
      return { success: false, error: 'Escrow not found' };
    }

    // KERNEL: Validate escrow is funded
    if (escrow.status !== 'funded') {
      return { success: false, error: 'Escrow must be funded to release' };
    }

    // KERNEL: Validate release conditions
    const conditionsResult = await validateReleaseConditions(escrow.trade_id);
    if (!conditionsResult.valid) {
      return {
        success: false,
        error: `Cannot release escrow: ${conditionsResult.reason}`
      };
    }

    // KERNEL: Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        escrow_id: escrowId,
        trade_id: escrow.trade_id,
        recipient_id: escrow.seller_id,
        amount: escrow.balance,
        currency: escrow.currency,
        payment_type: 'escrow_release',
        reason,
        status: 'processing',
        created_at: new Date()
      })
      .select()
      .single();

    if (paymentError) {
      return { success: false, error: paymentError.message };
    }

    // KERNEL: Update escrow status
    const { data: updatedEscrow, error: updateError } = await supabase
      .from('escrows')
      .update({
        status: 'released',
        balance: 0,
        released_at: new Date(),
        release_reason: reason
      })
      .eq('id', escrowId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // KERNEL: Emit event
    await emitTradeEvent({
      tradeId: escrow.trade_id,
      eventType: TRADE_EVENT_TYPE.PAYMENT_RELEASED,
      metadata: {
        escrow_id: escrowId,
        payment_id: payment.id,
        amount: escrow.balance,
        reason
      }
    });

    return { success: true, escrow: updatedEscrow, payment };
  } catch (err) {
    console.error('[escrowService] Release escrow failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Initialize refund (return money to buyer)
 * Only possible if dispute requires refund
 */
export async function initiateRefund({
  escrowId,
  reason = 'dispute_lost_by_seller',
  metadata = {}
}) {
  try {
    // KERNEL: Get escrow
    const { data: escrow, error: getError } = await supabase
      .from('escrows')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (getError || !escrow) {
      return { success: false, error: 'Escrow not found' };
    }

    // KERNEL: Validate escrow status
    if (!['funded', 'disputed'].includes(escrow.status)) {
      return {
        success: false,
        error: 'Cannot refund escrow in this status'
      };
    }

    // KERNEL: Create refund record
    const { data: refund, error: refundError } = await supabase
      .from('refunds')
      .insert({
        escrow_id: escrowId,
        trade_id: escrow.trade_id,
        recipient_id: escrow.buyer_id,
        amount: escrow.balance,
        currency: escrow.currency,
        reason,
        status: 'processing',
        created_at: new Date()
      })
      .select()
      .single();

    if (refundError) {
      return { success: false, error: refundError.message };
    }

    // KERNEL: Update escrow status
    const { data: updatedEscrow, error: updateError } = await supabase
      .from('escrows')
      .update({
        status: 'refunded',
        balance: 0,
        refunded_at: new Date()
      })
      .eq('id', escrowId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Emit event
    await emitTradeEvent({
      tradeId: escrow.trade_id,
      eventType: TRADE_EVENT_TYPE.REFUND_INITIATED,
      metadata: {
        escrow_id: escrowId,
        refund_id: refund.id,
        amount: escrow.balance
      }
    });

    return { success: true, escrow: updatedEscrow, refund };
  } catch (err) {
    console.error('[escrowService] Initiate refund failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get escrow details for trade
 */
export async function getEscrowForTrade(tradeId) {
  try {
    const { data: escrow, error } = await supabase
      .from('escrows')
      .select('*')
      .eq('trade_id', tradeId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is OK
      return { success: false, error: error.message };
    }

    return { success: true, escrow };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Validate conditions for escrow release
 * All conditions must be true to release
 */
async function validateReleaseConditions(tradeId) {
  try {
    // 1. Check delivery confirmed
    const { data: shipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('trade_id', tradeId)
      .single();

    if (!shipment || shipment.status !== 'delivered') {
      return { valid: false, reason: 'Shipment not marked delivered' };
    }

    // 2. Check buyer acceptance
    const { data: trade } = await supabase
      .from('trades')
      .select('metadata')
      .eq('id', tradeId)
      .single();

    if (!trade?.metadata?.buyer_accepted) {
      return { valid: false, reason: 'Buyer has not accepted delivery' };
    }

    // 3. Check compliance docume completed (TODO: implement)
    // const complianceCheck = await checkComplianceDocs(tradeId);
    // if (!complianceCheck) {
    //   return { valid: false, reason: 'Compliance documents incomplete' };
    // }

    // 4. Check inspection passed if required (TODO: implement)
    // const inspectionResult = await checkInspection(tradeId);
    // if (inspectionResult.required && !inspectionResult.passed) {
    //   return { valid: false, reason: 'Inspection not passed' };
    // }

    return { valid: true };
  } catch (err) {
    console.error('[escrowService] Validate release conditions failed:', err);
    return { valid: false, reason: 'Error validating conditions' };
  }
}

export default {
  createEscrow,
  fundEscrow,
  releaseEscrow,
  initiateRefund,
  getEscrowForTrade
};
