/**
 * Buyer Demand Generation Service
 * Create RFQ pools, campaigns, and automated demand generation
 */

import { supabase } from '@/api/supabaseClient';
import { TARGET_COUNTRY, getCountryConfig } from '@/config/countryConfig';

/**
 * Create RFQ pool for product category
 */
export async function createRFQPool(category, country = null, targetQuantity = null) {
  try {
    const targetCountry = country || TARGET_COUNTRY;
    const config = getCountryConfig();
    
    // Get popular products for country
    const popularProducts = config.popularProducts || [];
    
    // Create template RFQ
    const { data: rfq, error } = await supabase
      .from('rfqs')
      .insert({
        title: `Looking for ${targetQuantity || 'bulk'} ${category} from ${targetCountry}`,
        description: `We are seeking verified suppliers of ${category} from ${targetCountry}. Quality and reliable delivery are essential.`,
        quantity: targetQuantity || 1000,
        unit: 'kg',
        delivery_location: 'Global',
        status: 'open',
        country: targetCountry,
        source: 'rfq_pool',
        metadata: { 
          pool: true,
          category,
          country: targetCountry
        }
      })
      .select()
      .single();

    if (error) throw error;

    // Notify suppliers in country
    await notifySuppliersOfRFQ(rfq.id, targetCountry, category);

    return rfq;
  } catch (error) {
    console.error('Error creating RFQ pool:', error);
    throw error;
  }
}

/**
 * Notify suppliers of new RFQ
 */
async function notifySuppliersOfRFQ(rfqId, country, category) {
  try {
    // Get suppliers in country with matching products
    const { data: suppliers } = await supabase
      .from('companies')
      .select('id, owner_email, company_name')
      .eq('country', country)
      .in('role', ['seller', 'hybrid']);

    if (!suppliers || suppliers.length === 0) return;

    // Create notifications
    const notifications = suppliers.map(supplier => ({
      user_email: supplier.owner_email,
      company_id: supplier.id,
      title: `New RFQ: ${category} from ${country}`,
      message: `A buyer is looking for ${category}. Check the RFQ and submit your quote.`,
      type: 'rfq_match',
      link: `/dashboard/rfqs/${rfqId}`,
      related_id: rfqId
    }));

    await supabase.from('notifications').insert(notifications);

    // Track notification event
    await supabase.from('acquisition_events').insert({
      type: 'buyer_signup',
      country,
      source: 'rfq_pool_notification',
      metadata: { rfq_id: rfqId, suppliers_notified: suppliers.length }
    });
  } catch (error) {
    console.error('Error notifying suppliers:', error);
  }
}

/**
 * Generate promotional campaign for buyers
 */
export async function createBuyerCampaign(country = null, discountPercent = 10) {
  try {
    const targetCountry = country || TARGET_COUNTRY;
    
    const { data: campaign, error } = await supabase
      .from('marketing_campaigns')
      .insert({
        name: `Buyer Campaign - ${targetCountry}`,
        type: 'buyer_acquisition',
        target_country: targetCountry,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
        metrics: {
          discount_percent: discountPercent,
          escrow_fee_waived: true,
          first_orders_limit: 50
        }
      })
      .select()
      .single();

    if (error) throw error;
    return campaign;
  } catch (error) {
    console.error('Error creating buyer campaign:', error);
    throw error;
  }
}

/**
 * Get active RFQ pools for country
 */
export async function getRFQPools(country = null) {
  try {
    const targetCountry = country || TARGET_COUNTRY;
    
    const { data, error } = await supabase
      .from('rfqs')
      .select('*')
      .eq('status', 'open')
      .eq('country', targetCountry)
      .contains('metadata', { pool: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching RFQ pools:', error);
    return [];
  }
}

/**
 * Auto-generate RFQs using KoniAI suggestions
 */
export async function generateSuggestedRFQs(country = null) {
  try {
    const targetCountry = country || TARGET_COUNTRY;
    const config = getCountryConfig();
    
    // Get popular products and create RFQs
    const suggestedRFQs = [];
    
    for (const product of config.popularProducts.slice(0, 5)) {
      try {
        const rfq = await createRFQPool(product, targetCountry, 1000);
        suggestedRFQs.push(rfq);
      } catch (error) {
        console.error(`Error creating RFQ for ${product}:`, error);
      }
    }

    return suggestedRFQs;
  } catch (error) {
    console.error('Error generating suggested RFQs:', error);
    throw error;
  }
}

export default {
  createRFQPool,
  createBuyerCampaign,
  getRFQPools,
  generateSuggestedRFQs
};
