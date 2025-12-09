/**
 * Buyers Service Detail Page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Shield, Search, CheckCircle, 
  FileText, Globe, ArrowRight, Lock, TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';

export default function BuyersService() {
  const benefits = [
    {
      icon: Shield,
      title: 'Verified Suppliers Only',
      description: 'All suppliers are KYC/AML verified and background-checked for your peace of mind'
    },
    {
      icon: Search,
      title: 'Easy Sourcing',
      description: 'Search thousands of products or post RFQs to get custom quotes'
    },
    {
      icon: Lock,
      title: 'Buyer Protection',
      description: 'Escrow payments protect you until you receive and approve your order'
    },
    {
      icon: FileText,
      title: 'Request Quotes',
      description: 'Post RFQs and receive competitive quotes from verified suppliers'
    },
    {
      icon: Globe,
      title: '54 Countries',
      description: 'Source from suppliers across all 54 African countries in one platform'
    },
    {
      icon: TrendingUp,
      title: 'Quality Assurance',
      description: 'Access inspection services and quality control before shipment'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Browse or Post RFQ',
      description: 'Search products or post a Request for Quote to get custom offers'
    },
    {
      number: '02',
      title: 'Compare & Choose',
      description: 'Compare suppliers, prices, and reviews to find the best match'
    },
    {
      number: '03',
      title: 'Secure Payment',
      description: 'Pay through escrow - funds held until you approve delivery'
    },
    {
      number: '04',
      title: 'Receive & Verify',
      description: 'Get your order, verify quality, and release payment'
    }
  ];

  return (
    <>
      <SEO 
        title="Join as Buyer - Source Verified African Suppliers"
        description="Source verified African suppliers, request quotes, and trade with confidence. Join as a buyer on Afrikoni B2B marketplace."
        url="/services/buyers"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-afrikoni-chestnut/20 to-afrikoni-gold/20 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="w-20 h-20 bg-afrikoni-chestnut rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-afrikoni-chestnut mb-6">
                Join as Buyer
              </h1>
              <p className="text-xl md:text-2xl text-afrikoni-deep mb-8">
                Source verified African suppliers, request quotes, and trade with confidence through our protected platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-afrikoni-chestnut hover:bg-afrikoni-chestnut/90 text-white px-8 py-6 text-lg"
                  asChild
                >
                  <Link to="/signup">Get Started Free</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-afrikoni-chestnut text-afrikoni-chestnut hover:bg-afrikoni-chestnut/10 px-8 py-6 text-lg"
                  asChild
                >
                  <Link to="/marketplace">Browse Products</Link>
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
                Why Buy on Afrikoni?
              </h2>
              <p className="text-lg text-afrikoni-deep/80">
                Secure sourcing with verified suppliers and buyer protection
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
                        <div className="w-12 h-12 bg-afrikoni-chestnut/20 rounded-lg flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-afrikoni-chestnut" />
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
                Source with confidence in 4 simple steps
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
                      <div className="text-5xl font-bold text-afrikoni-chestnut/20 mb-4">
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
        <section className="py-16 md:py-20 bg-gradient-to-r from-afrikoni-chestnut/20 to-afrikoni-gold/20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Ready to Source from Africa?
              </h2>
              <p className="text-lg text-afrikoni-deep mb-8">
                Join thousands of buyers sourcing verified products from African suppliers
              </p>
              <Button
                size="lg"
                className="bg-afrikoni-chestnut hover:bg-afrikoni-chestnut/90 text-white px-8 py-6 text-lg"
                asChild
              >
                <Link to="/signup">Join as Buyer</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}

