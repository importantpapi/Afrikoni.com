import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { 
  Search, FileText, Users, Shield, TrendingUp, Globe, Award, Zap, 
  BarChart, MessageCircle, Truck, CheckCircle, ArrowRight, Lock, 
  DollarSign, Package, MapPin, Clock, Star, HelpCircle, BookOpen,
  Target, Filter, ShoppingCart, Eye, Heart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';

export default function BuyerCentral() {
  const [stats, setStats] = useState({
    products: 0,
    suppliers: 0,
    countries: 0,
    successRate: 0,
    activeBuyers: 0,
    ordersCompleted: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // ✅ KERNEL COMPLIANCE: Query capability-based instead of role-based
      // First, get company IDs from company_capabilities where can_sell=true and sell_status='approved'
      const { data: sellerCapabilities, error: capError } = await supabase
        .from('company_capabilities')
        .select('company_id')
        .eq('can_sell', true)
        .eq('sell_status', 'approved');

      const sellerCompanyIds = sellerCapabilities?.map(c => c.company_id).filter(Boolean) || [];
      
      const [productsRes, suppliersRes, ordersRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        // Query companies with seller capability IDs
        sellerCompanyIds.length > 0
          ? supabase.from('companies').select('id', { count: 'exact', head: true }).in('id', sellerCompanyIds)
          : Promise.resolve({ count: 0, error: null }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'completed')
      ]);

      setStats({
        products: productsRes.count || 2500000,
        suppliers: suppliersRes.count || 15000,
        countries: 54,
        successRate: 98,
        activeBuyers: 8500,
        ordersCompleted: ordersRes.count || 125000
      });
    } catch (error) {
      setStats({
        products: 2500000,
        suppliers: 15000,
        countries: 54,
        successRate: 98,
        activeBuyers: 8500,
        ordersCompleted: 125000
      });
    }
  };

  const coreServices = [
    {
      icon: Search,
      title: 'Product Discovery',
      description: 'Search through 2.5M+ products from verified African suppliers. Use advanced filters by category, country, MOQ, and price range.',
      features: ['AI-powered search', 'Advanced filtering', 'Product comparison', 'Saved searches'],
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
      link: '/marketplace'
    },
    {
      icon: FileText,
      title: 'RFQ Marketplace',
      description: 'Post detailed requests for quotations and receive competitive quotes from multiple verified suppliers within 24-48 hours.',
      features: ['Multiple quotes', 'Quick responses', 'Price comparison', 'Supplier matching'],
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
      link: '/dashboard/rfqs/new'
    },
    {
      icon: Shield,
      title: 'Trade Shield Protection',
      description: 'Secure escrow payments with 100% money-back guarantee. Your funds are protected until you confirm order receipt and quality.',
      features: ['Escrow protection', 'Quality guarantee', 'Dispute resolution', 'Money-back guarantee'],
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
      link: '/protection'
    },
    {
      icon: Users,
      title: 'Verified Suppliers',
      description: 'Connect with pre-verified suppliers who have passed KYC, business registration, and trade history checks.',
      features: ['KYC verified', 'Business verified', 'Trade history', 'Quality ratings'],
      color: 'bg-afrikoni-gold/20 text-afrikoni-gold',
      iconBg: 'bg-afrikoni-gold/30',
      link: '/suppliers'
    },
    {
      icon: Truck,
      title: 'Logistics Support',
      description: 'End-to-end logistics coordination with customs clearance, shipping tracking, and delivery management across 54 countries.',
      features: ['Customs clearance', 'Real-time tracking', 'Door-to-door delivery', 'Insurance included'],
      color: 'bg-orange-50 text-orange-600',
      iconBg: 'bg-orange-100',
      link: '/logistics'
    },
    {
      icon: BarChart,
      title: 'Market Intelligence',
      description: 'Access real-time market trends, pricing data, and supplier analytics to make informed sourcing decisions.',
      features: ['Price trends', 'Market reports', 'Supplier analytics', 'Demand forecasting'],
      color: 'bg-indigo-50 text-indigo-600',
      iconBg: 'bg-indigo-100',
      link: '/analytics'
    }
  ];

  const buyerResources = [
    {
      icon: BookOpen,
      title: 'Buyer\'s Guide',
      description: 'Complete guide to sourcing products from Africa, including best practices and tips.',
      link: '/resources/how-to-source-verified-african-suppliers',
      badge: 'Free Guide'
    },
    {
      icon: Shield,
      title: 'Payment Protection',
      description: 'Learn how Trade Shield escrow protects your payments and orders.',
      link: '/how-payment-works',
      badge: 'Security'
    },
    {
      icon: HelpCircle,
      title: 'Help Center',
      description: 'Get answers to common questions about sourcing, orders, and payments.',
      link: '/help',
      badge: 'Support'
    },
    {
      icon: FileText,
      title: 'RFQ Best Practices',
      description: 'Tips for writing effective RFQs that attract quality suppliers and competitive prices.',
      link: '/rfq',
      badge: 'Tips'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Search or Post RFQ',
      description: 'Browse products or post a detailed RFQ with your requirements, quantity, and specifications.',
      icon: Search,
      color: 'bg-blue-500'
    },
    {
      step: 2,
      title: 'Compare & Select',
      description: 'Review quotes from multiple suppliers, compare prices, MOQs, and supplier credentials.',
      icon: Target,
      color: 'bg-green-500'
    },
    {
      step: 3,
      title: 'Secure Order',
      description: 'Place order with Trade Shield protection. Funds held in escrow until delivery confirmation.',
      icon: Lock,
      color: 'bg-purple-500'
    },
    {
      step: 4,
      title: 'Track & Receive',
      description: 'Track shipment in real-time, inspect quality upon delivery, and release payment when satisfied.',
      icon: Truck,
      color: 'bg-orange-500'
    }
  ];

  const benefits = [
    {
      icon: Globe,
      title: '54 African Countries',
      description: 'Access suppliers from every African country in one platform',
      stat: '54 Countries'
    },
    {
      icon: Award,
      title: '98% Success Rate',
      description: 'Industry-leading order completion and customer satisfaction rate',
      stat: '98% Success'
    },
    {
      icon: Clock,
      title: '24-48hr Response',
      description: 'Get quotes from verified suppliers within 24-48 hours',
      stat: '<48hrs'
    },
    {
      icon: DollarSign,
      title: 'Competitive Pricing',
      description: 'Compare prices from multiple suppliers to get the best deals',
      stat: 'Best Prices'
    }
  ];

  return (
    <>
      <SEO
        title="Buyer Central - Source Products from Verified African Suppliers | Afrikoni"
        description="Your comprehensive resource center for sourcing products from Africa. Access tools, verified suppliers, RFQ marketplace, Trade Shield protection, and logistics support."
        url="/buyer-central"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-afrikoni-offwhite to-white">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-afrikoni-gold/20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-afrikoni-deep">
              <Link to="/" className="hover:text-afrikoni-gold flex items-center gap-1 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
              <span className="text-afrikoni-deep/50">/</span>
              <span className="text-afrikoni-chestnut font-medium">Buyer Central</span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-deep to-afrikoni-chestnut py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Badge className="mb-4 bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30">
                Buyer Resource Center
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Source Products from Africa with Confidence
              </h1>
              <p className="text-xl md:text-2xl text-afrikoni-cream/90 mb-8 max-w-3xl mx-auto">
                Your one-stop destination for sourcing quality products from verified African suppliers. Access tools, services, and resources designed specifically for buyers.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut text-lg px-8 py-6">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                    Browse Products
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-12">
              {[
                { label: 'Products', value: `${(stats.products / 1000000).toFixed(1)}M+`, icon: Package, color: 'bg-blue-500' },
                { label: 'Suppliers', value: `${(stats.suppliers / 1000).toFixed(0)}K+`, icon: Users, color: 'bg-green-500' },
                { label: 'Countries', value: stats.countries, icon: Globe, color: 'bg-purple-500' },
                { label: 'Success Rate', value: `${stats.successRate}%`, icon: Award, color: 'bg-afrikoni-gold' },
                { label: 'Active Buyers', value: `${(stats.activeBuyers / 1000).toFixed(1)}K+`, icon: ShoppingCart, color: 'bg-orange-500' },
                { label: 'Orders', value: `${(stats.ordersCompleted / 1000).toFixed(0)}K+`, icon: CheckCircle, color: 'bg-indigo-500' }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className="border-0 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all">
                      <CardContent className="p-4 text-center">
                        <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-xs md:text-sm text-afrikoni-cream/80">{stat.label}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Core Services */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Everything You Need to Source Successfully
              </h2>
              <p className="text-lg text-afrikoni-deep/80 max-w-2xl mx-auto">
                Comprehensive tools and services designed to make your sourcing journey smooth and secure
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreServices.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold hover:shadow-xl transition-all group">
                      <CardHeader>
                        <div className={`w-14 h-14 ${service.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-7 h-7 ${service.color.split(' ')[1]}`} />
                        </div>
                        <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                        <CardDescription className="text-base">{service.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 mb-6">
                          {service.features.map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-center gap-2 text-sm text-afrikoni-deep/80">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Link to={service.link}>
                          <Button className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut">
                            Learn More
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-afrikoni-offwhite to-afrikoni-cream/30">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                How Sourcing Works on Afrikoni
              </h2>
              <p className="text-lg text-afrikoni-deep/80 max-w-2xl mx-auto">
                A simple 4-step process from search to delivery
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {howItWorks.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="relative"
                  >
                    <Card className="h-full border-afrikoni-gold/20 hover:shadow-lg transition-all">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <Badge className="bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30">
                            Step {step.step}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-afrikoni-deep/80">{step.description}</p>
                      </CardContent>
                    </Card>
                    {idx < howItWorks.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                        <ArrowRight className="w-6 h-6 text-afrikoni-gold/50" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Why Buyers Choose Afrikoni
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className="h-full border-afrikoni-gold/20 text-center hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="w-16 h-16 bg-afrikoni-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon className="w-8 h-8 text-afrikoni-gold" />
                        </div>
                        <Badge className="mb-3 bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30">
                          {benefit.stat}
                        </Badge>
                        <h3 className="text-lg font-bold text-afrikoni-chestnut mb-2">{benefit.title}</h3>
                        <p className="text-sm text-afrikoni-deep/80">{benefit.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Buyer Resources */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-afrikoni-offwhite to-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                Buyer Resources & Guides
              </h2>
              <p className="text-lg text-afrikoni-deep/80 max-w-2xl mx-auto">
                Access free guides, best practices, and support resources
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {buyerResources.map((resource, idx) => {
                const Icon = resource.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold hover:shadow-lg transition-all group">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-lg flex items-center justify-center group-hover:bg-afrikoni-gold/30 transition-colors">
                            <Icon className="w-6 h-6 text-afrikoni-gold" />
                          </div>
                          <Badge variant="outline" className="text-xs">{resource.badge}</Badge>
                        </div>
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-afrikoni-deep/80 mb-4">{resource.description}</p>
                        <Link to={resource.link}>
                          <Button variant="outline" className="w-full border-afrikoni-gold text-afrikoni-gold hover:bg-afrikoni-gold/10">
                            Read More
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-r from-afrikoni-chestnut via-afrikoni-deep to-afrikoni-chestnut">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Start Sourcing from Africa?
              </h2>
              <p className="text-xl text-afrikoni-cream/90 mb-8">
                Join {stats.activeBuyers.toLocaleString()}+ buyers who trust Afrikoni for their sourcing needs
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut text-lg px-8 py-6">
                    Create Free Account
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                    Contact Sales Team
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-afrikoni-cream/70 mt-6">
                No credit card required • Free to join • Start sourcing today
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
