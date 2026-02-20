import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * Fetch a single trade with all related entities
 * Replaces manual useEffect fetching in OneFlow and Trade detail views.
 */
async function fetchTrade(tradeId) {
    if (!tradeId) return null;

    const { data, error } = await supabase
        .from('trades')
        .select(`
      *,
      buyer:companies!trades_buyer_company_id_fkey(*),
      seller:companies!trades_seller_company_id_fkey(*),
      product:products(*),
      shipments(*),
      escrows(*),
      payments(*)
    `)
        .eq('id', tradeId)
        .single();

    if (error) throw error;
    return data;
}

/**
 * React Query hook for a single trade
 */
export function useTrade(tradeId) {
    const { isSystemReady } = useDashboardKernel();

    return useQuery({
        queryKey: ['trade', tradeId],
        queryFn: () => fetchTrade(tradeId),
        enabled: isSystemReady && !!tradeId,
        refetchOnWindowFocus: true,
    });
}
