/**
 * Logistics Platform Upgrade Section
 * Full section with route map background, pillars, and CTA
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Package, Globe, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';

export default function LogisticsPlatform() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Use role from auth context
  const userRole = role || profile?.role || null;

  const handleJoinLogistics = () => {
    // Always go to logistics partner onboarding page, not signup
    navigate('/logistics-partner-onboarding');
  };

  const pillars = [
    {
      icon: Globe,
      title: 'Cross-border Shipping',
      description: 'Seamless shipping across 54 African countries with real-time tracking and customs support.',
      color: 'text-os-accent'
    },
    {
      icon: Package,
      title: 'Customs Support',
      description: 'Expert assistance with documentation, clearance, and compliance across all African borders.',
      color: 'text-afrikoni-chestnut'
    },
    {
      icon: MapPin,
      title: 'Real-time Tracking',
      description: 'Track your shipments from origin to destination with live updates and notifications.',
      color: 'text-os-accent'
    },
    {
      icon: Truck,
      title: 'Warehousing',
      description: 'Strategic warehousing solutions across key African hubs for faster delivery times.',
      color: 'text-afrikoni-chestnut'
    }
  ];

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-br from-afrikoni-deep via-afrikoni-chestnut to-afrikoni-deep overflow-hidden">
      {/* Route Map Background Visual */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M20 20 L80 20 L80 80 L20 80 Z' stroke='%23E4B544' stroke-width='2' fill='none'/%3E%3Ccircle cx='50' cy='50' r='15' fill='%23E4B544' opacity='0.3'/%3E%3Cpath d='M20 50 L50 20 L80 50 L50 80 Z' stroke='%23E4B544' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          backgroundPosition: 'center'
        }} />
      </div>

      {/* Africa Map Silhouette Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <Globe className="w-[800px] h-[800px] text-os-accent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-os-accent/20 mb-4"
          >
            <Truck className="w-8 h-8 text-os-accent" />
          </motion.div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-cream mb-4">
            Logistics Platform
          </h2>
          <p className="text-os-lg md:text-os-xl text-afrikoni-cream/90 max-w-3xl mx-auto">
            End-to-end logistics solutions connecting businesses across Africa and the world
          </p>
        </motion.div>

        {/* Pillars Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="bg-white/10 backdrop-blur-sm border border-os-accent/20 rounded-os-sm p-6 hover:bg-white/15 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-os-accent/20 flex items-center justify-center mb-4">
                  <Icon className={`w-6 h-6 ${pillar.color}`} />
                </div>
                <h3 className="font-bold text-afrikoni-cream text-os-lg mb-2">
                  {pillar.title}
                </h3>
                <p className="text-afrikoni-cream/80 text-os-sm leading-relaxed">
                  {pillar.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleJoinLogistics}
              className="bg-os-accent text-afrikoni-chestnut hover:bg-os-accentLight px-8 py-3 rounded-full text-os-base md:text-os-lg font-bold shadow-os-lg hover:shadow-2xl transition-all hover:ring-4 hover:ring-os-accent/50"
            >
              {user ? 'Go to Logistics Dashboard' : 'Join Logistics Network'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

