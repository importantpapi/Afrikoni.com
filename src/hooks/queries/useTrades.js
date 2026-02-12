import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * AFRIKONI TRADE OS - REACT QUERY HOOK: useTrades
 * Enterprise-grade trade data fetching (Stripe/Alibaba pattern)
 */

async function fetchTrades(profileCompanyId) {
  if (!profileCompanyId) {
    return { trades: [], activeTrades: [], pipelineValue: 0 };
  }

  // Step 1: Fetch trades with full payload
  const { data: tradesData, error: tradesError } = await supabase
    .from('trades')
    .select(`
      *,
      buyer:companies!buyer_id(*),
      seller:companies!seller_id(*)
    `)
    .or(`buyer_id.eq.${profileCompanyId},seller_id.eq.${profileCompanyId}`)
    .order('created_at', { ascending: false });

  if (tradesError) throw tradesError;
  if (!tradesData || tradesData.length === 0) {
    return { trades: [], activeTrades: [], pipelineValue: 0 };
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
  const enrichedTrades = tradesData.map(trade => ({
    ...trade,
    productName: (trade.product_id && productsMap[trade.product_id])
      ? productsMap[trade.product_id]
      : trade.product_name || 'Unknown Product',
    corridor: {
      originCountry: trade.origin_country || 'Unknown',
      destinationCountry: trade.destination_country || 'Unknown',
      risk: trade.metadata?.risk || 'low'
    }
  }));

  // Step 4: Calculate pipeline value (Active only)
  const activeTrades = enrichedTrades.filter(t => !['closed', 'settled'].includes(t.status));
  const pipelineValue = activeTrades.reduce((sum, trade) => {
    const value = trade.target_price ?? trade.price_max ?? trade.price_min ?? trade.total_amount ?? 0;
    return sum + Number(value || 0);
  }, 0);

  return {
    trades: enrichedTrades,
    activeTrades,
    pipelineValue
  };
}

export function useTrades() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

  return useQuery({
    queryKey: ['trades', profileCompanyId],
    queryFn: () => fetchTrades(profileCompanyId),
    enabled: isSystemReady && canLoadData && !!profileCompanyId,
    initialData: { trades: [], activeTrades: [], pipelineValue: 0 },
  });
}
