/**
 * RFQ Service - Kernel Architecture
 * Centralizes business logic for RFQ creation.
 */

import { supabase, withRetry } from '@/api/supabaseClient';
import { getOrCreateCompany } from '@/utils/companyHelper';
import { sanitizeString, validateNumeric } from '@/utils/security';
import { format } from 'date-fns';
import { createTrade } from '@/services/tradeKernel';

const RLS_CODES = ['42501', 'PGRST301'];

function isRLSError(err) {
  return (
    !err ? false :
      RLS_CODES.includes(err.code) ||
      err.status === 403 ||
      err.message?.includes('permission denied') ||
      err.message?.includes('row-level security')
  );
}

function cleanAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];
  return attachments.filter((url) => typeof url === 'string' && url.trim() !== '');
}

function buildDates(dateValue) {
  if (!dateValue) return null;
  try {
    return format(dateValue, 'yyyy-MM-dd');
  } catch {
    return null;
  }
}

/**
 * Create a new RFQ with status "rfq_open" (Kernel Architecture)
 */
export async function createRFQ({ user, formData }) {
  try {
    if (!user?.id) {
      return { success: false, error: 'User authentication required. Please log in.' };
    }

    if (!formData?.title || !formData?.description || !formData?.quantity) {
      return { success: false, error: 'Please fill in all required fields (title, description, quantity).' };
    }

    const quantity = validateNumeric(formData.quantity, { min: 1 });
    const targetPrice = formData.target_price ? validateNumeric(formData.target_price, { min: 0 }) : null;

    if (quantity === null || quantity < 1) {
      return { success: false, error: 'Please enter a valid quantity (must be at least 1).' };
    }
    if (formData.target_price && (targetPrice === null || targetPrice < 0)) {
      return { success: false, error: 'Please enter a valid target price (must be 0 or greater).' };
    }

    console.log('[rfqService] Resolving company ID for user:', user.id);
    const companyId = await getOrCreateCompany(supabase, user);
    if (!companyId) {
      console.error('[rfqService] Company resolution failed');
      return { success: false, error: 'Company profile incomplete. Please complete your company profile to create RFQs.' };
    }
    console.log('[rfqService] Company ID resolved:', companyId);

    const expires = buildDates(formData.closing_date || formData.expires_at);

    // KERNEL MAPPING
    const tradeData = {
      trade_type: 'rfq',
      buyer_id: companyId,
      created_by: user.id,
      title: sanitizeString(formData.title),
      description: sanitizeString(formData.description),
      category_id: formData.category_id || null, // Ensure uuid if presenting
      quantity,
      quantity_unit: sanitizeString(formData.unit || 'pieces'),
      target_price: targetPrice,
      currency: formData.currency || 'USD',
      status: 'rfq_open',
      expires_at: expires,
      metadata: {
        delivery_location: sanitizeString(formData.delivery_location || ''),
        target_country: sanitizeString(formData.target_country || ''),
        target_city: sanitizeString(formData.target_city || ''),
        attachments: cleanAttachments(formData.attachments),
        incoterms: sanitizeString(formData.incoterms || ''),
        shipping_method: sanitizeString(formData.shipping_method || ''),
        unit_type: sanitizeString(formData.unit || 'pieces'),
      }
    };

    const result = await createTrade(tradeData);
    if (!result.success) {
      if (result.error?.includes('permission denied')) {
        return {
          success: false,
          error: 'Permission denied. Please ensure you are logged in and allowed to create Trades.',
        };
      }
      return { success: false, error: result.error || 'Failed to create RFQ Trade. Please try again.' };
    }

    return { success: true, data: result.data, isMinimalProfile: false };
  } catch (error) {
    console.error('[rfqService] Unexpected error creating RFQ:', error);
    return { success: false, error: error.message || 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Create RFQ with status "draft" (mobile wizard compatibility)
 * Note: Wizard uses 'in_review' but Kernel uses 'draft' for pre-published state.
 */
export async function createRFQInReview({ user, formData, options = {} }) {
  try {
    if (!user?.id) {
      return { success: false, error: 'User authentication required. Please log in.' };
    }

    if (!formData?.title) {
      return { success: false, error: 'Title is required.' };
    }

    console.log('[rfqService] Resolving company ID for user (draft):', user.id);
    const companyId = await getOrCreateCompany(supabase, user);
    if (!companyId) {
      console.error('[rfqService] Company resolution failed (draft)');
      return { success: false, error: 'Company profile incomplete. Please complete your company profile to create RFQs.' };
    }
    console.log('[rfqService] Company ID resolved (draft):', companyId);

    const quantity = formData.quantity ? validateNumeric(formData.quantity, { min: 0 }) : null;
    const targetPrice = formData.target_price ? validateNumeric(formData.target_price, { min: 0 }) : null;
    const deadline = buildDates(formData.delivery_deadline || formData.expires_at);

    // KERNEL MAPPING
    const tradeData = {
      trade_type: 'rfq',
      buyer_id: companyId,
      created_by: user.id,
      title: sanitizeString(formData.title),
      description: sanitizeString(formData.description || formData.title), // Fallback description
      category_id: formData.category_id || null,
      quantity,
      quantity_unit: sanitizeString(formData.unit || 'pieces'),
      target_price: targetPrice,
      currency: formData.currency || 'USD',
      status: 'draft', // Kernel Draft State
      expires_at: deadline,
      metadata: {
        delivery_location: sanitizeString(formData.delivery_location || ''),
        delivery_deadline: deadline,
        attachments: cleanAttachments(formData.attachments),
        verified_only: options.verified_only ?? true,
        afrikoni_managed: options.afrikoni_managed ?? true,
      }
    };

    const result = await createTrade(tradeData);
    if (!result.success) {
      if (result.error?.includes('permission denied')) {
        return {
          success: false,
          error: 'Permission denied. Please ensure you are logged in and allowed to create Trades.',
        };
      }
      return { success: false, error: result.error || 'Failed to create Draft Trade. Please try again.' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('[rfqService] Unexpected error creating RFQ (draft):', error);
    return { success: false, error: error.message || 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Fetch RFQs (as TRADES) for a specific user/company
 * Supports filtering by status and role (buyer vs supplier)
 */
export async function getRFQs({ user, companyId, role = 'buyer', status = 'all' }) {
  try {
    if (!user || !companyId) return { data: [], count: 0 };

    // Query RFQS table (established schema)
    let query = supabase
      .from('rfqs')
      .select('*, quotes:quotes(count)', { count: 'exact' });

    if (role === 'buyer') {
      // Buyers see their own RFQs
      query = query.eq('buyer_id', companyId);
    } else {
      // Suppliers see RFQs they are matched to OR public ones
      // For now, allow seeing active RFQs
      if (status === 'all') {
        query = query.neq('status', 'draft'); // Don't show drafts to suppliers
      }
    }

    // Filter by Status
    if (status !== 'all') {
      // Map legacy statuses if necessary, or use kernel statuses
      const kernelStatus = status === 'open' ? 'rfq_open' : status;
      query = query.eq('status', kernelStatus);
    }

    // Order by newest
    query = query.order('created_at', { ascending: false });

    // ✅ ENTERPRISE RELIABILITY: Use withRetry for critical read
    const fetchWithRetry = async () => await query;
    const result = await withRetry(fetchWithRetry);
    const { data, error, count } = result;

    if (error) {
      console.error('[rfqService] Error fetching RFQs (Trades):', error);
      throw error;
    }

    // Map Trade Kernel schema to UI schema expected by legacy components
    // detailed_rfq = { ...trade, productName: trade.title, ... }
    const mappedData = data.map(trade => ({
      ...trade,
      productName: trade.title, // UI expects productName
      buyerCompany: 'Your Company', // TODO: Join with companies table if needed
      deliveryCountry: trade.metadata?.target_country || trade.metadata?.delivery_location || 'Unknown',
      unit: trade.quantity_unit,
      targetPrice: trade.target_price,
      quotesReceived: trade.quotes?.[0]?.count || 0,
      deadline: trade.expires_at,
      status: trade.status === 'rfq_open' ? 'sent' : trade.status // Map kernel 'rfq_open' to UI 'sent'
    }));

    return {
      data: mappedData,
      count
    };
  } catch (error) {
    console.error('[rfqService] Unexpected error in getRFQs:', error);
    return { data: [], count: 0, error };
  }
}
