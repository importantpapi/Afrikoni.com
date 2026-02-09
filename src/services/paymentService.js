/**
 * Payment Service - Handles Stripe integration and payment processing
 * Connects to Supabase backend for payment verification
 */

import { supabase } from '@/api/supabaseClient';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Create a Payment Intent on the backend
 * Returns clientSecret for Stripe Elements
 */
export async function createPaymentIntent(escrowId, amount, currency = 'USD') {
  try {
    // Call backend Edge Function to create Stripe PaymentIntent
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        escrow_id: escrowId,
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toUpperCase()
      }
    });

    if (error) throw error;

    return {
      clientSecret: data.clientSecret,
      paymentIntentId: data.paymentIntentId,
      publishableKey: STRIPE_PUBLISHABLE_KEY
    };
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    throw new Error('Payment initialization failed');
  }
}

/**
 * Process payment with Stripe Elements
 * Called from EscrowFundingPanel after Stripe confirmation
 */
export async function confirmPayment(paymentIntentId, paymentMethodId) {
  try {
    // Verify payment status with our backend
    const { data, error } = await supabase.functions.invoke('confirm-stripe-payment', {
      body: {
        payment_intent_id: paymentIntentId,
        payment_method_id: paymentMethodId
      }
    });

    if (error) throw error;

    return {
      success: data.success,
      status: data.status,
      message: data.message
    };
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    throw new Error('Payment confirmation failed');
  }
}

/**
 * Get payment history for an escrow
 */
export async function getPaymentHistory(escrowId) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('escrow_id', escrowId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch payment history:', error);
    return [];
  }
}

/**
 * Get payment status by Payment Intent ID
 */
export async function getPaymentStatus(paymentIntentId) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Failed to fetch payment status:', error);
    return null;
  }
}

/**
 * Initialize refund for disputed/rejected orders
 */
export async function initiateRefund(escrowId, amount, reason) {
  try {
    // Get payment info first
    const { data: escrow, error: escrowError } = await supabase
      .from('escrows')
      .select('stripe_payment_intent_id, amount')
      .eq('id', escrowId)
      .single();

    if (escrowError) throw escrowError;

    // Call backend to process refund
    const { data, error } = await supabase.functions.invoke('process-refund', {
      body: {
        escrow_id: escrowId,
        payment_intent_id: escrow.stripe_payment_intent_id,
        amount: Math.round(amount * 100),
        reason: reason
      }
    });

    if (error) throw error;

    return {
      refundId: data.refundId,
      status: data.status,
      amount: data.amount / 100
    };
  } catch (error) {
    console.error('Refund initiation failed:', error);
    throw new Error('Refund processing failed');
  }
}

/**
 * Validate payment method
 */
export async function validatePaymentMethod(paymentMethodId) {
  try {
    const { data, error } = await supabase.functions.invoke('validate-payment-method', {
      body: { payment_method_id: paymentMethodId }
    });

    if (error) throw error;
    return data.valid;
  } catch (error) {
    console.error('Payment method validation failed:', error);
    return false;
  }
}

/**
 * Get available payment methods for a user
 */
export async function getUserPaymentMethods(userId) {
  try {
    const { data, error } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch payment methods:', error);
    return [];
  }
}

/**
 * Save payment method for future use
 */
export async function savePaymentMethod(userId, paymentMethodId, nickname) {
  try {
    const { data, error } = await supabase
      .from('user_payment_methods')
      .insert({
        user_id: userId,
        stripe_payment_method_id: paymentMethodId,
        nickname: nickname,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to save payment method:', error);
    throw error;
  }
}

/**
 * Delete saved payment method
 */
export async function deletePaymentMethod(paymentMethodId) {
  try {
    const { error } = await supabase
      .from('user_payment_methods')
      .update({ is_active: false })
      .eq('stripe_payment_method_id', paymentMethodId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to delete payment method:', error);
    return false;
  }
}

/**
 * Get payment analytics for a trade or company
 */
export async function getPaymentAnalytics(companyId, timeRange = '30d') {
  try {
    const { data, error } = await supabase.functions.invoke('get-payment-analytics', {
      body: {
        company_id: companyId,
        time_range: timeRange
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch payment analytics:', error);
    return null;
  }
}

export default {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getPaymentStatus,
  initiateRefund,
  validatePaymentMethod,
  getUserPaymentMethods,
  savePaymentMethod,
  deletePaymentMethod,
  getPaymentAnalytics
};
