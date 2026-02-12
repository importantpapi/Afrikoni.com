import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * AFRIKONI TRADE OS - REACT QUERY HOOK: usePayments
 * Fetch payments/invoices for the current company
 */
async function fetchPayments(profileCompanyId) {
  if (!profileCompanyId) {
    return [];
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .or(`buyer_company_id.eq.${profileCompanyId},seller_company_id.eq.${profileCompanyId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function usePayments() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

  return useQuery({
    queryKey: ['invoices', profileCompanyId],
    queryFn: () => fetchPayments(profileCompanyId),
    enabled: isSystemReady && canLoadData && !!profileCompanyId,
    initialData: [],
  });
}
