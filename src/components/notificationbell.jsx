import React, { useState, useEffect } from 'react';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '@/utils';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Subscribe to real-time notifications
      const setupSubscription = async () => {
        const { getOrCreateCompany } = await import('@/utils/companyHelper');
        const companyId = await getOrCreateCompany(supabase, user);
        
        const channel = supabase
          .channel('notifications')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: companyId ? `company_id=eq.${companyId}` : `user_email=eq.${user.email}`
          }, () => {
            loadNotifications();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      };

      let cleanup;
      setupSubscription().then(cleanupFn => {
        cleanup = cleanupFn;
      });

      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
    } catch (error) {
      // Error logged (removed for production)
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      // Get company_id if available
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, user);

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Try company_id first, then fallback to user_email
      if (companyId) {
        query = query.eq('company_id', companyId);
      } else {
        query = query.eq('user_email', user.email);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      // Error logged (removed for production)
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      // Error logged (removed for production)
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-afrikoni-cream text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
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
          <Card className="absolute right-0 top-12 w-80 md:w-96 z-50 max-h-[500px] overflow-hidden shadow-lg flex flex-col">
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
                        onClick={() => {
                          markAsRead(notification.id);
                          setIsOpen(false);
                          
                          // Navigate based on type
                          if (notification.link) {
                            window.location.href = notification.link;
                          } else if (notification.type === 'order' && notification.related_id) {
                            window.location.href = `/dashboard/orders/${notification.related_id}`;
                          } else if (notification.type === 'rfq' && notification.related_id) {
                            window.location.href = `/dashboard/rfqs/${notification.related_id}`;
                          } else if (notification.type === 'message' && notification.related_id) {
                            window.location.href = `/messages?conversation=${notification.related_id}`;
                          } else if (notification.type === 'verification' && notification.related_id) {
                            window.location.href = `/verification-center`;
                          } else if (notification.type === 'product' && notification.related_id) {
                            window.location.href = `/dashboard/products/new?id=${notification.related_id}`;
                          } else if (notification.type === 'support_ticket' && notification.related_id) {
                            window.location.href = `/dashboard/support-chat?ticketId=${notification.related_id}`;
                          } else if (notification.type === 'dispute' && notification.related_id) {
                            window.location.href = `/dashboard/disputes/${notification.related_id}`;
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-afrikoni-chestnut mb-1 break-words line-clamp-2">
                              {notification.title}
                            </div>
                            <div className="text-xs text-afrikoni-deep mt-1 break-words whitespace-normal leading-relaxed line-clamp-3">
                              {notification.message}
                            </div>
                            <div className="text-xs text-afrikoni-deep/70 mt-2 flex items-center gap-2 flex-wrap">
                              <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                              {notification.type && (
                                <span className="px-1.5 py-0.5 bg-afrikoni-gold/10 text-afrikoni-gold rounded text-[10px] whitespace-nowrap">
                                  {notification.type}
                                </span>
                              )}
                            </div>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                  >
                    View all notifications →
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

