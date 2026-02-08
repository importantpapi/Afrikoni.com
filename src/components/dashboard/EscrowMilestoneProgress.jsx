import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import {
  ShieldCheck, DollarSign, Truck, Package, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';

/**
 * EscrowMilestoneProgress - Escrow progress bar tied to logistics milestones
 *
 * Shows how escrow funds are released as trade milestones are hit:
 * 1. Order Confirmation (escrow funded) - 30%
 * 2. Shipment Confirmation (bill of lading) - 40%
 * 3. Delivery Confirmation (goods inspected) - 30%
 */

const MILESTONES = [
  {
    id: 'order_confirmed',
    label: 'Order Confirmation',
    description: 'Escrow funded',
    icon: DollarSign,
    releasePercent: 30,
  },
  {
    id: 'shipment_confirmed',
    label: 'Shipment Confirmation',
    description: 'Bill of lading confirmed',
    icon: Truck,
    releasePercent: 40,
  },
  {
    id: 'delivery_confirmed',
    label: 'Delivery Confirmation',
    description: 'Goods received & inspected',
    icon: Package,
    releasePercent: 30,
  },
];

function getMilestoneStatus(milestoneId, currentMilestone) {
  const order = ['order_confirmed', 'shipment_confirmed', 'delivery_confirmed'];
  const currentIdx = order.indexOf(currentMilestone);
  const milestoneIdx = order.indexOf(milestoneId);

  if (milestoneIdx < currentIdx) return 'completed';
  if (milestoneIdx === currentIdx) return 'active';
  return 'pending';
}

export default function EscrowMilestoneProgress({
  totalAmount = 64000,
  releasedAmount = 19200,
  heldAmount = 44800,
  currentMilestone = 'order_confirmed',
  fxRate = null,
  className = '',
}) {
  const releaseProgress = totalAmount > 0 ? Math.round((releasedAmount / totalAmount) * 100) : 0;

  return (
    <Card className={`border-afrikoni-gold/20 bg-white dark:bg-[#1A1A1A] rounded-afrikoni-lg shadow-premium ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-afrikoni-charcoal dark:text-[#F5F0E8] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-afrikoni-green" />
            Escrow Status
          </CardTitle>
          <Badge className="bg-afrikoni-green/15 text-afrikoni-green border-afrikoni-green/30">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Amount Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <DollarSign className="w-3 h-3" /> TOTAL
            </div>
            <p className="text-lg font-bold text-afrikoni-charcoal dark:text-[#F5F0E8]">
              ${totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <div className="text-xs text-afrikoni-green font-medium mb-1">RELEASED</div>
            <p className="text-lg font-bold text-afrikoni-green">
              ${releasedAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-afrikoni-gold mb-1">
              <Clock className="w-3 h-3" /> HELD
            </div>
            <p className="text-lg font-bold text-afrikoni-gold">
              ${heldAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Release Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span>Release Progress</span>
            <span className="font-medium">{releaseProgress}%</span>
          </div>
          <div className="h-2.5 bg-gray-200 dark:bg-[#2A2A2A] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${releaseProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-afrikoni-green to-afrikoni-gold rounded-full"
            />
          </div>
        </div>

        {/* Payment Milestones */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Payment Milestones
          </p>
          {MILESTONES.map((milestone, i) => {
            const status = getMilestoneStatus(milestone.id, currentMilestone);
            const Icon = milestone.icon;
            const amount = Math.round(totalAmount * (milestone.releasePercent / 100));

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  status === 'completed'
                    ? 'bg-afrikoni-green/5 border-afrikoni-green/20'
                    : status === 'active'
                    ? 'bg-afrikoni-gold/5 border-afrikoni-gold/30 ring-1 ring-afrikoni-gold/20'
                    : 'bg-gray-50 dark:bg-[#222] border-gray-100 dark:border-[#2A2A2A]'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  status === 'completed' ? 'bg-afrikoni-green text-white'
                    : status === 'active' ? 'bg-afrikoni-gold text-white'
                    : 'bg-gray-200 dark:bg-[#333] text-gray-400'
                }`}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${
                    status === 'completed' ? 'text-afrikoni-green'
                      : status === 'active' ? 'text-afrikoni-charcoal dark:text-[#F5F0E8]'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {milestone.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {milestone.description}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${
                    status === 'completed' ? 'text-afrikoni-green'
                      : status === 'active' ? 'text-afrikoni-gold'
                      : 'text-gray-400'
                  }`}>
                    ${amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-400">{milestone.releasePercent}%</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FX Rate */}
        {fxRate && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#2A2A2A] text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            FX Rate (ECB) <span className="font-medium text-afrikoni-charcoal dark:text-[#F5F0E8]">{fxRate}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
