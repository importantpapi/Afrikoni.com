/**
 * Live Trust Counters Component
 * Animated counters showing platform statistics
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Package, Users, Globe, Shield } from 'lucide-react';

export default function TrustCounters() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  
  const [counters, setCounters] = useState({
    products: 0,
    suppliers: 0,
    countries: 0,
    deliveryRate: 0
  });

  const targets = {
    products: 12500,
    suppliers: 850,
    countries: 24,
    deliveryRate: 98
  };

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    const timers = Object.keys(targets).map((key) => {
      const target = targets[key];
      let current = 0;
      const increment = target / steps;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setCounters((prev) => ({ ...prev, [key]: Math.floor(current) }));
      }, interval);

      return timer;
    });

    return () => timers.forEach((timer) => clearInterval(timer));
  }, [isInView]);

  const stats = [
    {
      icon: Package,
      value: counters.products,
      suffix: '+',
      label: 'Products',
      color: 'text-afrikoni-gold'
    },
    {
      icon: Users,
      value: counters.suppliers,
      suffix: '+',
      label: 'Suppliers',
      color: 'text-afrikoni-chestnut'
    },
    {
      icon: Globe,
      value: counters.countries,
      suffix: '',
      label: 'Countries Live',
      color: 'text-afrikoni-gold'
    },
    {
      icon: Shield,
      value: counters.deliveryRate,
      suffix: '%',
      label: 'Secure Delivery Rate',
      color: 'text-green-600'
    }
  ];

  return (
    <section 
      ref={ref}
      className="py-12 md:py-16 bg-gradient-to-b from-white to-afrikoni-offwhite border-y border-afrikoni-gold/10"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 rounded-full bg-afrikoni-gold/10 flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <motion.div
                  initial={{ scale: 0.8 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  className="mb-2"
                >
                  <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-afrikoni-chestnut">
                    {counters[Object.keys(targets)[idx]]}
                  </span>
                  <span className="text-2xl md:text-3xl lg:text-4xl font-bold text-afrikoni-gold ml-1">
                    {stat.suffix}
                  </span>
                </motion.div>
                <p className="text-sm md:text-base text-afrikoni-deep/70 font-medium">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

