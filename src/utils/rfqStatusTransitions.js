/**
 * RFQ Status Transition Utilities
 * Ensures strict status discipline and audit trail
 */

import { supabase } from '@/api/supabaseClient';
import { canTransitionRFQStatus, RFQ_STATUS, RFQ_STATUS_TRANSITIONS } from '@/constants/status';

/**
 * Log RFQ status transition for audit trail
 * @param {string} rfqId - RFQ ID
 * @param {string} fromStatus - Previous status
 * @param {string} toStatus - New status
 * @param {string} userId - User who made the change
 * @param {string} reason - Reason for transition (optional)
 * @param {object} metadata - Additional metadata (optional)
 */
export async function logRFQStatusTransition(rfqId, fromStatus, toStatus, userId, reason = null, metadata = {}) {
  try {
    // Store in audit log (you can create an rfq_audit_log table later)
    // For now, we'll log to console and could store in a JSON field
    const auditEntry = {
      rfq_id: rfqId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: userId,
      changed_at: new Date().toISOString(),
      reason: reason,
      metadata: metadata
    };

    // Log to console for now (can be moved to database table later)
    console.log('[RFQ Status Transition]', auditEntry);

    // TODO: Create rfq_audit_log table and store here
    // await supabase.from('rfq_audit_log').insert(auditEntry);

    return { success: true, auditEntry };
  } catch (error) {
    console.error('Error logging RFQ status transition:', error);
    return { success: false, error };
  }
}

/**
 * Safely transition RFQ status with validation and logging
 * @param {string} rfqId - RFQ ID
 * @param {string} newStatus - Desired new status
 * @param {string} userId - User making the change
 * @param {string} reason - Reason for transition (optional)
 * @param {object} metadata - Additional metadata (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function transitionRFQStatus(rfqId, newStatus, userId, reason = null, metadata = {}) {
  try {
    // Get current RFQ status
    const { data: rfq, error: fetchError } = await supabase
      .from('rfqs')
      .select('status')
      .eq('id', rfqId)
      .single();

    if (fetchError) {
      return { success: false, error: 'RFQ not found' };
    }

    const currentStatus = rfq.status;

    // Validate transition
    if (!canTransitionRFQStatus(currentStatus, newStatus)) {
      return {
        success: false,
        error: `Invalid status transition: Cannot change from "${currentStatus}" to "${newStatus}". Valid next statuses: ${getValidRFQNextStatuses(currentStatus).join(', ')}`
      };
    }

    // Log transition before updating
    await logRFQStatusTransition(rfqId, currentStatus, newStatus, userId, reason, metadata);

    // Update status
    const { error: updateError } = await supabase
      .from('rfqs')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', rfqId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error transitioning RFQ status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get valid next statuses for an RFQ
 * @param {string} currentStatus - Current RFQ status
 * @returns {string[]} - Array of valid next statuses
 */
export function getValidRFQNextStatuses(currentStatus) {
  return RFQ_STATUS_TRANSITIONS[currentStatus] || [];
}

