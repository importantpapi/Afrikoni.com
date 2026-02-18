import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * AFRIKONI TRADE OS - REACT QUERY HOOK: useRFQs
 * Fetch RFQs where company is the buyer
 */
async function fetchRFQs(profileCompanyId) {
  if (!profileCompanyId) return [];

  // AFRIKONI TRADE OS: Unify legacy RFQs and modern Trades-as-RFQs
  // This solves the MISSING RFQS issue during kernel transition.

  try {
    // 1. Fetch from legacy RFQ table
    const { data: legacyData, error: legacyError } = await supabase
      .from('rfqs')
      .select('*')
      .eq('buyer_company_id', profileCompanyId)
      .order('created_at', { ascending: false });

    // 2. Fetch from modern Trade table (types = rfq)
    const { data: tradeData, error: tradeError } = await supabase
      .from('trades')
      .select('*')
      .eq('buyer_id', profileCompanyId)
      .eq('trade_type', 'rfq')
      .order('created_at', { ascending: false });

    if (legacyError) console.error('[useRFQs] Legacy fetch error:', legacyError);
    if (tradeError) console.error('[useRFQs] Trade fetch error:', tradeError);

    // 3. Merge and Deduplicate by ID
    const allRFQs = new Map();

    // Add legacy ones first
    (legacyData || []).forEach(item => {
      allRFQs.set(item.id, {
        ...item,
        source: 'legacy'
      });
    });

    // Add/Update with trade-based ones (which are the source of truth for new RFQs)
    (tradeData || []).forEach(item => {
      const existing = allRFQs.get(item.id);
      allRFQs.set(item.id, {
        ...existing, // Keep legacy fields if they exist
        ...item,     // Override with trade data
        // Normalize field names mismatch between tables
        buyer_company_id: item.buyer_id || existing?.buyer_company_id,
        unit: item.quantity_unit || existing?.unit,
        status: item.status === 'rfq_open' ? 'open' : (item.status === 'draft' ? 'draft' : 'open'), // Map kernel to UI
        source: 'kernel'
      });
    });

    return Array.from(allRFQs.values()).sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );
  } catch (error) {
    console.error('[useRFQs] Critical fetch failure:', error);
    return [];
  }
}

export function useRFQs() {
  const { profileCompanyId, canLoadData, isSystemReady } = useDashboardKernel();

  return useQuery({
    queryKey: ['rfqs', profileCompanyId],
    queryFn: () => fetchRFQs(profileCompanyId),
    enabled: isSystemReady && canLoadData && !!profileCompanyId,
    // SECURE SYNC: Removed initialData to allow persistence layer to hydrate
  });
}
