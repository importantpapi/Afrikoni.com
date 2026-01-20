/**
 * Invoices Queries
 * Handles invoice creation, payment, and management
 * ✅ KERNEL COMPLIANCE: Uses capabilities instead of role parameter
 */

import { supabase } from '@/api/supabaseClient';

/**
 * Get invoices for a company
 * @param {string} companyId - Company ID
 * @param {Object} capabilities - Capabilities object (from useCapability hook)
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Invoices list
 */
export async function getInvoices(companyId, capabilities = null, filters = {}) {
  // ✅ KERNEL COMPLIANCE: Determine column from capabilities instead of role
  // If company can sell, they're viewing seller invoices; otherwise buyer invoices
  const column = capabilities?.can_sell === true && capabilities?.sell_status === 'approved'
    ? 'seller_company_id'
    : 'buyer_company_id';
  let query = supabase
    .from('invoices')
    .select(`
      *,
      orders(*),
      buyer_company:companies!invoices_buyer_company_id_fkey(*),
      seller_company:companies!invoices_seller_company_id_fkey(*)
    `)
    .eq(column, companyId)
    .order('created_at', { ascending: false });
  
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.limit) query = query.limit(filters.limit);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getInvoice(invoiceId) {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      orders(*),
      buyer_company:companies!invoices_buyer_company_id_fkey(*),
      seller_company:companies!invoices_seller_company_id_fkey(*)
    `)
    .eq('id', invoiceId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createInvoiceFromOrder(orderId, invoiceData) {
  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      buyer_company:companies!orders_buyer_company_id_fkey(*),
      seller_company:companies!orders_seller_company_id_fkey(*)
    `)
    .eq('id', orderId)
    .single();
  
  if (orderError) throw orderError;
  
  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const invoice = {
    order_id: orderId,
    buyer_company_id: order.buyer_company_id,
    seller_company_id: order.seller_company_id,
    invoice_number: invoiceNumber,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: invoiceData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: order.currency || 'USD',
    subtotal: order.total_amount || 0,
    tax_amount: invoiceData.tax_amount || 0,
    total_amount: (order.total_amount || 0) + (invoiceData.tax_amount || 0),
    status: 'issued',
    billing_details: invoiceData.billing_details || {}
  };
  
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateInvoiceStatus(invoiceId, status) {
  const { data, error } = await supabase
    .from('invoices')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', invoiceId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function markInvoiceAsPaid(invoiceId, paymentData) {
  // Update invoice status
  await updateInvoiceStatus(invoiceId, 'paid');
  
  // Create wallet transaction if payment data provided
  if (paymentData) {
    const { createWalletTransaction } = await import('./payments');
    await createWalletTransaction({
      company_id: paymentData.company_id,
      type: 'payment',
      amount: -paymentData.amount,
      currency: paymentData.currency,
      status: 'completed',
      description: `Payment for invoice ${paymentData.invoice_number}`,
      invoice_id: invoiceId,
      metadata: paymentData.metadata
    });
  }
  
  return true;
}

