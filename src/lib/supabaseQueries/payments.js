/**
 * Payments & Wallet Queries
 * Handles wallet_accounts, wallet_transactions, escrow_payments, escrow_events
 */

import { supabase } from '@/api/supabaseClient';

// ============ WALLET ACCOUNTS ============

export async function getWalletAccount(companyId) {
  const { data, error } = await supabase
    .from('wallet_accounts')
    .select('*')
    .eq('company_id', companyId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createWalletAccount(companyId, currency = 'USD') {
  const { data, error } = await supabase
    .from('wallet_accounts')
    .insert({
      company_id: companyId,
      currency,
      available_balance: 0,
      pending_balance: 0
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateWalletBalance(companyId, amount, type = 'available') {
  const { data, error } = await supabase.rpc('update_wallet_balance', {
    p_company_id: companyId,
    p_amount: amount,
    p_type: type
  });
  
  if (error) throw error;
  return data;
}

// ============ WALLET TRANSACTIONS ============

export async function getWalletTransactions(companyId, filters = {}) {
  let query = supabase
    .from('wallet_transactions')
    .select(`
      *,
      fees(*),
      invoices(*)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.limit) query = query.limit(filters.limit);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createWalletTransaction(transaction) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert(transaction)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============ ESCROW PAYMENTS ============

export async function getEscrowPayment(orderId) {
  const { data, error } = await supabase
    .from('escrow_payments')
    .select(`
      *,
      orders(*),
      buyer_company:companies!escrow_payments_buyer_company_id_fkey(*),
      seller_company:companies!escrow_payments_seller_company_id_fkey(*)
    `)
    .eq('order_id', orderId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * ✅ KERNEL COMPLIANCE: Uses capabilities instead of role parameter
 * @param {string} companyId - Company ID
 * @param {Object} capabilities - Capabilities object (from useCapability hook)
 * @returns {Promise<Array>} Escrow payments list
 */
export async function getEscrowPaymentsByCompany(companyId, capabilities = null) {
  // ✅ KERNEL COMPLIANCE: Determine column from capabilities instead of role
  // If company can sell, they're viewing seller escrow; otherwise buyer escrow
  const column = capabilities?.can_sell === true && capabilities?.sell_status === 'approved'
    ? 'seller_company_id'
    : 'buyer_company_id';
  const { data, error } = await supabase
    .from('escrow_payments')
    .select(`
      *,
      orders(*),
      buyer_company:companies!escrow_payments_buyer_company_id_fkey(*),
      seller_company:companies!escrow_payments_seller_company_id_fkey(*)
    `)
    .eq(column, companyId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createEscrowPayment(escrowData) {
  const { data, error } = await supabase
    .from('escrow_payments')
    .insert(escrowData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateEscrowStatus(escrowId, status, amount = null) {
  const updateData = { status, updated_at: new Date().toISOString() };
  if (amount !== null) updateData.amount = amount;
  
  // If releasing escrow, calculate commission (4% default)
  if (status === 'released') {
    // Get current escrow data
    const { data: currentEscrow } = await supabase
      .from('escrow_payments')
      .select('amount, commission_rate, currency')
      .eq('id', escrowId)
      .single();
    
    if (currentEscrow) {
      const commissionRate = currentEscrow.commission_rate || 4.00;
      const commissionAmount = (currentEscrow.amount * commissionRate) / 100;
      const netPayout = currentEscrow.amount - commissionAmount;
      
      updateData.commission_amount = commissionAmount;
      updateData.net_payout_amount = netPayout;
      updateData.released_at = new Date().toISOString();
    }
  }
  
  const { data, error } = await supabase
    .from('escrow_payments')
    .update(updateData)
    .eq('id', escrowId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============ ESCROW EVENTS ============

export async function getEscrowEvents(escrowId) {
  const { data, error } = await supabase
    .from('escrow_events')
    .select(`
      *,
      created_by:profiles(*)
    `)
    .eq('escrow_id', escrowId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createEscrowEvent(eventData) {
  const { data, error } = await supabase
    .from('escrow_events')
    .insert(eventData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============ FEES ============

export async function getActiveFees() {
  const { data, error } = await supabase
    .from('fees')
    .select('*')
    .eq('active', true)
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function calculateFees(orderAmount, feeType = 'platform_commission') {
  const fees = await getActiveFees();
  const fee = fees.find(f => f.fee_type === feeType);
  
  if (!fee) return 0;
  
  if (fee.calculation_method === 'percentage') {
    return (orderAmount * fee.value) / 100;
  }
  return fee.value;
}
