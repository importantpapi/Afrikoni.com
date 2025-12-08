import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import HeroSection from '@/components/home/HeroSection';
import TrustCards from '@/components/home/TrustCards';
import PopularCategories from '@/components/home/PopularCategories';
import SourceByCountry from '@/components/home/SourceByCountry';
import RFQCard from '@/components/home/RFQCard';
import AboutAfrikoni from '@/components/home/AboutAfrikoni';
import QuickActions from '@/components/home/QuickActions';
import WhyAfrikoni from '@/components/home/WhyAfrikoni';
import TrustSection from '@/components/home/TrustSection';
import ProtectionSection from '@/components/home/ProtectionSection';
import HowItWorks from '@/components/home/HowItWorks';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import StatsSection from '@/components/home/StatsSection';
import NewsletterSection from '@/components/home/NewsletterSection';
import PoweringAfricanTrade from '@/components/home/PoweringAfricanTrade';
import BusinessModel from '@/components/home/BusinessModel';
import EarlyUserTestGroup from '@/components/home/EarlyUserTestGroup';
import TransparencySection from '@/components/home/TransparencySection';
import SocialProof from '@/components/home/SocialProof';
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
      <div className="min-h-screen">
        <HeroSection categories={categories} />
        <TrustCards />
        <PopularCategories categories={categories} />
        <SourceByCountry />
        <RFQCard />
        <AboutAfrikoni />
        <HowItWorks />
        <TransparencySection />
        <SocialProof />
        <NewsletterSection />
      </div>
    </>
  );
}

