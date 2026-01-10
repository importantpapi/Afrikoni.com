/**
 * Supplier Acquisition Landing Page
 * Country-specific landing page for supplier onboarding
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, Shield, Truck, Globe, DollarSign, Users, 
  TrendingUp, Zap, ArrowRight, Star, Package, FileText,
  MessageSquare, Gift, Award
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Label } from '@/components/shared/ui/label';
import { toast } from 'sonner';
import { getCountryConfig, TARGET_COUNTRY, getMarketingContent } from '@/config/countryConfig';
import { supabase } from '@/api/supabaseClient';
import Layout from '@/layout';

export default function SupplierAcquisitionPage() {
  const { country } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    product_categories: '',
    current_export_volume: '',
    referral_code: ''
  });

  useEffect(() => {
    // Use country from URL or default to TARGET_COUNTRY
    const countryName = country || TARGET_COUNTRY;
    const countryConfig = getCountryConfig();
    setConfig(countryConfig);
  }, [country]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create supplier application
      const { data, error } = await supabase
        .from('supplier_applications')
        .insert({
          company_name: formData.company_name,
          email: formData.email,
          phone: formData.phone,
          country: config?.name || TARGET_COUNTRY,
          products_categories: formData.product_categories,
          status: 'pending',
          source: 'acquisition_landing',
          referral_code: formData.referral_code || null
        })
        .select()
        .single();

      if (error) throw error;

      // Track acquisition event
      await trackAcquisitionEvent({
        type: 'supplier_signup',
        country: config?.name || TARGET_COUNTRY,
        email: formData.email,
        phone: formData.phone,
        source: 'landing_page',
        referral_code: formData.referral_code
      }).catch(console.error);

      toast.success('Application submitted! We\'ll contact you within 24 hours.');
      navigate('/signup?type=supplier&country=' + (config?.name || TARGET_COUNTRY));
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!config) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const benefits = [
    {
      icon: Shield,
      title: 'Verified Payment & Escrow',
      description: 'Secure transactions with Afrikoni Trade Shield — funds held safely until delivery'
    },
    {
      icon: Truck,
      title: 'Export-Ready Logistics',
      description: `Access to logistics partners in ${config.name} — seamless shipping to global buyers`
    },
    {
      icon: Globe,
      title: 'Global Buyer Network',
      description: 'Connect with verified buyers worldwide looking for authentic African products'
    },
    {
      icon: Zap,
      title: 'KoniAI Support',
      description: 'AI-powered assistance for product listings, RFQ responses, and deal closing'
    },
    {
      icon: DollarSign,
      title: 'Multiple Payment Options',
      description: `Accept payments in ${config.currency} or USD — flexible payment terms`
    },
    {
      icon: TrendingUp,
      title: 'Growth & Visibility',
      description: 'Premium subscription plans to boost your listings and reach more buyers'
    }
  ];

  const stats = [
    { label: 'Verified Suppliers', value: '500+', icon: Users },
    { label: 'Active Buyers', value: '2,000+', icon: Globe },
    { label: 'Orders Protected', value: '$5M+', icon: Shield },
    { label: 'Countries Served', value: '50+', icon: Package }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-afrikoni-ivory to-white">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <Badge className="mb-4 bg-afrikoni-gold text-afrikoni-chestnut">
                Join {config.name}'s Export Network
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold text-afrikoni-text-dark mb-6">
                {getMarketingContent('supplier')}
              </h1>
              <p className="text-xl text-afrikoni-text-dark/70 max-w-3xl mx-auto mb-8">
                Join Afrikoni's verified supplier network and access global buyers with secure escrow payments, 
                export-ready logistics, and AI-powered support.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                {stats.map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm"
                  >
                    <stat.icon className="w-5 h-5 text-afrikoni-gold" />
                    <div className="text-left">
                      <div className="text-2xl font-bold text-afrikoni-text-dark">{stat.value}</div>
                      <div className="text-xs text-afrikoni-text-dark/70">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="border-afrikoni-gold/20 shadow-premium-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Get Started Today</CardTitle>
                  <p className="text-afrikoni-text-dark/70">
                    Limited time: Free Verified Supplier Upgrade for first 50 suppliers from {config.name}
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Company Name *</Label>
                      <Input
                        required
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="Your company name"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <Label>Phone *</Label>
                        <Input
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder={`${config.phoneCode} ...`}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Product Categories *</Label>
                      <Input
                        required
                        value={formData.product_categories}
                        onChange={(e) => setFormData({ ...formData, product_categories: e.target.value })}
                        placeholder="e.g., Cocoa, Shea Butter, Coffee"
                      />
                      <p className="text-xs text-afrikoni-text-dark/60 mt-1">
                        Popular in {config.name}: {config.popularProducts.slice(0, 3).join(', ')}
                      </p>
                    </div>
                    <div>
                      <Label>Referral Code (Optional)</Label>
                      <Input
                        value={formData.referral_code}
                        onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
                        placeholder="Enter referral code for bonus"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
                      size="lg"
                    >
                      {isSubmitting ? 'Submitting...' : 'Apply Now — Free Verified Upgrade'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <p className="text-xs text-center text-afrikoni-text-dark/60">
                      By applying, you agree to our terms. We'll contact you within 24 hours.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-afrikoni-text-dark mb-12">
              Why Join Afrikoni?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-colors">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-afrikoni-gold/10 rounded-lg flex items-center justify-center mb-4">
                        <benefit.icon className="w-6 h-6 text-afrikoni-gold" />
                      </div>
                      <h3 className="text-xl font-semibold text-afrikoni-text-dark mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-afrikoni-text-dark/70">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Special Offers */}
        <section className="py-20 px-4 bg-gradient-to-r from-afrikoni-gold/5 to-afrikoni-green/5">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-afrikoni-text-dark mb-12">
              Limited-Time Offers for {config.name} Suppliers
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-afrikoni-gold/30 bg-white">
                <CardContent className="p-6">
                  <Gift className="w-8 h-8 text-afrikoni-gold mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Founding Supplier Status</h3>
                  <p className="text-afrikoni-text-dark/70 mb-4">
                    First 50 suppliers get lifetime reduced commission (6% instead of 8%)
                  </p>
                  <Badge className="bg-afrikoni-gold text-afrikoni-chestnut">Limited Time</Badge>
                </CardContent>
              </Card>
              <Card className="border-afrikoni-gold/30 bg-white">
                <CardContent className="p-6">
                  <Award className="w-8 h-8 text-afrikoni-gold mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Free Verification</h3>
                  <p className="text-afrikoni-text-dark/70 mb-4">
                    List 3+ products in first month → Free Verified Supplier Badge ($99 value)
                  </p>
                  <Badge className="bg-afrikoni-green text-white">Active</Badge>
                </CardContent>
              </Card>
              <Card className="border-afrikoni-gold/30 bg-white">
                <CardContent className="p-6">
                  <Users className="w-8 h-8 text-afrikoni-gold mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Referral Rewards</h3>
                  <p className="text-afrikoni-text-dark/70 mb-4">
                    Refer a supplier → Both get 1 month free Growth subscription
                  </p>
                  <Badge className="bg-afrikoni-gold text-afrikoni-chestnut">Ongoing</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-afrikoni-text-dark mb-6">
              Ready to Start Exporting?
            </h2>
            <p className="text-xl text-afrikoni-text-dark/70 mb-8">
              Join {config.name}'s leading exporters on Afrikoni today
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => document.getElementById('apply-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
                size="lg"
              >
                Apply Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Link to="/signup?type=supplier">
                <Button variant="outline" size="lg">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
