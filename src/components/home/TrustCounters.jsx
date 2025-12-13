/**
 * Live Trust Counters Component
 * Animated counters showing REAL platform statistics from Supabase
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Package, Users, Globe, Shield } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

export default function TrustCounters() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  
  const [counters, setCounters] = useState({
    products: 0,
    suppliers: 0,
    countries: 0,
    deliveryRate: 0
  });

  const [targets, setTargets] = useState({
    products: 0,
    suppliers: 0,
    countries: 0,
    deliveryRate: 0
  });

  // Load real data from Supabase
  useEffect(() => {
    const loadRealStats = async () => {
      try {
        // Get active products count
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get verified suppliers count
        const { count: suppliersCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .in('role', ['seller', 'hybrid'])
          .eq('verification_status', 'verified');

        // Get unique countries from products
        const { data: productsData } = await supabase
          .from('products')
          .select('country')
          .eq('status', 'active');
        
        const uniqueCountries = new Set(
          productsData?.map(p => p.country).filter(Boolean) || []
        );

        // Get delivery rate (completed orders / total orders)
        const { count: completedOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');
        
        const { count: totalOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('status', ['completed', 'cancelled', 'refunded']);

        const deliveryRate = totalOrders > 0 
          ? Math.round((completedOrders / totalOrders) * 100)
          : 0;

        setTargets({
          products: productsCount || 0,
          suppliers: suppliersCount || 0,
          countries: uniqueCountries.size || 0,
          deliveryRate: deliveryRate
        });
      } catch (error) {
        // Silently fail - show zeros if data can't be loaded
        console.debug('Error loading stats:', error);
        setTargets({
          products: 0,
          suppliers: 0,
          countries: 0,
          deliveryRate: 0
        });
      }
    };

    loadRealStats();
  }, []);

  useEffect(() => {
    if (!isInView || (targets.products === 0 && targets.suppliers === 0)) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    const timers = Object.keys(targets).map((key) => {
      const target = targets[key];
      if (target === 0) return null;
      
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

    return () => timers.forEach((timer) => timer && clearInterval(timer));
  }, [isInView, targets]);

  // Only show if we have real data
  if (targets.products === 0 && targets.suppliers === 0 && targets.countries === 0) {
    return null;
  }

  const stats = [
    {
      icon: Package,
      value: counters.products,
      suffix: targets.products > 0 ? '+' : '',
      label: 'Products',
      color: 'text-afrikoni-gold'
    },
    {
      icon: Users,
      value: counters.suppliers,
      suffix: targets.suppliers > 0 ? '+' : '',
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
            const key = Object.keys(targets)[idx];
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
                    {counters[key]}
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
