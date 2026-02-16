/**
 * SystemPageTimeline - Vertical timeline for mobile, horizontal for desktop
 * Used for "How it works", "Protocol flow", "Dispute flow"
 */

import React from 'react';
import { motion } from 'framer-motion';

export default function SystemPageTimeline({ steps, className = '' }) {
  return (
    <div className={`space-y-8 md:space-y-0 ${className}`}>
      {/* Desktop: Horizontal layout */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-os-accent/20 z-0" style={{ width: 'calc(100% - 3rem)' }} />
              )}
              <div className="bg-afrikoni-cream rounded-os-sm border border-os-accent/30 p-6 h-full relative z-10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-os-accent text-white flex items-center justify-center font-bold text-os-lg">
                    {step.number || idx + 1}
                  </div>
                  {Icon && (
                    <div className="w-10 h-10 rounded-lg bg-os-accent/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-os-accent" />
                    </div>
                  )}
                </div>
                <h3 className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut mb-2">
                  {step.title}
                </h3>
                <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Mobile: Vertical layout */}
      <div className="md:hidden space-y-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="flex gap-4"
            >
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-os-accent text-white flex items-center justify-center font-bold text-os-lg">
                  {step.number || idx + 1}
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-0.5 h-full bg-os-accent/20 mt-2" style={{ minHeight: '2rem' }} />
                )}
              </div>
              <div className="flex-1 bg-afrikoni-cream rounded-os-sm border border-os-accent/30 p-6">
                {Icon && (
                  <div className="w-10 h-10 rounded-lg bg-os-accent/20 flex items-center justify-center mb-4 inline-flex">
                    <Icon className="w-5 h-5 text-os-accent" />
                  </div>
                )}
                <h3 className="text-h3 font-semibold leading-[1.3] text-afrikoni-chestnut mb-2">
                  {step.title}
                </h3>
                <p className="text-body font-normal leading-[1.6] text-afrikoni-chestnut/80">
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

