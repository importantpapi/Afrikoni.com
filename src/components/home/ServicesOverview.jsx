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
import { isLogistics } from '@/utils/roleHelpers';

export default function ServicesOverview() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady } = useAuth();
  const navigate = useNavigate();
  
  // Use role from auth context
  const userRole = role || profile?.role || null;

  const handleLogisticsClick = (e) => {
    e.preventDefault();
    if (user && isLogistics(userRole)) {
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
      link: '/services/suppliers',
      features: [
        'Verified supplier badge',
        'Global buyer network',
        'Secure escrow payments',
        'Logistics support'
      ],
      cta: 'Join as Supplier',
      colorClass: 'bg-afrikoni-gold hover:bg-afrikoni-goldDark',
      iconBgClass: 'bg-afrikoni-gold/20',
      iconColorClass: 'text-afrikoni-gold'
    },
    {
      id: 'buyers',
      title: 'For Buyers',
      description: 'Source verified African suppliers, request quotes, and trade with confidence through our protected platform.',
      icon: ShoppingBag,
      link: '/services/buyers',
      features: [
        'Verified suppliers only',
        'Request for Quotes (RFQ)',
        'Buyer protection & escrow',
        'Quality inspection services'
      ],
      cta: 'Join as Buyer',
      colorClass: 'bg-afrikoni-chestnut hover:bg-afrikoni-chestnut/90',
      iconBgClass: 'bg-afrikoni-chestnut/20',
      iconColorClass: 'text-afrikoni-chestnut'
    },
    {
      id: 'logistics',
      title: 'For Logistics Partners',
      description: 'Connect with businesses needing shipping solutions across 54 African countries and beyond.',
      icon: Truck,
      link: '/services/logistics',
      features: [
        'Cross-border shipping',
        'Real-time tracking',
        'Customs clearance support',
        'End-to-end logistics'
      ],
      cta: 'Join Logistics Network',
      colorClass: 'bg-afrikoni-clay hover:bg-afrikoni-clay/90',
      iconBgClass: 'bg-afrikoni-clay/20',
      iconColorClass: 'text-afrikoni-clay'
    }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-afrikoni-offwhite to-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
            How We Serve You
          </h2>
          <p className="text-lg md:text-xl text-afrikoni-deep/80 max-w-3xl mx-auto">
            Whether you're a supplier, buyer, or logistics partner, Afrikoni has solutions designed for your success.
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
                <Card className="h-full border-2 border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all hover:shadow-xl group card-hover-lift">
                  <CardContent className="p-6 md:p-8">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-xl ${service.iconBgClass} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 ${service.iconColorClass}`} />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-afrikoni-chestnut mb-3">
                      {service.title}
                    </h3>

                    {/* Description */}
                    <p className="text-afrikoni-deep/80 mb-6 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                      {service.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-afrikoni-deep">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {service.id === 'logistics' ? (
                      <Button 
                        onClick={handleLogisticsClick}
                        className={`w-full ${service.colorClass} text-white group-hover:shadow-lg transition-all`}
                      >
                        {user && isLogistics(userRole) ? 'Go to Dashboard' : 'Join as Logistics Partner'}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    ) : (
                      <Link to={service.link}>
                        <Button 
                          className={`w-full ${service.colorClass} text-white group-hover:shadow-lg transition-all`}
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

