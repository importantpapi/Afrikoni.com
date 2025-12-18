import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, MessageCircle, ShoppingCart, Building2, Users, TrendingUp, CheckCircle,
  Shield, Lock, Globe, Award, FileText, ArrowRight, Sparkles, Clock, Package,
  BarChart3, Star, Zap, MapPin, Truck, DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { createPageUrl } from '@/utils';
import { supabase } from '@/api/supabaseClient';
import TrustCards from '@/components/home/TrustCards';
import ServicesOverview from '@/components/home/ServicesOverview';

export default function HowItWorks() {
  const [stats, setStats] = useState([
    { value: '...', label: 'Verified Suppliers' },
    { value: '...', label: 'Verified Listings' },
    { value: '54', label: 'African Countries' },
    { value: '...', label: 'Active Buyers' }
  ]);

  useEffect(() => {
    loadRealStats();
  }, []);

  const loadRealStats = async () => {
    try {
      // Get verified suppliers count (public query - no auth required)
      const { count: verifiedSuppliers, error: suppliersError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('verified', true);

      // Get active products count (public query - no auth required)
      const { count: activeProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get active buyers (users with RFQs) - this may require auth, so handle gracefully
      let uniqueBuyers = new Set();
      try {
        const { data: buyersData, error: buyersError } = await supabase
          .from('rfqs')
          .select('user_id')
          .limit(1000);
        
        if (!buyersError && buyersData) {
          uniqueBuyers = new Set(buyersData.map(r => r.user_id).filter(Boolean));
        }
      } catch (rfqError) {
        // Silently fail if RFQ query fails (likely due to RLS)
        console.debug('RFQ stats not available:', rfqError);
      }

      // Only update stats if we got valid data (ignore auth errors)
      if (!suppliersError && !productsError) {
        setStats([
          { 
            value: verifiedSuppliers > 0 ? `${verifiedSuppliers}+` : 'Growing', 
            label: 'Verified Suppliers' 
          },
          { 
            value: activeProducts > 0 && activeProducts >= 10 ? `${activeProducts}+` : 'Curated', 
            label: activeProducts > 0 && activeProducts >= 10 ? 'Products Available' : 'Verified Listings' 
          },
          { value: '54', label: 'African Countries' },
          { 
            value: uniqueBuyers.size > 0 ? `${uniqueBuyers.size}+` : 'Active', 
            label: 'Active Buyers' 
          }
        ]);
      }
    } catch (error) {
      // Silently fail - keep default stats
      console.debug('Stats loading error (non-critical):', error);
    }
  };

  const buyerSteps = [
    {
      number: '01',
      icon: Search,
      title: 'Search & Discover',
      description: 'Use our powerful search to find verified African suppliers and products across African markets. Filter by category, country, price, and more.',
      features: ['Browse by category', 'Filter by location', 'Compare prices', 'Verify suppliers'],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderClass: 'border-blue-200',
      duration: '2 min'
    },
    {
      number: '02',
      icon: MessageCircle,
      title: 'Connect & Negotiate',
      description: 'Send RFQs, chat with suppliers, and negotiate terms directly on the platform. Get multiple quotes and compare offers.',
      features: ['Send bulk inquiries', 'Real-time messaging', 'Get quotes', 'Negotiate terms'],
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderClass: 'border-purple-200',
      duration: '5 min'
    },
    {
      number: '03',
      icon: ShoppingCart,
      title: 'Order & Pay Securely',
      description: 'Place orders with secure escrow protection. Your funds are held safely until you approve delivery. Track everything in real-time.',
      features: ['Escrow protection', 'Multiple payment methods', 'Order tracking', 'Dispute resolution'],
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderClass: 'border-green-200',
      duration: '2 min'
    }
  ];

  const sellerSteps = [
    {
      number: '01',
      icon: Building2,
      title: 'List Your Products',
      description: 'Create detailed product listings with specifications, pricing, and high-quality images. Showcase your products to global buyers.',
      features: ['Upload product catalogs', 'Set pricing tiers', 'Add certifications', 'Manage inventory'],
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderClass: 'border-orange-200',
      duration: 'Reviewed before going live'
    },
    {
      number: '02',
      icon: Shield,
      title: 'Get Verified & Discovered',
      description: 'Complete business verification to gain buyer trust and improve visibility. Verified suppliers appear first in search results.',
      features: ['Business verification', 'Quality certifications', 'Customer reviews', 'Trust badges'],
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderClass: 'border-indigo-200',
      duration: '24-48h'
    },
    {
      number: '03',
      icon: TrendingUp,
      title: 'Fulfill & Grow',
      description: 'Process orders, ship products, and scale your business across Africa. Access analytics and growth insights.',
      features: ['Order management', 'Shipping integration', 'Analytics dashboard', 'Growth insights'],
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderClass: 'border-yellow-200',
      duration: 'Ongoing'
    }
  ];

  const buyerBenefits = [
    {
      icon: Shield,
      title: 'Verified Suppliers Only',
      description: 'Every supplier is KYC/AML verified and background-checked',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Lock,
      title: 'Buyer Protection',
      description: 'Escrow payments protect your funds until delivery approval',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Globe,
      title: '54 African Countries',
      description: 'Source from suppliers across all 54 African countries',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: FileText,
      title: 'Request Quotes',
      description: 'Post RFQs and receive competitive quotes from multiple suppliers',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const sellerBenefits = [
    {
      icon: Award,
      title: 'Verified Badge',
      description: 'Get the trusted verified supplier badge on your profile',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: TrendingUp,
      title: 'Higher Visibility',
      description: 'Verified suppliers appear first in search results',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: DollarSign,
      title: 'Secure Payments',
      description: 'Receive payments through escrow with buyer protection',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Truck,
      title: 'Logistics Support',
      description: 'Access our network of logistics partners',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <>
      <SEO 
        title="How It Works - Afrikoni B2B Marketplace"
        description="Learn how Afrikoni works for buyers and sellers. Discover how to source products, connect with verified suppliers, and grow your business across Africa."
        url="/how-it-works"
      />
      <div className="min-h-screen bg-gradient-to-b from-afrikoni-offwhite to-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-afrikoni-earth via-afrikoni-deep to-afrikoni-chestnut py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A937' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <Badge className="bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30 mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Platform Overview
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-afrikoni-cream mb-6">
                How Afrikoni Works
              </h1>
              <p className="text-xl md:text-2xl text-afrikoni-cream/90 mb-8 max-w-3xl mx-auto">
                We connect African businesses with global opportunities through our trusted B2B marketplace platform. Simple, secure, and designed for growth.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-12">
                {stats.map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
                    className="bg-afrikoni-cream/10 backdrop-blur-sm rounded-lg p-4 border border-afrikoni-gold/20"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-afrikoni-gold mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-afrikoni-cream/80">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          {/* Trust & Services Overview (moved from homepage) */}
          <TrustCards />
          <ServicesOverview />

          {/* For Buyers Section */}
          <section className="mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Badge className="bg-green-50 text-green-700 border-green-200 mb-4">
                For Buyers
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Source Products in 3 Simple Steps
              </h2>
              <p className="text-lg text-afrikoni-deep/70 max-w-2xl mx-auto">
                Find verified suppliers, request quotes, and trade with confidence through our protected platform.
              </p>
              <p className="text-base text-afrikoni-deep/60 max-w-2xl mx-auto mt-4">
                Every trade request is reviewed by our team to ensure quality, seriousness, and supplier fit.
              </p>
            </motion.div>

            <div className="relative mb-12">
              {/* Timeline line */}
              <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-afrikoni-gold/20" />

              <div className="space-y-8">
                {buyerSteps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="relative flex items-start gap-6"
                    >
                      {/* Step number circle */}
                      <div className={`hidden md:flex relative z-10 w-16 h-16 ${step.bgColor} rounded-full items-center justify-center flex-shrink-0 shadow-lg border-2 ${step.borderClass}`}>
                        <Icon className={`w-8 h-8 ${step.color}`} />
                      </div>
                      <div className={`md:hidden w-12 h-12 ${step.bgColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border-2 ${step.borderClass}`}>
                        <Icon className={`w-6 h-6 ${step.color}`} />
                      </div>

                      {/* Content */}
                      <Card className={`flex-1 border-2 ${step.borderClass} hover:shadow-xl transition-all`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge className={`${step.bgColor} ${step.color} border ${step.borderClass} mb-2`}>
                                {step.number}
                              </Badge>
                              <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">
                                {step.title}
                              </h3>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {step.duration}
                            </Badge>
                          </div>
                          <p className="text-afrikoni-deep/70 mb-4">
                            {step.description}
                          </p>
                          <ul className="space-y-2">
                            {step.features.map((feature, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-2 text-sm text-afrikoni-deep/70">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Buyer Benefits */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {buyerBenefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className={`h-full border-2 border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all`}>
                      <CardContent className="p-4 text-center">
                        <div className={`w-10 h-10 ${benefit.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                          <Icon className={`w-5 h-5 ${benefit.color}`} />
                        </div>
                        <h4 className="font-semibold text-afrikoni-chestnut mb-1 text-sm">
                          {benefit.title}
                        </h4>
                        <p className="text-xs text-afrikoni-deep/70">
                          {benefit.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Link to={createPageUrl('BuyerCentral')}>
                <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-8 py-6 text-lg font-bold shadow-xl">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Start Sourcing Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </section>

          {/* Divider */}
          <div className="border-t-2 border-afrikoni-gold/20 my-16 md:my-20" />

          {/* For Sellers Section */}
          <section className="mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Badge className="bg-green-50 text-green-700 border-green-200 mb-4">
                For Sellers
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Grow Your Business in 3 Steps
              </h2>
              <p className="text-lg text-afrikoni-deep/70 max-w-2xl mx-auto">
                List products, get verified, and start receiving orders from verified buyers across Africa and the world.
              </p>
            </motion.div>

            <div className="relative mb-12">
              {/* Timeline line */}
              <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-afrikoni-gold/20" />

              <div className="space-y-8">
                {sellerSteps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      className="relative flex items-start gap-6"
                    >
                      {/* Step number circle */}
                      <div className={`hidden md:flex relative z-10 w-16 h-16 ${step.bgColor} rounded-full items-center justify-center flex-shrink-0 shadow-lg border-2 ${step.borderClass}`}>
                        <Icon className={`w-8 h-8 ${step.color}`} />
                      </div>
                      <div className={`md:hidden w-12 h-12 ${step.bgColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border-2 ${step.borderClass}`}>
                        <Icon className={`w-6 h-6 ${step.color}`} />
                      </div>

                      {/* Content */}
                      <Card className={`flex-1 border-2 ${step.borderClass} hover:shadow-xl transition-all`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge className={`${step.bgColor} ${step.color} border ${step.borderClass} mb-2`}>
                                {step.number}
                              </Badge>
                              <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">
                                {step.title}
                              </h3>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {step.duration}
                            </Badge>
                          </div>
                          <p className="text-afrikoni-deep/70 mb-4">
                            {step.description}
                          </p>
                          <ul className="space-y-2">
                            {step.features.map((feature, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-2 text-sm text-afrikoni-deep/70">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Seller Benefits */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {sellerBenefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className={`h-full border-2 border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all`}>
                      <CardContent className="p-4 text-center">
                        <div className={`w-10 h-10 ${benefit.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                          <Icon className={`w-5 h-5 ${benefit.color}`} />
                        </div>
                        <h4 className="font-semibold text-afrikoni-chestnut mb-1 text-sm">
                          {benefit.title}
                        </h4>
                        <p className="text-xs text-afrikoni-deep/70">
                          {benefit.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Link to={createPageUrl('SellerOnboarding')}>
                <Button size="lg" variant="outline" className="border-2 border-afrikoni-gold/40 text-afrikoni-chestnut hover:bg-afrikoni-gold/10 px-8 py-6 text-lg">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Start Selling Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </section>

          {/* Final CTA Section */}
          <section className="bg-gradient-to-r from-afrikoni-chestnut via-afrikoni-deep to-afrikoni-chestnut rounded-2xl p-8 md:p-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-16 h-16 bg-afrikoni-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-afrikoni-chestnut" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-cream mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-afrikoni-cream/90 mb-8 max-w-2xl mx-auto">
                Whether you're a buyer looking to source products or a seller ready to grow your business, Afrikoni makes cross-border trade simple and secure.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-8 py-6 text-lg font-bold shadow-xl">
                    <Users className="w-5 h-5 mr-2" />
                    Join as Buyer
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/become-supplier">
                  <Button size="lg" variant="outline" className="border-2 border-afrikoni-cream/30 text-afrikoni-cream/80 hover:bg-afrikoni-cream/5 px-8 py-6 text-lg opacity-75">
                    <Building2 className="w-5 h-5 mr-2" />
                    Become a Supplier
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-afrikoni-cream/70 mt-6">
                No credit card required • Free to join • Start trading today
              </p>
            </motion.div>
          </section>
        </div>
      </div>
    </>
  );
}
