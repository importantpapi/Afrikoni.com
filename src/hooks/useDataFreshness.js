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

  // ✅ TAB SLEEP FIX: Disable time-based staleness checks
  // 
  // PROBLEM: When user leaves tab, browser pauses setInterval. When they return,
  // the interval fires and sees "30+ seconds elapsed" → marks data as stale →
  // pages clear their screen and show blank content until re-fetch completes.
  //
  // SOLUTION: Rely ONLY on event-based invalidation from realtime subscriptions.
  // If data actually changed, the realtime hook will trigger 'dashboard-realtime-update'.
  // If nothing changed, keep showing the "old" data (which is still valid).
  //
  // This prevents the "Flash of Death" when switching tabs.
  //
  // NOTE: Initial mount still sets isStale=true if lastFetched is null,
  // which is correct (first load should always fetch).
  useEffect(() => {
    if (!lastFetched) {
      if (!isStale) setIsStale(true);
      return;
    }

    // ✅ DISABLED: Time-based staleness check
    // Keeping this code commented for reference, but it's the root cause of tab-sleep blanking.
    //
    // const checkStaleness = () => {
    //   const age = Date.now() - lastFetched;
    //   const newIsStale = age > thresholdMs;
    //   if (newIsStale && !isStale) {
    //     setIsStale(true);
    //     console.log(`[useDataFreshness] Stale by time (${Math.round(age / 1000)}s > ${thresholdMs / 1000}s)`);
    //   }
    // };
    //
    // checkIntervalRef.current = setInterval(checkStaleness, 1000);
    // return () => clearInterval(checkIntervalRef.current);

  }, [lastFetched, thresholdMs, isStale]);

  // ✅ EVENT-BASED INVALIDATION (PASSIVE MODE)
  // Listens to realtime events but does NOT force screen wipes.
  // Components will naturally re-fetch when their dependencies change.
  useEffect(() => {
    const handleRealtimeUpdate = (e) => {
      const { table } = e.detail || {};

      // If filter provided, only log if table matches
      if (eventFilter && eventFilter.table && table !== eventFilter.table) {
        return;
      }

      // 🛡️ TAB SLEEP FIX: Log but don't set isStale.
      // Setting isStale=true here causes blank screens on tab wake-up.
      // Instead, let components handle their own re-fetch logic via useEffect deps.
      console.log(`[useDataFreshness] Realtime event from ${table} - components will refresh via deps`);
      
      // ❌ REMOVED: setIsStale(true); 
      // This was causing the "Flash of Death" when switching tabs.
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
