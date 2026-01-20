/**
 * Automation Service
 * Email/SMS drip campaigns, notifications, and automated matching
 */

import { supabase } from '@/api/supabaseClient';
import { TARGET_COUNTRY } from '@/config/countryConfig';

/**
 * Send onboarding reminder to stuck users
 */
export async function sendOnboardingReminder(email, stage, country = null) {
  try {
    const targetCountry = country || TARGET_COUNTRY;
    
    // Get user details
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_id')
      .eq('id', (await supabase.from('auth.users').select('id').eq('email', email).single()).data?.id)
      .maybeSingle();

    const subject = getReminderSubject(stage);
    const message = getReminderMessage(stage, targetCountry, profile?.full_name);

    // In production, integrate with email service
    // For now, create notification
    await supabase.from('notifications').insert({
      user_email: email,
      title: subject,
      message,
      type: 'onboarding_reminder',
      metadata: { stage, country: targetCountry }
    });

    // Track reminder
    await supabase.from('acquisition_events').insert({
      type: 'supplier_invite',
      country: targetCountry,
      email,
      source: 'automation_reminder',
      metadata: { stage, action: 'reminder_sent' }
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending reminder:', error);
    throw error;
  }
}

function getReminderSubject(stage) {
  const subjects = {
    invited: 'Complete your Afrikoni supplier signup',
    signed_up: 'Finish your company profile',
    profile_complete: 'List your first product and start selling'
  };
  return subjects[stage] || 'Continue your Afrikoni journey';
}

function getReminderMessage(stage, country, name) {
  const namePart = name ? `Hi ${name},` : 'Hi,';
  
  const messages = {
    invited: `${namePart} You were invited to join Afrikoni as a supplier from ${country}. Complete your signup to access global buyers and secure escrow payments.`,
    signed_up: `${namePart} Your Afrikoni account is ready! Complete your company profile to start listing products and connecting with buyers.`,
    profile_complete: `${namePart} You're almost there! List your first product to start receiving orders from verified buyers worldwide.`
  };
  
  return messages[stage] || `${namePart} Continue your journey on Afrikoni.`;
}

/**
 * Auto-match suppliers to new RFQs
 */
export async function autoMatchSuppliersToRFQ(rfqId) {
  try {
    // Get RFQ details
    const { data: rfq } = await supabase
      .from('rfqs')
      .select('*, buyer_company:companies!rfqs_buyer_company_id_fkey(country)')
      .eq('id', rfqId)
      .single();

    if (!rfq) return;

    // Get matching suppliers
    const { data: suppliers } = await supabase
      .from('companies')
      .select('id, owner_email, company_name, country')
      .eq('country', rfq.buyer_company?.country || TARGET_COUNTRY)
      .in('role', ['seller', 'hybrid']);

    if (!suppliers || suppliers.length === 0) return;

    // Create match notifications
    const notifications = suppliers.map(supplier => ({
      user_email: supplier.owner_email,
      company_id: supplier.id,
      title: `New RFQ Match: ${rfq.title}`,
      message: `A buyer is looking for products you might supply. Check this RFQ and submit your quote.`,
      type: 'rfq_match',
      link: `/dashboard/rfqs/${rfqId}`,
      related_id: rfqId
    }));

    await supabase.from('notifications').insert(notifications);

    return { matched: suppliers.length };
  } catch (error) {
    console.error('Error auto-matching suppliers:', error);
    throw error;
  }
}

/**
 * Send weekly supply-demand matches
 */
export async function sendWeeklyMatches(country = null) {
  try {
    const targetCountry = country || TARGET_COUNTRY;
    
    // Get top 5 RFQs from last week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: topRFQs } = await supabase
      .from('rfqs')
      .select('id, title, quantity, unit, target_price')
      .eq('status', 'open')
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (!topRFQs || topRFQs.length === 0) return;

    // Get all suppliers in country
    const { data: suppliers } = await supabase
      .from('companies')
      .select('id, owner_email, company_name')
      .eq('country', targetCountry)
      .in('role', ['seller', 'hybrid']);

    if (!suppliers || suppliers.length === 0) return;

    // Create weekly digest notification
    const notifications = suppliers.map(supplier => ({
      user_email: supplier.owner_email,
      company_id: supplier.id,
      title: 'Top 5 RFQ Opportunities This Week',
      message: `We found ${topRFQs.length} new RFQs that match your location. Check them out and submit quotes!`,
      type: 'weekly_digest',
      link: '/dashboard/rfqs',
      metadata: { rfq_ids: topRFQs.map(r => r.id) }
    }));

    await supabase.from('notifications').insert(notifications);

    return { sent: suppliers.length, rfqs: topRFQs.length };
  } catch (error) {
    console.error('Error sending weekly matches:', error);
    throw error;
  }
}

/**
 * Trigger product listing suggestions
 */
export async function suggestProductListings(companyId) {
  try {
    const { data: company } = await supabase
      .from('companies')
      .select('country, company_name')
      .eq('id', companyId)
      .single();

    if (!company) return;

    const config = getCountryConfig();
    const popularProducts = config.popularProducts || [];

    // ✅ KERNEL-SCHEMA ALIGNMENT: Use 'name' instead of 'title' (DB schema uses 'name')
    // Get existing products
    const { data: existingProducts } = await supabase
      .from('products')
      .select('name')
      .eq('company_id', companyId);

    const existingTitles = existingProducts?.map(p => (p.name || p.title || '').toLowerCase()).filter(Boolean) || [];
    const suggestions = popularProducts.filter(p => 
      !existingTitles.some(title => title.includes(p.toLowerCase()))
    );

    if (suggestions.length === 0) return;

    // Create suggestion notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('company_id', companyId)
      .single();

    if (profile) {
      await supabase.from('notifications').insert({
        user_id: profile.id,
        company_id: companyId,
        title: 'Product Listing Suggestions',
        message: `Based on popular products in ${company.country}, consider listing: ${suggestions.slice(0, 3).join(', ')}`,
        type: 'product_suggestion',
        link: '/dashboard/products/new',
        metadata: { suggestions }
      });
    }

    return { suggestions };
  } catch (error) {
    console.error('Error suggesting products:', error);
    throw error;
  }
}

export default {
  sendOnboardingReminder,
  autoMatchSuppliersToRFQ,
  sendWeeklyMatches,
  suggestProductListings
};
