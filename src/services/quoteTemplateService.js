/**
 * Quote Templates Service - 2026
 * Allows suppliers to save and reuse quote templates for faster quoting
 */

import { supabase } from '@/api/supabaseClient';

/**
 * Get all quote templates for a supplier
 * @param {string} supplierCompanyId - Supplier company ID
 * @returns {Promise<Array>} Quote templates
 */
export async function getQuoteTemplates(supplierCompanyId) {
  try {
    const { data, error } = await supabase
      .from('quote_templates')
      .select('*')
      .eq('supplier_company_id', supplierCompanyId)
      .order('use_count', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      templates: data || []
    };
  } catch (err) {
    console.error('[getQuoteTemplates] Error:', err);
    return { success: false, error: err.message, templates: [] };
  }
}

/**
 * Get default quote template
 * @param {string} supplierCompanyId - Supplier company ID
 * @param {string} productCategory - Optional product category filter
 * @returns {Promise<Object|null>} Default template
 */
export async function getDefaultTemplate(supplierCompanyId, productCategory = null) {
  try {
    let query = supabase
      .from('quote_templates')
      .select('*')
      .eq('supplier_company_id', supplierCompanyId)
      .eq('is_default', true);

    if (productCategory) {
      query = query.eq('product_category', productCategory);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error

    return {
      success: true,
      template: data || null
    };
  } catch (err) {
    console.error('[getDefaultTemplate] Error:', err);
    return { success: false, error: err.message, template: null };
  }
}

/**
 * Create a new quote template
 * @param {Object} templateData - Template data
 * @returns {Promise<Object>} Created template
 */
export async function createQuoteTemplate(templateData) {
  try {
    const { data, error } = await supabase
      .from('quote_templates')
      .insert({
        supplier_company_id: templateData.supplierCompanyId,
        created_by: templateData.createdBy,
        template_name: templateData.name,
        product_category: templateData.productCategory,
        unit_price: templateData.unitPrice,
        currency: templateData.currency || 'USD',
        lead_time_days: templateData.leadTimeDays,
        incoterms: templateData.incoterms,
        payment_terms: templateData.paymentTerms,
        moq: templateData.moq || null,
        delivery_location: templateData.deliveryLocation,
        certifications: templateData.certifications || [],
        notes: templateData.notes,
        is_default: templateData.isDefault || false
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      template: data
    };
  } catch (err) {
    console.error('[createQuoteTemplate] Error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update a quote template
 * @param {string} templateId - Template ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated template
 */
export async function updateQuoteTemplate(templateId, updates) {
  try {
    const { data, error } = await supabase
      .from('quote_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      template: data
    };
  } catch (err) {
    console.error('[updateQuoteTemplate] Error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a quote template
 * @param {string} templateId - Template ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteQuoteTemplate(templateId) {
  try {
    const { error } = await supabase
      .from('quote_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('[deleteQuoteTemplate] Error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Apply template to RFQ (increment use count and return template data)
 * @param {string} templateId - Template ID
 * @param {Object} rfqData - RFQ data to merge with template
 * @returns {Promise<Object>} Quote data pre-filled from template
 */
export async function applyTemplate(templateId, rfqData = {}) {
  try {
    // Get template
    const { data: template, error } = await supabase
      .from('quote_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;

    // Increment use count
    await supabase
      .from('quote_templates')
      .update({
        use_count: (template.use_count || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', templateId);

    // Merge template with RFQ-specific data
    const quoteData = {
      unitPrice: template.unit_price,
      totalPrice: template.unit_price * (rfqData.quantity || 1),
      currency: template.currency,
      leadTime: template.lead_time_days,
      incoterms: template.incoterms,
      deliveryLocation: template.delivery_location,
      paymentTerms: template.payment_terms,
      certificates: template.certifications || [],
      notes: template.notes || ''
    };

    return {
      success: true,
      quoteData,
      template
    };
  } catch (err) {
    console.error('[applyTemplate] Error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Check if company can post RFQ (anti-spam)
 * @param {string} companyId - Company ID
 * @returns {Promise<Object>} Posting eligibility status
 */
export async function canPostRFQ(companyId) {
  try {
    const { data, error } = await supabase.rpc('can_post_rfq', {
      p_company_id: companyId
    });

    if (error) throw error;

    return {
      success: true,
      ...data
    };
  } catch (err) {
    console.error('[canPostRFQ] Error:', err);
    return { 
      success: false, 
      can_post: false,
      error: err.message,
      reason: 'error'
    };
  }
}

/**
 * Increment RFQ count after successful posting
 * @param {string} companyId - Company ID
 * @returns {Promise<void>}
 */
export async function incrementRFQCount(companyId) {
  try {
    const { error } = await supabase.rpc('increment_rfq_count', {
      p_company_id: companyId
    });

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('[incrementRFQCount] Error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Validate quote price against market data (prevent suspicious quotes)
 * @param {number} unitPrice - Unit price
 * @param {string} product - Product name
 * @param {string} currency - Currency
 * @returns {Object} Validation result
 */
export function validateQuotePrice(unitPrice, product, currency = 'USD') {
  // TODO: Implement market price database lookup
  // For now, basic sanity checks
  
  if (unitPrice <= 0) {
    return {
      valid: false,
      warning: 'critical',
      message: 'Price must be greater than zero'
    };
  }

  if (unitPrice < 0.01) {
    return {
      valid: false,
      warning: 'critical',
      message: 'Price is suspiciously low. Please verify.'
    };
  }

  // Placeholder: In production, compare against market data
  // const marketPrice = getMarketPrice(product, currency);
  // if (unitPrice < marketPrice * 0.1) {
  //   return { valid: false, warning: 'critical', message: '90% below market price' };
  // }

  return {
    valid: true,
    warning: null,
    message: 'Price looks reasonable'
  };
}

export default {
  getQuoteTemplates,
  getDefaultTemplate,
  createQuoteTemplate,
  updateQuoteTemplate,
  deleteQuoteTemplate,
  applyTemplate,
  canPostRFQ,
  incrementRFQCount,
  validateQuotePrice
};
