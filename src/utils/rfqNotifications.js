/**
 * Centralized RFQ notification helper
 * Single source of truth for RFQ notifications
 */

import { supabase } from '@/api/supabaseClient';

const NOTIFICATION_MESSAGES = {
  rfq_submitted: {
    title: 'RFQ received – Afrikoni',
    message: 'Your trade request has been received. Our team is reviewing it to ensure the best supplier match. You\'ll hear from us within 24–48 hours.'
  },
  rfq_matched: {
    title: 'Suppliers matched for your RFQ',
    message: 'We\'ve matched verified African suppliers to your request. You can now review quotes and continue securely through Afrikoni.'
  },
  rfq_clarification: {
    title: 'Clarification needed on your RFQ',
    message: 'To match you with the right suppliers, we need a bit more detail. Please review the requested clarification in your dashboard.'
  },
  rfq_rejected: {
    title: 'Update on your RFQ submission',
    message: 'After review, this request doesn\'t currently meet our matching criteria. You\'re welcome to submit a revised RFQ at any time.'
  }
};

/**
 * Send RFQ notification to buyer
 * @param {Object} params
 * @param {string} params.type - Notification type (rfq_submitted, rfq_matched, rfq_clarification, rfq_rejected)
 * @param {string} params.rfqId - RFQ ID
 * @param {string} params.buyerUserId - Buyer user ID (primary source)
 * @param {string} params.companyId - Buyer company ID (optional, for fallback)
 */
export async function sendRFQNotification({ type, rfqId, buyerUserId, companyId = null }) {
  try {
    const notification = NOTIFICATION_MESSAGES[type];
    if (!notification) {
      console.error(`Unknown notification type: ${type}`);
      return;
    }

    // buyerUserId is required - if not provided, try to get from RFQ
    let userId = buyerUserId;
    if (!userId && rfqId) {
      const { data: rfq } = await supabase
        .from('rfqs')
        .select('buyer_user_id, buyer_company_id')
        .eq('id', rfqId)
        .single();
      
      userId = rfq?.buyer_user_id;
      if (!companyId && rfq?.buyer_company_id) {
        companyId = rfq.buyer_company_id;
      }
    }

    // Fallback: get user_id from company if still missing
    if (!userId && companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('user_id')
        .eq('id', companyId)
        .single();
      userId = company?.user_id;
    }

    if (!userId) {
      console.error(`Cannot send notification: no user_id found for RFQ ${rfqId}`);
      return;
    }

    await supabase.from('notifications').insert({
      user_id: userId,
      company_id: companyId,
      type: type,
      related_id: rfqId,
      title: notification.title,
      message: notification.message
    });
  } catch (error) {
    console.error('Failed to send RFQ notification:', error);
  }
}

