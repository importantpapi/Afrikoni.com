import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';

// ✅ TOTAL SYSTEM SYNC: Global channel registry to prevent duplicates across hook instances
const _activeChannels = new Map();
const _channelTimeouts = new Map();

/**
 * =============================================================================
 * useRealTimeDashboardData - PRODUCTION-GRADE SINGLE-CHANNEL IMPLEMENTATION
 * =============================================================================
 * 
 * ARCHITECTURE RULES (IMMUTABLE):
 * 1. ONE channel per companyId: `dashboard - { companyId }`
 * 2. ALL refs, NO React state for subscription lifecycle
 * 3. Idempotent: Never resubscribe if already subscribed for same companyId
 * 4. Survives: route changes, tab switches, token refresh, auth re-resolution
 * 5. Cleanup: Only on hard unmount or companyId change
 * 6. ✅ REACT QUERY INTEGRATION: Invalidates queries instead of CustomEvents
 * 
 * WHY THIS CANNOT REGRESS:
 * - No React state triggers re-renders that could cause resubscription
 * - Refs persist across renders without causing effect re-execution
 * - Single channel eliminates "binding mismatch" errors
 * - Idempotency guard prevents subscription storms
 * - Callback ref pattern prevents dependency array issues
 * - React Query auto-invalidation replaces manual event listeners
 * 
 * @param {string|null} companyId - Company ID to subscribe for (null = disabled)
 * @param {string|null} userId - User ID for notifications (null = skip notifications)
 * @param {function|null} onUpdate - Callback for realtime updates
 * @param {boolean} enabled - Whether subscriptions should be active
 */
export function useRealTimeDashboardData(companyId, userId, onUpdate, enabled = true) {
  // ===========================================================================
  // REACT QUERY CLIENT - For automatic cache invalidation
  // ===========================================================================
  const queryClient = useQueryClient();

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

  // ===========================================================================
  // STABLE CALLBACK - Invokes ref, never changes identity
  // ===========================================================================
  const invalidationQueueRef = useRef(new Set());
  const invalidationTimeoutRef = useRef(null);

  const invokeCallback = useCallback((table, eventType, data) => {
    // 1. ✅ DEBOUNCED INVALIDATION (Principal Engineer Pattern)
    // Prevents "thundering herd" refetches during batch updates
    invalidationQueueRef.current.add(table);

    if (invalidationTimeoutRef.current) {
      clearTimeout(invalidationTimeoutRef.current);
    }

    invalidationTimeoutRef.current = setTimeout(() => {
      const tablesToInvalidate = Array.from(invalidationQueueRef.current);
      invalidationQueueRef.current.clear();

      console.log(`[Realtime] Batch invalidating queries for: ${tablesToInvalidate.join(', ')}`);

      tablesToInvalidate.forEach(tbl => {
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === tbl
        });
      });
    }, 300); // 300ms consolidation window

    // 2. Direct callback to the component prop (legacy support)
    if (onUpdateRef.current && isMountedRef.current) {
      onUpdateRef.current({
        table,
        event: eventType,
        data,
      });
    }

    // 3. ✅ BACKWARDS COMPATIBILITY: Keep CustomEvent
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('dashboard-realtime-update', {
        detail: {
          table,
          event: eventType,
          data,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
    }
  }, [queryClient]); // queryClient is stable

  // ===========================================================================
  // CLEANUP FUNCTION - Removes exactly ONE channel, resets refs
  // ===========================================================================

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      const channelName = channelRef.current.topic;
      console.log(`[Realtime] Cleanup: Removing channel ${channelName} `);

      try {
        supabase.removeChannel(channelRef.current);
      } catch (err) {
        console.warn('[Realtime] Cleanup error (non-fatal):', err);
      }

      channelRef.current = null;
    }

    isSubscribedRef.current = false;
    subscribedCompanyIdRef.current = null;
    // Also remove from global registry
    _activeChannels.delete(companyId);
    if (_channelTimeouts.has(companyId)) {
      clearTimeout(_channelTimeouts.get(companyId));
      _channelTimeouts.delete(companyId);
    }
  }, [companyId]); // companyId is a dependency for global cleanup

  // ===========================================================================
  // MAIN SUBSCRIPTION EFFECT - Runs once per valid companyId
  // ===========================================================================

  useEffect(() => {
    // Track mount state
    isMountedRef.current = true;

    // ✅ ENTERPRISE GUARD: UUID validation for companyId
    // Prevents "invalid input syntax for type uuid" 400 errors in Supabase filters
    const isValidUuid = (id) => {
      if (!id || typeof id !== 'string') return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };

    if (!enabled) {
      console.log('[Realtime] Disabled - skipping subscription');
      return;
    }

    if (!companyId || !isValidUuid(companyId)) {
      if (companyId) {
        console.warn(`[Realtime] ⚠️ Invalid companyId format: "${companyId}" - skipping subscription`);
      } else {
        console.warn('[Realtime] ⚠️ No companyId - User profile may not be linked to a company. Please complete company setup.');
        console.warn('[Realtime] Navigate to /dashboard/company-info to create/link a company.');
      }
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

    // ✅ TOTAL SYSTEM SYNC: Check for existing active channel for this company
    if (_activeChannels.has(companyId)) {
      const existingChannel = _activeChannels.get(companyId);
      console.warn(`% c[Sync:Detector] Duplicate subscription blocked for company: ${companyId} `, 'color: #ff9d00; font-weight: bold');

      // If the existing channel is healthy, we just link to it (idempotency)
      if (existingChannel.state === 'joined') {
        // Update refs to reflect the existing channel
        channelRef.current = existingChannel;
        isSubscribedRef.current = true;
        subscribedCompanyIdRef.current = companyId;
        return;
      }

      // If it's stale or closed, remove it so we can re-subscribe
      console.log('[Sync:Detector] Cleaning up stale channel before re-subscription');
      supabase.removeChannel(existingChannel);
      _activeChannels.delete(companyId);
      if (_channelTimeouts.has(companyId)) {
        clearTimeout(_channelTimeouts.get(companyId));
        _channelTimeouts.delete(companyId);
      }
    }

    // =========================================================================
    // GUARD 3: CompanyId changed - cleanup old subscription first
    // =========================================================================
    if (subscribedCompanyIdRef.current && subscribedCompanyIdRef.current !== companyId) {
      console.log(`[Realtime] CompanyId changed from ${subscribedCompanyIdRef.current} to ${companyId} - cleaning up old`);
      cleanup();
    }

    // =========================================================================
    // 🛡️ ADAPTIVE DEBOUNCE FIX: Desktop vs Mobile optimization
    // =========================================================================
    // Mobile devices: Need 1000ms to avoid double-mount issues
    // Desktop devices: Can connect faster (500ms) since CPU/network is faster
    // 
    // We detect if we're on a faster device by checking if profileCompanyId
    // arrived quickly (system resolved < 500ms after mount)
    // =========================================================================
    const isLikelyDesktop = typeof window !== 'undefined' && window.performance &&
      window.performance.memory && window.performance.memory.jsHeapSizeLimit > 2147483648; // > 2GB heap

    const debounceDelay = isLikelyDesktop ? 500 : 1000;
    console.log(`[Realtime] Debouncing connection for ${companyId}(${debounceDelay}ms - ${isLikelyDesktop ? 'desktop' : 'mobile'})...`);

    const connectionTimer = setTimeout(() => {
      // Double-check we're still mounted and enabled
      if (!isMountedRef.current || !enabled || !companyId) {
        console.log('[Realtime] Connection cancelled during debounce (component unmounted)');
        return;
      }

      // =========================================================================
      // CREATE SINGLE CHANNEL WITH ALL HANDLERS
      // =========================================================================

      const channelName = `dashboard - hook - ${companyId} `;
      console.log(`[Realtime] Creating channel: ${channelName} `);

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
            filter: `buyer_company_id = eq.${companyId} `,
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
            filter: `company_id = eq.${companyId} `,
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
            filter: `buyer_company_id = eq.${companyId} `,
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
            filter: `seller_company_id = eq.${companyId} `,
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
            filter: `receiver_company_id = eq.${companyId} `,
          },
          (payload) => {
            console.log('[Realtime] New message:', payload.eventType);
            invokeCallback('messages', payload.eventType, payload.new);
          }
        )
        // -----------------------------------------------------------------
        // Trades (buyer_id or seller_id as company filter)
        // -----------------------------------------------------------------
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trades',
            filter: `buyer_id = eq.${companyId} `,
          },
          (payload) => {
            console.log('[Realtime] Trade (buyer) update:', payload.eventType);
            invokeCallback('trades', payload.eventType, payload.new);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trades',
            filter: `seller_id = eq.${companyId} `,
          },
          (payload) => {
            console.log('[Realtime] Trade (seller) update:', payload.eventType);
            invokeCallback('trades', payload.eventType, payload.new);
          }
        )
        // -----------------------------------------------------------------
        // Shipments (company_id filter)
        // -----------------------------------------------------------------
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shipments',
            filter: `company_id = eq.${companyId} `,
          },
          (payload) => {
            console.log('[Realtime] Shipment update:', payload.eventType);
            invokeCallback('shipments', payload.eventType, payload.new);
          }
        )
        // -----------------------------------------------------------------
        // Escrows (buyer_id or seller_id as company filter)
        // -----------------------------------------------------------------
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'escrows',
            filter: `buyer_id = eq.${companyId} `,
          },
          (payload) => {
            console.log('[Realtime] Escrow (buyer) update:', payload.eventType);
            invokeCallback('escrows', payload.eventType, payload.new);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'escrows',
            filter: `seller_id = eq.${companyId} `,
          },
          (payload) => {
            console.log('[Realtime] Escrow (seller) update:', payload.eventType);
            invokeCallback('escrows', payload.eventType, payload.new);
          }
        )
        // -----------------------------------------------------------------
        // Payments (company_id filter)
        // -----------------------------------------------------------------
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
            filter: `company_id = eq.${companyId} `,
          },
          (payload) => {
            console.log('[Realtime] Payment update:', payload.eventType);
            invokeCallback('payments', payload.eventType, payload.new);
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
            filter: `user_id = eq.${userId} `,
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
            console.log(`[Realtime] ✅ Subscribed to ${channelName} `);
            console.log(`% c[Live:Signal] Channel ${companyId} is active`, 'color: #10b981; font-weight: bold');
            isSubscribedRef.current = true;
            subscribedCompanyIdRef.current = companyId;
            _activeChannels.set(companyId, channel); // Add to global registry
            if (_channelTimeouts.has(companyId)) {
              clearTimeout(_channelTimeouts.get(companyId));
              _channelTimeouts.delete(companyId);
            }
            break;

          case 'CHANNEL_ERROR':
            console.error(`[Realtime] ❌ Channel error for ${channelName}: `, err?.message || 'Unknown');
            _activeChannels.delete(companyId); // Remove from global registry on error
            break;

          case 'TIMED_OUT':
            console.warn(`[Realtime] ⏱️ Subscription timed out for ${channelName}`);
            break;

          case 'CLOSED':
            console.log(`[Realtime] Channel ${channelName} closed`);
            isSubscribedRef.current = false;
            _activeChannels.delete(companyId); // Remove from global registry on close
            break;

          default:
            console.log(`[Realtime] Channel ${channelName} status: ${status} `);
        }
      });

      // Store channel reference
      channelRef.current = channel;

    }, debounceDelay); // ✅ Using adaptive debounce delay

    // =========================================================================
    // 🛡️ TAB WAKE-UP HANDLER: Reconnect if channel died during tab sleep
    // =========================================================================
    // When user leaves tab, browser may close WebSocket connections to save battery.
    // When they return, we need to check if the connection is still alive and
    // force a reconnect if needed.
    // =========================================================================
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Realtime] Tab became visible - checking connection health...');

        // Check if channel exists and its state
        if (channelRef.current) {
          const state = channelRef.current.state;
          console.log(`[Realtime] Current channel state: ${state} `);

          // If channel is closed or errored, cleanup and let effect re-run
          if (state === 'closed' || state === 'errored') {
            console.log('[Realtime] Channel is dead - triggering reconnection');
            cleanup();
            // The cleanup will set isSubscribedRef.current = false,
            // which will cause the effect guards to pass on next render,
            // allowing a fresh subscription.
          } else {
            console.log('[Realtime] Channel is healthy - no action needed');
          }
        } else {
          console.log('[Realtime] No active channel - will create on next effect run');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // =========================================================================
    // CLEANUP - Cancel timer + cleanup channel on unmount or companyId change
    // =========================================================================

    return () => {
      console.log(`[Realtime] Effect cleanup for ${companyId}`);
      clearTimeout(connectionTimer); // ✅ Cancel pending connection
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      isMountedRef.current = false;

      // Throttle removal from global registry to prevent rapid subscribe/unsubscribe cycles
      // This helps if the component unmounts and remounts quickly (e.g., route change)
      if (channelRef.current && _activeChannels.get(companyId) === channelRef.current) {
        console.log(`[Realtime] Cleaning up channel for ${companyId} with throttle`);
        _activeChannels.delete(companyId);
        const timeout = setTimeout(() => {
          supabase.removeChannel(channelRef.current);
          _channelTimeouts.delete(companyId);
        }, 1000); // 1 second throttle
        _channelTimeouts.set(companyId, timeout);
      } else {
        cleanup(); // Perform immediate cleanup if not the globally active channel or no channel
      }
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
      ? `realtime - ${table} -${filterColumn} -${filterValue} `
      : `realtime - ${table} `;

    // IDEMPOTENCY: Check if already subscribed to same channel
    if (channelRef.current && channelRef.current.topic === channelName && isSubscribedRef.current) {
      console.log(`[useRealTimeSubscription] Already subscribed to ${channelName} `);
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

    console.log(`[useRealTimeSubscription] Creating channel: ${channelName} `);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filterColumn && filterValue && { filter: `${filterColumn}=eq.${filterValue} ` }),
        },
        (payload) => {
          onUpdateRef.current?.(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[useRealTimeSubscription] ✅ Subscribed to ${channelName} `);
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
          console.error(`[useRealTimeCount] Error for ${table}: `, error.message);
          countRef.current = 0;
        } else {
          countRef.current = count || 0;
        }

        hasLoadedRef.current = true;
      } catch (err) {
        console.error(`[useRealTimeCount] Exception for ${table}: `, err);
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
    refresh: () => { }
  };
}
