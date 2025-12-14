/**
 * Trust Status Strip Component
 * Status-based trust signals (no numbers)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Package, Users, Globe, Shield } from 'lucide-react';

export default function TrustCounters() {
  const statusItems = [
    {
      icon: Package,
      label: 'Marketplace Active',
      color: 'text-afrikoni-gold'
    },
    {
      icon: Users,
      label: 'Suppliers Under Verification',
      color: 'text-afrikoni-chestnut'
    },
    {
      icon: Globe,
      label: 'Pan-African Coverage',
      color: 'text-afrikoni-gold'
    },
    {
      icon: Shield,
      label: 'RFQ-Based Matching',
      color: 'text-green-600'
    }
  ];

  return (
    <div className="py-3 md:py-4 bg-afrikoni-offwhite/50 border-b border-afrikoni-gold/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 lg:gap-8">
          {statusItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="flex items-center gap-2 md:gap-3"
              >
                <Icon className={`w-4 h-4 md:w-5 md:h-5 ${item.color} flex-shrink-0`} />
                <span className="text-xs md:text-sm text-afrikoni-deep/70 font-medium whitespace-nowrap">
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
