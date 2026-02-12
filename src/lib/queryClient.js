import { QueryClient } from '@tanstack/react-query';

/**
 * AFRIKONI TRADE OS - REACT QUERY CLIENT
 * Enterprise-grade data fetching configuration (Stripe/Alibaba pattern)
 * 
 * Configuration Philosophy:
 * - staleTime: 30s - Data is fresh for 30 seconds (reduce unnecessary refetches)
 * - gcTime: 5min - Cache persists for 5 minutes after last use
 * - retry: 1 - Single retry on failure (fast-fail for better UX)
 * - refetchOnWindowFocus: true - Auto-refresh when user returns to tab
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data freshness window
      staleTime: 30 * 1000, // 30 seconds
      
      // Garbage collection time (cache persistence)
      gcTime: 5 * 60 * 1000, // 5 minutes
      
      // Retry configuration
      retry: 1, // Single retry for faster failure detection
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
      
      // Auto-refresh behavior
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Network mode
      networkMode: 'online',
    },
    mutations: {
      // Mutation retry configuration
      retry: 1,
      networkMode: 'online',
    },
  },
});
