import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, MessageSquare, ShoppingCart, FileText, DollarSign, Shield, CheckSquare, Search, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, startOfDay, differenceInDays } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [currentRole, setCurrentRole] = useState('buyer');
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('notifications-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user: userData, role: userRole } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!userData) {
        navigate('/login');
        return;
      }

      const role = userRole || userData.role || userData.user_role || 'buyer';
      setCurrentRole(role === 'logistics_partner' ? 'logistics' : role);

      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, userData);

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else if (userData.id) {
        query = query.eq('user_id', userData.id);
      } else {
        query = query.eq('user_email', userData.email);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

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

  const filteredNotifications = notifications.filter(n => {
    // Filter by type
    let matches = true;
    if (filter === 'unread') matches = !n.read;
    else if (filter === 'read') matches = n.read;
    else if (filter === 'rfq') matches = n.type === 'rfq' || n.type === 'quote';
    else if (filter === 'order') matches = n.type === 'order';
    else if (filter === 'message') matches = n.type === 'message';
    else if (filter === 'payment') matches = n.type === 'payment';
    else if (filter === 'review') matches = n.type === 'review';
    
    // Filter by search query
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
      navigate(`/messages?conversation=${notification.related_id}`);
    } else if (notification.type === 'product' && notification.related_id) {
      navigate(`/dashboard/products/new?id=${notification.related_id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <DashboardLayout currentRole={currentRole}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentRole={currentRole}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut">Notifications</h1>
            <p className="text-afrikoni-deep mt-0.5 text-xs md:text-sm">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedNotifications.length > 0 && (
              <>
                <Button onClick={markSelectedAsRead} variant="outline" size="sm">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Mark Read ({selectedNotifications.length})
                </Button>
                <Button onClick={deleteSelectedNotifications} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
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

        {/* Filters & Search */}
        <Card className="border-afrikoni-gold/20 shadow-premium bg-white rounded-afrikoni-lg">
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-afrikoni-text-dark/50" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-afrikoni-gold/30"
                  />
                </div>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full md:w-48 border-afrikoni-gold/30">
                  <SelectValue placeholder="Filter notifications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({notifications.length})</SelectItem>
                  <SelectItem value="unread">Unread ({unreadCount})</SelectItem>
                  <SelectItem value="rfq">RFQs ({notifications.filter(n => n.type === 'rfq' || n.type === 'quote').length})</SelectItem>
                  <SelectItem value="order">Orders ({notifications.filter(n => n.type === 'order').length})</SelectItem>
                  <SelectItem value="message">Messages ({notifications.filter(n => n.type === 'message').length})</SelectItem>
                  <SelectItem value="payment">Payments ({notifications.filter(n => n.type === 'payment').length})</SelectItem>
                  <SelectItem value="review">Reviews ({notifications.filter(n => n.type === 'review').length})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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
                <h3 className="text-sm font-semibold text-afrikoni-text-dark/70 uppercase tracking-wide mb-3 px-2">
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
                        <Card className={`hover:shadow-premium-lg transition-all cursor-pointer border-afrikoni-gold/20 ${
                          !notification.read ? 'bg-afrikoni-gold/5 border-afrikoni-gold/40' : 'bg-white'
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
                                className="mt-1 w-4 h-4 text-afrikoni-gold border-afrikoni-gold/30 rounded"
                              />
                              <div
                                onClick={() => handleNotificationClick(notification)}
                                className="flex items-start gap-4 flex-1"
                              >
                                <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                                  notification.type === 'message' ? 'bg-blue-50 text-blue-600' :
                                  notification.type === 'order' ? 'bg-afrikoni-gold/20 text-afrikoni-gold' :
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
                                      <h4 className="font-semibold text-afrikoni-text-dark">{notification.title}</h4>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          notification.type === 'order' ? 'border-afrikoni-gold text-afrikoni-gold' :
                                          notification.type === 'message' ? 'border-blue-500 text-blue-600' :
                                          notification.type === 'payment' ? 'border-green-500 text-green-600' :
                                          'border-gray-300 text-gray-600'
                                        }`}
                                      >
                                        {notification.type}
                                      </Badge>
                                    </div>
                                    {!notification.read && (
                                      <Badge className="bg-afrikoni-gold text-white text-xs">New</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-afrikoni-text-dark/70 mb-2">{notification.message}</p>
                                  <p className="text-xs text-afrikoni-text-dark/50">
                                    {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {notification.read && (
                                    <CheckCircle className="w-5 h-5 text-afrikoni-gold" />
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-afrikoni-text-dark/50 hover:text-red-600"
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
    </DashboardLayout>
  );
}


