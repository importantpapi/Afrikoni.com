import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import HeroSection from '@/components/home/HeroSection';
import TrustCounters from '@/components/home/TrustCounters';
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
    // Only load data once on mount
    loadData();
    trackPageView('Home');
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        description="The AI-powered B2B marketplace connecting Africa and the world. Verified African suppliers, assisted and secured transaction workflows, Afrikoni Shield™ compliance, and cross-border logistics across African markets."
        url="/"
      />
      <StructuredData type="Organization" />
      <StructuredData type="WebSite" />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Live Trade Ticker */}
        <LiveTradeTicker />
        
        {/* Hero Section */}
        <section className="relative overflow-visible">
          <HeroSection categories={categories} />
        </section>

        {/* Trust Counters - Compact - Hidden per request */}
        {/* <TrustCounters /> */}

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
