import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * AFRIKONI TRADE OS - REACT QUERY HOOK: useWalletTransactions
 * Fetch wallet transactions for the current company
 */
async function fetchWalletTransactions(profileCompanyId) {
  if (!profileCompanyId) {
    return [];
  }

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('company_id', profileCompanyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useWalletTransactions() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

  return useQuery({
    queryKey: ['wallet_transactions', profileCompanyId],
    queryFn: () => fetchWalletTransactions(profileCompanyId),
    enabled: isSystemReady && canLoadData && !!profileCompanyId,
    initialData: [],
  });
}
