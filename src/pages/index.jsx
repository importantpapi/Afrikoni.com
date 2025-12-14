import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import HeroSection from '@/components/home/HeroSection';
import TrustCounters from '@/components/home/TrustCounters';
import TrustCards from '@/components/home/TrustCards';
import ServicesOverview from '@/components/home/ServicesOverview';
import ExploreAfricanSupply from '@/components/home/ExploreAfricanSupply';
import RFQCard from '@/components/home/RFQCard';
import PartnerLogos from '@/components/home/PartnerLogos';
import LiveTradeTicker from '@/components/community/LiveTradeTicker';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, TrendingUp, Shield, Globe, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    loadData();
    trackPageView('Home');
  }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      // Silently fail - categories are optional for homepage
      setCategories([]);
    }
  };

  return (
    <>
      <SEO 
        title="AFRIKONI - AI-Powered African B2B Marketplace with Verified Suppliers"
        description="The AI-powered B2B marketplace connecting Africa and the world. Verified African suppliers, secure escrow payments, Afrikoni Shield™ compliance, and cross-border logistics across 54 countries."
        url="/"
      />
      <StructuredData type="Organization" />
      <StructuredData type="WebSite" />
      <div className="min-h-screen bg-gradient-to-b from-afrikoni-offwhite via-white to-afrikoni-offwhite">
        {/* Live Trade Ticker */}
        <LiveTradeTicker />
        
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-afrikoni-earth via-afrikoni-deep to-afrikoni-chestnut">
          <HeroSection categories={categories} />
        </section>

        {/* Trust Counters - Compact with Enhanced Design */}
        <section className="relative -mt-8 md:-mt-12 z-10">
          <TrustCounters />
        </section>

        {/* Trust Cards - Enhanced */}
        <section className="py-16 md:py-20 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Badge className="bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30 mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Trust & Security
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-afrikoni-chestnut mb-4">
                Trade with Confidence
              </h2>
              <p className="text-lg text-afrikoni-deep/70 max-w-2xl mx-auto">
                Everything you need for safe and successful B2B trading across Africa
              </p>
            </motion.div>
            <TrustCards />
          </div>
        </section>

        {/* Services Overview - Enhanced */}
        <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-white via-afrikoni-offwhite to-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Badge className="bg-green-50 text-green-700 border-green-200 mb-4">
                <Users className="w-3 h-3 mr-1" />
                How We Serve You
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-afrikoni-chestnut mb-4">
                Solutions for Every Business
              </h2>
              <p className="text-lg text-afrikoni-deep/70 max-w-2xl mx-auto">
                Whether you're a supplier, buyer, or logistics partner, Afrikoni has solutions designed for your success
              </p>
            </motion.div>
            <ServicesOverview />
          </div>
        </section>

        {/* Explore African Supply - Enhanced */}
        <section className="py-16 md:py-20 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Badge className="bg-purple-50 text-purple-700 border-purple-200 mb-4">
                <Globe className="w-3 h-3 mr-1" />
                Discover Products
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-afrikoni-chestnut mb-4">
                Explore African Supply
              </h2>
              <p className="text-lg text-afrikoni-deep/70 max-w-2xl mx-auto">
                Browse verified products and suppliers across 54 African countries
              </p>
            </motion.div>
            <ExploreAfricanSupply />
          </div>
        </section>

        {/* RFQ Card - Enhanced with Better Visual Hierarchy */}
        <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-chestnut/10 to-afrikoni-gold/5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A937' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <RFQCard />
          </div>
        </section>

        {/* Partner Logos - Enhanced */}
        <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-white to-afrikoni-offwhite">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-4">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trusted Partners
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-afrikoni-chestnut mb-4">
                Trusted by Businesses Across Africa
              </h2>
              <p className="text-lg text-afrikoni-deep/70 max-w-2xl mx-auto">
                Join the growing community of businesses building Africa's trade future
              </p>
            </motion.div>
            <PartnerLogos />
          </div>
        </section>

        {/* Final CTA Section - New Enhanced Section */}
        <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-r from-afrikoni-chestnut via-afrikoni-deep to-afrikoni-chestnut relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A937' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-20 h-20 bg-afrikoni-gold rounded-full flex items-center justify-center mx-auto mb-6 shadow-afrikoni-xl">
                <Sparkles className="w-10 h-10 text-afrikoni-chestnut" />
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-afrikoni-cream mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl md:text-2xl text-afrikoni-cream/90 mb-8 max-w-2xl mx-auto">
                Join Africa's trusted B2B marketplace and start trading with confidence today
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/rfq/create">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      size="lg" 
                      className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-8 py-6 text-lg font-bold shadow-xl"
                    >
                      Post a Trade Request
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/become-supplier">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="border-2 border-afrikoni-cream/50 text-afrikoni-cream hover:bg-afrikoni-cream/10 px-8 py-6 text-lg"
                    >
                      Become a Supplier
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </Link>
              </div>
              <p className="text-sm text-afrikoni-cream/70 mt-6">
                No credit card required • Free to join • Start trading today
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
