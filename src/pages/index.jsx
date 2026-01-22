import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import HeroSection from '@/components/home/HeroSection';
import TrustCounters from '@/components/home/TrustCounters';
import ExploreAfricanSupply from '@/components/home/ExploreAfricanSupply';
import RFQCard from '@/components/home/RFQCard';
import PartnerLogos from '@/components/home/PartnerLogos';
import LiveTradeTicker from '@/components/community/LiveTradeTicker';
import BetaSection from '@/components/home/BetaSection';
import StickySearchBar from '@/components/home/StickySearchBar';
import MobileCategoryGrid from '@/components/home/MobileCategoryGrid';
import CountryQuickFilters from '@/components/home/CountryQuickFilters';
import MobileCountryFilters from '@/components/home/MobileCountryFilters';
import VerifiedSuppliersSection from '@/components/home/VerifiedSuppliersSection';
import MobileSupplierCards from '@/components/home/MobileSupplierCards';
import MobileActionZones from '@/components/home/MobileActionZones';
import TrendingProductsSection from '@/components/home/TrendingProductsSection';
import MobileProductGrid from '@/components/home/MobileProductGrid';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';
import StructuredData from '@/components/StructuredData';
import { useAnalytics } from '@/hooks/useAnalytics';
import * as GeoService from '@/services/GeoService';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    // Only load data once on mount
    loadData();
    detectUserCountry();
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

  const detectUserCountry = async () => {
    // ✅ REFACTORED: Uses GeoService singleton (no direct ipapi.co fetch)
    try {
      const { country } = await GeoService.getCountry();

      // Only set if we got a real country (not fallback 'International')
      if (country && country !== 'International') {
        setDetectedCountry(country);
      }
    } catch (err) {
      // GeoService never throws, but just in case
      // Silently fail - country detection is optional
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
        
        {/* ============================================================ */}
        {/* ✅ MOBILE BENTO ARCHITECTURE - Mobile Only */}
        {/* ============================================================ */}
        
        {/* 1. Command Center: Sticky Header with Glassmorphism */}
        <StickySearchBar />
        
        {/* 2. Category Hub: 2x4 Dense Grid - Mobile Only */}
        <MobileCategoryGrid />
        
        {/* Country Filters - Mobile Only: Top 5 Trending + Search */}
        <MobileCountryFilters />
        
        {/* 3. Trust Hierarchy: Horizontal Supplier Cards - Mobile Only */}
        <MobileSupplierCards />
        
        {/* 4. Action Zones: How It Works & Post RFQ Bento Blocks - Mobile Only */}
        <MobileActionZones />
        
        {/* Mobile Product Grids - Infinite Discovery Flow - Mobile Only */}
        <section className="md:hidden">
          {/* Primary: Country-Specific Products */}
          {detectedCountry && (
            <MobileProductGrid 
              country={detectedCountry} 
              limit={8}
              showHeader={true}
            />
          )}
          
          {/* Secondary: All Popular Products (if no country or as backup) */}
          {!detectedCountry && (
            <MobileProductGrid 
              country={null} 
              limit={8}
              title="Popular products"
              showHeader={true}
            />
          )}
          
          {/* Tertiary: Additional discovery sections */}
          <MobileProductGrid 
            country={null} 
            limit={6}
            title="Explore more products"
            showHeader={true}
          />
        </section>
        
        {/* ============================================================ */}
        {/* ✅ DESKTOP LAYOUT - Desktop Only (unchanged) */}
        {/* ============================================================ */}
        
        {/* Category Chips - Removed from desktop per user request */}
        
        {/* Hero Section - Desktop Only (Mobile uses StickySearchBar + MobileProductGrid) */}
        <section className="hidden md:block relative overflow-visible">
          <HeroSection categories={categories} />
        </section>

        {/* Verified Suppliers Section - Desktop Only (Mobile uses MobileSupplierCards) */}
        <div className="hidden md:block">
          <VerifiedSuppliersSection />
        </div>

        {/* Trending Products Section - Phase 2.2 */}
        <TrendingProductsSection />

        {/* Trust Counters - Compact - Hidden per request */}
        {/* <TrustCounters /> */}

        {/* Explore African Supply - Merged Categories & Countries - Mobile: Reduced padding */}
        <section className="pb-8 md:pb-16 lg:pb-20">
          <ExploreAfricanSupply />
        </section>

        {/* RFQ Card - Prominent Placement - Mobile: Reduced padding */}
        <section className="py-8 md:py-16 lg:py-20 bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-chestnut/10 to-afrikoni-gold/5">
          <RFQCard />
        </section>

        {/* Partner Logos - Mobile: Hidden to reduce length */}
        <section className="hidden md:block py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-afrikoni-offwhite">
          <PartnerLogos />
        </section>


      </div>
    </>
  );
}
