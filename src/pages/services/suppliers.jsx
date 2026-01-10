/**
 * Suppliers Service Detail Page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Store, Shield, Globe, TrendingUp, CheckCircle, 
  DollarSign, Truck, ArrowRight, Users, Award
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import SEO from '@/components/SEO';

export default function SuppliersService() {
  const benefits = [
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Connect with buyers from around the world looking for African products'
    },
    {
      icon: Shield,
      title: 'Verified Badge',
      description: 'Get verified and earn trust with our KYC/AML verification process'
    },
    {
      icon: DollarSign,
      title: 'Secure Payments',
      description: 'Receive payments through our escrow system with buyer protection'
    },
    {
      icon: Truck,
      title: 'Logistics Support',
      description: 'Access our network of logistics partners for seamless shipping'
    },
    {
      icon: TrendingUp,
      title: 'Growth Tools',
      description: 'Analytics, marketing tools, and AI-powered product optimization'
    },
    {
      icon: Users,
      title: 'Buyer Network',
      description: 'Access thousands of verified buyers actively sourcing products'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Sign Up & Verify',
      description: 'Create your account and complete KYC verification to get verified badge'
    },
    {
      number: '02',
      title: 'List Products',
      description: 'Add your products with AI-powered descriptions and competitive pricing'
    },
    {
      number: '03',
      title: 'Receive Orders',
      description: 'Get orders from verified buyers with secure escrow payments'
    },
    {
      number: '04',
      title: 'Ship & Grow',
      description: 'Use our logistics network and watch your business grow globally'
    }
  ];

  return (
    <>
      <SEO 
        title="Join as Supplier - Afrikoni B2B Marketplace"
        description="Reach global buyers, get verified, and grow your business with Afrikoni's secure B2B marketplace. Join thousands of African suppliers."
        url="/services/suppliers"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-afrikoni-gold/20 to-afrikoni-chestnut/20 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="w-20 h-20 bg-afrikoni-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <Store className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-afrikoni-chestnut mb-6">
                Join as Supplier
              </h1>
              <p className="text-xl md:text-2xl text-afrikoni-deep mb-8">
                Reach global buyers, get verified, and grow your business with secure payments and logistics support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white px-8 py-6 text-lg"
                  asChild
                >
                  <Link to="/become-supplier">Get Started Free</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 px-8 py-6 text-lg"
                  asChild
                >
                  <Link to="/pricing">View Pricing</Link>
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
                Why Sell on Afrikoni?
              </h2>
              <p className="text-lg text-afrikoni-deep/80">
                Everything you need to grow your business globally
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
                        <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-lg flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-afrikoni-gold" />
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
                Get started in 4 simple steps
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
                      <div className="text-5xl font-bold text-afrikoni-gold/20 mb-4">
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
        <section className="py-16 md:py-20 bg-gradient-to-r from-afrikoni-gold/20 to-afrikoni-chestnut/20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Ready to Grow Your Business?
              </h2>
              <p className="text-lg text-afrikoni-deep mb-8">
                Join thousands of suppliers already selling on Afrikoni
              </p>
              <Button
                size="lg"
                className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white px-8 py-6 text-lg"
                asChild
              >
                <Link to="/become-supplier">Join as Supplier</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}

