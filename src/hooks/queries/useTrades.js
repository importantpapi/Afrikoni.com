import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * AFRIKONI TRADE OS - REACT QUERY HOOK: useTrades
 * Enterprise-grade trade data fetching (Stripe/Alibaba pattern)
 * 
 * Features:
 * - Automatic cache invalidation via DashboardRealtimeManager
 * - Zero manual refresh wiring (no addEventListener)
 * - Built-in race condition handling
 * - Stale-while-revalidate pattern
 * 
 * Replaces: useTradeKernelState (manual fetch + event listeners)
 */

/**
 * Fetch trades with enriched product names
 * @param {string} profileCompanyId - Company ID to filter trades
 * @returns {Promise<{activeTrades: Array, pipelineValue: number}>}
 */
async function fetchTrades(profileCompanyId) {
  if (!profileCompanyId) {
    return { activeTrades: [], pipelineValue: 0 };
  }

  // Step 1: Fetch trades
  const { data: tradesData, error: tradesError } = await supabase
    .from('trades')
    .select('id, status, origin_country, destination_country, target_price, price_min, price_max, buyer_id, seller_id, product_id, product_name, milestones')
    .or(`buyer_id.eq.${profileCompanyId},seller_id.eq.${profileCompanyId}`)
    .order('created_at', { ascending: false });

  if (tradesError) throw tradesError;
  if (!tradesData || tradesData.length === 0) {
    return { activeTrades: [], pipelineValue: 0 };
  }

  // Step 2: Fetch products for enrichment
  let productsMap = {};
  const productIds = Array.from(new Set(tradesData.filter(t => t.product_id).map(t => t.product_id)));
  
  if (productIds.length > 0) {
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds);
    
    if (!productsError && Array.isArray(productsData)) {
      productsMap = Object.fromEntries(productsData.map(p => [p.id, p.name]));
    }
  }

  // Step 3: Transform and enrich trades
  const activeTradesList = tradesData
    .filter(trade => !['closed', 'settled'].includes(trade.status))
    .map(trade => ({
      id: trade.id,
      productName: (trade.product_id && productsMap[trade.product_id])
        ? productsMap[trade.product_id]
        : trade.product_name || 'Unknown Product',
      status: trade.status,
      corridor: {
        originCountry: trade.origin_country || 'Unknown',
        destinationCountry: trade.destination_country || 'Unknown',
      },
      milestones: trade.milestones || [
        { status: 'completed' },
        { status: trade.status === 'draft' ? 'pending' : 'completed' },
        { status: 'pending' },
        { status: 'pending' },
      ]
    }));

  // Step 4: Calculate pipeline value
  const pipelineValue = activeTradesList.reduce((sum, trade) => {
    const raw = tradesData.find(t => t.id === trade.id);
    const value = raw?.target_price ?? raw?.price_max ?? raw?.price_min ?? 0;
    return sum + Number(value || 0);
  }, 0);

  return {
    activeTrades: activeTradesList,
    pipelineValue
  };
}

/**
 * React Query hook for trades data
 * @returns {{activeTrades: Array, pipelineValue: number, isLoading: boolean, error: Error}}
 */
export function useTrades() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

  return useQuery({
    queryKey: ['trades', profileCompanyId],
    queryFn: () => fetchTrades(profileCompanyId),
    enabled: isSystemReady && canLoadData && !!profileCompanyId,
    initialData: { activeTrades: [], pipelineValue: 0 },
  });
}
