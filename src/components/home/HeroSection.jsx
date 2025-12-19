import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, CheckCircle, Users, Globe, Shield, Lock, TrendingUp, ArrowRight, Store, ShoppingBag, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/ui/Logo';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/api/supabaseClient';
import SearchSuggestions from '@/components/search/SearchSuggestions';
import { addSearchToHistory } from '@/components/search/SearchHistory';

// Compact Social Proof Component
function SocialProofSection() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    verifiedSuppliers: 0,
    countries: 0,
    activeBusinesses: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get verified suppliers count
        const { count: suppliersCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .in('role', ['seller', 'hybrid'])
          .eq('verification_status', 'verified');

        // Get unique countries from products
        const { data: productsData } = await supabase
          .from('products')
          .select('country_of_origin')
          .eq('status', 'active');
        
        const uniqueCountries = new Set(
          productsData?.map(p => p.country_of_origin).filter(Boolean) || []
        );

        // Get active businesses (companies)
        const { count: businessesCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .in('verification_status', ['verified', 'pending']);

        setStats({
          verifiedSuppliers: suppliersCount || 0,
          countries: uniqueCountries.size || 0,
          activeBusinesses: businessesCount || 0
        });
      } catch (error) {
        // Silently fail - show zeros if data can't be loaded
        console.debug('Error loading social proof stats:', error);
      }
    };

    loadStats();
  }, []);

  // Only show if we have some data
  if (stats.verifiedSuppliers === 0 && stats.countries === 0 && stats.activeBusinesses === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-8 text-sm md:text-base"
    >
      {stats.verifiedSuppliers > 0 && (
        <div className="flex items-center gap-2.5 text-afrikoni-cream/95 bg-afrikoni-cream/5 border border-afrikoni-gold/20 rounded-full px-4 py-2 backdrop-blur-sm">
          <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-afrikoni-gold flex-shrink-0" />
          <span>
            <span className="font-bold text-afrikoni-gold text-base md:text-lg">{stats.verifiedSuppliers}+</span>
            <span className="ml-1.5 font-medium">Verified Suppliers</span>
          </span>
        </div>
      )}
      <div className="flex items-center gap-2.5 text-afrikoni-cream/95 bg-afrikoni-cream/5 border border-afrikoni-gold/20 rounded-full px-4 py-2 backdrop-blur-sm">
        <Globe className="w-5 h-5 md:w-6 md:h-6 text-afrikoni-gold flex-shrink-0" />
        <span className="font-medium">{t('active_54')}</span>
      </div>
      {stats.activeBusinesses > 0 && (
        <div className="flex items-center gap-2.5 text-afrikoni-cream/95 bg-afrikoni-cream/5 border border-afrikoni-gold/20 rounded-full px-4 py-2 backdrop-blur-sm">
          <Users className="w-5 h-5 md:w-6 md:h-6 text-afrikoni-gold flex-shrink-0" />
          <span>
            <span className="font-bold text-afrikoni-gold text-base md:text-lg">{stats.activeBusinesses}+</span>
            <span className="ml-1.5 font-medium">Active Businesses</span>
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function HeroSection({ categories = [] }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const [user, setUser] = useState(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

  // Limit categories to top 12 most popular + search functionality
  const popularCategoryNames = [
    'Agriculture', 'Food & Beverages', 'Textiles & Apparel', 
    'Beauty & Personal Care', 'Consumer Electronics', 'Industrial Machinery',
    'Home & Living', 'Automotive', 'Energy & Power', 'Healthcare',
    'Packaging', 'Chemicals'
  ];
  
  const displayedCategories = useMemo(() => {
    if (categorySearchQuery.trim()) {
      // Filter by search query
      return categories.filter(cat => 
        cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
      ).slice(0, 15);
    }
    // Show popular categories first, then others
    const popular = categories.filter(cat => 
      popularCategoryNames.includes(cat.name)
    ).slice(0, 12);
    const others = categories.filter(cat => 
      !popularCategoryNames.includes(cat.name)
    ).slice(0, 3);
    return [...popular, ...others];
  }, [categories, categorySearchQuery]);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      addSearchToHistory(searchQuery);
    }
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    navigate(`/marketplace?${params.toString()}`);
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (text, type, id) => {
    setSearchQuery(text);
    setShowSuggestions(false);
    if (text.trim()) {
      addSearchToHistory(text);
    }
    const params = new URLSearchParams();
    params.set('q', text);
    if (type === 'category' && id) {
      params.set('category', id);
    }
    navigate(`/marketplace?${params.toString()}`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('hero-search-input')?.focus();
      }
      // Escape to close suggestions
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  return (
    <div className="relative bg-gradient-to-br from-afrikoni-earth via-afrikoni-deep to-afrikoni-chestnut py-16 md:py-24 overflow-visible">
      {/* Faint Afrikoni Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]">
        <Logo type="icon" size="xl" link={false} className="scale-150 text-afrikoni-gold" />
      </div>

      {/* Subtle Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212, 168, 87, 0.1) 10px, rgba(212, 168, 87, 0.1) 20px)'
        }}
      />

      <div className="w-full max-w-[1440px] mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Sidebar - Quick Links & Features */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block lg:col-span-3"
          >
            <Card className="border border-afrikoni-gold/20 bg-afrikoni-cream/5 backdrop-blur-sm shadow-lg opacity-70">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-xs font-semibold text-afrikoni-gold/80 mb-2 uppercase tracking-wide">
                  {t('quick_access')}
                </h3>
                <motion.button
                  whileHover={{ x: 2 }}
                  onClick={() => navigate('/services/buyers')}
                  className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-transparent hover:bg-afrikoni-gold/5 transition-all text-left group border border-afrikoni-gold/20"
                >
                  <ShoppingBag className="w-4 h-4 text-afrikoni-gold/70 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-afrikoni-cream/80">{t('buy_source')}</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-afrikoni-gold/50 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  whileHover={{ x: 2 }}
                  onClick={() => navigate('/become-supplier')}
                  className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-transparent hover:bg-afrikoni-gold/5 transition-all text-left group border border-afrikoni-gold/20"
                >
                  <Store className="w-4 h-4 text-afrikoni-gold/70 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-afrikoni-cream/80">{t('sell_products')}</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-afrikoni-gold/50 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button
                  whileHover={{ x: 2 }}
                  onClick={() => navigate('/logistics-partner-onboarding')}
                  className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-transparent hover:bg-afrikoni-gold/5 transition-all text-left group border border-afrikoni-gold/20"
                >
                  <Truck className="w-4 h-4 text-afrikoni-gold/70 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-afrikoni-cream/80">{t('ship_goods')}</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-afrikoni-gold/50 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Center Content */}
          <div className="lg:col-span-6 text-center">
            {/* Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            {/* Mobile: Title only + short subtitle */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-afrikoni-gold mb-3 md:mb-4 leading-tight tracking-tight">
              {t('trade_trust_thrive')}
            </h1>
            {/* Mobile: Short subtitle only, Desktop: Full subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-afrikoni-cream/95 font-medium mb-4 md:mb-6 max-w-3xl mx-auto leading-relaxed">
              <span className="md:hidden">Africa's trusted B2B marketplace.</span>
              <span className="hidden md:inline">{t('hero_subtitle')}</span>
            </p>
          </motion.div>

          {/* Afrikoni Shield trust strip - Hidden per request */}
          {/* <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-afrikoni-cream/5 border border-afrikoni-gold/40 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11px] md:text-xs text-afrikoni-cream mb-5 mx-2"
          >
            <span className="font-semibold uppercase tracking-wide text-afrikoni-gold">
              Afrikoni&nbsp;Shield™
            </span>
            <span className="opacity-80">Verified suppliers</span>
            <span className="w-1 h-1 rounded-full bg-afrikoni-gold/70" />
            <span className="opacity-80">KYC / AML &amp; anti-corruption</span>
            <span className="w-1 h-1 rounded-full bg-afrikoni-gold/70" />
            <span className="opacity-80">Escrow-protected payments</span>
            <span className="w-1 h-1 rounded-full bg-afrikoni-gold/70" />
            <span className="opacity-80">Cross-border logistics support</span>
          </motion.div> */}

            {/* Enterprise-Grade Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-3xl mx-auto mb-8"
          >
              <div ref={searchContainerRef} className="relative z-[5000]" style={{ position: 'relative' }}>
            <div
              className={`
                    flex items-center gap-3
                    bg-white/95
                    rounded-full
                    shadow-lg
                    border border-afrikoni-gold/20
                    px-4 py-3
                    transition-all duration-300
                    focus-within:ring-1 focus-within:ring-afrikoni-gold/30 focus-within:shadow-xl
                    ${searchFocused ? 'shadow-xl border-afrikoni-gold/30' : ''}
                  `}
                >
                  {/* Category Dropdown - Subtle, Embedded */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-transparent text-sm text-afrikoni-deep/70 px-3 focus:outline-none border-0 focus:ring-0 h-auto py-1.5 min-w-[80px] sm:min-w-[100px]">
                      <SelectValue placeholder="All" />
                </SelectTrigger>
                    <SelectContent className="max-h-[60vh] sm:max-h-[400px] bg-white shadow-xl border-afrikoni-gold/20">
                      <div className="sticky top-0 bg-white z-10 p-3 border-b border-afrikoni-gold/20">
                        <Input
                          type="text"
                          placeholder="Search categories..."
                          value={categorySearchQuery}
                          onChange={(e) => setCategorySearchQuery(e.target.value)}
                          className="w-full h-9 text-sm border-afrikoni-gold/30 focus:border-afrikoni-gold"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-[50vh] sm:max-h-[350px] overflow-y-auto">
                        <SelectItem value="all" className="font-semibold">{t('categories.all') || 'All'}</SelectItem>
                        {displayedCategories.length > 0 ? (
                          displayedCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id} className="text-sm">{cat.name}</SelectItem>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-sm text-afrikoni-deep/60 text-center">
                            No categories found
                          </div>
                        )}
                      </div>
                </SelectContent>
              </Select>

                  {/* Main Search Input - Dominant */}
                  <input
                id="hero-search-input"
                    type="text"
                    placeholder={t('search_placeholder')}
                value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        handleSearch();
                      }
                    }}
                    onFocus={() => {
                      setSearchFocused(true);
                      setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setSearchFocused(false);
                      }, 200);
                    }}
                    className="flex-1 text-base px-2 focus:outline-none placeholder:text-afrikoni-deep/50 bg-transparent text-afrikoni-chestnut min-h-[44px]"
                  />

                  {/* Clear button */}
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => {
                        setSearchQuery('');
                        setShowSuggestions(false);
                      }}
                      className="p-1.5 rounded-full hover:bg-afrikoni-gold/10 text-afrikoni-deep/50 hover:text-afrikoni-chestnut transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}

                  {/* Search Button - Secondary */}
                  <button
                  onClick={handleSearch}
                    className="flex items-center gap-2 bg-afrikoni-gold/60 text-afrikoni-chestnut font-medium px-5 py-2 rounded-full hover:bg-afrikoni-gold/70 transition-all duration-200 min-h-[44px] touch-manipulation opacity-90"
                  >
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Search</span>
                  </button>
                </div>

                {/* Premium Search Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && (searchFocused || searchQuery) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2"
                      style={{ position: 'absolute', zIndex: 9000 }}
                    >
                      <SearchSuggestions
                        query={searchQuery}
                        onSelectSuggestion={handleSelectSuggestion}
                        showHistory={!searchQuery}
                        showTrending={!searchQuery}
                      />
              </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </motion.div>


            {/* Social Proof */}
            <SocialProofSection />
          </div>

          {/* Right Sidebar - Trust Features */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden lg:block lg:col-span-3"
          >
            <Card className="border border-afrikoni-gold/20 bg-afrikoni-cream/5 backdrop-blur-sm shadow-lg opacity-70">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-xs font-semibold text-afrikoni-gold/80 mb-2 uppercase tracking-wide">
                  Why Afrikoni
                </h3>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 p-1.5 rounded-lg bg-afrikoni-gold/3">
                    <Shield className="w-3.5 h-3.5 text-afrikoni-gold/70 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-afrikoni-cream/80">Verified Only</p>
                      <p className="text-[10px] text-afrikoni-cream/60">Only vetted African suppliers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-1.5 rounded-lg bg-afrikoni-gold/3">
                    <Lock className="w-3.5 h-3.5 text-afrikoni-gold/70 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-afrikoni-cream/80">Secure Payments</p>
                      <p className="text-[10px] text-afrikoni-cream/60">Escrow‑protected trade</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-1.5 rounded-lg bg-afrikoni-gold/3">
                    <Globe className="w-3.5 h-3.5 text-afrikoni-gold/70 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-afrikoni-cream/80">54 Countries</p>
                      <p className="text-[10px] text-afrikoni-cream/60">Pan-African reach</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-1.5 rounded-lg bg-afrikoni-gold/3">
                    <TrendingUp className="w-3.5 h-3.5 text-afrikoni-gold/70 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-afrikoni-cream/80">Growing Network</p>
                      <p className="text-[10px] text-afrikoni-cream/60">Active daily</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

    </div>
  );
}
