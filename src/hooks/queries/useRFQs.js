import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * AFRIKONI TRADE OS - REACT QUERY HOOK: useRFQs
 * Fetch RFQs where company is the buyer
 */
async function fetchRFQs(profileCompanyId) {
  if (!profileCompanyId) {
    return [];
  }

  const { data, error } = await supabase
    .from('rfqs')
    .select('*')
    .eq('buyer_company_id', profileCompanyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useRFQs() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

  return useQuery({
    queryKey: ['rfqs', profileCompanyId],
    queryFn: () => fetchRFQs(profileCompanyId),
    enabled: isSystemReady && canLoadData && !!profileCompanyId,
    initialData: [],
  });
}
