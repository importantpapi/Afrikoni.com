import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, MessageSquare, ShoppingCart, FileText, DollarSign, Shield, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
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
      const userData = await supabaseHelpers.auth.me();
      if (!userData) {
        navigate('/login');
        return;
      }

      const role = userData.role || userData.user_role || 'buyer';
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
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    if (filter === 'rfq') return n.type === 'rfq';
    if (filter === 'order') return n.type === 'order';
    if (filter === 'message') return n.type === 'message';
    if (filter === 'payment') return n.type === 'payment';
    return true;
  });

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
              <Button onClick={markSelectedAsRead} variant="outline" size="sm">
                <CheckSquare className="w-4 h-4 mr-2" />
                Mark Selected ({selectedNotifications.length})
              </Button>
            )}
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              Mark all as read
            </Button>
          )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-5 md:p-6">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter notifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({notifications.length})</SelectItem>
                <SelectItem value="unread">Unread ({unreadCount})</SelectItem>
                <SelectItem value="rfq">RFQs ({notifications.filter(n => n.type === 'rfq').length})</SelectItem>
                <SelectItem value="order">Orders ({notifications.filter(n => n.type === 'order').length})</SelectItem>
                <SelectItem value="message">Messages ({notifications.filter(n => n.type === 'message').length})</SelectItem>
                <SelectItem value="payment">Payments ({notifications.filter(n => n.type === 'payment').length})</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <EmptyState 
            type="notifications"
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description="You'll see notifications here when you receive messages, order updates, and more"
          />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={`hover:shadow-afrikoni-lg transition-all cursor-pointer ${
                    !notification.read ? 'bg-afrikoni-gold/5 border-afrikoni-gold/30' : ''
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
                          className="mt-1"
                        />
                        <div
                          onClick={() => handleNotificationClick(notification)}
                          className="flex items-start gap-4 flex-1"
                      >
                        <div className={`p-2 rounded-lg ${
                          notification.type === 'message' ? 'bg-afrikoni-gold/20 text-afrikoni-gold' :
                          notification.type === 'order' ? 'bg-afrikoni-gold/20 text-afrikoni-gold' :
                          notification.type === 'rfq' ? 'bg-afrikoni-gold/20 text-afrikoni-gold' :
                          notification.type === 'payment' ? 'bg-afrikoni-gold/20 text-afrikoni-gold' :
                          'bg-afrikoni-cream text-afrikoni-deep'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-afrikoni-chestnut">{notification.title}</h4>
                            {!notification.read && (
                              <Badge className="bg-afrikoni-gold text-afrikoni-chestnut">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-afrikoni-deep/70 mb-2">{notification.message}</p>
                          <p className="text-xs text-afrikoni-deep/50">
                            {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        {notification.read && (
                          <CheckCircle className="w-5 h-5 text-afrikoni-gold flex-shrink-0" />
                        )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


