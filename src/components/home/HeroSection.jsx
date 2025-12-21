import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, CheckCircle, Users, Globe, Shield, Lock, TrendingUp, ArrowRight, Store, ShoppingBag, Truck, FileText } from 'lucide-react';
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
      className="flex flex-wrap items-center justify-center gap-3 md:gap-8 mt-6 md:mt-8 text-meta px-2 md:px-0"
    >
      {stats.verifiedSuppliers > 0 && (
        <div className="flex items-center gap-2 text-afrikoni-cream/95 bg-afrikoni-cream/8 md:bg-afrikoni-cream/5 border border-afrikoni-gold/30 md:border-afrikoni-gold/20 rounded-full px-3 md:px-4 py-1.5 md:py-2 backdrop-blur-sm shadow-sm md:shadow-none">
          <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-afrikoni-gold flex-shrink-0" />
          <span className="text-xs md:text-body">
            <span className="font-bold text-afrikoni-gold">{stats.verifiedSuppliers}+</span>
            <span className="ml-1 md:ml-1.5 font-normal hidden sm:inline">Verified Suppliers</span>
            <span className="ml-1 md:hidden font-normal">Suppliers</span>
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 text-afrikoni-cream/95 bg-afrikoni-cream/8 md:bg-afrikoni-cream/5 border border-afrikoni-gold/30 md:border-afrikoni-gold/20 rounded-full px-3 md:px-4 py-1.5 md:py-2 backdrop-blur-sm shadow-sm md:shadow-none">
        <Globe className="w-4 h-4 md:w-6 md:h-6 text-afrikoni-gold flex-shrink-0" />
        <span className="text-xs md:text-body font-normal">{t('active_54')}</span>
      </div>
      {stats.activeBusinesses > 0 && (
        <div className="flex items-center gap-2 text-afrikoni-cream/95 bg-afrikoni-cream/8 md:bg-afrikoni-cream/5 border border-afrikoni-gold/30 md:border-afrikoni-gold/20 rounded-full px-3 md:px-4 py-1.5 md:py-2 backdrop-blur-sm shadow-sm md:shadow-none">
          <Users className="w-4 h-4 md:w-6 md:h-6 text-afrikoni-gold flex-shrink-0" />
          <span className="text-xs md:text-body">
            <span className="font-bold text-afrikoni-gold">{stats.activeBusinesses}+</span>
            <span className="ml-1 md:ml-1.5 font-normal hidden sm:inline">Active Businesses</span>
            <span className="ml-1 md:hidden font-normal">Businesses</span>
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
    let isMounted = true;
    
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setUser(session?.user || null);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user || null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
    <div className="relative bg-gradient-to-br from-afrikoni-earth via-afrikoni-deep to-afrikoni-chestnut py-12 md:py-24 overflow-visible">
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
            transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
            className="hidden lg:block lg:col-span-3"
          >
            <Card className="border border-afrikoni-gold/20 bg-afrikoni-cream/5 backdrop-blur-sm shadow-lg opacity-70">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-meta font-medium text-afrikoni-gold/80 mb-4 tracking-[0.02em]">
                  {t('quick_access')}
                </h3>
                <motion.button
                  whileHover={{ x: 2 }}
                  onClick={() => navigate('/services/buyers')}
                  className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-transparent hover:bg-afrikoni-gold/5 transition-all text-left group border border-afrikoni-gold/20"
                >
                  <ShoppingBag className="w-4 h-4 text-afrikoni-gold/70 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <p className="text-body font-normal leading-[1.6] text-afrikoni-cream/80">{t('buy_source')}</p>
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
                    <p className="text-body font-normal leading-[1.6] text-afrikoni-cream/80">{t('sell_products')}</p>
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
                    <p className="text-body font-normal leading-[1.6] text-afrikoni-cream/80">{t('ship_goods')}</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-afrikoni-gold/50 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Center Content */}
          <div className="lg:col-span-6 text-center">
            {/* Mobile: Operational Header | Desktop: Brand Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mb-6 md:mb-12 px-2 md:px-0"
            >
              {/* Mobile: Operational, Action-Oriented */}
              <div className="md:hidden space-y-4 mb-6">
                <h1 className="text-2xl font-bold leading-tight text-afrikoni-gold mb-2">
                  Find verified African suppliers
                </h1>
                <p className="text-base font-medium text-afrikoni-cream/95 leading-relaxed">
                  Search products or verified suppliers across 54 countries
                </p>
                {/* Small brand seal */}
                <p className="text-xs text-afrikoni-cream/70 font-medium">
                  Trade. Trust. Thrive.
                </p>
              </div>
              
              {/* Desktop: Brand Header (restored) */}
              <div className="hidden md:block">
                <h1 className="text-[60px] font-bold leading-[1.1] tracking-[-0.02em] text-afrikoni-gold mb-4 md:mb-8">
                  {t('trade_trust_thrive')}
                </h1>
                <p className="text-[18px] font-normal leading-[1.6] text-afrikoni-cream/90 mb-5 md:mb-8 max-w-3xl mx-auto">
                  {t('hero_subtitle') || 'A Pan-African B2B marketplace where verified African suppliers, buyers, and logistics partners build, trade, and scale safely across 54 countries.'}
                </p>
              </div>
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

            {/* Mobile: DOMINANT Search Bar - THE CONTROL PANEL */}
            <div className="md:hidden space-y-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
                className="w-full"
              >
                <div ref={searchContainerRef} className="relative z-[5000]" style={{ position: 'relative' }}>
                  {/* Mobile: FULL-WIDTH, HEAVIER, DARKER - THE ENGINE */}
                  <div
                    className={`
                      flex items-center gap-3
                      bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-deep to-afrikoni-chestnut
                      rounded-lg
                      shadow-2xl
                      border border-afrikoni-gold/40
                      px-4 py-4
                      transition-all duration-300
                      ${searchFocused ? 'border-afrikoni-gold shadow-[0_0_24px_rgba(212,169,55,0.5)]' : 'border-afrikoni-gold/40'}
                    `}
                  >
                    {/* Search Icon - Gold, prominent */}
                    <Search className="w-5 h-5 text-afrikoni-gold flex-shrink-0" />
                    
                    {/* Main Search Input - DOMINANT, HIGH CONTRAST */}
                    <input
                      id="hero-search-input"
                      type="text"
                      placeholder="Search products or verified suppliers"
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
                      className="flex-1 text-base px-2 py-2 focus:outline-none placeholder:text-afrikoni-cream/70 text-afrikoni-cream bg-transparent min-h-[52px] font-semibold"
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
                        className="p-1.5 rounded-full hover:bg-afrikoni-gold/20 text-afrikoni-cream/80 hover:text-afrikoni-gold transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}

                    {/* Search Button - Clear value proposition */}
                    <button
                      onClick={handleSearch}
                      className="flex items-center gap-2 bg-afrikoni-gold text-afrikoni-chestnut font-bold px-5 py-3 rounded-lg hover:bg-afrikoni-gold/90 active:scale-95 transition-all duration-200 min-h-[52px] touch-manipulation shadow-lg"
                    >
                      <Search className="w-5 h-5" />
                      <span className="text-sm font-bold">Find suppliers</span>
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

              {/* SECONDARY CTA - RFQ Card with Clear Explanation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
                className="bg-afrikoni-cream/30 border border-afrikoni-chestnut/20 rounded-lg p-4 space-y-3"
              >
                {/* RFQ Explanation - ONE clear line */}
                <p className="text-sm text-afrikoni-chestnut/90 font-medium leading-relaxed">
                  <span className="font-bold text-afrikoni-chestnut">RFQ = </span>
                  Tell us what you need. Verified suppliers send you quotes.
                </p>
                
                {/* RFQ Button - Clear wording, proper touch target */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate('/dashboard/rfqs/new');
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-afrikoni-chestnut/10 hover:bg-afrikoni-chestnut/20 active:bg-afrikoni-chestnut/30 border-2 border-afrikoni-chestnut/30 text-afrikoni-chestnut font-semibold px-6 py-4 rounded-lg active:scale-[0.98] transition-all duration-200 min-h-[52px] touch-manipulation cursor-pointer z-10 relative"
                  type="button"
                  aria-label="Post a Trade Request (RFQ)"
                >
                  <FileText className="w-5 h-5 flex-shrink-0" />
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-base font-bold text-left">Post a Trade Request (RFQ)</span>
                    <span className="text-xs text-afrikoni-chestnut/70 font-normal text-left">Suppliers come to you</span>
                  </div>
                </button>
              </motion.div>
            </div>

            {/* Desktop: Enterprise-Grade Search Bar - Keep original design */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
              className="hidden md:block max-w-3xl mx-auto mb-8 md:mb-12 px-2 md:px-0"
            >
              <div ref={searchContainerRef} className="relative z-[5000]" style={{ position: 'relative' }}>
                <div
                  className={`
                    flex items-center gap-2 md:gap-3
                    bg-white/98 md:bg-white/95
                    rounded-2xl md:rounded-full
                    shadow-xl md:shadow-lg
                    border-2 md:border border-afrikoni-gold/30 md:border-afrikoni-gold/20
                    px-3 md:px-4 py-2.5 md:py-3
                    transition-all duration-300
                    focus-within:ring-2 md:focus-within:ring-1 focus-within:ring-afrikoni-gold/40 md:focus-within:ring-afrikoni-gold/30 focus-within:shadow-2xl md:focus-within:shadow-xl
                    ${searchFocused ? 'shadow-2xl md:shadow-xl border-afrikoni-gold/40 md:border-afrikoni-gold/30' : ''}
                  `}
                >
                  {/* Category Dropdown - Desktop only */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-transparent text-xs md:text-sm text-afrikoni-deep/70 px-2 md:px-3 focus:outline-none border-0 focus:ring-0 h-auto py-1 md:py-1.5 min-w-[70px] sm:min-w-[100px] font-medium">
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

                  {/* Main Search Input - Desktop */}
                  <input
                    id="hero-search-input-desktop"
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
                    className="flex-1 text-sm md:text-base px-3 md:px-3 py-2 md:py-1.5 focus:outline-none placeholder:text-afrikoni-deep/70 md:placeholder:text-afrikoni-deep/50 bg-afrikoni-cream/40 md:bg-afrikoni-cream/20 border border-afrikoni-gold/30 md:border-afrikoni-gold/20 rounded-lg md:rounded-full text-afrikoni-chestnut min-h-[44px] md:min-h-[44px] focus:bg-afrikoni-cream/60 md:focus:bg-afrikoni-cream/30 focus:border-afrikoni-gold/50 md:focus:border-afrikoni-gold/40 transition-all duration-200"
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

                  {/* Search Button - Desktop */}
                  <button
                    onClick={handleSearch}
                    className="flex items-center gap-1.5 md:gap-2 bg-afrikoni-gold text-afrikoni-chestnut font-semibold md:font-medium px-4 md:px-5 py-2.5 md:py-2 rounded-xl md:rounded-full hover:bg-afrikoni-gold/90 md:hover:bg-afrikoni-gold/70 active:scale-95 md:active:scale-100 transition-all duration-200 min-h-[44px] touch-manipulation shadow-md md:shadow-none"
                  >
                    <Search className="w-4.5 h-4.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline text-sm md:text-base">Search</span>
                  </button>
                </div>

                {/* Premium Search Suggestions Dropdown - Desktop */}
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


            {/* Social Proof - Moved below search on mobile */}
            <div className="md:hidden mt-8">
              <SocialProofSection />
            </div>
            <div className="hidden md:block">
              <SocialProofSection />
            </div>
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
                <h3 className="text-meta font-medium text-afrikoni-gold/80 mb-4 tracking-[0.02em]">
                  Why Afrikoni
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-afrikoni-gold/5 border border-afrikoni-gold/10">
                    <Shield className="w-5 h-5 text-afrikoni-gold/70 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-h3 font-semibold leading-[1.3] text-afrikoni-cream/90 mb-1">Verified Only</h4>
                      <p className="text-body font-normal leading-[1.6] text-afrikoni-cream/70">Only vetted African suppliers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-afrikoni-gold/5 border border-afrikoni-gold/10">
                    <Lock className="w-5 h-5 text-afrikoni-gold/70 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-h3 font-semibold leading-[1.3] text-afrikoni-cream/90 mb-1">Secure Payments</h4>
                      <p className="text-body font-normal leading-[1.6] text-afrikoni-cream/70">Escrow‑protected trade</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-afrikoni-gold/5 border border-afrikoni-gold/10">
                    <Globe className="w-5 h-5 text-afrikoni-gold/70 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-h3 font-semibold leading-[1.3] text-afrikoni-cream/90 mb-1">54 Countries</h4>
                      <p className="text-body font-normal leading-[1.6] text-afrikoni-cream/70">Pan-African reach</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-afrikoni-gold/5 border border-afrikoni-gold/10">
                    <TrendingUp className="w-5 h-5 text-afrikoni-gold/70 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-h3 font-semibold leading-[1.3] text-afrikoni-cream/90 mb-1">Growing Network</h4>
                      <p className="text-body font-normal leading-[1.6] text-afrikoni-cream/70">New suppliers onboarding regularly</p>
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
