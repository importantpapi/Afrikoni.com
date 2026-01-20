/**
 * Returns & After-Sales Queries
 * ✅ KERNEL COMPLIANCE: Uses capabilities instead of role parameter
 */

import { supabase } from '@/api/supabaseClient';

/**
 * Get returns for a company
 * @param {string} companyId - Company ID
 * @param {Object} capabilities - Capabilities object (from useCapability hook)
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Returns list
 */
export async function getReturns(companyId, capabilities = null, filters = {}) {
  // ✅ KERNEL COMPLIANCE: Determine column from capabilities instead of role
  // If company can sell, they're viewing seller returns; otherwise buyer returns
  const column = capabilities?.can_sell === true && capabilities?.sell_status === 'approved'
    ? 'seller_company_id'
    : 'buyer_company_id';
  let query = supabase
    .from('returns')
    .select(`
      *,
      orders(*),
      products(*),
      buyer_company:companies!returns_buyer_company_id_fkey(*),
      seller_company:companies!returns_seller_company_id_fkey(*)
    `)
    .eq(column, companyId)
    .order('requested_at', { ascending: false });
  
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.limit) query = query.limit(filters.limit);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getReturn(returnId) {
  const { data, error } = await supabase
    .from('returns')
    .select(`
      *,
      orders(*),
      products(*),
      buyer_company:companies!returns_buyer_company_id_fkey(*),
      seller_company:companies!returns_seller_company_id_fkey(*)
    `)
    .eq('id', returnId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createReturn(returnData) {
  const { data, error } = await supabase
    .from('returns')
    .insert({
      ...returnData,
      status: 'requested',
      requested_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateReturnStatus(returnId, status, updates = {}) {
  const updateData = {
    status,
    ...updates
  };
  
  if (status === 'refunded' || status === 'closed') {
    updateData.resolved_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from('returns')
    .update(updateData)
    .eq('id', returnId)
    .select()
    .single();
  
  if (error) throw error;
  
  // If refunded, trigger escrow refund
  if (status === 'refunded' && data.refund_amount) {
    const { getEscrowPayment } = await import('./payments');
    const escrow = await getEscrowPayment(data.order_id);
    
    if (escrow) {
      const { updateEscrowStatus, createEscrowEvent } = await import('./payments');
      await updateEscrowStatus(escrow.id, 'refunded', data.refund_amount);
      await createEscrowEvent({
        escrow_id: escrow.id,
        event_type: 'refund',
        amount: data.refund_amount,
        metadata: { return_id: returnId }
      });
    }
  }
  
  return data;
}

