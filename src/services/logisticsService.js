/**
 * Logistics Service
 * Handles shipping quotes, tracking, and real-time shipment updates
 * Integrates with partners: DHL, FedEx, UPS, Afrikoni logistics
 */

import { supabase } from '@/api/supabaseClient';
import { emitTradeEvent, TRADE_EVENT_TYPE } from './tradeEvents';

// Logistics partners (in production, these would be real APIs)
const LOGISTICS_PARTNERS = [
  { id: 'dhl', name: 'DHL Express', baseRate: 0.15, api: 'https://api.dhl.com' },
  { id: 'fedex', name: 'FedEx', baseRate: 0.18, api: 'https://api.fedex.com' },
  { id: 'ups', name: 'UPS', baseRate: 0.16, api: 'https://onlinetools.ups.com' },
  { id: 'afrikoni', name: 'Afrikoni Logistics', baseRate: 0.14, api: 'internal', recommended: true }
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
 * Create shipment record for a trade
 */
export async function createShipment({
  tradeId,
  trackingNumber,
  carrier,
  pickupDate,
  estimatedDeliveryDate
}) {
  try {
    // KERNEL: Validate required fields
    if (!tradeId || !trackingNumber || !carrier) {
      return { success: false, error: 'Missing required fields' };
    }

    // KERNEL: Create shipment
    const { data: shipment, error } = await supabase
      .from('shipments')
      .insert({
        trade_id: tradeId,
        tracking_number: trackingNumber,
        carrier: carrier,
        status: 'pending',
        pickup_scheduled_date: pickupDate,
        estimated_delivery_date: estimatedDeliveryDate,
        milestones: [
          {
            name: 'Pending',
            timestamp: new Date().toISOString(),
            location: null,
            status: 'completed'
          }
        ],
        created_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    // Emit event
    await emitTradeEvent({
      tradeId,
      eventType: TRADE_EVENT_TYPE.SHIPMENT_CREATED,
      metadata: {
        shipment_id: shipment.id,
        tracking_number: trackingNumber,
        carrier,
        estimated_delivery_date: estimatedDeliveryDate
      }
    });

    return { success: true, shipment };
  } catch (err) {
    console.error('[logisticsService] Create shipment failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update shipment milestone (pickup, in transit, delivery, etc.)
 */
export async function updateShipmentMilestone({
  shipmentId,
  milestoneName,
  location,
  timestamp = new Date(),
  notes = ''
}) {
  try {
    // KERNEL: Get current shipment
    const { data: shipment, error: getError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (getError) throw getError;

    // KERNEL: Add milestone
    const milestones = shipment.milestones || [];
    const newMilestone = {
      name: milestoneName,
      timestamp: timestamp.toISOString(),
      location: location,
      notes: notes,
      status: 'completed'
    };

    milestones.push(newMilestone);

    // Determine shipment status based on milestone
    let newStatus = shipment.status;
    if (milestoneName.toLowerCase().includes('pickup')) {
      newStatus = 'picked_up';
    } else if (milestoneName.toLowerCase().includes('transit')) {
      newStatus = 'in_transit';
    } else if (milestoneName.toLowerCase().includes('delivery')) {
      newStatus = 'delivered';
    }

    // KERNEL: Update shipment
    const { data: updatedShipment, error: updateError } = await supabase
      .from('shipments')
      .update({
        status: newStatus,
        milestones: milestones,
        last_update_timestamp: timestamp,
        last_update_location: location
      })
      .eq('id', shipmentId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Emit event
    const eventTypeMap = {
      'pickup': TRADE_EVENT_TYPE.SHIPMENT_PICKED_UP,
      'in_transit': TRADE_EVENT_TYPE.SHIPMENT_IN_TRANSIT,
      'delivery': TRADE_EVENT_TYPE.SHIPMENT_DELIVERED
    };

    const eventType = eventTypeMap[milestoneName.toLowerCase().split(' ')[0]] || TRADE_EVENT_TYPE.SHIPMENT_UPDATED;

    await emitTradeEvent({
      tradeId: shipment.trade_id,
      eventType: eventType,
      metadata: {
        shipment_id: shipmentId,
        milestone: milestoneName,
        location: location,
        timestamp: timestamp.toISOString()
      }
    });

    return { success: true, shipment: updatedShipment };
  } catch (err) {
    console.error('[logisticsService] Update shipment milestone failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get shipment details for a trade
 */
export async function getShipment(tradeId) {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('trade_id', tradeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { success: true, shipment: data };
  } catch (err) {
    console.error('[logisticsService] Get shipment failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all shipments for a logistics partner
 */
export async function getLogisticsPartnerShipments(partnerId) {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        *,
        trades!trade_id (
          id,
          title,
          status,
          companies!buyer_company_id (
            id,
            name,
            country
          )
        )
      `)
      .eq('carrier', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, shipments: data || [] };
  } catch (err) {
    console.error('[logisticsService] Get logistics partner shipments failed:', err);
    return { success: false, error: err.message, shipments: [] };
  }
}

/**
 * Bulk update shipments from logistics partner API webhook
 * Called via webhook from logistics partner
 */
export async function bulkUpdateShipments(updates) {
  try {
    // updates should be array of { tracking_number, status, location, timestamp }
    const results = [];

    for (const update of updates) {
      // Find shipment by tracking number
      const { data: shipment, error: findError } = await supabase
        .from('shipments')
        .select('id')
        .eq('tracking_number', update.tracking_number)
        .single();

      if (findError || !shipment) {
        results.push({ tracking_number: update.tracking_number, success: false });
        continue;
      }

      // Update shipment
      const updateResult = await updateShipmentMilestone({
        shipmentId: shipment.id,
        milestoneName: update.status,
        location: update.location,
        timestamp: new Date(update.timestamp),
        notes: update.notes || ''
      });

      results.push({
        tracking_number: update.tracking_number,
        success: updateResult.success
      });
    }

    return { success: true, results };
  } catch (err) {
    console.error('[logisticsService] Bulk update shipments failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Estimate delivery date based on lead time
 */
export function estimateDeliveryDate(leadTimeDays, startDate = new Date()) {
  const estimatedDate = new Date(startDate);
  estimatedDate.setDate(estimatedDate.getDate() + leadTimeDays);
  return estimatedDate;
}

/**
 * Check shipment delay
 */
export function isShipmentDelayed(estimatedDate, currentDate = new Date()) {
  return currentDate > estimatedDate;
}

/**
 * Calculate days remaining until delivery
 */
export function getDaysUntilDelivery(estimatedDate, currentDate = new Date()) {
  const diff = estimatedDate - currentDate;
  const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return daysRemaining;
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

