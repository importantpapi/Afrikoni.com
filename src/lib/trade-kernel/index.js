import { supabase } from '../../api/supabaseClient';

/**
 * AFRIKONI TRADE KERNEL
 * Real-time trade engine powered by Supabase.
 * Fetches products, RFQs, orders, and logistics data from the database.
 */

export async function fetchProducts({ companyId, status, limit = 50 } = {}) {
  let query = supabase
    .from('products')
    .select('*, companies(company_name, country, verified)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (companyId) query = query.eq('company_id', companyId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchRFQs({ companyId, status, limit = 50 } = {}) {
  let query = supabase
    .from('rfqs')
    .select('*, companies(company_name, country)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (companyId) query = query.eq('company_id', companyId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchTradeOrders({ companyId, status, limit = 50 } = {}) {
  let query = supabase
    .from('orders')
    .select(`
      *,
      products(name, category),
      buyer:buyer_company_id(company_name, country),
      seller:seller_company_id(company_name, country)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (companyId) {
    query = query.or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`);
  }
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchKernelState(orderId) {
  if (!orderId) return null;

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      products(name, category),
      escrow_transactions(amount, status, released_amount),
      shipments(carrier, tracking_number, estimated_arrival, current_location, events)
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return order;
}
