import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDataFreshness - Hook to track data freshness and trigger refresh
 * 
 * ARCHITECTURAL PURPOSE:
 * 1. Time-based: Refreshes if older than threshold (default: 30s)
 * 2. Event-based: Refreshes immediately on 'dashboard-realtime-update'
 * 
 * @param {number} thresholdMs - Maximum age in milliseconds
 * @param {Object} eventFilter - Optional: { table: 'orders' } to only refresh on specific table events
 * @returns {object} { isStale, lastFetched, markFresh, refresh }
 */
export function useDataFreshness(thresholdMs = 30000, eventFilter = null) {
  const [lastFetched, setLastFetched] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const checkIntervalRef = useRef(null);

  // Mark data as fresh (call this after successful data fetch)
  const markFresh = useCallback(() => {
    const now = Date.now();
    setLastFetched(now);
    setIsStale(false);
  }, []);

  // Force refresh (marks as stale to trigger reload)
  const refresh = useCallback(() => {
    setLastFetched(null);
    setIsStale(true);
  }, []);

  // Time-based Stale Check
  useEffect(() => {
    if (!lastFetched) {
      if (!isStale) setIsStale(true);
      return;
    }

    const checkStaleness = () => {
      const age = Date.now() - lastFetched;
      const newIsStale = age > thresholdMs;
      if (newIsStale && !isStale) {
        setIsStale(true);
        console.log(`[useDataFreshness] Stale by time (${Math.round(age / 1000)}s > ${thresholdMs / 1000}s)`);
      }
    };

    checkIntervalRef.current = setInterval(checkStaleness, 1000);
    return () => clearInterval(checkIntervalRef.current);
  }, [lastFetched, thresholdMs, isStale]);

  // ✅ EVENT-BASED INVALIDATION
  // Listens to the singleton DashboardRealtimeManager
  useEffect(() => {
    const handleRealtimeUpdate = (e) => {
      const { table } = e.detail || {};

      // If filter provided, only refresh if table matches
      if (eventFilter && eventFilter.table && table !== eventFilter.table) {
        return;
      }

      console.log(`[useDataFreshness] Invalidation triggered by ${table} event`);
      setIsStale(true);
    };

    window.addEventListener('dashboard-realtime-update', handleRealtimeUpdate);
    return () => window.removeEventListener('dashboard-realtime-update', handleRealtimeUpdate);
  }, [eventFilter]);

  return {
    isStale,
    lastFetched,
    markFresh,
    refresh,
  };
}
