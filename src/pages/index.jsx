import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import HeroSection from '@/components/home/HeroSection';
import TrustCounters from '@/components/home/TrustCounters';
import TrustCards from '@/components/home/TrustCards';
import ServicesOverview from '@/components/home/ServicesOverview';
import PopularCategories from '@/components/home/PopularCategories';
import SourceByCountry from '@/components/home/SourceByCountry';
import RFQCard from '@/components/home/RFQCard';
import PartnerLogos from '@/components/home/PartnerLogos';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import CaseStudies from '@/components/home/CaseStudies';
import AboutAfrikoni from '@/components/home/AboutAfrikoni';
import BushidoManifesto from '@/components/home/BushidoManifesto';
import NewsletterSection from '@/components/home/NewsletterSection';
import TransparencySection from '@/components/home/TransparencySection';
import SocialProof from '@/components/home/SocialProof';
import LogisticsPlatform from '@/components/home/LogisticsPlatform';
import LiveTradeTicker from '@/components/community/LiveTradeTicker';
import SuccessStories from '@/components/community/SuccessStories';
import BetaSection from '@/components/home/BetaSection';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const { trackPageView } = useAnalytics();
  const navigate = useNavigate();

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
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Live Trade Ticker */}
        <LiveTradeTicker />
        
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <HeroSection categories={categories} />
        </section>

        {/* Trust Counters */}
        <section className="py-8 md:py-12 bg-gradient-to-b from-white to-afrikoni-offwhite">
          <TrustCounters />
        </section>

        {/* Trust Cards */}
        <section className="py-12 md:py-16 lg:py-20">
          <TrustCards />
        </section>

        {/* Services Overview */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-afrikoni-offwhite to-white">
          <ServicesOverview />
        </section>

        {/* Popular Categories & Source By Country */}
        <section className="py-12 md:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 space-y-12 md:space-y-16">
            <PopularCategories categories={categories} />
            <SourceByCountry />
          </div>
        </section>

        {/* RFQ Card - Prominent Placement */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-chestnut/10 to-afrikoni-gold/5">
          <RFQCard />
        </section>

        {/* Partner Logos */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-afrikoni-offwhite">
          <PartnerLogos />
        </section>

        {/* Success Stories & Testimonials */}
        <section className="py-12 md:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 space-y-12 md:space-y-16">
            <SuccessStories />
            <TestimonialsSection />
          </div>
        </section>

        {/* Case Studies */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-afrikoni-offwhite to-white">
          <CaseStudies />
        </section>

        {/* Logistics Platform */}
        <section className="py-12 md:py-16 lg:py-20">
          <LogisticsPlatform />
        </section>

        {/* About Afrikoni */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-afrikoni-offwhite">
          <AboutAfrikoni />
        </section>

        {/* Bushido Manifesto */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-afrikoni-chestnut/5 via-afrikoni-gold/5 to-afrikoni-chestnut/5">
          <BushidoManifesto />
        </section>

        {/* Transparency Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-white">
          <TransparencySection />
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-16 md:py-24 lg:py-28 bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-chestnut/10 to-afrikoni-gold/5 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-96 h-96 bg-afrikoni-gold/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-afrikoni-chestnut/5 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Card className="border-2 border-afrikoni-gold/30 shadow-2xl bg-gradient-to-br from-white to-afrikoni-offwhite max-w-4xl mx-auto">
                <CardContent className="p-10 md:p-14">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <Sparkles className="w-10 h-10 text-afrikoni-gold" />
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut">
                      Join Afrikoni Today
                    </h2>
                  </div>
                  <p className="text-lg md:text-xl text-afrikoni-deep mb-8 max-w-2xl mx-auto leading-relaxed">
                    Start trading with confidence. Connect with verified suppliers, secure payments, and seamless logistics across Africa.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => navigate('/signup')}
                        size="lg"
                        className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut px-8 py-6 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all hover:ring-4 hover:ring-afrikoni-gold/50 group"
                      >
                        Get Started Free
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => navigate('/marketplace')}
                        size="lg"
                        variant="outline"
                        className="border-2 border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 px-8 py-6 text-lg font-semibold"
                      >
                        Browse Marketplace
                      </Button>
                    </motion.div>
                  </div>
                  
                  {/* Trust Indicators */}
                  <div className="mt-10 pt-8 border-t border-afrikoni-gold/20">
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-afrikoni-deep/70">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-afrikoni-gold" />
                        <span>Verified Suppliers Only</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-afrikoni-gold" />
                        <span>Secure Escrow Payments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-afrikoni-gold" />
                        <span>54 African Countries</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-afrikoni-offwhite to-white">
          <NewsletterSection />
        </section>
      </div>
    </>
  );
}
