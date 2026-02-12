import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * AFRIKONI TRADE OS - REACT QUERY HOOK: useDisputes
 * Fetch disputes for the current company
 */
async function fetchDisputes(profileCompanyId) {
  if (!profileCompanyId) {
    return [];
  }

  const { data, error } = await supabase
    .from('disputes')
    .select('*')
    .or(`buyer_company_id.eq.${profileCompanyId},seller_company_id.eq.${profileCompanyId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useDisputes() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

  return useQuery({
    queryKey: ['disputes', profileCompanyId],
    queryFn: () => fetchDisputes(profileCompanyId),
    enabled: isSystemReady && canLoadData && !!profileCompanyId,
    initialData: [],
  });
}
