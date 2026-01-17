/**
 * useDataFreshness - Hook to track data freshness and trigger refresh
 * 
 * ARCHITECTURAL PURPOSE:
 * Ensures data is refreshed if older than threshold (default: 30 seconds)
 * Prevents stale data from showing after navigation
 * 
 * @param {number} thresholdMs - Maximum age in milliseconds before data is considered stale (default: 30000 = 30s)
 * @returns {object} { isStale, lastFetched, refresh }
 */
import { useState, useEffect, useRef, useCallback } from 'react';

export function useDataFreshness(thresholdMs = 30000) {
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

  // Check if data is stale
  useEffect(() => {
    if (!lastFetched) {
      setIsStale(true);
      // ✅ TOTAL SYSTEM SYNC: Hook diagnostics
      console.log('🔄 FRESHNESS UPDATE: [isStale=true] (no data fetched yet)');
      return;
    }

    const checkStaleness = () => {
      const age = Date.now() - lastFetched;
      const newIsStale = age > thresholdMs;
      setIsStale(newIsStale);
      // ✅ TOTAL SYSTEM SYNC: Hook diagnostics - log every state change
      console.log(`🔄 FRESHNESS UPDATE: [isStale=${newIsStale}] (age: ${Math.round(age / 1000)}s, threshold: ${thresholdMs / 1000}s)`);
    };

    // Check immediately
    checkStaleness();

    // Check every second
    checkIntervalRef.current = setInterval(checkStaleness, 1000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [lastFetched, thresholdMs]);

  return {
    isStale,
    lastFetched,
    markFresh,
    refresh,
  };
}
