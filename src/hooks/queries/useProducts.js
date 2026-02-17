import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * AFRIKONI TRADE OS - REACT QUERY HOOK: useProducts
 * Fetch products for the current company
 */
async function fetchProducts(profileCompanyId) {
  if (!profileCompanyId) {
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name)
    `)
    .eq('company_id', profileCompanyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useProducts() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

  return useQuery({
    queryKey: ['products', profileCompanyId],
    queryFn: () => fetchProducts(profileCompanyId),
    enabled: isSystemReady && canLoadData && !!profileCompanyId,
    initialData: [],
  });
}
