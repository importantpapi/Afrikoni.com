import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * AFRIKONI TRADE OS - REACT QUERY HOOK: useKYCVerifications
 * Fetch KYC verifications for the current company
 */
async function fetchKYCVerifications(profileCompanyId) {
  if (!profileCompanyId) {
    return [];
  }

  const { data, error } = await supabase
    .from('kyc_verifications')
    .select('*')
    .eq('company_id', profileCompanyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useKYCVerifications() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

  return useQuery({
    queryKey: ['kyc_verifications', profileCompanyId],
    queryFn: () => fetchKYCVerifications(profileCompanyId),
    enabled: isSystemReady && canLoadData && !!profileCompanyId,
    initialData: [],
  });
}
