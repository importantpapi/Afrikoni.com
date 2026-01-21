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
    // ✅ FINAL KERNEL ALIGNMENT: Localhost check - skip API call on localhost
    if (window.location.hostname === 'localhost') {
      setDetectedCountry('Belgium');
      return;
    }
    
    try {
      // ✅ KERNEL-SCHEMA ALIGNMENT: Enhanced error handling for ipapi.co failures (429, network, CORS)
      let response;
      try {
        response = await fetch('https://ipapi.co/json/');
        
        // Handle 429 (Too Many Requests) and other HTTP errors gracefully
        if (!response.ok) {
          if (response.status === 429) {
            // Rate limited - silently return null without logging
            return;
          }
          throw new Error(`IP API failed with status ${response.status}`);
        }
      } catch (fetchError) {
        // Network errors, CORS, or HTTP errors - silently return null
        return;
      }
      
      const data = await response.json();
      const countryCode = data?.country_code;
      const codeToName = {
        'NG': 'Nigeria', 'KE': 'Kenya', 'GH': 'Ghana', 'ZA': 'South Africa',
        'ET': 'Ethiopia', 'TZ': 'Tanzania', 'UG': 'Uganda', 'EG': 'Egypt',
        'MA': 'Morocco', 'DZ': 'Algeria', 'TN': 'Tunisia', 'SN': 'Senegal',
        'CI': "Côte d'Ivoire", 'CM': 'Cameroon', 'ZW': 'Zimbabwe', 'MZ': 'Mozambique',
        'MG': 'Madagascar', 'ML': 'Mali', 'BF': 'Burkina Faso', 'NE': 'Niger',
        'RW': 'Rwanda', 'BJ': 'Benin', 'GN': 'Guinea', 'TD': 'Chad',
        'ZM': 'Zambia', 'MW': 'Malawi', 'SO': 'Somalia', 'BI': 'Burundi',
        'TG': 'Togo', 'SL': 'Sierra Leone', 'LY': 'Libya', 'MR': 'Mauritania',
        'ER': 'Eritrea', 'GM': 'Gambia', 'BW': 'Botswana', 'NA': 'Namibia',
        'GA': 'Gabon', 'LS': 'Lesotho', 'GW': 'Guinea-Bissau', 'LR': 'Liberia',
        'CF': 'Central African Republic', 'CG': 'Congo', 'CD': 'DR Congo',
        'ST': 'São Tomé and Príncipe', 'SC': 'Seychelles', 'CV': 'Cape Verde',
        'KM': 'Comoros', 'MU': 'Mauritius', 'GQ': 'Equatorial Guinea',
        'SZ': 'Eswatini', 'SS': 'South Sudan', 'AO': 'Angola'
      };
      const countryName = codeToName[countryCode];
      
      if (!countryName) {
        // Invalid country code - silently return
        return;
      }
      if (countryName) {
        setDetectedCountry(countryName);
      }
    } catch (err) {
      // Silently fail - country detection is optional (CORS error on localhost is expected)
      console.debug('[IP Detection] Failed (non-critical):', err.message || 'CORS or network error');
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
