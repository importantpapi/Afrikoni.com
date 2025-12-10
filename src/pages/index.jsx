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
import HowItWorks from '@/components/home/HowItWorks';
import NewsletterSection from '@/components/home/NewsletterSection';
import TransparencySection from '@/components/home/TransparencySection';
import SocialProof from '@/components/home/SocialProof';
import LogisticsPlatform from '@/components/home/LogisticsPlatform';
import LiveTradeTicker from '@/components/community/LiveTradeTicker';
import SuccessStories from '@/components/community/SuccessStories';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
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
      <div className="min-h-screen">
        <LiveTradeTicker />
        <HeroSection categories={categories} />
        <TrustCounters />
        <TrustCards />
        <ServicesOverview />
        <PopularCategories categories={categories} />
        <SourceByCountry />
        <RFQCard />
        <PartnerLogos />
        {/* Success Stories Section - Hidden until we have real customer data */}
        {/* <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-4">
                Success Stories
              </h2>
              <p className="text-lg text-afrikoni-text-dark/70 max-w-2xl mx-auto">
                Real trades, real results. See how suppliers and buyers are succeeding on Afrikoni.
              </p>
            </motion.div>
            <SuccessStories limit={3} />
          </div>
        </section> */}
        {/* <TestimonialsSection /> */}
        {/* <CaseStudies /> */}
        <LogisticsPlatform />
        <BushidoManifesto />
        {/* Full-width CTA replacing Gallery and FAQ */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-afrikoni-gold/20 via-afrikoni-chestnut/20 to-afrikoni-gold/20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
                Join Afrikoni Today
              </h2>
              <p className="text-lg md:text-xl text-afrikoni-deep mb-8 max-w-2xl mx-auto">
                Start trading with confidence. Connect with verified suppliers, secure payments, and seamless logistics across Africa.
              </p>
            </motion.div>
          </div>
        </section>
        <AboutAfrikoni />
        <HowItWorks />
        <TransparencySection />
        {/* <SocialProof /> */}
        <NewsletterSection />
      </div>
    </>
  );
}

