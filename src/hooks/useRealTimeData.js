import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';

/**
 * useRealTimeData - Hook for real-time Supabase subscriptions
 * 
 * Provides automatic real-time updates for dashboard data
 * @param {string} table - Table name to subscribe to
 * @param {function} onUpdate - Callback when data changes
 * @param {object} filter - Optional filter (e.g., { column: 'company_id', value: companyId })
 * @param {array} dependencies - Dependencies array for useEffect
 */
export function useRealTimeSubscription(table, onUpdate, filter = null, dependencies = []) {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!table || !onUpdate) return;

    let channel;
    
    try {
      // Create channel name with filter for uniqueness
      const channelName = filter 
        ? `realtime-${table}-${filter.column}-${filter.value}`
        : `realtime-${table}`;

      // Set up subscription
      const subscription = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: table,
            ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
          },
          (payload) => {
            console.log(`[Real-time] ${table} changed:`, payload.eventType);
            onUpdate(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Real-time] Subscribed to ${table}`);
            setIsSubscribed(true);
          } else if (status === 'CHANNEL_ERROR') {
            console.warn(`[Real-time] Error subscribing to ${table}`);
            setIsSubscribed(false);
          } else if (status === 'CLOSED') {
            console.log(`[Real-time] Subscription to ${table} closed`);
            setIsSubscribed(false);
          }
        });

      channel = subscription;
    } catch (error) {
      console.error(`[Real-time] Error setting up subscription for ${table}:`, error);
    }

    // Cleanup
    return () => {
      if (channel) {
        console.log(`[Real-time] Unsubscribing from ${table}`);
        supabase.removeChannel(channel);
        setIsSubscribed(false);
      }
    };
  }, [table, ...dependencies]);

  return { isSubscribed };
}

/**
 * useRealTimeDashboardData - Specialized hook for dashboard real-time updates
 * Subscribes to multiple tables and provides unified update callback
 */
export function useRealTimeDashboardData(companyId, userId, onDataChange) {
  const [subscriptions, setSubscriptions] = useState({
    orders: false,
    rfqs: false,
    products: false,
    notifications: false,
    messages: false
  });

  useEffect(() => {
    // GUARD: Don't subscribe if companyId is null/undefined/invalid or onDataChange is missing
    if (!companyId || !onDataChange || typeof companyId !== 'string' || companyId.trim() === '') {
      console.log('[Dashboard Real-time] Skipping subscription: companyId or onDataChange missing/invalid', { 
        hasCompanyId: !!companyId, 
        companyIdType: typeof companyId,
        companyIdValue: companyId,
        hasOnDataChange: !!onDataChange 
      });
      return;
    }

    const channels = [];
    const newSubscriptions = {};

    // Helper to create subscription with validation
    const createSubscription = (table, filterColumn, filterValue) => {
      // Validate filterValue before creating subscription
      if (!filterValue || typeof filterValue !== 'string' || filterValue.trim() === '') {
        console.warn(`[Dashboard Real-time] Skipping ${table} subscription: invalid filterValue`, filterValue);
        return null;
      }

      const channelName = `dashboard-${table}-${filterValue}`;
      
      try {
        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: `${filterColumn}=eq.${filterValue}`
            },
            (payload) => {
              console.log(`[Dashboard Real-time] ${table} updated:`, payload.eventType);
              onDataChange({ table, event: payload.eventType, data: payload });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`[Dashboard] Subscribed to ${table}`);
              newSubscriptions[table] = true;
              setSubscriptions(prev => ({ ...prev, [table]: true }));
            } else if (status === 'CHANNEL_ERROR') {
              console.warn(`[Dashboard Real-time] Error subscribing to ${table}:`, status);
            }
          });

        return channel;
      } catch (error) {
        console.error(`[Dashboard Real-time] Error creating ${table} subscription:`, error);
        return null;
      }
    };

    try {
      // Subscribe to orders (only if companyId is valid)
      const orderBuyerChannel = createSubscription('orders', 'buyer_company_id', companyId);
      const orderSellerChannel = createSubscription('orders', 'seller_company_id', companyId);
      if (orderBuyerChannel) channels.push(orderBuyerChannel);
      if (orderSellerChannel) channels.push(orderSellerChannel);

      // Subscribe to RFQs
      const rfqChannel = createSubscription('rfqs', 'company_id', companyId);
      if (rfqChannel) channels.push(rfqChannel);

      // Subscribe to products
      const productChannel = createSubscription('products', 'company_id', companyId);
      if (productChannel) channels.push(productChannel);

      // Subscribe to notifications (by user or company)
      if (userId && typeof userId === 'string' && userId.trim() !== '') {
        const notificationUserChannel = createSubscription('notifications', 'user_id', userId);
        if (notificationUserChannel) channels.push(notificationUserChannel);
      }
      const notificationCompanyChannel = createSubscription('notifications', 'company_id', companyId);
      if (notificationCompanyChannel) channels.push(notificationCompanyChannel);

      // Subscribe to messages
      const messageChannel = createSubscription('messages', 'receiver_company_id', companyId);
      if (messageChannel) channels.push(messageChannel);

    } catch (error) {
      console.error('[Dashboard Real-time] Error setting up subscriptions:', error);
    }

    // Cleanup
    return () => {
      console.log('[Dashboard] Cleaning up real-time subscriptions');
      channels.forEach(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
      setSubscriptions({
        orders: false,
        rfqs: false,
        products: false,
        notifications: false,
        messages: false
      });
    };
  }, [companyId, userId, onDataChange]);

  return { subscriptions };
}

/**
 * useRealTimeCount - Hook for real-time count updates
 * Efficiently tracks count changes without loading full data
 */
export function useRealTimeCount(table, filter = null) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial count
  const loadCount = useCallback(async () => {
    if (!table) return;

    try {
      let query = supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (filter) {
        query = query.eq(filter.column, filter.value);
      }

      const { count: initialCount, error } = await query;

      if (error) throw error;
      setCount(initialCount || 0);
    } catch (error) {
      console.error(`Error loading count for ${table}:`, error);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [table, filter?.column, filter?.value]);

  // Set up real-time updates
  useEffect(() => {
    loadCount();
  }, [loadCount]);

  // Subscribe to changes and update count
  useRealTimeSubscription(
    table,
    (payload) => {
      setCount(prev => {
        if (payload.eventType === 'INSERT') return prev + 1;
        if (payload.eventType === 'DELETE') return Math.max(0, prev - 1);
        return prev; // UPDATE doesn't change count
      });
    },
    filter,
    [filter?.column, filter?.value]
  );

  return { count, isLoading, refresh: loadCount };
}

