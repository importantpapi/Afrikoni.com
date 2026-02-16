import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { CardSkeleton } from '@/components/shared/ui/skeletons';
import ErrorState from '@/components/shared/ui/ErrorState';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Bell, CheckCircle, MessageSquare, ShoppingCart, FileText, DollarSign, Shield, CheckSquare, Search, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, startOfDay, differenceInDays } from 'date-fns';
import EmptyState from '@/components/shared/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Input } from '@/components/shared/ui/input';
import { Surface } from '@/components/system/Surface';
import { StatusBadge } from '@/components/system/StatusBadge';

export default function NotificationsCenter() {
  // ✅ FINAL 3% FIX: Use unified Dashboard Kernel with capabilities for hybrid check
  const { profileCompanyId, userId, canLoadData, capabilities, isSystemReady, isAdmin } = useDashboardKernel();

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const navigate = useNavigate();

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerWithTimeout message="Loading notifications..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    navigate('/login');
    return null;
  }

  // ✅ KERNEL MIGRATION: Use canLoadData guard
  useEffect(() => {
    if (!canLoadData) {
      return;
    }

    loadNotifications();

    // ✅ FULL-STACK SYNC: Listen to centralized DashboardRealtimeManager updates
    // DashboardRealtimeManager subscribes to notifications via dashboard-${companyId} channel
    // Listen for custom events dispatched by DashboardRealtimeManager
    const handleRealtimeUpdate = (event) => {
      if (event.detail?.table === 'notifications') {
        loadNotifications();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications();
      }
    };

    window.addEventListener('dashboard-realtime-update', handleRealtimeUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', loadNotifications);

    return () => {
      window.removeEventListener('dashboard-realtime-update', handleRealtimeUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', loadNotifications);
    };
  }, [canLoadData, profileCompanyId, userId, isAdmin, capabilities]);

  // ✅ FULL-STACK SYNC: Wrap loadNotifications in useCallback to fix dependency array
  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ✅ FULL-STACK SYNC: Removed role-based logic - use capabilities instead

      // ✅ KERNEL-SCHEMA ALIGNMENT: Admin users can access notifications without company_id
      // Always require at least one filter to pass RLS (unless admin)
      // Prefer user_id over company_id for RLS matching (more reliable)
      if (!userId && !profileCompanyId && !isAdmin) {
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      // ✅ FULL-STACK SYNC: Standardize isHybrid as (can_buy && can_sell)
      const isHybrid = capabilities?.can_buy === true && capabilities?.can_sell === true;
      const isAdminOrHybrid = isAdmin || isHybrid;

      // ✅ FULL-STACK SYNC: Admin/hybrid users can see all notifications - RLS policy handles filtering
      if (!isAdminOrHybrid) {
        // Regular users: apply filters
        if (userId) {
          query = query.eq('user_id', userId);
        } else if (profileCompanyId) {
          query = query.eq('company_id', profileCompanyId);
        }
      }
      // Admin/hybrid: query runs without filter - RLS policy allows access

      const { data, error } = await query;

      if (error) {
        // Handle specific error codes gracefully
        if (error.code === '42501') {
          // RLS policy violation - silent
        } else if (error.code === 'PGRST116') {
          // No rows found - this is OK
          setNotifications([]);
          return;
        } else {
          throw error;
        }
      }
      setNotifications(data || []);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [userId, profileCompanyId, isAdmin, capabilities]);

  // ✅ KERNEL MIGRATION: Use canLoadData guard
  useEffect(() => {
    if (!canLoadData) {
      return;
    }

    loadNotifications();

    // ✅ FULL-STACK SYNC: Listen to centralized DashboardRealtimeManager updates
    // DashboardRealtimeManager subscribes to notifications via dashboard-${companyId} channel
    // Listen for custom events dispatched by DashboardRealtimeManager
    const handleRealtimeUpdate = (event) => {
      if (event.detail?.table === 'notifications') {
        loadNotifications();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications();
      }
    };

    window.addEventListener('dashboard-realtime-update', handleRealtimeUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', loadNotifications);

    return () => {
      window.removeEventListener('dashboard-realtime-update', handleRealtimeUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', loadNotifications);
    };
  }, [canLoadData, loadNotifications]); // ✅ FINAL CLEANUP: Include loadNotifications in dependencies

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      // Error silently handled
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;
      toast.success('All notifications marked as read');
      loadNotifications();
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return MessageSquare;
      case 'order': return ShoppingCart;
      case 'rfq': return FileText;
      case 'payment': return DollarSign;
      case 'verification': return Shield;
      default: return Bell;
    }
  };

  const classifySignal = (notification) => {
    const type = notification?.type || '';
    if (['rfq', 'quote', 'opportunity'].includes(type)) return 'opportunities';
    if (['verification', 'kyc', 'compliance'].includes(type)) return 'compliance';
    if (['shipment', 'logistics', 'delivery'].includes(type)) return 'logistics';
    if (['message', 'support', 'support_ticket'].includes(type)) return 'messages';
    return 'alerts';
  };

  const filteredNotifications = notifications.filter(n => {
    let matches = true;
    if (filter === 'unread') matches = !n.read;
    else if (filter === 'read') matches = n.read;
    else if (['alerts', 'opportunities', 'compliance', 'logistics', 'messages'].includes(filter)) {
      matches = classifySignal(n) === filter;
    }

    if (searchQuery && matches) {
      const query = searchQuery.toLowerCase();
      matches =
        n.title?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query) ||
        n.type?.toLowerCase().includes(query);
    }

    return matches;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at);
    let groupKey;

    if (isToday(date)) {
      groupKey = 'Today';
    } else if (isYesterday(date)) {
      groupKey = 'Yesterday';
    } else if (isThisWeek(date)) {
      groupKey = 'This Week';
    } else if (isThisMonth(date)) {
      groupKey = 'This Month';
    } else {
      groupKey = format(date, 'MMMM yyyy');
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
    return groups;
  }, {});

  const markSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', selectedNotifications);

      if (error) throw error;
      toast.success(`${selectedNotifications.length} notification(s) marked as read`);
      setSelectedNotifications([]);
      loadNotifications();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedNotifications.length} notification(s)?`)) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', selectedNotifications);

      if (error) throw error;
      toast.success(`${selectedNotifications.length} notification(s) deleted`);
      setSelectedNotifications([]);
      loadNotifications();
    } catch (error) {
      toast.error('Failed to delete notifications');
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Notification deleted');
      loadNotifications();
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    // Navigate based on type and link
    if (notification.link) {
      navigate(notification.link);
    } else if (notification.type === 'order' && notification.related_id) {
      navigate(`/dashboard/orders/${notification.related_id}`);
    } else if (notification.type === 'rfq' && notification.related_id) {
      navigate(`/dashboard/rfqs/${notification.related_id}`);
    } else if (notification.type === 'message' && notification.related_id) {
      navigate(`/dashboard/messages?conversation=${notification.related_id}`);
    } else if (notification.type === 'support' || notification.type === 'support_ticket') {
      // Support notifications - navigate to support chat
      if (notification.related_id) {
        navigate(`/dashboard/support-chat?ticket=${notification.related_id}`);
      } else {
        navigate('/dashboard/support-chat');
      }
    } else if (notification.type === 'product' && notification.related_id) {
      navigate(`/dashboard/products/new?id=${notification.related_id}`);
    } else if (notification.type === 'dispute' && notification.related_id) {
      navigate(`/dashboard/disputes/${notification.related_id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ✅ KERNEL MIGRATION: Use unified loading state
  if (isLoading) {
    return <CardSkeleton count={3} />;
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadNotifications}
      />
    );
  }

  return (
    <div className="os-page os-stagger space-y-4 pb-10">
      <Surface variant="panel" className="p-6 os-rail-glow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="os-label">Signals Center</div>
            <h1 className="os-title mt-2">Signals Center</h1>
            <p className="text-os-sm text-os-muted mt-1">
              {unreadCount > 0 ? `${unreadCount} unread signals` : 'All signals processed.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label="LIVE" tone="info" />
            <StatusBadge label={filter.toUpperCase()} tone="neutral" />
          </div>
        </div>
      </Surface>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {selectedNotifications.length > 0 && (
            <>
              <Button onClick={markSelectedAsRead} variant="outline" size="sm">
                <CheckSquare className="w-4 h-4 mr-2" />
                Mark Read ({selectedNotifications.length})
              </Button>
              <Button onClick={deleteSelectedNotifications} variant="outline" size="sm" className="hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedNotifications.length})
              </Button>
            </>
          )}
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <Surface variant="panel" className="p-5">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All', count: notifications.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              { id: 'opportunities', label: 'Trade Opportunities' },
              { id: 'logistics', label: 'Logistics' },
              { id: 'compliance', label: 'Compliance' },
              { id: 'messages', label: 'Messages' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`
                  px-4 py-2 rounded-full text-os-xs font-bold transition-all whitespace-nowrap border
                  ${filter === tab.id
                    ? 'bg-os-accent text-black border-os-accent shadow-os-md shadow-os-accent/20'
                    : 'bg-white/5 text-os-muted border-white/10 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                {tab.label} {tab.count !== undefined && <span className="ml-1 opacity-60">({tab.count})</span>}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-os-muted" />
            <Input
              placeholder="Search signals by keyword, trade ID, or counterparty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 os-input h-11 bg-white/5 border-white/10 focus:border-os-accent/50"
            />
          </div>
        </div>
      </Surface>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          type="notifications"
          title={filter === 'unread' ? 'No unread notifications' : searchQuery ? 'No matching notifications' : 'No notifications yet'}
          description={searchQuery ? "Try adjusting your search or filter" : "You'll see notifications here when you receive messages, order updates, and more"}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
            <div key={groupKey}>
              <h3 className="text-os-sm font-semibold uppercase tracking-wide mb-3 px-2">
                {groupKey}
              </h3>
              <div className="space-y-3">
                {groupNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className={`os-panel-soft hover:shadow-os-md-lg transition-all cursor-pointer ${!notification.read ? 'border border-[rgba(212,169,55,0.3)] bg-[rgba(212,169,55,0.08)]' : 'border border-white/10 bg-white/5'
                        }`}>
                        <CardContent className="p-5 md:p-6">
                          <div className="flex items-start gap-4">
                            <input
                              type="checkbox"
                              checked={selectedNotifications.includes(notification.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedNotifications([...selectedNotifications, notification.id]);
                                } else {
                                  setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id));
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 w-4 h-4 rounded"
                            />
                            <div
                              onClick={() => handleNotificationClick(notification)}
                              className="flex items-start gap-4 flex-1"
                            >
                              <div className={`p-2.5 rounded-lg flex-shrink-0 ${notification.type === 'message' ? 'bg-blue-50 text-blue-600' :
                                notification.type === 'order' ? 'bg-os-accent/20 text-os-accent' :
                                  notification.type === 'rfq' || notification.type === 'quote' ? 'bg-purple-50 text-purple-600' :
                                    notification.type === 'payment' ? 'bg-green-50 text-green-600' :
                                      notification.type === 'review' ? 'bg-yellow-50 text-yellow-600' :
                                        'bg-afrikoni-cream text-afrikoni-deep'
                                }`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1 gap-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <h4 className="font-semibold">{notification.title}</h4>
                                    <Badge
                                      variant="outline"
                                      className={`text-os-xs ${notification.type === 'order' ? 'border-os-accent text-os-accent' :
                                        notification.type === 'message' ? 'border-blue-500 text-blue-600' :
                                          notification.type === 'payment' ? 'border-green-500 text-green-600' :
                                            'border-gray-300 text-gray-600'
                                        }`}
                                    >
                                      {notification.type}
                                    </Badge>
                                  </div>
                                  {!notification.read && (
                                    <Badge className="text-os-xs">New</Badge>
                                  )}
                                </div>
                                <p className="text-os-sm mb-2">{notification.message}</p>
                                <p className="text-os-xs">
                                  {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Reply button for support and message notifications */}
                                {(notification.type === 'support' || notification.type === 'support_ticket' || notification.type === 'message') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-os-xs hover:bg-os-accent hover:text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (notification.type === 'support' || notification.type === 'support_ticket') {
                                        navigate(`/dashboard/support-chat${notification.related_id ? `?ticket=${notification.related_id}` : ''}`);
                                      } else if (notification.type === 'message' && notification.related_id) {
                                        navigate(`/dashboard/messages?conversation=${notification.related_id}`);
                                      }
                                    }}
                                  >
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    Reply
                                  </Button>
                                )}
                                {notification.read && (
                                  <CheckCircle className="w-5 h-5" />
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:text-red-600"
                                  onClick={(e) => deleteNotification(notification.id, e)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
