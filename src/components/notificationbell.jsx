import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { Bell, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';

export default function NotificationBell() {
  const { user, authReady, loading: authLoading } = useAuth();
  // ✅ FINAL 3% FIX: Use kernel hook with capabilities for hybrid check
  const { isAdmin, capabilities, profileCompanyId, userId } = useDashboardKernel();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const channelRef = useRef(null); // ✅ KERNEL ALIGNMENT: Store channel in ref for proper cleanup
  const activeCompanyIdRef = useRef(null); // ✅ VIBRANIUM STABILIZATION: Track active subscription companyId
  const stableCompanyIdRef = useRef(null); // ✅ KERNEL POLISH: Stable reference to prevent re-subscription on token refresh

  // ✅ FULL-STACK SYNC: Standardize isHybrid as (can_buy && can_sell)
  const isHybrid = capabilities?.can_buy === true && capabilities?.can_sell === true;
  const isAdminOrHybrid = isAdmin || isHybrid;

  // ✅ KERNEL ALIGNMENT: Wrap loadNotifications in useCallback to avoid stale closures
  // Must be defined BEFORE useEffect that uses it
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      // ✅ KERNEL ALIGNMENT: Use kernel-provided values
      const companyId = profileCompanyId || null;

      // ✅ KERNEL ALIGNMENT: Admin/hybrid users don't need filters - RLS policy handles visibility
      if (isAdminOrHybrid) {
        // Admin/hybrid: query runs without filter - RLS policy allows access to all notifications
        const { data, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.debug('Notification bell query error:', error);
          setNotifications([]);
          setUnreadCount(0);
          return;
        }

        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read).length || 0);
        return;
      }

      // Regular users: require at least one identifier
      if (!userId && !companyId && !user.email) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // ✅ KERNEL ALIGNMENT: Regular users apply filters
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (companyId) {
        query = query.eq('company_id', companyId);
      } else if (user.email) {
        query = query.eq('user_email', user.email);
      }

      const { data, error } = await query;

      if (error) {
        console.debug('Notification bell query error:', error);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.debug('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, userId, profileCompanyId, isAdmin, isHybrid]); // ✅ FINAL 3% FIX: Use isAdmin and isHybrid from capabilities

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading || !user) {
      return;
    }

    // ✅ VIBRANIUM STABILIZATION: Get current companyId
    const currentCompanyId = profileCompanyId || null;

    // ✅ KERNEL POLISH: Use stable reference - only update if companyId actually changed
    // This prevents re-subscription when token refreshes but companyId stays the same
    if (currentCompanyId !== stableCompanyIdRef.current) {
      stableCompanyIdRef.current = currentCompanyId;
    }
    const stableCompanyId = stableCompanyIdRef.current;

    // ✅ VIBRANIUM STABILIZATION: Only subscribe if companyId exists and is different from previous
    // This prevents infinite unsubscribe/subscribe cycles
    // ✅ KERNEL POLISH: Check if channel is already active for this companyId using stable reference
    const isAlreadySubscribed = (isAdmin && activeCompanyIdRef.current === 'admin') ||
      (stableCompanyId && stableCompanyId === activeCompanyIdRef.current && channelRef.current);

    if (isAlreadySubscribed) {
      // Already subscribed to this companyId - skip subscription but still load notifications
      console.log('[NotificationBell] Already subscribed - skipping duplicate subscription (stable companyId:', stableCompanyId, ')');
      loadNotifications();
      return;
    }

    // ✅ VIBRANIUM STABILIZATION: If companyId became null, clear the ref and unsubscribe
    // ✅ KERNEL POLISH: Use stableCompanyId to prevent clearing on token refresh
    if (!stableCompanyId && activeCompanyIdRef.current) {
      console.log('[NotificationBell] CompanyId became null - clearing subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      activeCompanyIdRef.current = null;
      stableCompanyIdRef.current = null; // ✅ KERNEL POLISH: Clear stable reference too
      return;
    }

    // Now safe to load notifications
    loadNotifications();

    // ✅ VIBRANIUM STABILIZATION: Unsubscribe from previous channel if exists and companyId changed
    // ✅ KERNEL POLISH: Use stable companyId reference to prevent unnecessary unsubscribes
    if (channelRef.current && activeCompanyIdRef.current !== stableCompanyId) {
      console.log('[NotificationBell] Unsubscribing from previous channel (companyId changed:', activeCompanyIdRef.current, '->', stableCompanyId, ')');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // ✅ KERNEL ALIGNMENT: Setup real-time subscription with proper admin/hybrid handling
    const setupSubscription = async () => {
      try {
        // ✅ FINAL 3% FIX: Admin users see all notifications, clients use company-scoped channel
        if (isAdmin) {
          // ✅ KERNEL POLISH: Double-check we're not already subscribed as admin
          if (activeCompanyIdRef.current === 'admin' && channelRef.current) {
            console.log('[NotificationBell] Already subscribed as admin - skipping');
            return channelRef.current;
          }

          // Admin: No filter - RLS policy allows access to all notifications
          const channel = supabase
            .channel(`notifications-admin-${userId || 'global'}`)
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'notifications',
              // ✅ FINAL 3% FIX: No filter for admin users - RLS handles visibility
            }, (payload) => {
              console.log('[NotificationBell] Real-time update (admin):', payload.eventType);
              loadNotifications();
            })
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                console.log('[NotificationBell] Real-time subscribed (admin - no filter)');
                activeCompanyIdRef.current = 'admin'; // Mark as admin subscription
              }
            });

          channelRef.current = channel;
          return channel;
        }

        // ✅ FINAL 3% FIX: Clients use dashboard-${companyId} pattern for 'World Isolation'
        // Regular users (including hybrid): apply company_id filter
        if (!stableCompanyId && !userId && !user.email) {
          return null;
        }

        // ✅ VIBRANIUM STABILIZATION: Only subscribe if companyId exists and is different
        if (!stableCompanyId) {
          console.log('[NotificationBell] No companyId - skipping subscription');
          return null;
        }

        // ✅ KERNEL POLISH: Double-check we're not already subscribed to this companyId using stable reference
        if (activeCompanyIdRef.current === stableCompanyId && channelRef.current) {
          console.log('[NotificationBell] Already subscribed to companyId:', stableCompanyId);
          return channelRef.current;
        }

        // ✅ FINAL 3% FIX: Use dashboard-${companyId} pattern to match DashboardRealtimeManager
        // ✅ KERNEL POLISH: Use stable companyId reference to prevent re-subscription on token refresh
        const channelName = `dashboard-notifications-${stableCompanyId}`;
        const filter = `company_id=eq.${stableCompanyId}`;

        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: filter
          }, (payload) => {
            console.log('[NotificationBell] Real-time update (client):', payload.eventType);
            loadNotifications();
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`[NotificationBell] Real-time subscribed (${channelName})`);
              // ✅ VIBRANIUM STABILIZATION: Track active subscription using stable reference
              activeCompanyIdRef.current = stableCompanyId;
            }
          });

        channelRef.current = channel;
        return channel;
      } catch (error) {
        console.debug('Error setting up subscription:', error);
        return null;
      }
    };

    setupSubscription();

    // ✅ KERNEL ALIGNMENT: Proper cleanup function
    // ✅ KERNEL POLISH: Ensure channel is properly unsubscribed and removed
    return () => {
      if (channelRef.current) {
        console.log('[NotificationBell] Cleanup: Unsubscribing from channel');
        try {
          // ✅ KERNEL POLISH: Explicitly unsubscribe before removing channel
          const channel = channelRef.current;
          channel.unsubscribe();
          supabase.removeChannel(channel);
        } catch (error) {
          console.debug('[NotificationBell] Cleanup error (non-critical):', error);
        } finally {
          channelRef.current = null;
          activeCompanyIdRef.current = null; // ✅ VIBRANIUM STABILIZATION: Clear tracked companyId
        }
      }
    };
  }, [userId, profileCompanyId, user?.email, authReady, authLoading, isAdminOrHybrid, loadNotifications, isAdmin]); // ✅ VIBRANIUM STABILIZATION: Include isAdmin
  // Note: profileCompanyId is in deps but we use stableCompanyIdRef to prevent re-subscription on token refresh

  const markAsRead = async (notificationId) => {
    if (!notificationId) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (!error) {
        loadNotifications();
      }
    } catch (error) {
      console.debug('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification) return;

    markAsRead(notification.id);
    setIsOpen(false);

    // Determine the URL to navigate to
    let url = notification.link;

    if (!url) {
      switch (notification.type) {
        case 'order':
          url = `/dashboard/orders/${notification.related_id}`;
          break;
        case 'rfq':
          url = `/dashboard/rfqs/${notification.related_id}`;
          break;
        case 'message':
          url = `/messages?conversation=${notification.related_id}`;
          break;
        case 'verification':
          url = `/dashboard/verification-center`;
          break;
        case 'product':
          url = `/dashboard/products/new?id=${notification.related_id}`;
          break;
        case 'support':
        case 'support_ticket':
          url = `/dashboard/support-chat${notification.related_id ? `?ticket=${notification.related_id}` : ''}`;
          break;
        case 'dispute':
          url = `/dashboard/disputes/${notification.related_id}`;
          break;
      }
    }

    if (url) {
      window.location.href = url;
    }
  };

  return (
    <button
      onClick={() => {
        if (user) {
          setIsOpen(!isOpen);
        }
      }}
      className="relative inline-flex items-center justify-center
                 w-10 h-10 rounded-lg
                 text-gray-700 hover:text-gray-900
                 hover:bg-gray-100
                 transition-colors duration-200"
      aria-label="Notifications"
      type="button"
    >
      <Bell className="w-5 h-5" />
      {user && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] 
                       bg-red-500 text-white text-[10px] font-bold
                       rounded-full flex items-center justify-center
                       shadow-sm ring-2 ring-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      {user && isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close notifications"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(false);
              }
            }}
          />
          {/* Notification Dropdown */}
          <Card
            className="fixed w-80 md:w-96 max-h-[500px] overflow-hidden shadow-2xl border-2 border-afrikoni-gold/30 bg-white flex flex-col"
            style={{
              position: 'fixed',
              zIndex: 9999,
              top: '80px',
              right: '16px',
              maxHeight: 'calc(100vh - 100px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-0 flex flex-col h-full">
              <div className="p-4 border-b bg-afrikoni-gold/5 flex-shrink-0">
                <h3 className="font-semibold text-afrikoni-chestnut">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-afrikoni-deep/70 mt-1">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-afrikoni-deep/70">
                    No notifications
                  </div>
                ) : (
                  <div className="divide-y divide-afrikoni-gold/10">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-afrikoni-offwhite cursor-pointer transition-colors ${!notification.read ? 'bg-amber-50/50 border-l-2 border-amber-400' : ''
                          }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-afrikoni-chestnut mb-1 break-words line-clamp-2">
                              {notification.title || 'Notification'}
                            </div>
                            <div className="text-xs text-afrikoni-deep mt-1 break-words whitespace-normal leading-relaxed line-clamp-3">
                              {notification.message || ''}
                            </div>
                            <div className="text-xs text-afrikoni-deep/70 mt-2 flex items-center gap-2 flex-wrap">
                              <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                              {notification.type && (
                                <span className="px-1.5 py-0.5 bg-afrikoni-gold/10 text-afrikoni-gold rounded text-[10px] whitespace-nowrap">
                                  {notification.type}
                                </span>
                              )}
                            </div>
                            {/* Quick Reply Button */}
                            {(notification.type === 'support' || notification.type === 'support_ticket' || notification.type === 'message') && (
                              <div className="mt-2 pt-2 border-t border-afrikoni-gold/10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                  className="w-full text-left text-xs font-medium text-afrikoni-gold hover:text-afrikoni-gold/80 flex items-center gap-1"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  {notification.type === 'support' || notification.type === 'support_ticket' ? 'Open Support Chat' : 'Reply to Message'}
                                </button>
                              </div>
                            )}
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-afrikoni-gold rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-3 border-t bg-afrikoni-offwhite/50">
                  <a
                    href="/dashboard/notifications"
                    className="text-xs text-afrikoni-gold hover:underline font-medium text-center block"
                    onClick={() => setIsOpen(false)}
                  >
                    View all notifications →
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </button>
  );
}
