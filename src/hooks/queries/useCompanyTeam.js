import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * AFRIKONI TRADE OS - REACT QUERY HOOK: useCompanyTeam
 * Fetch team members for the current company
 */
async function fetchCompanyTeam(profileCompanyId) {
  if (!profileCompanyId) {
    return [];
  }

  const { data, error } = await supabase
    .from('company_team')
    .select('*, profiles:user_id(id, email, full_name)')
    .eq('company_id', profileCompanyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useCompanyTeam() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

  return useQuery({
    queryKey: ['company_team', profileCompanyId],
    queryFn: () => fetchCompanyTeam(profileCompanyId),
    enabled: isSystemReady && canLoadData && !!profileCompanyId,
    initialData: [],
  });
}
