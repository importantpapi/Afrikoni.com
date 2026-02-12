import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * AFRIKONI TRADE OS - REACT QUERY HOOK: useActivityLogs
 * Fetch activity logs for the current company
 */
async function fetchActivityLogs(profileCompanyId) {
  if (!profileCompanyId) {
    return [];
  }

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('company_id', profileCompanyId)
    .order('timestamp', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

export function useActivityLogs() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

  return useQuery({
    queryKey: ['activity_logs', profileCompanyId],
    queryFn: () => fetchActivityLogs(profileCompanyId),
    enabled: isSystemReady && canLoadData && !!profileCompanyId,
    initialData: [],
  });
}
