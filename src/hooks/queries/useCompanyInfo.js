import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * AFRIKONI TRADE OS - REACT QUERY HOOK: useCompanyInfo
 * Fetch company profile information
 */
async function fetchCompanyInfo(profileCompanyId) {
  if (!profileCompanyId) {
    return null;
  }

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profileCompanyId)
    .single();

  if (error) throw error;
  return data;
}

export function useCompanyInfo() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

  return useQuery({
    queryKey: ['company', profileCompanyId],
    queryFn: () => fetchCompanyInfo(profileCompanyId),
    enabled: isSystemReady && canLoadData && !!profileCompanyId,
    initialData: null,
  });
}
