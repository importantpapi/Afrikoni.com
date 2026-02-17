/**
 * Quote Service - Suppliers submit quotes on RFQs
 * Handles quote creation, management, and supplier matching
 */

import { supabase } from '@/api/supabaseClient';
import { emitTradeEvent, TRADE_EVENT_TYPE } from './tradeEvents';
import { notifyQuoteSubmitted } from '@/services/notificationService';

/**
 * Get all open RFQs available to suppliers
 */
export async function getAvailableRFQs(filters = {}) {
  try {
    let query = supabase
      .from('trades')
      .select(`
        id,
        title,
        description,
        quantity,
        quantity_unit,
        target_price,
        target_price_currency,
        status,
        created_at,
        buyer_company_id,
        companies!buyer_company_id (
          id,
          name,
          country,
          trust_score
        )
      `)
      .eq('status', 'rfq_open')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.country) {
      query = query.eq('companies.country', filters.country);
    }

    if (filters.minBudget) {
      query = query.gte('target_price', filters.minBudget);
    }

    if (filters.maxBudget) {
      query = query.lte('target_price', filters.maxBudget);
    }

    if (filters.searchTerm) {
      query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, rfqs: data || [] };
  } catch (err) {
    console.error('[quoteService] Get available RFQs failed:', err);
    return { success: false, error: err.message, rfqs: [] };
  }
}

/**
 * Get RFQ details
 */
export async function getRFQDetails(rfqId) {
  try {
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        companies!buyer_company_id (
          id,
          name,
          country,
          trust_score,
          verification_status
        )
      `)
      .eq('id', rfqId)
      .single();

    if (error) throw error;

    // Also get existing quotes count
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('id')
      .eq('trade_id', rfqId);

    if (!quotesError) {
      data.quote_count = quotes?.length || 0;
    }

    return { success: true, rfq: data };
  } catch (err) {
    console.error('[quoteService] Get RFQ details failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Submit a quote on an RFQ
 */
export async function submitQuote({
  rfqId,
  supplierId,
  supplierCompanyId,
  unitPrice,
  totalPrice,
  currency = 'USD',
  leadTime, // days
  deliveryIncoterms, // EXW, FOB, CIF, etc.
  deliveryLocation,
  paymentTerms, // Net 30, Net 60, etc.
  certificates = [],
  notes = ''
}) {
  try {
    // KERNEL: Validate inputs
    if (!rfqId || !supplierId || !unitPrice || !totalPrice || !leadTime) {
      return { success: false, error: 'Missing required fields' };
    }

    if (unitPrice <= 0 || totalPrice <= 0) {
      return { success: false, error: 'Prices must be greater than 0' };
    }

    // Check if supplier already quoted on this RFQ
    const { data: existingQuote, error: checkError } = await supabase
      .from('quotes')
      .select('id')
      .eq('trade_id', rfqId)
      .eq('supplier_company_id', supplierCompanyId)
      .single();

    if (existingQuote) {
      return { success: false, error: 'You have already submitted a quote for this RFQ' };
    }

    // Get RFQ to validate
    const { data: rfq, error: rfqError } = await supabase
      .from('trades')
      .select('*')
      .eq('id', rfqId)
      .eq('status', 'rfq_open')
      .single();

    if (rfqError || !rfq) {
      return { success: false, error: 'RFQ not found or no longer open' };
    }

    const { logTradeEvent } = await import('./tradeKernel');
    // Create quote
    const { data: quote, error: createError } = await supabase
      .from('quotes')
      .insert({
        trade_id: rfqId,
        supplier_id: supplierId,
        supplier_company_id: supplierCompanyId,
        unit_price: unitPrice,
        total_price: totalPrice,
        quantity: rfq.quantity,
        quantity_unit: rfq.quantity_unit,
        currency,
        lead_time_days: leadTime,
        incoterms: deliveryIncoterms,
        delivery_location: deliveryLocation,
        payment_terms: paymentTerms,
        certificates: certificates,
        notes: notes,
        status: 'submitted',
        created_at: new Date()
      })
      .select()
      .single();
    if (createError) throw createError;
    // Log event
    await logTradeEvent(rfqId, 'quote_received', {
      quote_id: quote.id,
      supplier_company_id: supplierCompanyId,
      unit_price: unitPrice,
      total_price: totalPrice,
      lead_time_days: leadTime
    }, 'seller');

    // ✅ NOTIFICATION: Alert Buyer
    if (rfq.buyer_company_id) {
      // Don't await strictly to prevent blocking UI
      notifyQuoteSubmitted(quote.id, rfqId, rfq.buyer_company_id).catch(console.error);
    }

    return { success: true, quote };
  } catch (err) {
    console.error('[quoteService] Submit quote failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all quotes for an RFQ (for buyer)
 */
export async function getQuotesForRFQ(rfqId) {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        companies!supplier_company_id (
          id,
          name,
          country,
          trust_score,
          verification_status
        )
      `)
      .eq('trade_id', rfqId)
      .eq('status', 'submitted')
      .order('unit_price', { ascending: true });

    if (error) throw error;

    return { success: true, quotes: data || [] };
  } catch (err) {
    console.error('[quoteService] Get quotes for RFQ failed:', err);
    return { success: false, error: err.message, quotes: [] };
  }
}

/**
 * Get supplier's own quotes
 */
export async function getSupplierQuotes(supplierCompanyId) {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        trades!trade_id (
          id,
          title,
          status,
          created_at,
          companies!buyer_company_id (
            id,
            name
          )
        )
      `)
      .eq('supplier_company_id', supplierCompanyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, quotes: data || [] };
  } catch (err) {
    console.error('[quoteService] Get supplier quotes failed:', err);
    return { success: false, error: err.message, quotes: [] };
  }
}

/**
 * Accept or reject a quote
 */
export async function updateQuoteStatus(quoteId, status) {
  return { success: false, error: 'Kernel-enforced: quote status updates must occur via trade transition.' };
}

/**
 * Delete a draft quote
 */
export async function deleteQuote(quoteId) {
  try {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('[quoteService] Delete quote failed:', err);
    return { success: false, error: err.message };
  }
}

export default {
  getAvailableRFQs,
  getRFQDetails,
  submitQuote,
  getQuotesForRFQ,
  getSupplierQuotes,
  updateQuoteStatus,
  deleteQuote
};
