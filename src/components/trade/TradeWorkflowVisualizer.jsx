/**
 * TradeWorkflowVisualizer - Visual Order Progress Tracker
 *
 * Displays the current status of an order through the Afrikoni trade workflow.
 * Shows completed, current, and upcoming steps with animations.
 *
 * Trade Workflow Steps:
 * 1. RFQ Submitted - Buyer creates request for quote
 * 2. Quotes Received - Suppliers respond with quotes
 * 3. Order Confirmed - Buyer accepts quote, order created
 * 4. Payment Secured - Payment held in escrow
 * 5. Production/Preparation - Supplier prepares goods
 * 6. Quality Check - Goods inspected (optional)
 * 7. Shipped - Goods dispatched
 * 8. In Transit - Goods being transported
 * 9. Customs Clearance - Cross-border processing
 * 10. Delivered - Goods received by buyer
 * 11. Completed - Order finalized, payment released
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Shield,
  Package,
  ClipboardCheck,
  Truck,
  Navigation,
  Building,
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  Info
} from 'lucide-react';
import { Tooltip } from '@/components/shared/ui/tooltip';

// Define workflow steps with icons and descriptions
const WORKFLOW_STEPS = [
  {
    id: 'rfq_submitted',
    label: 'RFQ Submitted',
    shortLabel: 'RFQ',
    icon: FileText,
    description: 'Your request for quote was submitted to suppliers',
    estimatedTime: null
  },
  {
    id: 'quotes_received',
    label: 'Quotes Received',
    shortLabel: 'Quotes',
    icon: MessageSquare,
    description: 'Suppliers have responded with pricing and terms',
    estimatedTime: '1-3 days'
  },
  {
    id: 'order_confirmed',
    label: 'Order Confirmed',
    shortLabel: 'Confirmed',
    icon: CheckCircle,
    description: 'You accepted a quote and the order is confirmed',
    estimatedTime: null
  },
  {
    id: 'payment_secured',
    label: 'Payment Secured',
    shortLabel: 'Payment',
    icon: Shield,
    description: 'Payment is held securely in Afrikoni escrow',
    estimatedTime: null
  },
  {
    id: 'processing',
    label: 'Processing',
    shortLabel: 'Processing',
    icon: Package,
    description: 'Supplier is preparing your order',
    estimatedTime: '3-7 days'
  },
  {
    id: 'quality_check',
    label: 'Quality Check',
    shortLabel: 'QC',
    icon: ClipboardCheck,
    description: 'Goods are being inspected for quality',
    estimatedTime: '1-2 days',
    optional: true
  },
  {
    id: 'shipped',
    label: 'Shipped',
    shortLabel: 'Shipped',
    icon: Truck,
    description: 'Order has been dispatched for delivery',
    estimatedTime: null
  },
  {
    id: 'in_transit',
    label: 'In Transit',
    shortLabel: 'Transit',
    icon: Navigation,
    description: 'Goods are on their way to destination',
    estimatedTime: '7-21 days'
  },
  {
    id: 'customs',
    label: 'Customs Clearance',
    shortLabel: 'Customs',
    icon: Building,
    description: 'Processing through customs (cross-border orders)',
    estimatedTime: '2-5 days',
    optional: true
  },
  {
    id: 'delivered',
    label: 'Delivered',
    shortLabel: 'Delivered',
    icon: MapPin,
    description: 'Order has been delivered to your location',
    estimatedTime: null
  },
  {
    id: 'completed',
    label: 'Completed',
    shortLabel: 'Complete',
    icon: Star,
    description: 'Order finalized and payment released to supplier',
    estimatedTime: null
  }
];

// Map order status to workflow step index
const STATUS_TO_STEP_MAP = {
  'pending': 2, // Order confirmed but not paid
  'awaiting_payment': 2,
  'payment_secured': 3,
  'processing': 4,
  'quality_check': 5,
  'shipped': 6,
  'in_transit': 7,
  'customs': 8,
  'delivered': 9,
  'completed': 10,
  'cancelled': -1,
  'disputed': -2
};

/**
 * TradeWorkflowVisualizer Component
 *
 * @param {Object} props
 * @param {string} props.status - Current order status
 * @param {string} props.paymentStatus - Payment status (pending, paid, released)
 * @param {boolean} props.isCrossBorder - Whether order involves cross-border shipping
 * @param {boolean} props.hasQualityCheck - Whether order includes quality inspection
 * @param {Date} props.createdAt - Order creation date
 * @param {Date} props.estimatedDelivery - Estimated delivery date
 * @param {Array} props.events - Array of order events/timeline
 * @param {string} props.variant - Display variant: 'full' | 'compact' | 'minimal'
 */
export default function TradeWorkflowVisualizer({
  status = 'pending',
  paymentStatus = 'pending',
  isCrossBorder = false,
  hasQualityCheck = false,
  createdAt,
  estimatedDelivery,
  events = [],
  variant = 'full'
}) {
  const [isExpanded, setIsExpanded] = useState(variant === 'full');
  const [activeSteps, setActiveSteps] = useState([]);

  // Calculate which steps are active based on order type
  useEffect(() => {
    let steps = [...WORKFLOW_STEPS];

    // Remove optional steps if not applicable
    if (!hasQualityCheck) {
      steps = steps.filter(s => s.id !== 'quality_check');
    }
    if (!isCrossBorder) {
      steps = steps.filter(s => s.id !== 'customs');
    }

    setActiveSteps(steps);
  }, [isCrossBorder, hasQualityCheck]);

  // Get current step index
  const getCurrentStepIndex = () => {
    const baseIndex = STATUS_TO_STEP_MAP[status] ?? 0;

    // Adjust for removed optional steps
    let adjustedIndex = baseIndex;

    if (!hasQualityCheck && baseIndex > 5) {
      adjustedIndex -= 1;
    }
    if (!isCrossBorder && adjustedIndex > 7) {
      adjustedIndex -= 1;
    }

    return Math.max(0, Math.min(adjustedIndex, activeSteps.length - 1));
  };

  const currentStepIndex = getCurrentStepIndex();
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';
  const isDisputed = status === 'disputed';

  // Calculate progress percentage
  const progressPercent = isCompleted
    ? 100
    : Math.round((currentStepIndex / (activeSteps.length - 1)) * 100);

  // Get step status
  const getStepStatus = (index) => {
    if (isCancelled || isDisputed) return 'inactive';
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'upcoming';
  };

  // Render minimal variant (just progress bar)
  if (variant === 'minimal') {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-os-sm font-medium">
            {isCompleted ? 'Order Complete' : activeSteps[currentStepIndex]?.label || 'Processing'}
          </span>
          <span className="text-os-sm">{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${isCompleted
              ? 'bg-green-500'
              : isCancelled
                ? 'bg-red-500'
                : 'bg-os-accent'
              }`}
          />
        </div>
      </div>
    );
  }

  // Render compact variant (horizontal stepper)
  if (variant === 'compact') {
    return (
      <div className="w-full p-4 rounded-os-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Order Progress</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-os-sm hover:underline flex items-center gap-1"
          >
            {isExpanded ? 'Hide details' : 'Show details'}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Horizontal progress */}
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-4 left-4 right-4 h-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full"
            />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between relative">
            {activeSteps.map((step, index) => {
              const status = getStepStatus(index);
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${status === 'completed'
                      ? 'bg-green-500 text-white'
                      : status === 'current'
                        ? 'bg-os-accent text-white ring-4 ring-os-accent/20'
                        : 'bg-stone-200 text-stone-400'
                      }`}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`mt-2 text-os-xs text-center ${status === 'current'
                    ? 'font-semibold text-os-accent'
                    : status === 'completed'
                      ? 'text-green-600'
                      : 'text-stone-400'
                    }`}>
                    {step.shortLabel}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t overflow-hidden"
            >
              <div className="space-y-3">
                {activeSteps[currentStepIndex] && (
                  <div className="flex items-start gap-3 p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                      {React.createElement(activeSteps[currentStepIndex].icon, {
                        className: 'w-5 h-5 text-os-accent'
                      })}
                    </div>
                    <div>
                      <p className="font-medium">
                        {activeSteps[currentStepIndex].label}
                      </p>
                      <p className="text-os-sm">
                        {activeSteps[currentStepIndex].description}
                      </p>
                      {activeSteps[currentStepIndex].estimatedTime && (
                        <p className="text-os-xs mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Est. {activeSteps[currentStepIndex].estimatedTime}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {estimatedDelivery && (
                  <div className="flex items-center gap-2 text-os-sm">
                    <MapPin className="w-4 h-4" />
                    <span>
                      Estimated delivery: {new Date(estimatedDelivery).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full variant (vertical timeline)
  return (
    <div className="w-full rounded-os-sm border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Trade Workflow</h3>
            <p className="text-os-sm mt-0.5">
              Track your order progress from quote to delivery
            </p>
          </div>
          <div className="text-right">
            <div className="text-os-2xl font-bold">{progressPercent}%</div>
            <p className="text-os-xs">Complete</p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4 h-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${isCompleted
              ? 'bg-gradient-to-r from-green-500 to-green-400'
              : isCancelled
                ? 'bg-red-500'
                : 'bg-gradient-to-r from-os-accent to-amber-500'
              }`}
          />
        </div>
      </div>

      {/* Status alert for special states */}
      {(isCancelled || isDisputed) && (
        <div className={`px-6 py-3 flex items-center gap-3 ${isCancelled ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
          }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">
              {isCancelled ? 'Order Cancelled' : 'Order Under Dispute'}
            </p>
            <p className="text-os-sm opacity-80">
              {isCancelled
                ? 'This order has been cancelled. Payment will be refunded if applicable.'
                : 'A dispute has been raised. Our team is reviewing the case.'}
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="px-6 py-6">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5" />

          {/* Steps */}
          <div className="space-y-0">
            {activeSteps.map((step, index) => {
              const stepStatus = getStepStatus(index);
              const Icon = step.icon;
              const isLast = index === activeSteps.length - 1;

              // Tooltip content map
              const tooltips = {
                'payment_secured': "Your funds are held safely in escrow and only released when you confirm delivery.",
                'quality_check': "Verified inspectors check your goods before shipment to ensure quality.",
                'customs': "We handle all customs paperwork and duties for cross-border shipments.",
                'rfq_submitted': "Your Request for Quote is visible to verified suppliers.",
              };

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative pl-12 pb-6 ${isLast ? 'pb-0' : ''}`}
                >
                  {/* Step indicator */}
                  <div className="absolute left-0 z-10">
                    <Tooltip content={tooltips[step.id] || step.description} position="right">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-help ${stepStatus === 'completed'
                          ? 'bg-green-500 text-white'
                          : stepStatus === 'current'
                            ? 'bg-os-accent text-white ring-4 ring-os-accent/20 shadow-os-md'
                            : 'bg-stone-100 text-stone-400 border-2 border-stone-200'
                          }`}
                      >
                        {stepStatus === 'completed' ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                    </Tooltip>
                  </div>

                  {/* Progress line fill */}
                  {!isLast && stepStatus === 'completed' && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: '100%' }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="absolute left-[15px] top-8 w-0.5"
                      style={{ bottom: 0 }}
                    />
                  )}

                  {/* Step content */}
                  <div className={`${stepStatus === 'current'
                    ? 'bg-os-accent/5 -mx-3 px-3 py-2 rounded-lg'
                    : ''
                    }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className={`font-medium ${stepStatus === 'completed'
                          ? 'text-green-600'
                          : stepStatus === 'current'
                            ? 'text-os-accent'
                            : 'text-stone-400'
                          }`}>
                          {step.label}
                          {step.optional && (
                            <span className="ml-2 text-os-xs font-normal">
                              (Optional)
                            </span>
                          )}
                        </h4>
                        <p className={`text-os-sm mt-0.5 ${stepStatus === 'upcoming' ? 'text-stone-300' : 'text-stone-500'
                          }`}>
                          {step.description}
                        </p>
                      </div>

                      {step.estimatedTime && stepStatus === 'current' && (
                        <div className="flex items-center gap-1 text-os-xs px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          {step.estimatedTime}
                        </div>
                      )}
                    </div>

                    {/* Event timestamps from events array */}
                    {events
                      .filter(e => e.step === step.id)
                      .map((event, i) => (
                        <div key={i} className="mt-2 text-os-xs flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {new Date(event.timestamp).toLocaleString()}
                          {event.note && <span>- {event.note}</span>}
                        </div>
                      ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer with delivery estimate */}
      {estimatedDelivery && !isCompleted && !isCancelled && (
        <div className="px-6 py-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-os-sm font-medium">Estimated Delivery</p>
              <p className="text-os-sm">
                {new Date(estimatedDelivery).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Escrow protection notice */}
      {paymentStatus === 'paid' && !isCompleted && (
        <div className="px-6 py-3 border-t flex items-center gap-3">
          <Shield className="w-5 h-5 flex-shrink-0" />
          <div className="text-os-sm">
            <span className="font-medium">Protected by Afrikoni Escrow</span>
            <span className="ml-1">- Payment held securely until delivery confirmed</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Export step definitions for use in other components
export { WORKFLOW_STEPS, STATUS_TO_STEP_MAP };
