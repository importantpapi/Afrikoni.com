import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, Package, DollarSign, MessageSquare, AlertCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

/**
 * Smart Notification Center
 * Context-aware notifications that reduce noise and increase relevance
 * Groups related notifications, prioritizes by importance, suggests actions
 */

const NOTIFICATION_PRIORITIES = {
  URGENT: { level: 1, color: 'red', label: 'Urgent' },
  HIGH: { level: 2, color: 'amber', label: 'High' },
  MEDIUM: { level: 3, color: 'blue', label: 'Medium' },
  LOW: { level: 4, color: 'gray', label: 'Low' }
};

const NOTIFICATION_CATEGORIES = {
  PAYMENT: { icon: DollarSign, label: 'Payment', color: 'green' },
  ORDER: { icon: Package, label: 'Order Update', color: 'blue' },
  MESSAGE: { icon: MessageSquare, label: 'Message', color: 'purple' },
  RFQ: { icon: Clock, label: 'RFQ', color: 'amber' },
  ALERT: { icon: AlertCircle, label: 'Alert', color: 'red' }
};

export function SmartNotificationCenter({ notifications = [], onNotificationClick, onMarkAsRead, onMarkAllAsRead }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'urgent'

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.priority === 'URGENT' && !n.read).length;

  // Group notifications by context (same order/RFQ)
  const groupedNotifications = groupNotificationsByContext(notifications);

  // Apply filter
  const filteredGroups = groupedNotifications.filter(group => {
    if (filter === 'unread') return group.notifications.some(n => !n.read);
    if (filter === 'urgent') return group.notifications.some(n => n.priority === 'URGENT');
    return true;
  });

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-os-accent/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-afrikoni-cream hover:text-os-accent transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-os-accent text-afrikoni-chestnut text-os-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {urgentCount > 0 && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl border-2 border-os-accent/30 z-50 max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-os-accent/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-afrikoni-chestnut">Notifications</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-afrikoni-deep/40 hover:text-afrikoni-deep transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    className="text-os-xs h-auto py-1"
                  >
                    All ({notifications.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={filter === 'unread' ? 'default' : 'outline'}
                    onClick={() => setFilter('unread')}
                    className="text-os-xs h-auto py-1"
                  >
                    Unread ({unreadCount})
                  </Button>
                  {urgentCount > 0 && (
                    <Button
                      size="sm"
                      variant={filter === 'urgent' ? 'default' : 'outline'}
                      onClick={() => setFilter('urgent')}
                      className="text-os-xs h-auto py-1 bg-red-500 hover:bg-red-600 text-white"
                    >
                      Urgent ({urgentCount})
                    </Button>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-os-xs text-os-accent hover:underline mt-2"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {filteredGroups.length === 0 ? (
                  <div className="p-8 text-center text-afrikoni-deep/60">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-os-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-os-accent/10">
                    {filteredGroups.map(group => (
                      <NotificationGroup
                        key={group.id}
                        group={group}
                        onNotificationClick={onNotificationClick}
                        onMarkAsRead={onMarkAsRead}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotificationGroup({ group, onNotificationClick, onMarkAsRead }) {
  const [expanded, setExpanded] = useState(group.notifications.some(n => !n.read));
  const category = NOTIFICATION_CATEGORIES[group.category] || NOTIFICATION_CATEGORIES.ORDER;
  const CategoryIcon = category.icon;

  const unreadInGroup = group.notifications.filter(n => !n.read).length;
  const mostUrgent = group.notifications.reduce((max, n) => 
    NOTIFICATION_PRIORITIES[n.priority].level < NOTIFICATION_PRIORITIES[max.priority].level ? n : max
  );

  if (group.notifications.length === 1) {
    // Single notification - don't group
    const notification = group.notifications[0];
    return (
      <NotificationItem
        notification={notification}
        onNotificationClick={onNotificationClick}
        onMarkAsRead={onMarkAsRead}
      />
    );
  }

  return (
    <div className={cn(
      'p-3 hover:bg-os-accent/5 transition-colors cursor-pointer',
      unreadInGroup > 0 && 'bg-blue-50/50'
    )}>
      <div 
        className="flex items-start gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`p-2 rounded-lg bg-${category.color}-100 flex-shrink-0`}>
          <CategoryIcon className={`w-4 h-4 text-${category.color}-600`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-afrikoni-chestnut text-os-sm">
              {group.title}
            </span>
            {unreadInGroup > 0 && (
              <Badge variant="default" className="text-os-xs bg-os-accent text-afrikoni-chestnut">
                {unreadInGroup} new
              </Badge>
            )}
          </div>
          <p className="text-os-xs text-afrikoni-deep/70 mb-2">
            {group.notifications.length} updates
          </p>
          
          {expanded && (
            <div className="space-y-2 mt-3 pl-2 border-l-2 border-os-accent/30">
              {group.notifications.map(notification => (
                <div
                  key={notification.id}
                  className="text-os-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNotificationClick(notification);
                  }}
                >
                  <p className={cn(
                    'text-afrikoni-deep/80',
                    !notification.read && 'font-medium'
                  )}>
                    {notification.message}
                  </p>
                  <p className="text-afrikoni-deep/50 mt-0.5">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <ChevronRight className={cn(
          'w-4 h-4 text-afrikoni-deep/40 transition-transform flex-shrink-0',
          expanded && 'rotate-90'
        )} />
      </div>
    </div>
  );
}

function NotificationItem({ notification, onNotificationClick, onMarkAsRead }) {
  const category = NOTIFICATION_CATEGORIES[notification.category] || NOTIFICATION_CATEGORIES.ORDER;
  const CategoryIcon = category.icon;
  const priority = NOTIFICATION_PRIORITIES[notification.priority] || NOTIFICATION_PRIORITIES.MEDIUM;

  return (
    <div 
      className={cn(
        'p-3 hover:bg-os-accent/5 transition-colors cursor-pointer flex items-start gap-3',
        !notification.read && 'bg-blue-50/50'
      )}
      onClick={() => onNotificationClick(notification)}
    >
      <div className={`p-2 rounded-lg bg-${category.color}-100 flex-shrink-0`}>
        <CategoryIcon className={`w-4 h-4 text-${category.color}-600`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {notification.title && (
            <span className={cn(
              'font-medium text-os-sm',
              !notification.read ? 'text-afrikoni-chestnut' : 'text-afrikoni-deep/70'
            )}>
              {notification.title}
            </span>
          )}
          {priority.level <= 2 && (
            <Badge 
              variant="outline" 
              className={`text-os-xs bg-${priority.color}-50 text-${priority.color}-700 border-${priority.color}-200`}
            >
              {priority.label}
            </Badge>
          )}
        </div>
        <p className={cn(
          'text-os-xs mb-1',
          !notification.read ? 'text-afrikoni-deep' : 'text-afrikoni-deep/60'
        )}>
          {notification.message}
        </p>
        <p className="text-os-xs text-afrikoni-deep/50">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>

      {!notification.read && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead(notification.id);
          }}
          className="text-os-accent hover:text-os-accent/70 transition-colors flex-shrink-0"
          title="Mark as read"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Group notifications by context (same order, RFQ, etc.)
 */
function groupNotificationsByContext(notifications) {
  const groups = {};

  notifications.forEach(notification => {
    const contextId = notification.order_id || notification.rfq_id || notification.id;
    const contextType = notification.order_id ? 'order' : notification.rfq_id ? 'rfq' : 'other';
    
    if (!groups[contextId]) {
      groups[contextId] = {
        id: contextId,
        type: contextType,
        category: notification.category || 'ORDER',
        title: notification.context_title || notification.title || 'Updates',
        notifications: []
      };
    }
    
    groups[contextId].notifications.push(notification);
  });

  // Sort groups by most recent notification
  return Object.values(groups).sort((a, b) => {
    const aLatest = Math.max(...a.notifications.map(n => new Date(n.created_at).getTime()));
    const bLatest = Math.max(...b.notifications.map(n => new Date(n.created_at).getTime()));
    return bLatest - aLatest;
  });
}

/**
 * Notification priority calculator
 * Determines urgency based on content and context
 */
export function calculateNotificationPriority(notification) {
  const { type, category, message } = notification;

  // Urgent keywords
  const urgentKeywords = ['overdue', 'urgent', 'critical', 'failed', 'cancelled', 'dispute'];
  if (urgentKeywords.some(keyword => message?.toLowerCase().includes(keyword))) {
    return 'URGENT';
  }

  // High priority categories
  if (category === 'PAYMENT' || type === 'payment_overdue') {
    return 'HIGH';
  }

  if (category === 'ALERT') {
    return 'HIGH';
  }

  // Medium priority
  if (category === 'ORDER' || category === 'RFQ') {
    return 'MEDIUM';
  }

  // Low priority (messages, updates)
  return 'LOW';
}

