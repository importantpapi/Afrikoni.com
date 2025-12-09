/**
 * Enterprise Page
 * For large businesses and enterprise clients
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, Shield, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import SEO from '@/components/SEO';
import { useNavigate } from 'react-router-dom';

export default function Enterprise() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Building2,
      title: 'Dedicated Account Manager',
      description: 'Personal support from a dedicated account manager who understands your business needs.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Multi-user accounts with role-based permissions for your entire team.'
    },
    {
      icon: Shield,
      title: 'Enhanced Security',
      description: 'Advanced security features, custom contracts, and priority dispute resolution.'
    },
    {
      icon: TrendingUp,
      title: 'Volume Discounts',
      description: 'Special pricing and discounts for high-volume transactions and long-term partnerships.'
    }
  ];

  return (
    <>
      <SEO 
        title="Enterprise Solutions - Afrikoni | AFRIKONI"
        description="Enterprise B2B trade solutions for large businesses. Dedicated support, volume discounts, and custom integrations."
        url="/enterprise"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-deep to-afrikoni-chestnut py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-cream mb-6">
                Enterprise Solutions
              </h1>
              <p className="text-lg md:text-xl text-afrikoni-cream/90 mb-8">
                Tailored B2B trade solutions for large businesses. Scale your operations with dedicated support, volume discounts, and custom integrations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => navigate('/contact')}
                    className="bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight px-8 py-3 rounded-full text-base md:text-lg font-bold shadow-xl hover:shadow-2xl transition-all hover:ring-4 hover:ring-afrikoni-gold/50"
                  >
                    Contact Sales
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => navigate('/contact')}
                    variant="outline"
                    className="border-2 border-afrikoni-gold/70 text-afrikoni-cream hover:bg-afrikoni-gold/20 px-8 py-3 rounded-full text-base md:text-lg font-semibold"
                  >
                    Schedule Demo
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut mb-4">
                Enterprise Features
              </h2>
              <p className="text-lg text-afrikoni-deep/80 max-w-2xl mx-auto">
                Everything you need to scale your B2B trade operations
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all card-hover-lift">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 rounded-full bg-afrikoni-gold/20 flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-afrikoni-gold" />
                        </div>
                        <h3 className="font-bold text-afrikoni-chestnut text-lg mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-afrikoni-deep/80 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-afrikoni-gold/20 via-afrikoni-chestnut/20 to-afrikoni-gold/20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut mb-4">
                Ready to Scale Your Business?
              </h2>
              <p className="text-lg text-afrikoni-deep mb-8">
                Contact our enterprise team to discuss custom solutions for your business.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => navigate('/contact')}
                  className="bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight px-8 py-3 rounded-full text-base md:text-lg font-bold shadow-xl hover:shadow-2xl transition-all hover:ring-4 hover:ring-afrikoni-gold/50"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}

