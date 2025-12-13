import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, MessageCircle, ShoppingCart, Building2, Users, TrendingUp, CheckCircle, Upload, Award } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function HowItWorks() {
  const buyerSteps = [
    {
      number: '01',
      icon: Search,
      title: 'Search & Discover',
      description: 'Use AI-powered search to find African suppliers and products across 54 countries.',
      features: ['Browse by category', 'Filter by location', 'Compare prices', 'Verify suppliers'],
      color: 'bg-afrikoni-gold'
    },
    {
      number: '02',
      icon: MessageCircle,
      title: 'Connect & Negotiate',
      description: 'Send RFQs, chat with suppliers, and negotiate terms directly on the platform.',
      features: ['Send bulk inquiries', 'Real-time messaging', 'Get quotes', 'Negotiate terms'],
      color: 'bg-afrikoni-gold'
    },
    {
      number: '03',
      icon: ShoppingCart,
      title: 'Order & Pay Securely',
      description: 'Place orders with secure payment protection and track delivery progress.',
      features: ['Escrow protection', 'Multiple payment methods', 'Order tracking', 'Dispute resolution'],
      color: 'bg-afrikoni-gold'
    }
  ];

  const sellerSteps = [
    {
      number: '01',
      icon: Building2,
      title: 'List Your Products',
      description: 'Create detailed product listings with specifications, pricing, and images',
      features: ['Upload product catalogs', 'Set pricing tiers', 'Add certifications', 'Manage inventory'],
      color: 'bg-green-600'
    },
    {
      number: '02',
      icon: Users,
      title: 'Get Verified & Discovered',
      description: 'Complete business verification to gain buyer trust and improve visibility',
      features: ['Business verification', 'Quality certifications', 'Customer reviews', 'Trust badges'],
      color: 'bg-green-600'
    },
    {
      number: '03',
      icon: TrendingUp,
      title: 'Fulfill & Grow',
      description: 'Process orders, ship products, and scale your business across Africa',
      features: ['Order management', 'Shipping integration', 'Analytics dashboard', 'Growth insights'],
      color: 'bg-green-600'
    }
  ];

  return (
    <div id="how-it-works" className="py-12 md:py-16 bg-afrikoni-offwhite">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3 md:mb-4">How Afrikoni Works</h2>
          <p className="text-base md:text-lg text-afrikoni-deep max-w-3xl mx-auto">
            We connect African businesses with global opportunities through our AI-powered B2B marketplace platform
          </p>
        </motion.div>

        {/* For Buyers */}
        <div className="mb-12 md:mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6 md:mb-8"
          >
            <span className="text-green-600 font-semibold text-base md:text-lg">For Buyers</span>
            <h3 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mt-2">Source Products in 3 Simple Steps</h3>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {buyerSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                >
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-afrikoni-gold/20 relative overflow-hidden hover:shadow-2xl transition-all rounded-xl">
                      <div className="absolute top-0 right-0 text-7xl md:text-8xl font-bold text-zinc-50 -mr-2 md:-mr-4 -mt-2 md:-mt-4">
                        {step.number}
                      </div>
                      <CardContent className="p-6 md:p-8 relative">
                        <div className={`w-14 h-14 md:w-16 md:h-16 ${step.color} rounded-lg flex items-center justify-center mb-5 md:mb-6 shadow-md`}>
                          <Icon className="w-7 h-7 md:w-8 md:h-8 text-afrikoni-cream" />
                        </div>
                        <h4 className="text-lg md:text-xl font-bold text-afrikoni-chestnut mb-3">{step.title}</h4>
                        <p className="text-sm md:text-base text-afrikoni-deep mb-5 md:mb-6">{step.description}</p>
                        <ul className="space-y-2">
                          {step.features.map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-center gap-2 text-xs md:text-sm text-afrikoni-deep">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center mt-6 md:mt-8"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to={createPageUrl('BuyerCentral')}>
                <Button className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-creampx-6 md:px-8 py-2.5 md:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow">
                  Start Sourcing Now →
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* For Sellers */}
        <div>
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6 md:mb-8"
          >
            <span className="text-green-600 font-semibold text-base md:text-lg">For Sellers</span>
            <h3 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mt-2">Grow Your Business in 3 Steps</h3>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {sellerSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                >
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-afrikoni-gold/20 relative overflow-hidden hover:shadow-2xl transition-all rounded-xl">
                      <div className="absolute top-0 right-0 text-7xl md:text-8xl font-bold text-zinc-50 -mr-2 md:-mr-4 -mt-2 md:-mt-4">
                        {step.number}
                      </div>
                      <CardContent className="p-6 md:p-8 relative">
                        <div className={`w-14 h-14 md:w-16 md:h-16 ${step.color} rounded-lg flex items-center justify-center mb-5 md:mb-6 shadow-md`}>
                          <Icon className="w-7 h-7 md:w-8 md:h-8 text-afrikoni-cream" />
                        </div>
                        <h4 className="text-lg md:text-xl font-bold text-afrikoni-chestnut mb-3">{step.title}</h4>
                        <p className="text-sm md:text-base text-afrikoni-deep mb-5 md:mb-6">{step.description}</p>
                        <ul className="space-y-2">
                          {step.features.map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-center gap-2 text-xs md:text-sm text-afrikoni-deep">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center mt-6 md:mt-8"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to={createPageUrl('SellerOnboarding')}>
                <Button className="bg-green-600 hover:bg-green-700 text-afrikoni-creampx-6 md:px-8 py-2.5 md:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow">
                  Start Selling Now →
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
