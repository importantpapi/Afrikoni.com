/**
 * Subscription Service
 * Handles subscription plans, upgrades, and visibility boosts
 */

import { supabase } from '@/api/supabaseClient';

export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    features: [
      'Basic product listing',
      'Standard search ranking',
      'Basic RFQ access',
      'Up to 10 products'
    ],
    visibilityBoost: 0
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 49,
    features: [
      'Everything in Free',
      'AI Boost in search results',
      'Priority RFQ matching',
      'Unlimited products',
      'Advanced analytics',
      'Email support'
    ],
    visibilityBoost: 1.5 // 50% boost
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    monthlyPrice: 199,
    features: [
      'Everything in Growth',
      'Featured listing placement',
      'Top supplier badge',
      'Priority customer support',
      'Custom branding',
      'API access',
      'Dedicated account manager'
    ],
    visibilityBoost: 3.0 // 3x boost
  }
};

/**
 * Get current subscription for a company
 */
export async function getCompanySubscription(companyId) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Handle "no rows" and "table doesn't exist" errors gracefully
    if (error) {
      // PGRST116 = no rows found, 42P01 = relation does not exist
      if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('does not exist')) {
        return null; // Table doesn't exist or no subscription found - return null silently
      }
      throw error;
    }
    return data || null;
  } catch (error) {
    // Only log unexpected errors (not missing table or no rows)
    if (error.code !== 'PGRST116' && error.code !== '42P01' && !error.message?.includes('does not exist')) {
      console.error('Error getting subscription:', error);
    }
    return null;
  }
}

/**
 * Create or update subscription
 */
export async function createSubscription(companyId, planType, paymentData = {}) {
  try {
    const plan = SUBSCRIPTION_PLANS[planType];
    if (!plan) throw new Error('Invalid plan type');

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Cancel existing active subscription
    await supabase
      .from('subscriptions')
      .update({ 
        status: 'cancelled',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .eq('status', 'active');

    // Create new subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        company_id: companyId,
        plan_type: planType,
        monthly_price: plan.monthlyPrice,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        payment_method: paymentData.method || 'stripe',
        payment_id: paymentData.paymentId || null
      })
      .select()
      .single();

    if (error) throw error;

    // Create revenue transaction
    if (plan.monthlyPrice > 0) {
      await supabase.from('revenue_transactions').insert({
        transaction_type: 'subscription',
        amount: plan.monthlyPrice,
        currency: 'USD',
        subscription_id: data.id,
        company_id: companyId,
        description: `${plan.name} subscription - Monthly`,
        status: 'completed',
        processed_at: new Date().toISOString()
      });
    }

    return data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: cancelAtPeriodEnd,
        status: cancelAtPeriodEnd ? 'active' : 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Get subscription plan details
 */
export function getPlanDetails(planType) {
  return SUBSCRIPTION_PLANS[planType] || SUBSCRIPTION_PLANS.free;
}

