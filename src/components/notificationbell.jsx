import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { Bell, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { getOrCreateCompany } from '@/utils/companyHelper'; // Import at the top

export default function NotificationBell() {
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading || !user) {
      return;
    }

    // Now safe to load notifications
    loadNotifications();
    
    // Setup real-time subscription
    const setupSubscription = async () => {
      try {
        // Use company_id from profile first (no need to call getOrCreateCompany if we already have it)
        const companyId = profile?.company_id || null;
        
        if (!companyId && !user.id && !user.email) {
          return null;
        }
        
        let filter = '';
        if (companyId) {
          filter = `company_id=eq.${companyId}`;
        } else if (user.id) {
          filter = `user_id=eq.${user.id}`;
        } else if (user.email) {
          filter = `user_email=eq.${user.email}`;
        }
        
        const channel = supabase
          .channel(`notifications-${user.id || user.email}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: filter
          }, (payload) => {
            console.log('[NotificationBell] Real-time update:', payload.eventType);
            loadNotifications();
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('[NotificationBell] Real-time subscribed');
            }
          });

        return channel;
      } catch (error) {
        console.debug('Error setting up subscription:', error);
        return null;
      }
    };

    let channelCleanup = null;
    setupSubscription().then(channel => {
      channelCleanup = channel;
    });

    return () => {
      if (channelCleanup) {
        console.log('[NotificationBell] Unsubscribing');
        supabase.removeChannel(channelCleanup);
      }
    };
  }, [user?.id, user?.email, authReady, authLoading]); // More specific dependencies

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      // Use company_id from profile first (avoid unnecessary getOrCreateCompany calls)
      let companyId = profile?.company_id || null;

      if (companyId && user.id) {
        try {
          const { data: profileCheck } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .maybeSingle();

          if (profileCheck?.company_id !== companyId) {
            await supabase
              .from('profiles')
              .upsert({ id: user.id, company_id: companyId }, { onConflict: 'id' });
          }
        } catch (err) {
          console.debug('Error updating profile company_id:', err);
        }
      }

      if (!user.id && !user.email) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (user.id) {
        query = query.eq('user_id', user.id);
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
  };

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
          url = `/verification-center`;
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
                        className={`p-4 hover:bg-afrikoni-offwhite cursor-pointer transition-colors ${
                          !notification.read ? 'bg-amber-50/50 border-l-2 border-amber-400' : ''
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
