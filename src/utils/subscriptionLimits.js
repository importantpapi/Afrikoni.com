/**
 * Subscription Limits Utility
 * Handles product limits and feature restrictions based on subscription plans
 */

import { supabase } from '@/api/supabaseClient';
import { getCompanySubscription, SUBSCRIPTION_PLANS } from '@/services/subscriptionService';

/**
 * Product limits for each plan
 */
export const PRODUCT_LIMITS = {
  free: 10,
  growth: Infinity, // Unlimited
  elite: Infinity   // Unlimited
};

/**
 * Get current product count for a company
 */
export async function getProductCount(companyId) {
  if (!companyId) return 0;
  
  try {
    const { count, error } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId);
    
    if (error) {
      console.error('Error counting products:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error getting product count:', error);
    return 0;
  }
}

/**
 * Get active product count (excluding drafts)
 */
export async function getActiveProductCount(companyId) {
  if (!companyId) return 0;
  
  try {
    const { count, error } = await supabase
      .from('products')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .in('status', ['active', 'pending_review']);
    
    if (error) {
      console.error('Error counting active products:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error getting active product count:', error);
    return 0;
  }
}

/**
 * Check if company can add more products
 * Returns { canAdd: boolean, currentCount: number, limit: number, planType: string, needsUpgrade: boolean }
 */
export async function checkProductLimit(companyId) {
  if (!companyId) {
    return {
      canAdd: false,
      currentCount: 0,
      limit: 0,
      planType: 'free',
      needsUpgrade: true,
      message: 'Company ID required'
    };
  }

  try {
    // Get subscription
    const subscription = await getCompanySubscription(companyId);
    const planType = subscription?.plan_type || 'free';
    const limit = PRODUCT_LIMITS[planType] || PRODUCT_LIMITS.free;
    
    // Get current product count
    const currentCount = await getActiveProductCount(companyId);
    
    // Check if limit reached
    const canAdd = currentCount < limit;
    const needsUpgrade = !canAdd && planType === 'free';
    
    return {
      canAdd,
      currentCount,
      limit,
      planType,
      needsUpgrade,
      remaining: Math.max(0, limit - currentCount),
      message: canAdd 
        ? `You can add ${limit === Infinity ? 'unlimited' : limit - currentCount} more product${limit - currentCount !== 1 ? 's' : ''}`
        : needsUpgrade
        ? `You've reached your ${PRODUCT_LIMITS.free} product limit. Upgrade to Growth or Elite for unlimited products.`
        : 'Product limit reached'
    };
  } catch (error) {
    console.error('Error checking product limit:', error);
    return {
      canAdd: false,
      currentCount: 0,
      limit: 0,
      planType: 'free',
      needsUpgrade: true,
      message: 'Error checking product limit'
    };
  }
}

/**
 * Get subscription plan details with limits
 */
export function getPlanWithLimits(planType = 'free') {
  const plan = SUBSCRIPTION_PLANS[planType] || SUBSCRIPTION_PLANS.free;
  return {
    ...plan,
    productLimit: PRODUCT_LIMITS[planType] || PRODUCT_LIMITS.free,
    hasUnlimitedProducts: PRODUCT_LIMITS[planType] === Infinity
  };
}

/**
 * Format limit display
 */
export function formatProductLimit(limit) {
  if (limit === Infinity) return 'Unlimited';
  return limit.toString();
}

