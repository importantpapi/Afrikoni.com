import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * AFRIKONI TRADE OS - REACT QUERY CLIENT
 * Enterprise-grade data fetching configuration (Stripe/Alibaba pattern)
 * 
 * TIERED PERSISTENCE STRATEGY:
 * - L1-L3 (Metadata, Layouts, Capabilities): Persisted to IndexedDB/LocalStorage
 * - L4 (Atomic/Financials): Memory-only (EXCLUDED via shouldPersistQuery)
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 24 * 60 * 60 * 1000, // 24 hours for persistence resilience
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
  },
});

// ✅ SOVEREIGN SYNC: Persistence Layer
if (typeof window !== 'undefined') {
  const persister = createSyncStoragePersister({
    storage: window.localStorage, // Defaulting to LocalStorage for L1-L3 reliability
    key: 'AFRIKONI_SOVEREIGN_CACHE',
  });

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 24 * 60 * 60 * 1000, // 24 Hours
    /**
     * TIERED FILTER: Only persist non-sensitive operational state
     */
    shouldPersistQuery: (query) => {
      const lockKeys = ['profile', 'capabilities', 'counts', 'roles', 'settings', 'metadata', 'rfqs', 'orders'];
      const queryKey = query.queryKey[0];

      // EXCLUSION LIST (L4 - Atomic/Financial Sensitive)
      const sensitiveKeys = ['invoice-detail', 'payouts', 'trade-atomic', 'pii-data', 'sensitive'];
      if (sensitiveKeys.includes(queryKey)) return false;

      // INCLUSION LIST (L1-L3 - UI/Structural)
      return lockKeys.includes(queryKey);
    },
  });
}
