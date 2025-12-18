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
      
      // Subscribe to real-time notifications only if we have proper filters
      const setupSubscription = async () => {
        try {
          const { getOrCreateCompany } = await import('@/utils/companyHelper');
          const companyId = await getOrCreateCompany(supabase, user);
          
          // Only subscribe if we have a valid filter
          if (!companyId && !user.id && !user.email) {
            return null;
          }
          
          // Build filter for realtime subscription
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
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: filter
            }, () => {
              loadNotifications();
            })
            .subscribe((status) => {
              if (status === 'CHANNEL_ERROR') {
                // Silently handle subscription errors
                console.debug('Notification subscription error');
              }
            });

          return () => {
            if (channel) {
              supabase.removeChannel(channel);
            }
          };
        } catch (error) {
          // Silently fail - subscription is optional
          return null;
        }
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
      console.debug('Error loading user for notifications:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    // Ensure session is ready before querying (RLS requires auth.uid())
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    try {
      // Get company_id if available
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, user);

      // If company_id was created, verify profile has it set (RLS requires this)
      if (companyId && user.id) {
        try {
          const { data: profileCheck } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .maybeSingle();

          // If profile doesn't have company_id, update it (RLS requires this match)
          if (profileCheck?.company_id !== companyId) {
            await supabase
              .from('profiles')
              .upsert({ id: user.id, company_id: companyId }, { onConflict: 'id' });
          }
        } catch (err) {
          console.debug('Error updating profile company_id:', err);
        }
      }

      // Always require at least one filter to pass RLS
      // Prefer user_id over company_id for RLS matching (more reliable)
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

      // Prefer user_id first (most reliable for RLS), then company_id, then user_email
      if (user.id) {
        query = query.eq('user_id', user.id);
      } else if (companyId) {
        query = query.eq('company_id', companyId);
      } else if (user.email) {
        query = query.eq('user_email', user.email);
      }

      const { data, error } = await query;

      if (error) {
        // Log but don't throw - gracefully handle errors
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

  // ALWAYS render the bell icon (even if user not loaded)
  // Only show dropdown if user is logged in
  
  console.log('🔔 NotificationBell rendering:', { user: !!user, unreadCount });
  
  return (
    <div className="relative inline-flex" style={{ border: '2px solid red' }}>
      <button
        onClick={() => {
          console.log('🔔 Bell clicked, user:', !!user);
          if (user) {
            setIsOpen(!isOpen);
          }
        }}
        className="relative inline-flex items-center justify-center
                   w-9 h-9 rounded-full
                   hover:bg-black/5
                   transition"
        aria-label="Notifications"
        type="button"
        style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)' }}
      >
        <Bell className="w-5 h-5 text-afrikoni-charcoal" style={{ stroke: '#000', strokeWidth: 2 }} />
        {user && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

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
            style={{
              position: 'fixed',
              zIndex: 9998,
            }}
          />
          {/* Notification Dropdown - Fixed positioning with portal-like rendering */}
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

