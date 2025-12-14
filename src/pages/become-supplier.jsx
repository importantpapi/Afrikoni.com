import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, ShieldCheck, Globe2, Users, Shield, Award, TrendingUp,
  DollarSign, Truck, FileText, Star, Zap, Lock, BarChart3, MessageSquare,
  ArrowRight, Sparkles, Building2, MapPin, Clock, CheckCircle
} from 'lucide-react';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/api/supabaseClient';

export default function BecomeSupplier() {
  const [stats, setStats] = useState([
    { value: '...', label: 'Verified Suppliers' },
    { value: '54', label: 'African Countries' },
    { value: '24-48h', label: 'Verification Time' },
    { value: '...', label: 'Approval Rate' }
  ]);

  useEffect(() => {
    loadRealStats();
  }, []);

  const loadRealStats = async () => {
    try {
      // Get verified suppliers count
      const { count: verifiedCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('verified', true);

      // Get total suppliers
      const { count: totalCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // Get approved verifications
      const { count: approvedCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'verified');

      // Calculate approval rate
      const approvalRate = totalCount > 0 
        ? Math.round((approvedCount / totalCount) * 100)
        : 0;

      setStats([
        { value: verifiedCount > 0 ? `${verifiedCount}+` : 'Growing', label: 'Verified Suppliers' },
        { value: '54', label: 'African Countries' },
        { value: '24-48h', label: 'Verification Time' },
        { value: approvalRate > 0 ? `${approvalRate}%` : 'High', label: 'Approval Rate' }
      ]);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Keep default values on error
    }
  };
  const benefits = [
    {
      icon: Shield,
      title: 'Verified Badge',
      description: 'Get the trusted verified supplier badge that appears on your profile and all product listings, building instant credibility with buyers.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      icon: Globe2,
      title: 'Global Buyer Access',
      description: 'Access RFQs from verified buyers across 54 African countries and international markets. No more cold outreach.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: Lock,
      title: 'Escrow Protection',
      description: 'Secure payments through Afrikoni Trade Shield™. Get paid faster with buyer protection that builds trust.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      icon: Truck,
      title: 'Logistics Support',
      description: 'Access our network of logistics partners for seamless cross-border shipping and customs clearance.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      icon: TrendingUp,
      title: 'Higher Visibility',
      description: 'Verified suppliers appear first in search results and get priority placement in buyer recommendations.',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Access detailed analytics on product views, inquiries, and buyer behavior to optimize your listings.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ];

  const verificationSteps = [
    {
      number: '01',
      title: 'Create Account',
      description: 'Sign up in 30 seconds with your business email. No credit card required.',
      icon: Users,
      duration: '2 min'
    },
    {
      number: '02',
      title: 'Complete Company Profile',
      description: 'Add your company details, business registration, and basic information.',
      icon: Building2,
      duration: '5 min'
    },
    {
      number: '03',
      title: 'Upload Verification Documents',
      description: 'Submit business license, tax documents, and identity verification (KYB/KYC).',
      icon: FileText,
      duration: '10 min'
    },
    {
      number: '04',
      title: 'List Your Products',
      description: 'Add your first products with photos, specifications, and pricing. Quality matters.',
      icon: Award,
      duration: '15 min'
    },
    {
      number: '05',
      title: 'Get Verified',
      description: 'Our team reviews your application within 24-48 hours and activates your verified badge.',
      icon: ShieldCheck,
      duration: '24-48h'
    },
    {
      number: '06',
      title: 'Start Trading',
      description: 'Begin receiving inquiries and RFQs from verified buyers. Start closing deals!',
      icon: TrendingUp,
      duration: 'Ongoing'
    }
  ];

  const verificationChecks = [
    'Business registration and legal documents',
    'Identity verification of key stakeholders (KYB/KYC)',
    'Product catalogue quality and export readiness',
    'Sanctions and compliance screening via Afrikoni Shield™',
    'Business license and tax registration',
    'Quality certifications (if applicable)'
  ];

  return (
    <>
      <SEO
        title="Become a Verified Supplier | Afrikoni B2B Marketplace"
        description="Join Afrikoni as a verified African supplier and access serious buyers across 54 countries with escrow protection, logistics support, and Afrikoni Shield™ compliance."
        url="/become-supplier"
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
                Supplier Onboarding
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-afrikoni-cream mb-6">
                Become a Verified<br />Afrikoni Supplier
              </h1>
              <p className="text-xl md:text-2xl text-afrikoni-cream/90 mb-8 max-w-3xl mx-auto">
                Join Africa's trusted B2B marketplace. Get verified, reach serious buyers, and grow your export business with secure payments and logistics support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-8 py-6 text-lg font-bold shadow-xl">
                    <Users className="w-5 h-5 mr-2" />
                    Start Free Signup
                  </Button>
                </Link>
                <Link to="/supplier-hub">
                  <Button size="lg" variant="outline" className="border-2 border-afrikoni-cream/50 text-afrikoni-cream hover:bg-afrikoni-cream/10 px-8 py-6 text-lg">
                    Learn More
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
                Why Become a Verified Supplier?
              </h2>
              <p className="text-lg text-afrikoni-deep/70 max-w-2xl mx-auto">
                Unlock powerful features that help you reach more buyers, close more deals, and grow your business faster.
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
                    <Card className={`h-full border-2 ${benefit.borderColor} hover:shadow-xl transition-all`}>
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 ${benefit.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                          <Icon className={`w-6 h-6 ${benefit.color}`} />
                        </div>
                        <h3 className="text-xl font-bold text-afrikoni-chestnut mb-2">
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

          {/* Verification Process */}
          <section className="mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
                How Verification Works
              </h2>
              <p className="text-lg text-afrikoni-deep/70 max-w-2xl mx-auto">
                Simple 6-step process. Most suppliers complete verification in under 30 minutes.
              </p>
            </motion.div>

            <div className="relative">
              {/* Timeline line */}
              <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-afrikoni-gold/20" />

              <div className="space-y-8">
                {verificationSteps.map((step, idx) => {
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
                      <div className="hidden md:flex relative z-10 w-16 h-16 bg-afrikoni-gold rounded-full items-center justify-center flex-shrink-0 shadow-lg">
                        <Icon className="w-8 h-8 text-afrikoni-chestnut" />
                      </div>
                      <div className="md:hidden w-12 h-12 bg-afrikoni-gold rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Icon className="w-6 h-6 text-afrikoni-chestnut" />
                      </div>

                      {/* Content */}
                      <Card className="flex-1 border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <Badge className="bg-afrikoni-gold/10 text-afrikoni-gold border-afrikoni-gold/30 mb-2">
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

          {/* What We Check */}
          <section className="mb-16 md:mb-20">
            <Card className="border-2 border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <ShieldCheck className="w-6 h-6 text-afrikoni-gold" />
                  What We Verify
                </CardTitle>
                <p className="text-afrikoni-deep/70 mt-2">
                  Our verification process ensures only legitimate, trustworthy suppliers join the platform.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {verificationChecks.map((check, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                      <span className="text-afrikoni-deep">{check}</span>
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
              <p className="text-lg text-afrikoni-deep/70">
                No hidden fees. Pay only when you succeed.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-afrikoni-gold/20">
                <CardHeader>
                  <CardTitle className="text-xl">Verification</CardTitle>
                  <div className="text-3xl font-bold text-afrikoni-gold mt-2">
                    Free
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-afrikoni-deep/70">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Basic verification included
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      24-48 hour review
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Verified badge
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-afrikoni-gold bg-gradient-to-br from-afrikoni-gold/10 to-white">
                <CardHeader>
                  <Badge className="bg-afrikoni-gold text-afrikoni-chestnut mb-2 w-fit">
                    Most Popular
                  </Badge>
                  <CardTitle className="text-xl">Transaction Fee</CardTitle>
                  <div className="text-3xl font-bold text-afrikoni-gold mt-2">
                    8%
                  </div>
                  <p className="text-sm text-afrikoni-deep/70 mt-1">
                    Only on successful transactions
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-afrikoni-deep/70">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Escrow protection included
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Payment processing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Dispute resolution
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-afrikoni-gold/20">
                <CardHeader>
                  <CardTitle className="text-xl">Premium Features</CardTitle>
                  <div className="text-3xl font-bold text-afrikoni-gold mt-2">
                    Optional
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-afrikoni-deep/70">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Featured listings
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Priority support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Advanced analytics
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Final CTA */}
          <section className="bg-gradient-to-r from-afrikoni-chestnut via-afrikoni-deep to-afrikoni-chestnut rounded-2xl p-8 md:p-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-16 h-16 bg-afrikoni-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-afrikoni-chestnut" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-cream mb-4">
                Ready to Grow Your Export Business?
              </h2>
              <p className="text-lg text-afrikoni-cream/90 mb-8 max-w-2xl mx-auto">
                Join hundreds of verified suppliers already trading on Afrikoni. Start your verification today and unlock access to serious buyers across Africa and the world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-8 py-6 text-lg font-bold shadow-xl">
                    <Users className="w-5 h-5 mr-2" />
                    Start Free Signup
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="border-2 border-afrikoni-cream/50 text-afrikoni-cream hover:bg-afrikoni-cream/10 px-8 py-6 text-lg">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Talk to Sales
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-afrikoni-cream/70 mt-6">
                No credit card required • Free verification • 24-48 hour approval
              </p>
            </motion.div>
          </section>
        </div>
      </div>
    </>
  );
}
