/**
 * Acquisition Service
 * Handles supplier/buyer acquisition tracking, referrals, and growth metrics
 */

import { supabase } from '@/api/supabaseClient';
import { TARGET_COUNTRY, getCountryConfig } from '@/config/countryConfig';

/**
 * Track acquisition event
 */
export async function trackAcquisitionEvent(eventData) {
  try {
    // Use activity_logs as the canonical audit table
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        action: `acquisition_${eventData.type}`,
        metadata: {
          type: eventData.type,
          country: eventData.country || TARGET_COUNTRY,
          email: eventData.email,
          phone: eventData.phone,
          source: eventData.source || 'unknown',
          referral_code: eventData.referral_code,
          ...(eventData.metadata || {})
        }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error tracking acquisition event:', error);
    // Non-critical: don't throw, just return null
    return null;
  }
}

/**
 * Generate referral code for company/user
 */
export async function generateReferralCode(companyId, userId, country = null) {
  try {
    const code = `REF-${companyId?.slice(0, 8).toUpperCase() || userId?.slice(0, 8).toUpperCase() || Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const { data, error } = await supabase
      .from('referral_codes')
      .insert({
        code,
        referrer_company_id: companyId,
        referrer_user_id: userId,
        country: country || TARGET_COUNTRY,
        reward_type: 'subscription_free',
        reward_value: 49, // 1 month Growth subscription
        max_uses: 10
      })
      .select()
      .single();

    if (error) {
      console.warn('[acquisitionService] referral_codes table may not exist yet:', error.message);
      // Return a generated code even if DB insert fails
      return { code, referrer_company_id: companyId, referrer_user_id: userId };
    }
    return data;
  } catch (error) {
    console.error('Error generating referral code:', error);
    return { code: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}` };
  }
}

/**
 * Use referral code
 */
export async function useReferralCode(code, newUserEmail) {
  try {
    // Check if code exists and has uses left
    const { data: referral, error: fetchError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (fetchError || !referral) {
      // Table may not exist yet - fail gracefully
      console.warn('[acquisitionService] referral_codes lookup failed:', fetchError?.message);
      return null;
    }

    if (referral.current_uses >= referral.max_uses) {
      throw new Error('Referral code has reached maximum uses');
    }

    if (referral.expires_at && new Date(referral.expires_at) < new Date()) {
      throw new Error('Referral code has expired');
    }

    // Increment uses
    const { error: updateError } = await supabase
      .from('referral_codes')
      .update({ current_uses: referral.current_uses + 1 })
      .eq('id', referral.id);

    if (updateError) throw updateError;

    // Track referral usage
    await trackAcquisitionEvent({
      type: 'referral',
      country: referral.country,
      email: newUserEmail,
      source: 'referral_code',
      referral_code: code,
      metadata: { referrer_company_id: referral.referrer_company_id }
    });

    return referral;
  } catch (error) {
    console.error('Error using referral code:', error);
    throw error;
  }
}

/**
 * Get country growth metrics
 */
export async function getCountryMetrics(country = null, startDate = null, endDate = null) {
  try {
    const targetCountry = country || TARGET_COUNTRY;
    let query = supabase
      .from('country_metrics')
      .select('*')
      .eq('country', targetCountry)
      .order('metric_date', { ascending: false })
      .limit(30);

    if (startDate) {
      query = query.gte('metric_date', startDate);
    }
    if (endDate) {
      query = query.lte('metric_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching country metrics:', error);
    return [];
  }
}

/**
 * Calculate and update country metrics (should be run daily via cron)
 */
export async function updateCountryMetrics(country = null) {
  try {
    const targetCountry = country || TARGET_COUNTRY;
    const today = new Date().toISOString().split('T')[0];

    // Get supplier counts
    const { data: suppliers } = await supabase
      .from('companies')
      .select('id, verified, created_at, country, role')
      .eq('country', targetCountry)
      .in('role', ['seller', 'hybrid']);

    const totalSuppliers = suppliers?.length || 0;
    const verifiedSuppliers = suppliers?.filter(s => s.verified)?.length || 0;
    const newSuppliersToday = suppliers?.filter(s => 
      s.created_at?.split('T')[0] === today
    )?.length || 0;

    // Get buyer counts
    const { data: buyers } = await supabase
      .from('companies')
      .select('id, created_at, country, role')
      .eq('country', targetCountry)
      .in('role', ['buyer', 'hybrid']);

    const totalBuyers = buyers?.length || 0;
    const newBuyersToday = buyers?.filter(b => 
      b.created_at?.split('T')[0] === today
    )?.length || 0;

    // Get product counts
    const { data: products } = await supabase
      .from('products')
      .select('id, status, created_at, company:companies!products_company_id_fkey(country)')
      .eq('status', 'active');

    const countryProducts = products?.filter(p => 
      p.company?.country === targetCountry
    ) || [];
    const totalListings = countryProducts.length;
    const newListingsToday = countryProducts.filter(p => 
      p.created_at?.split('T')[0] === today
    ).length;

    // Get RFQ counts
    const { data: rfqs } = await supabase
      .from('rfqs')
      .select('id, status, created_at, buyer_company:companies!rfqs_buyer_company_id_fkey(country)')
      .eq('status', 'open');

    const countryRFQs = rfqs?.filter(r => 
      r.buyer_company?.country === targetCountry
    ) || [];
    const totalRFQs = countryRFQs.length;
    const newRFQsToday = countryRFQs.filter(r => 
      r.created_at?.split('T')[0] === today
    ).length;

    // Get order metrics
    const { data: orders } = await supabase
      .from('orders')
      .select('id, status, total_amount, created_at, seller_company:companies!orders_seller_company_id_fkey(country)')
      .eq('status', 'completed');

    const countryOrders = orders?.filter(o => 
      o.seller_company?.country === targetCountry
    ) || [];
    const totalOrders = countryOrders.length;
    const gmv = countryOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

    // Upsert metrics
    const { data, error } = await supabase
      .from('country_metrics')
      .upsert({
        country: targetCountry,
        metric_date: today,
        total_suppliers: totalSuppliers,
        verified_suppliers: verifiedSuppliers,
        active_suppliers: totalSuppliers, // Simplified
        new_suppliers_today: newSuppliersToday,
        total_buyers: totalBuyers,
        active_buyers: totalBuyers, // Simplified
        new_buyers_today: newBuyersToday,
        total_listings: totalListings,
        active_listings: totalListings,
        new_listings_today: newListingsToday,
        total_rfqs: totalRFQs,
        open_rfqs: totalRFQs,
        new_rfqs_today: newRFQsToday,
        total_orders: totalOrders,
        completed_orders: totalOrders,
        gmv: gmv,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'country,metric_date'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating country metrics:', error);
    throw error;
  }
}

/**
 * Get onboarding funnel metrics
 */
export async function getOnboardingFunnel(country = null) {
  try {
    const targetCountry = country || TARGET_COUNTRY;
    
    // Get metrics for today
    const { data: metrics } = await supabase
      .from('country_metrics')
      .select('*')
      .eq('country', targetCountry)
      .order('metric_date', { ascending: false })
      .limit(1)
      .single();

    return {
      invites_sent: metrics?.invites_sent || 0,
      signups_completed: metrics?.signups_completed || 0,
      profiles_completed: metrics?.profiles_completed || 0,
      products_listed: metrics?.products_listed || 0
    };
  } catch (error) {
    console.error('Error fetching onboarding funnel:', error);
    return { invites_sent: 0, signups_completed: 0, profiles_completed: 0, products_listed: 0 };
  }
}

export default {
  trackAcquisitionEvent,
  generateReferralCode,
  useReferralCode,
  getCountryMetrics,
  updateCountryMetrics,
  getOnboardingFunnel
};
