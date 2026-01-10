import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, Package, Truck, FileCheck, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Deal Milestone Tracker
 * Reduces buyer/supplier anxiety by showing clear progress through trade lifecycle
 * Critical for maintaining confidence during the 24-48 hour window after RFQ match
 */

const MILESTONE_DEFINITIONS = {
  rfq_created: {
    label: 'RFQ Submitted',
    description: 'Your trade request has been received',
    icon: FileCheck,
    color: 'green'
  },
  rfq_matched: {
    label: 'Suppliers Matched',
    description: 'Verified suppliers are reviewing your request',
    icon: Shield,
    color: 'blue'
  },
  quotes_received: {
    label: 'Quotes Received',
    description: 'Suppliers have submitted offers',
    icon: Package,
    color: 'blue'
  },
  quote_awarded: {
    label: 'Supplier Selected',
    description: 'You\'ve chosen a supplier, order is being prepared',
    icon: CheckCircle2,
    color: 'green'
  },
  payment_pending: {
    label: 'Payment Pending',
    description: 'Awaiting payment to secure the order',
    icon: Clock,
    color: 'amber'
  },
  payment_secured: {
    label: 'Payment Secured',
    description: 'Payment held in escrow, supplier notified',
    icon: Shield,
    color: 'green'
  },
  order_processing: {
    label: 'Order Processing',
    description: 'Supplier is preparing your order',
    icon: Package,
    color: 'blue'
  },
  shipped: {
    label: 'Shipped',
    description: 'Your order is on its way',
    icon: Truck,
    color: 'blue'
  },
  delivered: {
    label: 'Delivered',
    description: 'Order delivered, awaiting your confirmation',
    icon: Package,
    color: 'amber'
  },
  completed: {
    label: 'Trade Complete',
    description: 'Payment released, trade successful',
    icon: CheckCircle2,
    color: 'green'
  }
};

export function DealMilestoneTracker({ 
  currentStatus, 
  milestones = [],
  orderNumber,
  estimatedDelivery,
  showCompact = false,
  className = ''
}) {
  // Determine which milestones to show based on current status
  const getRelevantMilestones = () => {
    const statusFlow = [
      'rfq_created',
      'rfq_matched',
      'quotes_received',
      'quote_awarded',
      'payment_secured',
      'order_processing',
      'shipped',
      'delivered',
      'completed'
    ];

    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex === -1) return statusFlow.slice(0, 4);

    // Show: completed steps + current step + next 2 steps
    return statusFlow.slice(0, Math.min(currentIndex + 3, statusFlow.length));
  };

  const relevantMilestones = getRelevantMilestones();

  const getMilestoneState = (milestoneKey) => {
    const milestone = milestones.find(m => m.status === milestoneKey);
    
    if (milestone?.completed) {
      return 'completed';
    }
    
    if (milestoneKey === currentStatus) {
      return 'current';
    }
    
    const statusFlow = [
      'rfq_created', 'rfq_matched', 'quotes_received', 'quote_awarded',
      'payment_secured', 'order_processing', 'shipped', 'delivered', 'completed'
    ];
    
    const currentIndex = statusFlow.indexOf(currentStatus);
    const milestoneIndex = statusFlow.indexOf(milestoneKey);
    
    if (milestoneIndex < currentIndex) {
      return 'completed';
    }
    
    return 'pending';
  };

  if (showCompact) {
    return (
      <div className={cn('flex items-center gap-2 py-2', className)}>
        {relevantMilestones.map((key, index) => {
          const definition = MILESTONE_DEFINITIONS[key];
          const state = getMilestoneState(key);
          const Icon = definition.icon;

          return (
            <React.Fragment key={key}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'p-1.5 rounded-full',
                  state === 'completed' && 'bg-green-100',
                  state === 'current' && 'bg-blue-100',
                  state === 'pending' && 'bg-gray-100'
                )}>
                  <Icon className={cn(
                    'w-4 h-4',
                    state === 'completed' && 'text-green-600',
                    state === 'current' && 'text-blue-600',
                    state === 'pending' && 'text-gray-400'
                  )} />
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  state === 'completed' && 'text-green-700',
                  state === 'current' && 'text-blue-700',
                  state === 'pending' && 'text-gray-500'
                )}>
                  {definition.label}
                </span>
              </div>
              {index < relevantMilestones.length - 1 && (
                <div className={cn(
                  'h-px w-8 flex-shrink-0',
                  state === 'completed' ? 'bg-green-300' : 'bg-gray-300'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={cn('border-afrikoni-gold/30', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-afrikoni-chestnut">Deal Progress</CardTitle>
          {orderNumber && (
            <Badge variant="outline" className="text-xs">
              Order #{orderNumber}
            </Badge>
          )}
        </div>
        {estimatedDelivery && (
          <p className="text-xs text-afrikoni-deep/60 mt-1">
            Estimated delivery: {new Date(estimatedDelivery).toLocaleDateString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {relevantMilestones.map((key, index) => {
            const definition = MILESTONE_DEFINITIONS[key];
            const state = getMilestoneState(key);
            const Icon = definition.icon;
            const milestone = milestones.find(m => m.status === key);

            return (
              <div key={key} className="flex items-start gap-3">
                {/* Icon and connector line */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'p-2 rounded-full border-2',
                    state === 'completed' && 'bg-green-50 border-green-500',
                    state === 'current' && 'bg-blue-50 border-blue-500 animate-pulse',
                    state === 'pending' && 'bg-gray-50 border-gray-300'
                  )}>
                    {state === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : state === 'current' ? (
                      <Clock className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  {index < relevantMilestones.length - 1 && (
                    <div className={cn(
                      'w-0.5 h-12 my-1',
                      state === 'completed' ? 'bg-green-300' : 'bg-gray-300'
                    )} />
                  )}
                </div>

                {/* Milestone content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn(
                      'font-semibold text-sm',
                      state === 'completed' && 'text-green-700',
                      state === 'current' && 'text-blue-700',
                      state === 'pending' && 'text-gray-500'
                    )}>
                      {definition.label}
                    </h3>
                    {state === 'current' && (
                      <Badge variant="default" className="text-xs bg-blue-100 text-blue-700">
                        In Progress
                      </Badge>
                    )}
                  </div>
                  <p className={cn(
                    'text-xs',
                    state === 'completed' && 'text-green-600',
                    state === 'current' && 'text-blue-600',
                    state === 'pending' && 'text-gray-500'
                  )}>
                    {definition.description}
                  </p>
                  {milestone?.timestamp && (
                    <p className="text-xs text-afrikoni-deep/50 mt-1">
                      {new Date(milestone.timestamp).toLocaleString()}
                    </p>
                  )}
                  {milestone?.notes && (
                    <p className="text-xs text-afrikoni-deep/70 mt-2 italic">
                      Note: {milestone.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* What's Next Section */}
        {currentStatus !== 'completed' && (
          <div className="mt-6 pt-6 border-t border-afrikoni-gold/20">
            <h4 className="text-sm font-semibold text-afrikoni-chestnut mb-2">
              What happens next?
            </h4>
            <p className="text-xs text-afrikoni-deep/70">
              {getNextStepDescription(currentStatus)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getNextStepDescription(currentStatus) {
  const nextSteps = {
    rfq_created: 'Afrikoni team is reviewing your RFQ to ensure quality and match you with the right suppliers. This typically takes 24-48 hours.',
    rfq_matched: 'Verified suppliers are reviewing your request and preparing quotes. You\'ll be notified as quotes come in.',
    quotes_received: 'Review the quotes carefully. Compare pricing, delivery times, and supplier credentials. Award to the supplier that best fits your needs.',
    quote_awarded: 'The order is being prepared. You\'ll receive payment instructions to secure your order with escrow protection.',
    payment_pending: 'Complete payment to secure your order. Funds will be held safely in escrow until delivery is confirmed.',
    payment_secured: 'Your payment is secure. The supplier has been notified and is preparing your order for shipment.',
    order_processing: 'Your order is being prepared. The supplier will update you on progress and provide shipping details soon.',
    shipped: 'Track your shipment. You\'ll be notified when it arrives. Inspect the goods carefully before confirming delivery.',
    delivered: 'Please confirm delivery and quality. Once confirmed, payment will be released to the supplier and the trade is complete.',
    completed: 'Trade completed successfully! You can leave a review for the supplier to help other buyers.'
  };

  return nextSteps[currentStatus] || 'Your order is progressing smoothly. We\'ll keep you updated on any changes.';
}

/**
 * Mini version for dashboards and lists
 */
export function DealMilestoneCompact({ currentStatus, className = '' }) {
  const definition = MILESTONE_DEFINITIONS[currentStatus] || MILESTONE_DEFINITIONS.rfq_created;
  const Icon = definition.icon;

  return (
    <div className={cn('flex items-center gap-2 px-2 py-1 rounded-md bg-blue-50 border border-blue-200', className)}>
      <Icon className="w-3.5 h-3.5 text-blue-600" />
      <span className="text-xs font-medium text-blue-700">{definition.label}</span>
    </div>
  );
}

