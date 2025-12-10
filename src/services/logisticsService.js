/**
 * Logistics Service
 * Handles shipping quotes with Afrikoni markup
 */

import { supabase } from '@/api/supabaseClient';

// Mock logistics partners (in production, these would be real APIs)
const LOGISTICS_PARTNERS = [
  { id: 'dhl', name: 'DHL Express', baseRate: 0.15 }, // $0.15 per kg
  { id: 'fedex', name: 'FedEx', baseRate: 0.18 },
  { id: 'ups', name: 'UPS', baseRate: 0.16 },
  { id: 'afrikoni', name: 'Afrikoni Preferred', baseRate: 0.14, recommended: true }
];

/**
 * Calculate shipping quote from logistics partner
 */
export async function calculateShippingQuote(params) {
  const { pickupCountry, deliveryCountry, weightKg, volumeM3, dimensions } = params;
  
  // Mock calculation (in production, call partner APIs)
  const quotes = LOGISTICS_PARTNERS.map(partner => {
    // Simple calculation: base rate × weight × distance factor
    const distanceFactor = getDistanceFactor(pickupCountry, deliveryCountry);
    const basePrice = partner.baseRate * (weightKg || 1) * distanceFactor;
    
    // Afrikoni markup (3-10% based on partner)
    const markupPercent = partner.id === 'afrikoni' ? 5.00 : 7.00; // 5% for preferred, 7% for others
    const markupAmount = (basePrice * markupPercent) / 100;
    const finalPrice = basePrice + markupAmount;
    
    // Estimated days (mock)
    const estimatedDays = Math.ceil(distanceFactor * 3);
    
    return {
      partnerId: partner.id,
      partnerName: partner.name,
      basePrice: parseFloat(basePrice.toFixed(2)),
      afrikoniMarkupPercent: markupPercent,
      afrikoniMarkupAmount: parseFloat(markupAmount.toFixed(2)),
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      estimatedDays,
      recommended: partner.recommended || false
    };
  });
  
  return quotes.sort((a, b) => a.finalPrice - b.finalPrice);
}

/**
 * Get distance factor between countries (mock)
 */
function getDistanceFactor(origin, destination) {
  // Mock: simple distance calculation
  // In production, use actual distance APIs
  if (origin === destination) return 1;
  
  // Same region (e.g., both in West Africa)
  const westAfrica = ['Nigeria', 'Ghana', 'Senegal', 'Ivory Coast'];
  const eastAfrica = ['Kenya', 'Tanzania', 'Uganda'];
  const southAfrica = ['South Africa', 'Zimbabwe', 'Botswana'];
  
  const originRegion = getRegion(origin);
  const destRegion = getRegion(destination);
  
  if (originRegion === destRegion) return 1.5;
  if (originRegion !== 'unknown' && destRegion !== 'unknown') return 2.5;
  return 3.0; // Intercontinental
}

function getRegion(country) {
  const westAfrica = ['Nigeria', 'Ghana', 'Senegal', 'Ivory Coast', 'Burkina Faso', 'Mali'];
  const eastAfrica = ['Kenya', 'Tanzania', 'Uganda', 'Ethiopia', 'Rwanda'];
  const southAfrica = ['South Africa', 'Zimbabwe', 'Botswana', 'Namibia'];
  
  if (westAfrica.includes(country)) return 'west';
  if (eastAfrica.includes(country)) return 'east';
  if (southAfrica.includes(country)) return 'south';
  return 'unknown';
}

/**
 * Save logistics quote to database
 */
export async function saveLogisticsQuote(orderId, companyId, quoteData) {
  try {
    const { data, error } = await supabase
      .from('logistics_quotes')
      .insert({
        order_id: orderId,
        company_id: companyId,
        pickup_country: quoteData.pickupCountry,
        delivery_country: quoteData.deliveryCountry,
        pickup_city: quoteData.pickupCity,
        delivery_city: quoteData.deliveryCity,
        weight_kg: quoteData.weightKg,
        volume_m3: quoteData.volumeM3,
        dimensions: quoteData.dimensions,
        base_price: quoteData.basePrice,
        afrikoni_markup_percent: quoteData.afrikoniMarkupPercent,
        afrikoni_markup_amount: quoteData.afrikoniMarkupAmount,
        final_price: quoteData.finalPrice,
        logistics_partner_id: quoteData.partnerId,
        partner_name: quoteData.partnerName,
        estimated_days: quoteData.estimatedDays,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving logistics quote:', error);
    throw error;
  }
}

/**
 * Accept logistics quote
 */
export async function acceptLogisticsQuote(quoteId) {
  try {
    const { data, error } = await supabase
      .from('logistics_quotes')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Create revenue transaction for logistics margin
    if (data.afrikoni_markup_amount > 0) {
      await supabase.from('revenue_transactions').insert({
        transaction_type: 'logistics_margin',
        amount: data.afrikoni_markup_amount,
        currency: 'USD',
        logistics_quote_id: quoteId,
        order_id: data.order_id,
        company_id: data.company_id,
        description: `Logistics margin - ${data.partner_name}`,
        status: 'completed',
        processed_at: new Date().toISOString()
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error accepting logistics quote:', error);
    throw error;
  }
}

/**
 * Get logistics quotes for an order
 */
export async function getLogisticsQuotes(orderId) {
  try {
    const { data, error } = await supabase
      .from('logistics_quotes')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting logistics quotes:', error);
    return [];
  }
}

