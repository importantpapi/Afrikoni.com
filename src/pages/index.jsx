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
import BetaSection from '@/components/home/BetaSection';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { useAnalytics } from '@/hooks/useAnalytics';

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

        {/* Explore African Supply - Merged Categories & Countries */}
        <section>
          <ExploreAfricanSupply />
        </section>

        {/* RFQ Card - Prominent Placement */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-chestnut/10 to-afrikoni-gold/5">
          <RFQCard />
        </section>

        {/* Partner Logos */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-afrikoni-offwhite">
          <PartnerLogos />
        </section>


      </div>
    </>
  );
}
