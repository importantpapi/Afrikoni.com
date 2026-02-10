import { supabase } from '@/api/supabaseClient';

// Fetch orders for the current user/company
export async function fetchOrders(profileCompanyId) {
  if (!profileCompanyId) return [];
  // Fetch orders where the company is either buyer or seller
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .or(`buyer_company_id.eq.${profileCompanyId},seller_company_id.eq.${profileCompanyId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
