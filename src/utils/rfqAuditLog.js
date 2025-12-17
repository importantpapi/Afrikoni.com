/**
 * Admin RFQ action audit logging
 * Tracks all admin actions on RFQs for accountability
 */

import { supabase } from '@/api/supabaseClient';

/**
 * Log admin action on RFQ
 * @param {Object} params
 * @param {string} params.rfqId - RFQ ID
 * @param {string} params.action - Action taken (approve, reject, request_clarification)
 * @param {string} params.adminUserId - Admin user ID
 * @param {string} params.statusBefore - Status before action
 * @param {string} params.statusAfter - Status after action
 * @param {Object} params.metadata - Additional metadata (supplier_ids, notes, etc.)
 */
export async function logRFQAdminAction({
  rfqId,
  action,
  adminUserId,
  statusBefore,
  statusAfter,
  metadata = {}
}) {
  try {
    // Store in audit log (create table if doesn't exist, or use existing logs table)
    await supabase.from('rfq_audit_logs').insert({
      rfq_id: rfqId,
      action: action,
      admin_user_id: adminUserId,
      status_before: statusBefore,
      status_after: statusAfter,
      metadata: metadata,
      created_at: new Date().toISOString()
    }).catch(async (error) => {
      // If table doesn't exist, try alternative: store in RFQ metadata or notifications
      console.warn('RFQ audit log table may not exist, storing in RFQ metadata:', error);
      
      // Fallback: update RFQ with audit trail in metadata
      const { data: rfq } = await supabase
        .from('rfqs')
        .select('metadata')
        .eq('id', rfqId)
        .single();
      
      const auditTrail = rfq?.metadata?.audit_trail || [];
      auditTrail.push({
        action,
        admin_user_id: adminUserId,
        status_before: statusBefore,
        status_after: statusAfter,
        timestamp: new Date().toISOString(),
        metadata
      });

      await supabase
        .from('rfqs')
        .update({
          metadata: {
            ...rfq?.metadata,
            audit_trail: auditTrail
          }
        })
        .eq('id', rfqId);
    });
  } catch (error) {
    console.error('Failed to log RFQ admin action:', error);
  }
}

