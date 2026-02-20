/**
 * RFQ Service - Kernel Architecture
 * Centralizes business logic for RFQ creation.
 */

import { supabase, withRetry } from '@/api/supabaseClient';
import { getOrCreateCompany } from '@/utils/companyHelper';
import { sanitizeString, validateNumeric } from '@/utils/security';
import { format, parseISO } from 'date-fns';
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
    // Handle both Date objects and ISO strings
    const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
    return format(date, 'yyyy-MM-dd');
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

    // 🔒 ANTI-SPAM CHECK (2026 Protection)
    try {
      const { data: canPostData } = await supabase.rpc('can_post_rfq', {
        p_company_id: companyId
      });

      if (canPostData && !canPostData.can_post) {
        return {
          success: false,
          error: canPostData.message || 'You have reached your RFQ posting limit.',
          reason: canPostData.reason,
          limit_data: canPostData
        };
      }
    } catch (limitError) {
      console.warn('[rfqService] Could not check posting limits:', limitError);
      // Continue - don't block if check fails
    }

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
        contact_email: user.email, // Ops Fallback
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

    // ✅ INCREMENT RFQ COUNT (track usage)
    try {
      await supabase.rpc('increment_rfq_count', { p_company_id: companyId });
    } catch (countError) {
      console.warn('[rfqService] Could not increment RFQ count:', countError);
      // Non-blocking
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
 * ✅ FIX: Reads directly from TRADES kernel table to prevent bridge sync data loss
 */
export async function getRFQs({ user, companyId, role = 'buyer', status = 'all' }) {
  try {
    if (!user || !companyId) return { data: [], count: 0 };

    // ✅ FORENSIC FIX: Query TRADES table directly (Source of Truth)
    let query = supabase
      .from('trades')
      .select('*, quotes:quotes(count), buyer:companies!buyer_company_id(company_name)', { count: 'exact' })
      .eq('trade_type', 'rfq');

    if (role === 'buyer') {
      // Buyers see their own RFQs
      query = query.eq('buyer_company_id', companyId);
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
      buyerCompany: trade.buyer?.company_name || null,
      deliveryCountry: trade.metadata?.target_country || trade.metadata?.delivery_location || 'Unknown',
      unit: trade.quantity_unit,
      targetPrice: trade.target_price,
      // Handle quote count if relationship exists, else default to 0
      quotesReceived: trade.quotes?.[0]?.count || trade.quotes?.count || 0,
      deadline: trade.expires_at,
      // Map kernel 'rfq_open' to UI 'open'/'sent' for backward compatibility
      status: trade.status === 'rfq_open' ? 'open' : trade.status
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
