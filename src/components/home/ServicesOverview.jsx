/**
 * Services/Product Overview Section
 * Displays cards for Suppliers, Buyers, and Logistics partners
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import {
  Store, ShoppingBag, Truck, ArrowRight,
  Shield, Globe, TrendingUp, CheckCircle
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/contexts/CapabilityContext';

export default function ServicesOverview() {
  // Use centralized AuthProvider
  const { user, authReady } = useAuth();
  // ✅ FOUNDATION FIX: Use capabilities instead of roleHelpers
  const capabilities = useCapability();
  const navigate = useNavigate();

  // ✅ URGENT FIX: Define isLogistics within component scope to prevent crash
  const isLogistics = capabilities?.ready &&
    capabilities?.can_logistics === true &&
    capabilities?.logistics_status === 'approved';

  const handleLogisticsClick = (e) => {
    e.preventDefault();
    // ✅ FOUNDATION FIX: Check capabilities instead of role
    const isLogisticsApproved = capabilities.ready &&
      capabilities.can_logistics === true &&
      capabilities.logistics_status === 'approved';

    if (user && isLogisticsApproved) {
      // User is logged in and is a logistics partner, go to dashboard
      navigate('/dashboard/logistics');
    } else {
      // User not logged in or not a logistics partner, go to onboarding
      navigate('/logistics-partner-onboarding');
    }
  };
  const services = [
    {
      id: 'suppliers',
      title: 'For Suppliers',
      description: 'Reach global buyers, get verified, and grow your business with secure payments and logistics support.',
      icon: Store,
      link: '/signup',
      features: [
        'Verified supplier badge',
        'Global buyer network',
        'Secure escrow payments',
        'Logistics support'
      ],
      cta: 'Join as Supplier',
      colorClass: 'bg-os-accent hover:bg-os-accentDark',
      iconBgClass: 'bg-os-accent/20',
      iconColorClass: 'text-os-accent'
    },
    {
      id: 'buyers',
      title: 'For Buyers',
      description: 'Source verified African suppliers, request quotes, and trade with confidence through our protected platform.',
      icon: ShoppingBag,
      link: '/signup',
      features: [
        'Verified suppliers only',
        'Request for Quotes (RFQ)',
        'Buyer protection & escrow',
        'Quality inspection services'
      ],
      cta: 'Join as Buyer',
      colorClass: 'bg-os-text-primary hover:bg-os-text-primary/90',
      iconBgClass: 'bg-os-text-primary/10',
      iconColorClass: 'text-os-text-primary'
    },
    {
      id: 'logistics',
      title: 'For Logistics Partners',
      description: 'Connect with businesses needing shipping solutions across 54 African countries and beyond.',
      icon: Truck,
      link: '/signup',
      features: [
        'Cross-border shipping',
        'Real-time tracking',
        'Customs clearance support',
        'End-to-end logistics'
      ],
      cta: 'Join Logistics Network',
      colorClass: 'bg-os-text-secondary hover:bg-os-text-secondary/90',
      iconBgClass: 'bg-os-text-secondary/10',
      iconColorClass: 'text-os-text-secondary'
    }
  ];

  return (
    <section className="py-10 md:py-16 lg:py-20 bg-[var(--os-bg)]">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-32 md:text-56 font-bold text-os-text-primary mb-6 uppercase tracking-tighter leading-[0.9]">
            How Afrikoni <span className="text-os-accent italic">Works.</span>
          </h2>
          <p className="text-16 md:text-18 text-os-text-secondary font-medium max-w-2xl mx-auto leading-relaxed">
            Whether you're buying, selling, or shipping — Afrikoni gives you the tools to trade safely across Africa.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {services.map((service, idx) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="h-full border border-os-stroke bg-os-surface-solid hover:border-os-accent transition-all duration-500 hover:shadow-premium group rounded-[28px] overflow-hidden">
                  <CardContent className="p-6 md:p-8">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-os-sm ${service.iconBgClass} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 ${service.iconColorClass}`} />
                    </div>

                    {/* Title */}
                    <h3 className="text-os-2xl font-bold text-os-text-primary mb-3">
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="text-os-text-secondary font-medium mb-6 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                      {service.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-os-sm text-os-text-primary font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {service.id === 'logistics' ? (
                      <Button
                        onClick={handleLogisticsClick}
                        className={`w-full ${service.colorClass} text-[#FAF9F6] group-hover:shadow-os-md transition-all font-bold tracking-widest uppercase text-xs`}
                      >
                        {user && isLogistics ? 'Go to Dashboard' : 'Join as Logistics Partner'}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    ) : (
                      <Link to={service.link}>
                        <Button
                          className={`w-full ${service.colorClass} text-[#FAF9F6] group-hover:shadow-os-md transition-all font-bold tracking-widest uppercase text-xs`}
                        >
                          {service.cta}
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

