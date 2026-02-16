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
    // ✅ KERNEL ALIGNMENT: Use global event loop instead of direct subscription
    const handleRealtimeUpdate = (e) => {
      const { table } = e.detail || {};
      if (table === 'notifications') {
        console.log('[NotificationBell] Global event received, reloading...');
        loadNotifications();
      }
    };

    window.addEventListener('dashboard-realtime-update', handleRealtimeUpdate);

    // Initial load
    loadNotifications();

    return () => {
      window.removeEventListener('dashboard-realtime-update', handleRealtimeUpdate);
    };
  }, [loadNotifications]);
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
                       bg-red-500 text-white text-os-xs font-bold
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
            className="fixed w-80 md:w-96 max-h-[500px] overflow-hidden shadow-2xl border-2 border-os-accent/30 bg-white flex flex-col"
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
              <div className="p-4 border-b bg-os-accent/5 flex-shrink-0">
                <h3 className="font-semibold text-afrikoni-chestnut">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-os-xs text-afrikoni-deep/70 mt-1">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-afrikoni-deep/70">
                    No notifications
                  </div>
                ) : (
                  <div className="divide-y divide-os-accent/10">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-afrikoni-offwhite cursor-pointer transition-colors ${!notification.read ? 'bg-amber-50/50 border-l-2 border-amber-400' : ''
                          }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-os-sm text-afrikoni-chestnut mb-1 break-words line-clamp-2">
                              {notification.title || 'Notification'}
                            </div>
                            <div className="text-os-xs text-afrikoni-deep mt-1 break-words whitespace-normal leading-relaxed line-clamp-3">
                              {notification.message || ''}
                            </div>
                            <div className="text-os-xs text-afrikoni-deep/70 mt-2 flex items-center gap-2 flex-wrap">
                              <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                              {notification.type && (
                                <span className="px-1.5 py-0.5 bg-os-accent/10 text-os-accent rounded text-os-xs whitespace-nowrap">
                                  {notification.type}
                                </span>
                              )}
                            </div>
                            {/* Quick Reply Button */}
                            {(notification.type === 'support' || notification.type === 'support_ticket' || notification.type === 'message') && (
                              <div className="mt-2 pt-2 border-t border-os-accent/10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                  className="w-full text-left text-os-xs font-medium text-os-accent hover:text-os-accent/80 flex items-center gap-1"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  {notification.type === 'support' || notification.type === 'support_ticket' ? 'Open Support Chat' : 'Reply to Message'}
                                </button>
                              </div>
                            )}
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-os-accent rounded-full flex-shrink-0 mt-1" />
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
                    className="text-os-xs text-os-accent hover:underline font-medium text-center block"
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
