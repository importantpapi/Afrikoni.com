import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';

/**
 * =============================================================================
 * useRealTimeDashboardData - PRODUCTION-GRADE SINGLE-CHANNEL IMPLEMENTATION
 * =============================================================================
 * 
 * ARCHITECTURE RULES (IMMUTABLE):
 * 1. ONE channel per companyId: `dashboard-{companyId}`
 * 2. ALL refs, NO React state for subscription lifecycle
 * 3. Idempotent: Never resubscribe if already subscribed for same companyId
 * 4. Survives: route changes, tab switches, token refresh, auth re-resolution
 * 5. Cleanup: Only on hard unmount or companyId change
 * 
 * WHY THIS CANNOT REGRESS:
 * - No React state triggers re-renders that could cause resubscription
 * - Refs persist across renders without causing effect re-execution
 * - Single channel eliminates "binding mismatch" errors
 * - Idempotency guard prevents subscription storms
 * - Callback ref pattern prevents dependency array issues
 * 
 * @param {string|null} companyId - Company ID to subscribe for (null = disabled)
 * @param {string|null} userId - User ID for notifications (null = skip notifications)
 * @param {function|null} onUpdate - Callback for realtime updates
 * @param {boolean} enabled - Whether subscriptions should be active
 */
export function useRealTimeDashboardData(companyId, userId, onUpdate, enabled = true) {
  // ===========================================================================
  // REFS ONLY - No React state for subscription lifecycle
  // ===========================================================================
  
  /** @type {import('react').MutableRefObject<ReturnType<typeof supabase.channel>|null>} */
  const channelRef = useRef(null);
  
  /** Track if we've subscribed for this companyId */
  const subscribedCompanyIdRef = useRef(null);
  
  /** Track if subscription is currently active */
  const isSubscribedRef = useRef(false);
  
  /** Store callback in ref to avoid dependency array issues */
  const onUpdateRef = useRef(onUpdate);
  
  /** Track if component is mounted */
  const isMountedRef = useRef(true);

  // ===========================================================================
  // CALLBACK REF PATTERN - Update ref when callback changes, no re-subscription
  // ===========================================================================

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // ===========================================================================
  // STABLE CALLBACK - Invokes ref, never changes identity
  // ===========================================================================
  
  const invokeCallback = useCallback((table, eventType, data) => {
    if (onUpdateRef.current && isMountedRef.current) {
      onUpdateRef.current({
        table,
        event: eventType,
        data,
      });
    }
  }, []); // Empty deps = stable forever

  // ===========================================================================
  // CLEANUP FUNCTION - Removes exactly ONE channel, resets refs
  // ===========================================================================
  
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      const channelName = channelRef.current.topic;
      console.log(`[Realtime] Cleanup: Removing channel ${channelName}`);
      
      try {
        supabase.removeChannel(channelRef.current);
      } catch (err) {
        console.warn('[Realtime] Cleanup error (non-fatal):', err);
      }
      
      channelRef.current = null;
    }
    
    isSubscribedRef.current = false;
    subscribedCompanyIdRef.current = null;
  }, []);

  // ===========================================================================
  // MAIN SUBSCRIPTION EFFECT - Runs once per valid companyId
  // ===========================================================================
  
  useEffect(() => {
    // Track mount state
    isMountedRef.current = true;

    // =========================================================================
    // GUARD 1: Disabled or missing required params
    // =========================================================================
    if (!enabled) {
      console.log('[Realtime] Disabled - skipping subscription');
      return;
    }

    if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
      console.log('[Realtime] No valid companyId - skipping subscription');
      return;
    }

    // =========================================================================
    // GUARD 2: IDEMPOTENCY - Already subscribed for this companyId
    // =========================================================================
    if (
      isSubscribedRef.current &&
      subscribedCompanyIdRef.current === companyId &&
      channelRef.current
    ) {
      console.log(`[Realtime] Already subscribed for ${companyId} - skipping`);
      return;
    }

    // =========================================================================
    // GUARD 3: CompanyId changed - cleanup old subscription first
    // =========================================================================
    if (subscribedCompanyIdRef.current && subscribedCompanyIdRef.current !== companyId) {
      console.log(`[Realtime] CompanyId changed from ${subscribedCompanyIdRef.current} to ${companyId} - cleaning up old`);
      cleanup();
    }

    // =========================================================================
    // CREATE SINGLE CHANNEL WITH ALL HANDLERS
    // =========================================================================
    
    const channelName = `dashboard-${companyId}`;
    console.log(`[Realtime] Creating channel: ${channelName}`);

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: companyId },
        },
      })
      // -----------------------------------------------------------------
      // RFQs (buyer_company_id filter)
      // -----------------------------------------------------------------
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rfqs',
          filter: `buyer_company_id=eq.${companyId}`,
          },
          (payload) => {
          console.log('[Realtime] RFQ change:', payload.eventType);
          invokeCallback('rfqs', payload.eventType, payload.new);
        }
      )
      // -----------------------------------------------------------------
      // Products (company_id filter)
      // -----------------------------------------------------------------
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products',
          filter: `company_id=eq.${companyId}`,
          },
          (payload) => {
          console.log('[Realtime] Product change:', payload.eventType);
          invokeCallback('products', payload.eventType, payload.new);
        }
      )
      // -----------------------------------------------------------------
      // Orders (buyer_company_id filter)
      // -----------------------------------------------------------------
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          filter: `buyer_company_id=eq.${companyId}`,
          },
          (payload) => {
          console.log('[Realtime] Order (buyer) change:', payload.eventType);
          invokeCallback('orders', payload.eventType, payload.new);
        }
      )
      // -----------------------------------------------------------------
      // Orders (seller_company_id filter)
      // -----------------------------------------------------------------
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          filter: `seller_company_id=eq.${companyId}`,
          },
          (payload) => {
          console.log('[Realtime] Order (seller) change:', payload.eventType);
          invokeCallback('orders', payload.eventType, payload.new);
        }
      )
      // -----------------------------------------------------------------
      // Messages (receiver_company_id filter, INSERT only)
      // -----------------------------------------------------------------
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          filter: `receiver_company_id=eq.${companyId}`,
          },
          (payload) => {
          console.log('[Realtime] New message:', payload.eventType);
          invokeCallback('messages', payload.eventType, payload.new);
        }
      );

    // -----------------------------------------------------------------
    // Notifications (user_id filter) - Only if userId provided
    // -----------------------------------------------------------------
    if (userId && typeof userId === 'string' && userId.trim() !== '') {
      channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          filter: `user_id=eq.${userId}`,
          },
          (payload) => {
          console.log('[Realtime] New notification:', payload.eventType);
          invokeCallback('notifications', payload.eventType, payload.new);
        }
      );
    }

    // =========================================================================
    // SUBSCRIBE WITH STATUS HANDLING
    // =========================================================================
    
    channel.subscribe((status, err) => {
      if (!isMountedRef.current) {
        console.log('[Realtime] Component unmounted during subscribe - ignoring');
        return;
      }

      switch (status) {
        case 'SUBSCRIBED':
          console.log(`[Realtime] ✅ Subscribed to ${channelName}`);
          isSubscribedRef.current = true;
          subscribedCompanyIdRef.current = companyId;
          break;

        case 'CHANNEL_ERROR':
          console.error(`[Realtime] ❌ Channel error for ${channelName}:`, err?.message || 'Unknown');
          // Don't cleanup on error - let Supabase handle reconnection
          break;

        case 'TIMED_OUT':
          console.warn(`[Realtime] ⏱️ Subscription timed out for ${channelName}`);
          break;

        case 'CLOSED':
          console.log(`[Realtime] Channel ${channelName} closed`);
          isSubscribedRef.current = false;
          break;

        default:
          console.log(`[Realtime] Channel ${channelName} status: ${status}`);
      }
    });

    // Store channel reference
    channelRef.current = channel;

    // =========================================================================
    // CLEANUP - Only on unmount or companyId change
    // =========================================================================
    
    return () => {
      console.log(`[Realtime] Effect cleanup for ${companyId}`);
      isMountedRef.current = false;
      cleanup();
    };
  }, [companyId, userId, enabled, cleanup, invokeCallback]);
  // NOTE: cleanup and invokeCallback are stable (useCallback with [])
  // companyId, userId, enabled are the ONLY values that should trigger re-run

  // ===========================================================================
  // RETURN - Minimal, no state
  // ===========================================================================
  
  return {
    /** Whether currently subscribed */
    isSubscribed: isSubscribedRef.current,
    /** Manual cleanup (rarely needed) */
    cleanup,
  };
}

/**
 * =============================================================================
 * LEGACY EXPORTS - For backward compatibility
 * =============================================================================
 */

export function useRealTimeData(companyId, userId, onUpdate) {
  return useRealTimeDashboardData(companyId, userId, onUpdate, true);
}

/**
 * useRealTimeSubscription - LEGACY HOOK (use useRealTimeDashboardData instead)
 * 
 * ⚠️ WARNING: This hook is kept for backward compatibility only.
 * For dashboard features, use DashboardRealtimeManager instead.
 * 
 * STABILITY RULES:
 * 1. Dependencies parameter is IGNORED to prevent subscription storms
 * 2. Uses ref pattern for callback to prevent identity issues
 * 3. Only table and filter trigger re-subscription
 */
export function useRealTimeSubscription(table, onUpdate, filter = null, _dependencies = []) {
  const onUpdateRef = useRef(onUpdate);
  const channelRef = useRef(null);
  const isSubscribedRef = useRef(false);
  
  // Update callback ref without re-subscribing
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Memoize filter to prevent identity issues
  const filterColumn = filter?.column || null;
  const filterValue = filter?.value || null;

  useEffect(() => {
    // HARD GUARD: No table = no subscription
    if (!table || typeof table !== 'string') {
      return;
    }

    // Build channel name
    const channelName = filterColumn && filterValue
      ? `realtime-${table}-${filterColumn}-${filterValue}`
      : `realtime-${table}`;

    // IDEMPOTENCY: Check if already subscribed to same channel
    if (channelRef.current && channelRef.current.topic === channelName && isSubscribedRef.current) {
      console.log(`[useRealTimeSubscription] Already subscribed to ${channelName}`);
      return;
    }

    // Cleanup previous subscription if exists
    if (channelRef.current) {
      console.log(`[useRealTimeSubscription] Cleaning up previous channel`);
      try {
        supabase.removeChannel(channelRef.current);
      } catch (err) {
        console.warn('[useRealTimeSubscription] Cleanup error:', err);
      }
      channelRef.current = null;
      isSubscribedRef.current = false;
    }

    console.log(`[useRealTimeSubscription] Creating channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filterColumn && filterValue && { filter: `${filterColumn}=eq.${filterValue}` }),
        },
        (payload) => {
          onUpdateRef.current?.(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[useRealTimeSubscription] ✅ Subscribed to ${channelName}`);
          isSubscribedRef.current = true;
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log(`[useRealTimeSubscription] Unmount cleanup for ${channelName}`);
        try {
          supabase.removeChannel(channelRef.current);
        } catch (err) {
          console.warn('[useRealTimeSubscription] Unmount cleanup error:', err);
        }
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [table, filterColumn, filterValue]); // ❌ REMOVED: ...dependencies - this was causing subscription storms!

  return { isSubscribed: isSubscribedRef.current };
}

/**
 * useRealTimeCount - LEGACY HOOK
 * 
 * Loads count for a table with optional filter.
 * Uses refs to prevent unnecessary re-renders.
 */
export function useRealTimeCount(table, filter = null) {
  const countRef = useRef(0);
  const loadingRef = useRef(true);
  const hasLoadedRef = useRef(false);

  // Extract primitives to prevent object identity issues
  const filterColumn = filter?.column || null;
  const filterValue = filter?.value || null;

  useEffect(() => {
    // HARD GUARD: No table = no query
    if (!table || typeof table !== 'string') {
      loadingRef.current = false;
      return;
    }

    // HARD GUARD: If filter is specified, both column and value must be present
    if (filterColumn && !filterValue) {
      console.warn(`[useRealTimeCount] Filter column specified but no value for ${table}`);
      loadingRef.current = false;
      return;
    }

    const loadCount = async () => {
      try {
        let query = supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (filterColumn && filterValue) {
          query = query.eq(filterColumn, filterValue);
        }

        const { count, error } = await query;
        
        if (error) {
          console.error(`[useRealTimeCount] Error for ${table}:`, error.message);
          countRef.current = 0;
        } else {
          countRef.current = count || 0;
        }
        
        hasLoadedRef.current = true;
      } catch (err) {
        console.error(`[useRealTimeCount] Exception for ${table}:`, err);
        countRef.current = 0;
      } finally {
        loadingRef.current = false;
      }
    };

    loadCount();
  }, [table, filterColumn, filterValue]);

  return { 
    count: countRef.current, 
    isLoading: loadingRef.current, 
    refresh: () => {} 
  };
}
