import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';

/**
 * =============================================================================
 * DashboardRealtimeManager - SINGLE OWNER OF REALTIME SUBSCRIPTIONS
 * =============================================================================
 * 
 * ARCHITECTURAL RULE:
 * This component MUST be rendered in the dashboard LAYOUT (above <Outlet />).
 * It renders NULL and survives all nested route changes.
 * 
 * OWNERSHIP:
 * - This is the ONLY place realtime subscriptions are created
 * - DashboardHome, OrdersPage, RFQsPage, etc. MUST NOT have realtime hooks
 * - Subscriptions survive: tab switches, route changes, token refresh
 * 
 * LIFECYCLE:
 * - Mounts once when user enters /dashboard/*
 * - Unmounts only when user leaves /dashboard/* entirely
 * - Single channel per companyId
 * 
 * @param {string} companyId - Company ID to subscribe for
 * @param {string} userId - User ID for notifications
 * @param {function} onUpdate - Callback for realtime updates (optional)
 * @param {boolean} enabled - Whether subscriptions should be active
 */
export default function DashboardRealtimeManager({
  companyId,
  userId,
  onUpdate = null,
  enabled = true
}) {
  // ===========================================================================
  // REFS ONLY - Zero React state for subscription lifecycle
  // ===========================================================================

  const channelRef = useRef(null);
  const subscribedCompanyIdRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const onUpdateRef = useRef(onUpdate);
  const isMountedRef = useRef(true);

  // ===========================================================================
  // CALLBACK REF PATTERN - Update ref when callback changes
  // ===========================================================================

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // ===========================================================================
  // STABLE INVOKER - Never changes identity
  // ===========================================================================

  const invokeCallback = useCallback((table, eventType, data) => {
    if (onUpdateRef.current && isMountedRef.current) {
      onUpdateRef.current({ table, event: eventType, data });
    }

    // ✅ FULL-STACK SYNC: Dispatch custom event for components that don't have direct callback access
    if (isMountedRef.current && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dashboard-realtime-update', {
        detail: { table, event: eventType, data }
      }));
    }
  }, []);

  // ===========================================================================
  // CLEANUP - Removes exactly ONE channel
  // ===========================================================================

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      const topic = channelRef.current.topic;
      console.log(`[RealtimeManager] Cleanup: Removing channel ${topic}`);

      try {
        supabase.removeChannel(channelRef.current);
      } catch (err) {
        console.warn('[RealtimeManager] Cleanup error (non-fatal):', err);
      }

      channelRef.current = null;
    }

    isSubscribedRef.current = false;
    subscribedCompanyIdRef.current = null;
  }, []);

  // ===========================================================================
  // MAIN SUBSCRIPTION EFFECT
  // ===========================================================================

  useEffect(() => {
    isMountedRef.current = true;

    // =========================================================================
    // GUARD 1: Disabled or invalid params
    // =========================================================================
    if (!enabled) {
      console.log('[RealtimeManager] Disabled - skipping');
      return;
    }

    if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
      console.log('[RealtimeManager] No valid companyId - skipping');
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
      console.log(`[RealtimeManager] Already subscribed for ${companyId} - no-op`);
      return;
    }

    // =========================================================================
    // GUARD 3: CompanyId changed - cleanup old first
    // =========================================================================
    if (subscribedCompanyIdRef.current && subscribedCompanyIdRef.current !== companyId) {
      console.log(`[RealtimeManager] CompanyId changed: ${subscribedCompanyIdRef.current} → ${companyId}`);
      cleanup();
    }

    // =========================================================================
    // CREATE SINGLE CHANNEL
    // =========================================================================

    const channelName = `dashboard-manager-${companyId}`;
    console.log(`[RealtimeManager] Creating channel: ${channelName}`);

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: companyId },
        },
      })
      // -----------------------------------------------------------------
      // RFQs (buyer)
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
          console.log('[RealtimeManager] RFQ change:', payload.eventType);
          invokeCallback('rfqs', payload.eventType, payload.new);
        }
      )
      // -----------------------------------------------------------------
      // Products
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
          console.log('[RealtimeManager] Product change:', payload.eventType);
          invokeCallback('products', payload.eventType, payload.new);
        }
      )
      // -----------------------------------------------------------------
      // Orders (buyer)
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
          console.log('[RealtimeManager] Order (buyer):', payload.eventType);
          invokeCallback('orders', payload.eventType, payload.new);
        }
      )
      // -----------------------------------------------------------------
      // Orders (seller)
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
          console.log('[RealtimeManager] Order (seller):', payload.eventType);
          invokeCallback('orders', payload.eventType, payload.new);
        }
      )
      // -----------------------------------------------------------------
      // Messages (INSERT only)
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
          console.log('[RealtimeManager] New message');
          invokeCallback('messages', payload.eventType, payload.new);
        }
      );

    // -----------------------------------------------------------------
    // Notifications (company-scoped + user-level, INSERT/UPDATE only)
    // ✅ FULL-STACK SYNC: Use dashboard-${companyId} channel pattern
    // -----------------------------------------------------------------
    if (companyId && typeof companyId === 'string' && companyId.trim() !== '') {
      // Company-scoped notifications
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          console.log('[RealtimeManager] Notification change (company):', payload.eventType);
          invokeCallback('notifications', payload.eventType, payload.new);
        }
      );
    }

    // User-level notifications (fallback if no companyId)
    if (userId && typeof userId === 'string' && userId.trim() !== '') {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[RealtimeManager] Notification change (user):', payload.eventType);
          invokeCallback('notifications', payload.eventType, payload.new);
        }
      );
    }

    // =========================================================================
    // SUBSCRIBE
    // =========================================================================

    channel.subscribe((status, err) => {
      if (!isMountedRef.current) return;

      switch (status) {
        case 'SUBSCRIBED':
          console.log(`[RealtimeManager] ✅ Subscribed to ${channelName}`);
          isSubscribedRef.current = true;
          subscribedCompanyIdRef.current = companyId;
          break;
        case 'CHANNEL_ERROR':
          console.error(`[RealtimeManager] ❌ Error:`, err?.message || 'Unknown');
          break;
        case 'TIMED_OUT':
          console.warn(`[RealtimeManager] ⏱️ Timeout`);
          break;
        case 'CLOSED':
          console.log(`[RealtimeManager] Channel closed`);
          isSubscribedRef.current = false;
          break;
      }
    });

    channelRef.current = channel;

    // =========================================================================
    // CLEANUP ON UNMOUNT OR COMPANYID CHANGE
    // =========================================================================

    return () => {
      console.log(`[RealtimeManager] Effect cleanup`);
      isMountedRef.current = false;
      cleanup();
    };
  }, [companyId, userId, enabled, cleanup, invokeCallback]);

  // ===========================================================================
  // RENDER NULL - This is a behavior component, not a UI component
  // ===========================================================================

  return null;
}
