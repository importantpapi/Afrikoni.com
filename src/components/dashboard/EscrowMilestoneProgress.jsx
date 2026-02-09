import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import {
  ShieldCheck, DollarSign, Truck, Package, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';

/**
 * EscrowMilestoneProgress - Trade OS 2026
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
    <Card className={`border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-xl ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-[#F5F0E8] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Escrow Status
          </CardTitle>
          <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 text-[10px] font-semibold">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Amount Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-[#1A1A1A]">
            <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-medium uppercase tracking-wider">
              <DollarSign className="w-3 h-3" /> Total
            </div>
            <p className="text-base font-bold font-mono text-gray-900 dark:text-[#F5F0E8]">
              ${totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mb-1 uppercase tracking-wider">Released</div>
            <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ${releasedAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-[#D4A937]/5">
            <div className="flex items-center justify-center gap-1 text-[10px] text-[#D4A937] font-medium mb-1 uppercase tracking-wider">
              <Clock className="w-3 h-3" /> Held
            </div>
            <p className="text-base font-bold font-mono text-[#D4A937]">
              ${heldAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Release Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
            <span className="uppercase tracking-wider">Release Progress</span>
            <span className="font-mono font-bold text-[#D4A937]">{releaseProgress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-[#2A2A2A] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${releaseProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-500 to-[#D4A937] rounded-full"
            />
          </div>
        </div>

        {/* Payment Milestones */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">
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
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
                    : status === 'active'
                    ? 'bg-[#D4A937]/5 border-[#D4A937]/20 ring-1 ring-[#D4A937]/10'
                    : 'bg-gray-50 dark:bg-[#1A1A1A] border-gray-100 dark:border-[#2A2A2A]'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  status === 'completed' ? 'bg-emerald-500 text-white'
                    : status === 'active' ? 'bg-[#D4A937] text-white dark:text-[#0A0A0A]'
                    : 'bg-gray-200 dark:bg-[#2A2A2A] text-gray-400 dark:text-gray-600'
                }`}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-[10px] font-bold">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold ${
                    status === 'completed' ? 'text-emerald-600 dark:text-emerald-400'
                      : status === 'active' ? 'text-gray-900 dark:text-[#F5F0E8]'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {milestone.label}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {milestone.description}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-[13px] font-bold font-mono ${
                    status === 'completed' ? 'text-emerald-600 dark:text-emerald-400'
                      : status === 'active' ? 'text-[#D4A937]'
                      : 'text-gray-400'
                  }`}>
                    ${amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-mono text-gray-400 dark:text-gray-600">{milestone.releasePercent}%</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FX Rate */}
        {fxRate && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#2A2A2A] text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 font-mono">
            FX Rate (ECB) <span className="font-bold text-gray-600 dark:text-gray-300">{fxRate}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
