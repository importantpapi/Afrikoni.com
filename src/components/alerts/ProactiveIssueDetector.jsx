import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, DollarSign, Package, TrendingDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Proactive Issue Detector
 * Catches problems before they become disputes
 * Alerts buyers and suppliers to take preventive action
 */

const ISSUE_TYPES = {
  PAYMENT_DELAY: {
    icon: DollarSign,
    color: 'red',
    severity: 'high',
    title: 'Payment Overdue',
    category: 'payment'
  },
  DELIVERY_DELAY: {
    icon: Clock,
    color: 'amber',
    severity: 'medium',
    title: 'Delivery Delay Risk',
    category: 'delivery'
  },
  LOW_COMMUNICATION: {
    icon: Package,
    color: 'blue',
    severity: 'low',
    title: 'Low Communication',
    category: 'communication'
  },
  QUALITY_CONCERN: {
    icon: AlertTriangle,
    color: 'red',
    severity: 'high',
    title: 'Quality Concern',
    category: 'quality'
  },
  MISSING_DOCUMENTS: {
    icon: Package,
    color: 'amber',
    severity: 'medium',
    title: 'Missing Documents',
    category: 'documentation'
  }
};

export function ProactiveIssueAlert({ issue, onDismiss, onTakeAction, className = '' }) {
  const issueType = ISSUE_TYPES[issue.type] || ISSUE_TYPES.LOW_COMMUNICATION;
  const Icon = issueType.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn('', className)}
      >
        <Card className={`border-2 border-${issueType.color}-300 bg-${issueType.color}-50`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-${issueType.color}-100 flex-shrink-0`}>
                <Icon className={`w-5 h-5 text-${issueType.color}-600`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold text-${issueType.color}-900`}>
                        {issueType.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className={`text-os-xs bg-${issueType.color}-100 text-${issueType.color}-700 border-${issueType.color}-300`}
                      >
                        {issueType.severity} priority
                      </Badge>
                    </div>
                    <p className={`text-os-sm text-${issueType.color}-800 mb-3`}>
                      {issue.description}
                    </p>
                  </div>
                  <button
                    onClick={onDismiss}
                    className={`text-${issueType.color}-600 hover:text-${issueType.color}-800 transition-colors flex-shrink-0`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Recommended Actions */}
                {issue.recommendedActions && issue.recommendedActions.length > 0 && (
                  <div className="space-y-2">
                    <p className={`text-os-xs font-medium text-${issueType.color}-900`}>
                      Recommended actions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {issue.recommendedActions.map((action, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant="outline"
                          onClick={() => onTakeAction(action)}
                          className={`text-os-xs h-auto py-1.5 border-${issueType.color}-300 hover:bg-${issueType.color}-100`}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Impact if not resolved */}
                {issue.impact && (
                  <div className={`mt-3 pt-3 border-t border-${issueType.color}-200`}>
                    <p className={`text-os-xs text-${issueType.color}-700 italic`}>
                      ⚠️ {issue.impact}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Issue Detection Rules Engine
 */
export function detectOrderIssues(order, shipment = null, payments = [], messages = []) {
  const issues = [];
  const now = new Date();

  // 1. Payment Delay Detection
  if (order.payment_status === 'pending') {
    const daysSinceOrder = Math.floor((now - new Date(order.created_at)) / (1000 * 60 * 60 * 24));
    
    if (daysSinceOrder > 7) {
      issues.push({
        id: `payment-delay-${order.id}`,
        type: 'PAYMENT_DELAY',
        orderId: order.id,
        description: `Payment has been pending for ${daysSinceOrder} days. Supplier is waiting to start production.`,
        impact: 'Delayed payment may result in order cancellation or increased delivery time.',
        recommendedActions: [
          { label: 'Complete Payment Now', action: 'pay_order', params: { orderId: order.id } },
          { label: 'Contact Supplier', action: 'message_supplier', params: { orderId: order.id } }
        ],
        detectedAt: now,
        severity: daysSinceOrder > 14 ? 'high' : 'medium'
      });
    }
  }

  // 2. Delivery Delay Risk
  if (order.estimated_delivery && shipment) {
    const estimatedDate = new Date(order.estimated_delivery);
    const daysUntilDelivery = Math.floor((estimatedDate - now) / (1000 * 60 * 60 * 24));
    
    if (shipment.status === 'pending' && daysUntilDelivery < 3) {
      issues.push({
        id: `delivery-delay-${order.id}`,
        type: 'DELIVERY_DELAY',
        orderId: order.id,
        description: `Order has not shipped yet, but estimated delivery is in ${daysUntilDelivery} days. Delay is likely.`,
        impact: 'Order may arrive later than expected. Consider extending timeline or requesting update.',
        recommendedActions: [
          { label: 'Request Status Update', action: 'request_update', params: { orderId: order.id } },
          { label: 'Contact Supplier', action: 'message_supplier', params: { orderId: order.id } }
        ],
        detectedAt: now,
        severity: 'medium'
      });
    }

    // Already past estimated delivery
    if (now > estimatedDate && order.status !== 'delivered' && order.status !== 'completed') {
      issues.push({
        id: `overdue-delivery-${order.id}`,
        type: 'DELIVERY_DELAY',
        orderId: order.id,
        description: `Order is ${Math.floor((now - estimatedDate) / (1000 * 60 * 60 * 24))} days overdue.`,
        impact: 'Significant delay. Consider opening a support ticket if supplier is unresponsive.',
        recommendedActions: [
          { label: 'Contact Supplier Urgently', action: 'urgent_message', params: { orderId: order.id } },
          { label: 'Open Support Ticket', action: 'create_support_ticket', params: { orderId: order.id } }
        ],
        detectedAt: now,
        severity: 'high'
      });
    }
  }

  // 3. Low Communication Detection
  if (order.status === 'processing' || order.status === 'shipped') {
    const daysSinceLastMessage = messages.length > 0
      ? Math.floor((now - new Date(messages[messages.length - 1].created_at)) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLastMessage > 7) {
      issues.push({
        id: `low-communication-${order.id}`,
        type: 'LOW_COMMUNICATION',
        orderId: order.id,
        description: `No communication from ${order.seller_company_id === order.current_user_company ? 'buyer' : 'supplier'} for ${daysSinceLastMessage} days.`,
        impact: 'Lack of updates can create uncertainty. Regular communication builds trust.',
        recommendedActions: [
          { label: 'Send Update Request', action: 'request_update', params: { orderId: order.id } },
          { label: 'Provide Status Update', action: 'send_update', params: { orderId: order.id } }
        ],
        detectedAt: now,
        severity: 'low'
      });
    }
  }

  // 4. Missing Documentation
  if (order.status === 'shipped' && shipment && !shipment.tracking_number) {
    issues.push({
      id: `missing-tracking-${order.id}`,
      type: 'MISSING_DOCUMENTS',
      orderId: order.id,
      description: 'Shipment marked as shipped but no tracking number provided.',
      impact: 'Buyer cannot track delivery. This reduces confidence and may delay payment release.',
      recommendedActions: [
        { label: 'Add Tracking Number', action: 'add_tracking', params: { orderId: order.id } }
      ],
      detectedAt: now,
      severity: 'medium'
    });
  }

  return issues;
}

/**
 * Dashboard widget showing all active issues
 */
export function IssuesDashboardWidget({ orders = [], onIssueAction, className = '' }) {
  const [dismissedIssues, setDismissedIssues] = useState([]);
  const [allIssues, setAllIssues] = useState([]);

  useEffect(() => {
    const detectedIssues = [];
    orders.forEach(order => {
      const orderIssues = detectOrderIssues(order, order.shipment, order.payments, order.messages || []);
      detectedIssues.push(...orderIssues);
    });
    
    // Filter out dismissed issues
    const activeIssues = detectedIssues.filter(issue => !dismissedIssues.includes(issue.id));
    setAllIssues(activeIssues);
  }, [orders, dismissedIssues]);

  const handleDismiss = (issueId) => {
    setDismissedIssues(prev => [...prev, issueId]);
    localStorage.setItem('afrikoni_dismissed_issues', JSON.stringify([...dismissedIssues, issueId]));
  };

  const handleTakeAction = (issue, action) => {
    if (onIssueAction) {
      onIssueAction(issue, action);
    }
    // Optionally dismiss after action
    handleDismiss(issue.id);
  };

  if (allIssues.length === 0) {
    return null;
  }

  // Sort by severity: high > medium > low
  const sortedIssues = [...allIssues].sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-afrikoni-chestnut flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          Proactive Alerts ({allIssues.length})
        </h3>
        <Badge variant="outline" className="text-os-xs">
          {allIssues.filter(i => i.severity === 'high').length} high priority
        </Badge>
      </div>
      
      <div className="space-y-3">
        {sortedIssues.map(issue => (
          <ProactiveIssueAlert
            key={issue.id}
            issue={issue}
            onDismiss={() => handleDismiss(issue.id)}
            onTakeAction={(action) => handleTakeAction(issue, action)}
          />
        ))}
      </div>
    </div>
  );
}

