/**
 * Trust Status Strip Component
 * Institutional-grade trust signals with honest startup metrics
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Globe, Users, Zap } from 'lucide-react';

export default function TrustCounters() {
  const statusItems = [
    {
      icon: Globe,
      value: '54+',
      label: 'African Markets',
      color: 'from-afrikoni-chestnut to-afrikoni-chestnut/70'
    },
    {
      icon: Users,
      value: '100+',
      label: 'Ecosystem Members',
      color: 'from-os-accent to-os-accent/70'
    },
    {
      icon: ShieldCheck,
      value: 'Secure',
      label: 'Escrow Protection',
      color: 'from-green-600 to-green-500'
    },
    {
      icon: Zap,
      value: 'Vetted',
      label: 'Verified Suppliers',
      color: 'from-blue-600 to-blue-500'
    }
  ];

  return (
    <div className="relative py-4 md:py-6 bg-white/40 backdrop-blur-md border-y border-white/20">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-os-accent/5 via-transparent to-afrikoni-chestnut/5 opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 lg:gap-12">
          {statusItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex flex-col items-center md:items-start text-center md:text-left group"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${item.color} bg-opacity-10 text-white shadow-sm ring-1 ring-inset ring-white/20`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-os-lg md:text-os-xl font-bold text-afrikoni-deep tracking-tight">
                    {item.value}
                  </span>
                </div>
                <span className="text-os-xs md:text-os-sm text-afrikoni-deep/60 font-medium uppercase tracking-widest pl-0 md:pl-10">
                  {item.label}
                </span>

                {/* Micro-interaction line */}
                <div className="w-0 group-hover:w-full h-[1px] bg-gradient-to-r from-transparent via-os-accent/30 to-transparent transition-all duration-500 mt-2 hidden md:block" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

