/**
 * Logistics Service Detail Page
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Truck, Globe, MapPin, CheckCircle, 
  Package, TrendingUp, ArrowRight, Shield, Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import SEO from '@/components/SEO';
import { useAuth } from '@/contexts/AuthProvider';

export default function LogisticsService() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady } = useAuth();
  const navigate = useNavigate();

  const handleJoinLogistics = () => {
    // Always go to logistics partner onboarding page, not signup
    navigate('/logistics-partner-onboarding');
  };
  const benefits = [
    {
      icon: Globe,
      title: '54 Countries Coverage',
      description: 'Connect with businesses needing shipping solutions across all African countries'
    },
    {
      icon: Package,
      title: 'Real-Time Tracking',
      description: 'Provide customers with live shipment tracking and delivery updates'
    },
    {
      icon: Shield,
      title: 'Secure & Insured',
      description: 'All shipments are insured and protected through our platform'
    },
    {
      icon: MapPin,
      title: 'Customs Support',
      description: 'Access our customs clearance network for faster cross-border shipping'
    },
    {
      icon: Clock,
      title: 'On-Time Delivery',
      description: 'Track and maintain high delivery performance ratings'
    },
    {
      icon: TrendingUp,
      title: 'Growing Network',
      description: 'Join a network of logistics partners serving thousands of businesses'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Apply to Join',
      description: 'Submit your logistics company details and service coverage areas'
    },
    {
      number: '02',
      title: 'Get Verified',
      description: 'Complete verification process to become a trusted logistics partner'
    },
    {
      number: '03',
      title: 'Receive Orders',
      description: 'Get shipping requests from buyers and suppliers on the platform'
    },
    {
      number: '04',
      title: 'Deliver & Grow',
      description: 'Complete shipments, earn ratings, and grow your logistics business'
    }
  ];

  return (
    <>
      <SEO 
        title="Join Logistics Network - Afrikoni Shipping Partners"
        description="Connect with businesses needing shipping solutions across 54 African countries. Join Afrikoni's logistics network."
        url="/services/logistics"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-afrikoni-deep/20 to-afrikoni-gold/20 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="w-20 h-20 bg-afrikoni-deep rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-afrikoni-chestnut mb-6">
                Join Logistics Network
              </h1>
              <p className="text-xl md:text-2xl text-afrikoni-deep mb-8">
                Connect with businesses needing shipping solutions across 54 African countries and beyond.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-afrikoni-deep hover:bg-afrikoni-deep/90 text-white px-8 py-6 text-lg"
                  asChild
                >
                  <Link to="/contact">Apply to Join</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-afrikoni-deep text-afrikoni-chestnut hover:bg-afrikoni-deep/10 px-8 py-6 text-lg"
                  asChild
                >
                  <Link to="/logistics">Learn More</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Why Partner with Afrikoni?
              </h2>
              <p className="text-lg text-afrikoni-deep/80">
                Grow your logistics business with our platform
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 bg-afrikoni-deep/20 rounded-lg flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-afrikoni-deep" />
                        </div>
                        <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-afrikoni-deep/80">
                          {benefit.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                How It Works
              </h2>
              <p className="text-lg text-afrikoni-deep/80">
                Join our network in 4 simple steps
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="relative"
                >
                  <Card className="h-full border-afrikoni-gold/20">
                    <CardContent className="p-6">
                      <div className="text-5xl font-bold text-afrikoni-deep/20 mb-4">
                        {step.number}
                      </div>
                      <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">
                        {step.title}
                      </h3>
                      <p className="text-afrikoni-deep/80">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-afrikoni-gold/50" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-r from-afrikoni-deep/20 to-afrikoni-gold/20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Ready to Join Our Network?
              </h2>
              <p className="text-lg text-afrikoni-deep mb-8">
                Connect with businesses across Africa and grow your logistics operations
              </p>
              <Button
                size="lg"
                className="bg-afrikoni-deep hover:bg-afrikoni-deep/90 text-white px-8 py-6 text-lg"
                onClick={handleJoinLogistics}
              >
                {user ? 'Go to Logistics Dashboard' : 'Join Logistics Network'}
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}

