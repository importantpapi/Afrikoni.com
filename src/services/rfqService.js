/**
 * RFQ Service - Kernel Architecture
 * Centralizes business logic for RFQ creation.
 */

import { supabase } from '@/api/supabaseClient';
import { getOrCreateCompany } from '@/utils/companyHelper';
import { sanitizeString, validateNumeric } from '@/utils/security';
import { format } from 'date-fns';

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
 * Create a new RFQ with status "open"
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

    const companyId = await getOrCreateCompany(supabase, user);
    if (!companyId) {
      return { success: false, error: 'Company profile incomplete. Please complete your company profile to create RFQs.' };
    }

    const expires = buildDates(formData.closing_date || formData.expires_at);

    const rfqData = {
      title: sanitizeString(formData.title),
      description: sanitizeString(formData.description),
      category_id: formData.category_id || null,
      quantity,
      unit: sanitizeString(formData.unit || 'pieces'),
      target_price: targetPrice,
      delivery_location: sanitizeString(formData.delivery_location || ''),
      target_country: sanitizeString(formData.target_country || ''),
      target_city: sanitizeString(formData.target_city || ''),
      expires_at: expires,
      attachments: cleanAttachments(formData.attachments),
      status: 'open',
      buyer_company_id: companyId,
      buyer_user_id: user.id,
      unit_type: sanitizeString(formData.unit || 'pieces'),
    };

    const { data: newRFQ, error } = await supabase.from('rfqs').insert(rfqData).select().single();
    if (error) {
      if (isRLSError(error)) {
        return {
          success: false,
          error: 'Permission denied. Please ensure you are logged in and allowed to create RFQs.',
        };
      }
      return { success: false, error: error.message || 'Failed to create RFQ. Please try again.' };
    }

    return { success: true, data: newRFQ, isMinimalProfile: false };
  } catch (error) {
    console.error('[rfqService] Unexpected error creating RFQ:', error);
    return { success: false, error: error.message || 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Create RFQ with status "in_review" (mobile wizard compatibility)
 */
export async function createRFQInReview({ user, formData, options = {} }) {
  try {
    if (!user?.id) {
      return { success: false, error: 'User authentication required. Please log in.' };
    }

    if (!formData?.title) {
      return { success: false, error: 'Title is required.' };
    }

    const companyId = await getOrCreateCompany(supabase, user);
    if (!companyId) {
      return { success: false, error: 'Company profile incomplete. Please complete your company profile to create RFQs.' };
    }

    const quantity = formData.quantity ? validateNumeric(formData.quantity, { min: 0 }) : null;
    const targetPrice = formData.target_price ? validateNumeric(formData.target_price, { min: 0 }) : null;
    const deadline = buildDates(formData.delivery_deadline || formData.expires_at);

    const rfqData = {
      title: sanitizeString(formData.title),
      description: sanitizeString(formData.description || formData.title),
      category_id: formData.category_id || null,
      quantity,
      unit: sanitizeString(formData.unit || 'pieces'),
      target_price: targetPrice,
      delivery_location: sanitizeString(formData.delivery_location || ''),
      delivery_deadline: deadline,
      expires_at: deadline,
      attachments: cleanAttachments(formData.attachments),
      status: 'in_review',
      buyer_company_id: companyId,
      buyer_user_id: user.id,
      verified_only: options.verified_only ?? true,
      afrikoni_managed: options.afrikoni_managed ?? true,
    };

    const { data: newRFQ, error } = await supabase.from('rfqs').insert(rfqData).select().single();
    if (error) {
      if (isRLSError(error)) {
        return {
          success: false,
          error: 'Permission denied. Please ensure you are logged in and allowed to create RFQs.',
        };
      }
      return { success: false, error: error.message || 'Failed to create RFQ. Please try again.' };
    }

    return { success: true, data: newRFQ };
  } catch (error) {
    console.error('[rfqService] Unexpected error creating RFQ (in_review):', error);
    return { success: false, error: error.message || 'An unexpected error occurred. Please try again.' };
  }
}
