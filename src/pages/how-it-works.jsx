import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import {
  Search, MessageCircle, ShoppingCart, Building, Users, TrendingUp, CheckCircle,
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
    { value: '0', label: 'Verified Suppliers' },
    { value: '0', label: 'Verified Listings' },
    { value: '54', label: 'African Countries' },
    { value: '8', label: 'Active Buyers' } // Updated to show all registered buyers/hybrid users
  ]);

  useEffect(() => {
    loadRealStats();
  }, []);

  const loadRealStats = async () => {
    try {
      // Get verified suppliers count - check both verified field and verification_status
      const { count: verifiedSuppliers, error: suppliersError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .or('verified.eq.true,verification_status.eq.verified');

      // Get verified listings - products from verified companies
      // First get verified company IDs, then count products from those companies
      let verifiedListingsCount = 0;
      try {
        // Get verified company IDs
        const { data: verifiedCompanies, error: companiesError } = await supabase
          .from('companies')
          .select('id')
          .or('verified.eq.true,verification_status.eq.verified');

        if (!companiesError && verifiedCompanies && verifiedCompanies.length > 0) {
          const verifiedCompanyIds = verifiedCompanies.map(c => c.id);

          // Count active products from verified companies
          const { count: productsCount, error: productsError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .in('company_id', verifiedCompanyIds)
            .eq('status', 'active');

          if (!productsError && productsCount !== null) {
            verifiedListingsCount = productsCount;
          }
        }
      } catch (listingsError) {
        console.debug('Verified listings count error:', listingsError);
        // Fallback to all active products if we can't filter by verified companies
        const { count: allProducts } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        if (allProducts !== null) {
          verifiedListingsCount = allProducts;
        }
      }

      // Get active buyers - count all users with buyer or hybrid role (registered buyers)
      let activeBuyersCount = 0;
      try {
        // Count all users with buyer or hybrid role from profiles
        // This includes all registered buyers on the platform, not just those who have created RFQs/orders
        const { count: buyersCount, error: buyersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .in('role', ['buyer', 'hybrid']);

        if (!buyersError && buyersCount !== null) {
          activeBuyersCount = buyersCount;
        } else {
          // Fallback: count unique buyer companies from RFQs/orders if profile query fails
          const { data: rfqsData, error: rfqsError } = await supabase
            .from('rfqs')
            .select('buyer_company_id')
            .limit(10000);

          if (!rfqsError && rfqsData) {
            const uniqueBuyerCompanies = new Set(
              rfqsData.map(r => r.buyer_company_id).filter(Boolean)
            );

            // Also check orders for additional buyer companies
            const { data: ordersData, error: ordersError } = await supabase
              .from('orders')
              .select('buyer_company_id')
              .limit(10000);

            if (!ordersError && ordersData) {
              ordersData.forEach(order => {
                if (order.buyer_company_id) {
                  uniqueBuyerCompanies.add(order.buyer_company_id);
                }
              });
            }

            activeBuyersCount = uniqueBuyerCompanies.size;
          }
        }
      } catch (buyersError) {
        console.debug('Active buyers count error:', buyersError);
      }

      // Update stats with real data
      if (suppliersError) {
        console.warn('Failed to load verified suppliers count:', suppliersError);
      }

      // Always show the actual numbers, even if 0
      setStats([
        {
          value: `${verifiedSuppliers || 0}`,
          label: 'Verified Suppliers'
        },
        {
          value: `${verifiedListingsCount || 0}`,
          label: 'Verified Listings'
        },
        { value: '54', label: 'African Countries' },
        {
          value: `${activeBuyersCount || 0}`,
          label: 'Active Buyers'
        }
      ]);

      console.log('[How It Works] Real-time stats loaded:', {
        verifiedSuppliers: verifiedSuppliers || 0,
        verifiedListings: verifiedListingsCount || 0,
        activeBuyers: activeBuyersCount || 0
      });
    } catch (error) {
      console.error('Stats loading error:', error);
      // On error, keep showing default values (don't hide stats)
      setStats([
        { value: '0', label: 'Verified Suppliers' },
        { value: '0', label: 'Verified Listings' },
        { value: '54', label: 'African Countries' },
        { value: '8', label: 'Active Buyers' } // Default: count all buyer/hybrid users
      ]);
    }
  };

  const buyerSteps = [
    {
      number: '01',
      icon: Search,
      title: 'Discover Verified Suppliers',
      description: 'Access our curated database of pre-verified suppliers. Every company undergoes KYC, business license verification, and quality checks before listing.',
      features: [
        'AI-powered supplier matching',
        'Verified certifications & compliance docs',
        'Trust scores & performance metrics',
        '54 African countries coverage'
      ],
      premium: 'Premium Feature: Get matched with suppliers based on your buying patterns and preferences',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderClass: 'border-blue-200',
      duration: '2 minutes'
    },
    {
      number: '02',
      icon: MessageCircle,
      title: 'Request Quotes & Negotiate',
      description: 'Post detailed RFQs that our AI matches to qualified suppliers. Receive competitive quotes within 24-48 hours. Our team reviews every RFQ for quality.',
      features: [
        'Bulk RFQ creation with KoniAI',
        'Automated supplier matching',
        'Real-time quote comparison dashboard',
        'Direct negotiation with verified suppliers'
      ],
      premium: 'Enterprise Feature: Dedicated account manager helps negotiate custom terms and pricing',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderClass: 'border-purple-200',
      duration: '24-48 hours'
    },
    {
      number: '03',
      icon: ShoppingCart,
      title: 'Trade with Full Protection',
      description: 'Execute orders with Afrikoni Trade Shield: escrow protection, real-time tracking, quality inspection services, and guaranteed dispute resolution.',
      features: [
        'Bank-grade escrow protection',
        'Multi-currency support (USD, EUR, GBP, XAF)',
        'End-to-end shipment tracking',
        'White-glove dispute resolution'
      ],
      premium: 'Enterprise Feature: Priority support, custom payment terms, and dedicated logistics coordination',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderClass: 'border-green-200',
      duration: 'Protected until delivery'
    }
  ];

  const sellerSteps = [
    {
      number: '01',
      icon: Building,
      title: 'Apply & Get Verified',
      description: 'Submit your business details, certifications, and documentation. Our team manually reviews every application to maintain marketplace quality. Only verified suppliers are accepted.',
      features: [
        'KYC/AML compliance verification',
        'Business license & tax document review',
        'Quality certification validation',
        'Onboarding support from our team'
      ],
      premium: 'Premium Feature: Fast-track verification (24-48h) for established businesses with proven track records',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderClass: 'border-orange-200',
      duration: '24-72 hours review'
    },
    {
      number: '02',
      icon: Shield,
      title: 'List Products & Get Discovered',
      description: 'Create comprehensive product listings that appear first in search results. Verified suppliers get priority placement, trust badges, and access to premium buyers.',
      features: [
        'Priority search ranking for verified suppliers',
        'Product listing optimization guidance',
        'Access to premium buyer RFQs',
        'Trust score & performance analytics'
      ],
      premium: 'Enterprise Feature: Bulk product import via API, custom catalog pages, and featured placement options',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderClass: 'border-indigo-200',
      duration: 'Listings go live after review'
    },
    {
      number: '03',
      icon: TrendingUp,
      title: 'Fulfill Orders & Scale',
      description: 'Receive orders from verified buyers, process payments through escrow, and scale your business across 54 African countries with our logistics network.',
      features: [
        'Secure escrow payment processing',
        'Integrated logistics & shipping partners',
        'Real-time order & inventory management',
        'Business analytics & growth insights'
      ],
      premium: 'Enterprise Feature: Volume discounts, custom payment terms, dedicated account manager, and API integration',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderClass: 'border-yellow-200',
      duration: 'Ongoing support'
    }
  ];

  const buyerBenefits = [
    {
      icon: Shield,
      title: '100% Verified Suppliers',
      description: 'Every supplier undergoes KYC/AML checks, business license verification, and quality assessment. No unverified listings.',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Lock,
      title: 'Trade Shield Protection',
      description: 'Bank-grade escrow protection. Funds held securely until delivery confirmation. 100% money-back guarantee on verified disputes.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: BarChart3,
      title: 'AI-Powered Matching',
      description: 'Our AI analyzes your RFQs and matches you with the best suppliers based on quality, price, and delivery capabilities.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Globe,
      title: '54 African Countries',
      description: 'Single platform to source from all 54 African countries. Local expertise, global reach.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Users,
      title: 'Dedicated Support',
      description: 'Premium buyers get dedicated account managers for negotiations, logistics coordination, and priority dispute resolution.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      icon: Zap,
      title: 'Fast Response Times',
      description: 'Verified suppliers respond within 24-48 hours. Our team ensures quality and seriousness of every RFQ.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  const sellerBenefits = [
    {
      icon: Award,
      title: 'Verified Trust Badge',
      description: 'Exclusive verified badge increases buyer confidence and conversion rates by up to 300%.',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: TrendingUp,
      title: 'Priority Search Ranking',
      description: 'Verified suppliers appear first in all search results. Up to 10x more visibility than unverified competitors.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: DollarSign,
      title: 'Guaranteed Payments',
      description: 'Escrow protection means you get paid when buyers confirm delivery. Zero payment disputes or chargebacks.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Users,
      title: 'Premium Buyer Access',
      description: 'Access exclusive RFQs from verified buyers. Higher-value orders, better payment terms, long-term partnerships.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: BarChart3,
      title: 'Business Analytics',
      description: 'Advanced analytics dashboard shows buyer behavior, conversion rates, pricing insights, and growth opportunities.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      icon: Truck,
      title: 'Logistics Network',
      description: 'Integrated logistics partners across 54 countries. Streamlined shipping, customs clearance, and delivery tracking.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
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
              <Badge className="bg-os-accent/20 text-os-accent border-os-accent/30 mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Platform Overview
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-afrikoni-cream mb-6">
                The Premium B2B Marketplace for Africa
              </h1>
              <p className="text-os-xl md:text-os-2xl text-afrikoni-cream/90 mb-4 max-w-3xl mx-auto font-medium">
                Enterprise-grade platform connecting verified African suppliers with global buyers. KYC-verified, escrow-protected, and built for serious business.
              </p>
              <p className="text-os-base md:text-os-lg text-afrikoni-cream/80 max-w-2xl mx-auto mb-8">
                Every supplier is manually verified. Every transaction is protected. Every partnership is backed by our guarantee.
              </p>

              {/* Premium Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                <Badge className="bg-afrikoni-cream/10 backdrop-blur-sm border-os-accent/40 text-afrikoni-cream px-4 py-2">
                  <Shield className="w-4 h-4 mr-2" />
                  KYC/AML Compliant
                </Badge>
                <Badge className="bg-afrikoni-cream/10 backdrop-blur-sm border-os-accent/40 text-afrikoni-cream px-4 py-2">
                  <Lock className="w-4 h-4 mr-2" />
                  Bank-Grade Security
                </Badge>
                <Badge className="bg-afrikoni-cream/10 backdrop-blur-sm border-os-accent/40 text-afrikoni-cream px-4 py-2">
                  <Award className="w-4 h-4 mr-2" />
                  Enterprise Ready
                </Badge>
                <Badge className="bg-afrikoni-cream/10 backdrop-blur-sm border-os-accent/40 text-afrikoni-cream px-4 py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  100% Verified Suppliers
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-12">
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

        {/* Choose Your Path Section - New addition for clarity */}
        <section className="-mt-16 md:-mt-20 relative z-20 px-4 mb-20">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 md:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-8 shadow-xl border-t-4 border-blue-600 hover:transform hover:-translate-y-1 transition-all"
            >
              <div className="w-14 h-14 bg-blue-100/50 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">I want to Source Products</h3>
              <p className="text-gray-600 mb-6 min-h-[48px]">
                For retailers, businesses, and procurement teams looking for verified African suppliers.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Free to join & request quotes
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Access thousands of verified products
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Secure escrow payments
                </li>
              </ul>
              <Button onClick={() => document.getElementById('for-buyers').scrollIntoView({ behavior: 'smooth' })} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg">
                See How Buying Works
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-8 shadow-xl border-t-4 border-orange-500 hover:transform hover:-translate-y-1 transition-all"
            >
              <div className="w-14 h-14 bg-orange-100/50 rounded-xl flex items-center justify-center mb-6 text-orange-600">
                <Building className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">I want to Sell Products</h3>
              <p className="text-gray-600 mb-6 min-h-[48px]">
                For manufacturers, wholesalers, and producers wanting to export to global markets.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Verify once, trade globally
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Guaranteed payments on delivery
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Manage orders & logistics
                </li>
              </ul>
              <Button onClick={() => document.getElementById('for-sellers').scrollIntoView({ behavior: 'smooth' })} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 text-lg">
                See How Selling Works
              </Button>
            </motion.div>
          </div>
        </section >

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
                Source Premium Products in 3 Steps
              </h2>
              <p className="text-os-lg text-afrikoni-deep/70 max-w-2xl mx-auto font-medium">
                Connect with verified suppliers, get competitive quotes, and trade with full protection. Enterprise-grade platform built for serious buyers.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <Badge variant="outline" className="text-os-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  All suppliers manually verified
                </Badge>
                <Badge variant="outline" className="text-os-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Escrow protection included
                </Badge>
                <Badge variant="outline" className="text-os-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  24-48h quote response time
                </Badge>
              </div>
            </motion.div>

            <div className="relative mb-12">
              {/* Timeline line */}
              <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-os-accent/20" />

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
                      <div className={`hidden md:flex relative z-10 w-16 h-16 ${step.bgColor} rounded-full items-center justify-center flex-shrink-0 shadow-os-md border-2 ${step.borderClass}`}>
                        <Icon className={`w-8 h-8 ${step.color}`} />
                      </div>
                      <div className={`md:hidden w-12 h-12 ${step.bgColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-os-md border-2 ${step.borderClass}`}>
                        <Icon className={`w-6 h-6 ${step.color}`} />
                      </div>

                      {/* Content */}
                      <Card className={`flex-1 border-2 ${step.borderClass} hover:shadow-os-lg transition-all`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge className={`${step.bgColor} ${step.color} border ${step.borderClass} mb-2`}>
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
                          <p className="text-afrikoni-deep/70 mb-4">
                            {step.description}
                          </p>
                          <ul className="space-y-2 mb-3">
                            {step.features.map((feature, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-2 text-os-sm text-afrikoni-deep/70">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          {step.premium && (
                            <div className="mt-3 pt-3 border-t border-os-accent/20">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-os-accent flex-shrink-0 mt-0.5" />
                                <p className="text-os-xs text-afrikoni-deep/60 italic">
                                  {step.premium}
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Buyer Benefits */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
                    <Card className={`h-full border-2 border-os-accent/20 hover:border-os-accent/40 transition-all`}>
                      <CardContent className="p-4 text-center">
                        <div className={`w-10 h-10 ${benefit.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                          <Icon className={`w-5 h-5 ${benefit.color}`} />
                        </div>
                        <h4 className="font-semibold text-afrikoni-chestnut mb-1 text-os-sm">
                          {benefit.title}
                        </h4>
                        <p className="text-os-xs text-afrikoni-deep/70">
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
                <Button size="lg" className="bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut px-8 py-6 text-os-lg font-bold shadow-os-lg">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Start Sourcing Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </section>

          {/* Divider */}
          <div className="border-t-2 border-os-accent/20 my-16 md:my-20" />

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
                Scale Your Business in 3 Steps
              </h2>
              <p className="text-os-lg text-afrikoni-deep/70 max-w-2xl mx-auto font-medium">
                Get verified, list products, and access premium buyers. Only serious suppliers are accepted - quality over quantity.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <Badge variant="outline" className="text-os-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Manual verification process
                </Badge>
                <Badge variant="outline" className="text-os-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  10x more visibility when verified
                </Badge>
                <Badge variant="outline" className="text-os-xs">
                  <DollarSign className="w-3 h-3 mr-1" />
                  Guaranteed payments via escrow
                </Badge>
              </div>
            </motion.div>

            <div className="relative mb-12">
              {/* Timeline line */}
              <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-os-accent/20" />

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
                      <div className={`hidden md:flex relative z-10 w-16 h-16 ${step.bgColor} rounded-full items-center justify-center flex-shrink-0 shadow-os-md border-2 ${step.borderClass}`}>
                        <Icon className={`w-8 h-8 ${step.color}`} />
                      </div>
                      <div className={`md:hidden w-12 h-12 ${step.bgColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-os-md border-2 ${step.borderClass}`}>
                        <Icon className={`w-6 h-6 ${step.color}`} />
                      </div>

                      {/* Content */}
                      <Card className={`flex-1 border-2 ${step.borderClass} hover:shadow-os-lg transition-all`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge className={`${step.bgColor} ${step.color} border ${step.borderClass} mb-2`}>
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
                          <p className="text-afrikoni-deep/70 mb-4">
                            {step.description}
                          </p>
                          <ul className="space-y-2 mb-3">
                            {step.features.map((feature, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-2 text-os-sm text-afrikoni-deep/70">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          {step.premium && (
                            <div className="mt-3 pt-3 border-t border-os-accent/20">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-os-accent flex-shrink-0 mt-0.5" />
                                <p className="text-os-xs text-afrikoni-deep/60 italic">
                                  {step.premium}
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Seller Benefits */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
                    <Card className={`h-full border-2 border-os-accent/20 hover:border-os-accent/40 transition-all`}>
                      <CardContent className="p-4 text-center">
                        <div className={`w-10 h-10 ${benefit.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                          <Icon className={`w-5 h-5 ${benefit.color}`} />
                        </div>
                        <h4 className="font-semibold text-afrikoni-chestnut mb-1 text-os-sm">
                          {benefit.title}
                        </h4>
                        <p className="text-os-xs text-afrikoni-deep/70">
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
                <Button size="lg" variant="outline" className="border-2 border-os-accent/40 text-afrikoni-chestnut hover:bg-os-accent/10 px-8 py-6 text-os-lg">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Start Selling Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
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
                <Zap className="w-8 h-8 text-afrikoni-chestnut" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-cream mb-4">
                Ready to Join Africa's Premium B2B Marketplace?
              </h2>
              <p className="text-os-lg text-afrikoni-cream/90 mb-4 max-w-2xl mx-auto font-medium">
                Enterprise-grade platform trusted by serious buyers and verified suppliers across 54 African countries.
              </p>
              <p className="text-os-base text-afrikoni-cream/80 mb-8 max-w-2xl mx-auto">
                Every account is manually reviewed. Every transaction is protected. Every partnership is backed by our guarantee.
              </p>

              {/* Key Differentiators */}
              <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
                <div className="bg-afrikoni-cream/10 backdrop-blur-sm rounded-lg p-4 border border-os-accent/30">
                  <div className="text-os-2xl font-bold text-os-accent mb-1">100%</div>
                  <div className="text-os-sm text-afrikoni-cream/80">Verified Suppliers Only</div>
                </div>
                <div className="bg-afrikoni-cream/10 backdrop-blur-sm rounded-lg p-4 border border-os-accent/30">
                  <div className="text-os-2xl font-bold text-os-accent mb-1">Bank-Grade</div>
                  <div className="text-os-sm text-afrikoni-cream/80">Escrow Protection</div>
                </div>
                <div className="bg-afrikoni-cream/10 backdrop-blur-sm rounded-lg p-4 border border-os-accent/30">
                  <div className="text-os-2xl font-bold text-os-accent mb-1">24/7</div>
                  <div className="text-os-sm text-afrikoni-cream/80">Priority Support</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="bg-os-accent hover:bg-os-accentDark text-afrikoni-chestnut px-8 py-6 text-os-lg font-bold shadow-os-lg">
                    <Users className="w-5 h-5 mr-2" />
                    Join as Buyer
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/become-supplier">
                  <Button size="lg" variant="outline" className="border-2 border-afrikoni-cream/30 text-afrikoni-cream/80 hover:bg-afrikoni-cream/5 px-8 py-6 text-os-lg opacity-75">
                    <Building className="w-5 h-5 mr-2" />
                    Become a Supplier
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              <p className="text-os-sm text-afrikoni-cream/70 mt-6">
                Free to join • No credit card required • Manual verification ensures quality • Start trading today
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                <Badge variant="outline" className="border-afrikoni-cream/30 text-afrikoni-cream/80">
                  <Shield className="w-3 h-3 mr-1" />
                  KYC/AML Compliant
                </Badge>
                <Badge variant="outline" className="border-afrikoni-cream/30 text-afrikoni-cream/80">
                  <Lock className="w-3 h-3 mr-1" />
                  SOC 2 Ready
                </Badge>
                <Badge variant="outline" className="border-afrikoni-cream/30 text-afrikoni-cream/80">
                  <Globe className="w-3 h-3 mr-1" />
                  54 Countries
                </Badge>
              </div>
            </motion.div>
          </section>
        </div>
      </div>
    </>
  );
}
