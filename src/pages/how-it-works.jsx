import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, MessageCircle, ShoppingCart, Building2, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
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
    <>
      <SEO 
        title="How It Works - Afrikoni B2B Marketplace"
        description="Learn how Afrikoni works for buyers and sellers. Discover how to source products, connect with verified suppliers, and grow your business across Africa."
        url="/how-it-works"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-chestnut/10 to-afrikoni-gold/5 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-chestnut mb-4">
                How Afrikoni Works
              </h1>
              <p className="text-lg md:text-xl text-afrikoni-deep max-w-3xl mx-auto">
                We connect African businesses with global opportunities through our AI-powered B2B marketplace platform
              </p>
            </motion.div>
          </div>
        </section>

        {/* For Buyers */}
        <section className="py-12 md:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-6 md:mb-8"
            >
              <span className="text-green-600 font-semibold text-base md:text-lg">For Buyers</span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-afrikoni-chestnut mt-2">
                Source Products in 3 Simple Steps
              </h2>
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
                      <Card className="border-2 border-afrikoni-gold/20 relative overflow-hidden hover:shadow-2xl transition-all rounded-xl h-full">
                        <div className="absolute top-0 right-0 text-7xl md:text-8xl font-bold text-zinc-50 -mr-2 md:-mr-4 -mt-2 md:-mt-4">
                          {step.number}
                        </div>
                        <CardContent className="p-6 md:p-8 relative">
                          <div className={`w-14 h-14 md:w-16 md:h-16 ${step.color} rounded-lg flex items-center justify-center mb-5 md:mb-6 shadow-md`}>
                            <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-afrikoni-chestnut mb-3">{step.title}</h3>
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
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow">
                    Start Sourcing Now →
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* For Sellers */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-afrikoni-offwhite">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-6 md:mb-8"
            >
              <span className="text-green-600 font-semibold text-base md:text-lg">For Sellers</span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-afrikoni-chestnut mt-2">
                Grow Your Business in 3 Steps
              </h2>
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
                      <Card className="border-2 border-afrikoni-gold/20 relative overflow-hidden hover:shadow-2xl transition-all rounded-xl h-full">
                        <div className="absolute top-0 right-0 text-7xl md:text-8xl font-bold text-zinc-50 -mr-2 md:-mr-4 -mt-2 md:-mt-4">
                          {step.number}
                        </div>
                        <CardContent className="p-6 md:p-8 relative">
                          <div className={`w-14 h-14 md:w-16 md:h-16 ${step.color} rounded-lg flex items-center justify-center mb-5 md:mb-6 shadow-md`}>
                            <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                          </div>
                          <h3 className="text-lg md:text-xl font-bold text-afrikoni-chestnut mb-3">{step.title}</h3>
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
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow">
                    Start Selling Now →
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}

