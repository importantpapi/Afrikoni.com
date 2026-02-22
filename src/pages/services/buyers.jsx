/**
 * Buyers Service Detail Page
 * Join as Buyer - Source Verified African Suppliers
 * Enhanced with modern UI similar to become-supplier page
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Shield, Search, CheckCircle, 
  FileText, Globe, ArrowRight, Lock, TrendingUp, Users,
  Award, BarChart3, MessageSquare, Sparkles, Clock, Package,
  MapPin, Star, Zap, Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import SEO from '@/components/SEO';
import { supabase } from '@/api/supabaseClient';

export default function BuyersService() {
  const [stats, setStats] = useState([
    { value: '...', label: 'Verified Suppliers' },
    { value: '...', label: 'Products Available' },
    { value: '54', label: 'African Countries' },
    { value: '...', label: 'Active Buyers' }
  ]);

  useEffect(() => {
    loadRealStats();
  }, []);

  const loadRealStats = async () => {
    try {
      // Get verified suppliers count
      const { count: verifiedSuppliers } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('verified', true);

      // Get active products count
      const { count: activeProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get unique countries from products
      const { data: countriesData } = await supabase
        .from('products')
        .select('country_of_origin')
        .eq('status', 'active');

      const uniqueCountries = new Set(
        countriesData?.map(p => p.country_of_origin).filter(Boolean) || []
      );

      // Get active buyers (users with RFQs or orders)
      const { data: buyersData } = await supabase
        .from('rfqs')
        .select('user_id')
        .limit(1000);

      const uniqueBuyers = new Set(buyersData?.map(r => r.user_id).filter(Boolean) || []);

      setStats([
        { 
          value: verifiedSuppliers > 0 ? `${verifiedSuppliers}+` : 'Growing', 
          label: 'Verified Suppliers' 
        },
        { 
          value: activeProducts > 0 ? `${activeProducts}+` : 'Available', 
          label: 'Products Available' 
        },
        { value: '54', label: 'African Countries' },
        { 
          value: uniqueBuyers.size > 0 ? `${uniqueBuyers.size}+` : 'Active', 
          label: 'Active Buyers' 
        }
      ]);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Keep default values on error
    }
  };

  const benefits = [
    {
      icon: Shield,
      title: 'Verified Suppliers Only',
      description: 'All suppliers undergo rigorous KYC/AML verification and background checks. Trade with confidence knowing every supplier is legitimate.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      icon: Search,
      title: 'Easy Product Discovery',
      description: 'Search thousands of products across 54 African countries or post RFQs to get custom quotes from verified suppliers.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: Lock,
      title: 'Buyer Protection',
      description: 'Escrow payments protect your funds until you receive and approve your order. Money-back guarantee on all transactions.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      icon: FileText,
      title: 'Request Quotes (RFQ)',
      description: 'Post detailed RFQs and receive competitive quotes from multiple verified suppliers. Compare and choose the best offer.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      icon: Globe,
      title: '54 African Countries',
      description: 'Source from suppliers across all 54 African countries in one unified platform. No need to manage multiple relationships.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      icon: Award,
      title: 'Quality Assurance',
      description: 'Access inspection services and quality control before shipment. Ensure you receive exactly what you ordered.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Browse or Post RFQ',
      description: 'Search products by category, country, or specifications. Or post a Request for Quote to get custom offers from multiple suppliers.',
      icon: Search,
      duration: '2 min'
    },
    {
      number: '02',
      title: 'Compare & Choose',
      description: 'Compare suppliers, prices, MOQs, and reviews. View verified badges and trust scores to make informed decisions.',
      icon: BarChart3,
      duration: '5 min'
    },
    {
      number: '03',
      title: 'Secure Payment',
      description: 'Pay through our escrow system - funds are held securely until you approve delivery. Your money is protected.',
      icon: Lock,
      duration: '2 min'
    },
    {
      number: '04',
      title: 'Receive & Verify',
      description: 'Get your order, verify quality, and release payment. Access logistics tracking and inspection services if needed.',
      icon: CheckCircle,
      duration: 'Varies'
    }
  ];

  const buyerProtection = [
    'Escrow-protected payments until delivery approval',
    'Money-back guarantee on all transactions',
    'Dispute resolution support',
    'Quality inspection services available',
    'Verified supplier network only',
    '24/7 customer support'
  ];

  return (
    <>
      <SEO 
        title="Join as Buyer - Source Verified African Suppliers"
        description="Source verified African suppliers, request quotes, and trade with confidence. Join as a buyer on Afrikoni B2B marketplace."
        url="/services/buyers"
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
              <Badge className="bg-os-accent/20 text-os-accent border-os-accent/30 mb-4">
                <ShoppingBag className="w-3 h-3 mr-1" />
                Buyer Onboarding
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-afrikoni-cream mb-6">
                Source from Verified<br />African Suppliers
              </h1>
              <p className="text-os-xl md:text-os-2xl text-afrikoni-cream/90 mb-8 max-w-3xl mx-auto">
                Join Afrikoni as a buyer and access verified suppliers across 54 African countries. Request quotes, compare offers, and trade with confidence through our protected platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link to="/signup">
                  <Button size="lg" className="bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut px-8 py-6 text-os-lg font-bold shadow-os-lg">
                    <Users className="w-5 h-5 mr-2" />
                    Start Free Signup
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button size="lg" variant="outline" className="border-2 border-afrikoni-cream/50 text-afrikoni-cream hover:bg-afrikoni-cream/10 px-8 py-6 text-os-lg">
                    Browse Products
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {stats.map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
                    className="bg-afrikoni-cream/10 backdrop-blur-sm rounded-lg p-4 border border-os-accent/20"
                  >
                    <div className="text-os-2xl md:text-3xl font-bold text-os-accent mb-1">
                      {stat.value}
                    </div>
                    <div className="text-os-sm text-afrikoni-cream/80">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          {/* Benefits Section */}
          <section className="mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Why Buy on Afrikoni?
              </h2>
              <p className="text-os-lg text-afrikoni-deep/70 max-w-2xl mx-auto">
                Secure sourcing with verified suppliers, buyer protection, and seamless cross-border trade.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className={`h-full border-2 ${benefit.borderColor} hover:shadow-os-lg transition-all`}>
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 ${benefit.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                          <Icon className={`w-6 h-6 ${benefit.color}`} />
                        </div>
                        <h3 className="text-os-xl font-bold text-afrikoni-chestnut mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-afrikoni-deep/70">
                          {benefit.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* How It Works Section */}
          <section className="mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                How It Works
              </h2>
              <p className="text-os-lg text-afrikoni-deep/70 max-w-2xl mx-auto">
                Source with confidence in 4 simple steps. Most buyers complete their first order in under 30 minutes.
              </p>
            </motion.div>

            <div className="relative">
              {/* Timeline line */}
              <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-os-accent/20" />

              <div className="space-y-8">
                {steps.map((step, idx) => {
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
                      <div className="hidden md:flex relative z-10 w-16 h-16 bg-os-accent rounded-full items-center justify-center flex-shrink-0 shadow-os-md">
                        <Icon className="w-8 h-8 text-afrikoni-chestnut" />
                      </div>
                      <div className="md:hidden w-12 h-12 bg-os-accent rounded-full flex items-center justify-center flex-shrink-0 shadow-os-md">
                        <Icon className="w-6 h-6 text-afrikoni-chestnut" />
                      </div>

                      {/* Content */}
                      <Card className="flex-1 border-os-accent/20 hover:border-os-accent/40 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge className="bg-os-accent/10 text-os-accent border-os-accent/30 mb-2">
                                {step.number}
                              </Badge>
                              <h3 className="text-os-xl font-bold text-afrikoni-chestnut mb-2">
                                {step.title}
                              </h3>
                            </div>
                            <Badge variant="outline" className="text-os-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {step.duration}
                            </Badge>
                          </div>
                          <p className="text-afrikoni-deep/70">
                            {step.description}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Buyer Protection Section */}
          <section className="mb-16 md:mb-20">
            <Card className="border-2 border-os-accent/30 bg-gradient-to-br from-os-accent/5 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-os-2xl">
                  <Shield className="w-6 h-6 text-os-accent" />
                  Buyer Protection & Guarantees
                </CardTitle>
                <p className="text-afrikoni-deep/70 mt-2">
                  Your peace of mind is our priority. Every transaction is protected.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {buyerProtection.map((protection, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-os-accent flex-shrink-0 mt-0.5" />
                      <span className="text-afrikoni-deep">{protection}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Pricing Section */}
          <section className="mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Transparent Pricing
              </h2>
              <p className="text-os-lg text-afrikoni-deep/70">
                No hidden fees. Browse and request quotes for free.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-os-accent/20">
                <CardHeader>
                  <CardTitle className="text-os-xl">Browse & Search</CardTitle>
                  <div className="text-3xl font-bold text-os-accent mt-2">
                    Free
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-os-sm text-afrikoni-deep/70">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Unlimited product browsing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Search all suppliers
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      View product details
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-os-accent bg-gradient-to-br from-os-accent/10 to-white">
                <CardHeader>
                  <Badge className="bg-os-accent text-afrikoni-chestnut mb-2 w-fit">
                    Most Popular
                  </Badge>
                  <CardTitle className="text-os-xl">Post RFQ</CardTitle>
                  <div className="text-3xl font-bold text-os-accent mt-2">
                    Free
                  </div>
                  <p className="text-os-sm text-afrikoni-deep/70 mt-1">
                    Request quotes from suppliers
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-os-sm text-afrikoni-deep/70">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Post unlimited RFQs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Receive multiple quotes
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Compare offers
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-os-accent/20">
                <CardHeader>
                  <CardTitle className="text-os-xl">Transaction Fee</CardTitle>
                  <div className="text-3xl font-bold text-os-accent mt-2">
                    4%
                  </div>
                  <p className="text-os-sm text-afrikoni-deep/70 mt-1">
                    Only on successful orders
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-os-sm text-afrikoni-deep/70">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Escrow protection included
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Dispute resolution
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Payment processing
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="bg-gradient-to-r from-afrikoni-chestnut via-afrikoni-deep to-afrikoni-chestnut rounded-os-md p-8 md:p-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-16 h-16 bg-os-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-8 h-8 text-afrikoni-chestnut" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-cream mb-4">
                Ready to Source from Africa?
              </h2>
              <p className="text-os-lg text-afrikoni-cream/90 mb-8 max-w-2xl mx-auto">
                Join buyers already sourcing verified products from African suppliers. Start browsing products or post your first RFQ today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut px-8 py-6 text-os-lg font-bold shadow-os-lg">
                    <Users className="w-5 h-5 mr-2" />
                    Join as Buyer
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button size="lg" variant="outline" className="border-2 border-afrikoni-cream/50 text-afrikoni-cream hover:bg-afrikoni-cream/10 px-8 py-6 text-os-lg">
                    <Search className="w-5 h-5 mr-2" />
                    Browse Products
                  </Button>
                </Link>
              </div>
              <p className="text-os-sm text-afrikoni-cream/70 mt-6">
                No credit card required • Free to browse • Free RFQ posting
              </p>
            </motion.div>
          </section>
        </div>
      </div>
    </>
  );
}
