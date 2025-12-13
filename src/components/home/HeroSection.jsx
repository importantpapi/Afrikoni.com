import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/ui/Logo';
import { useLanguage } from '@/i18n/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/api/supabaseClient';

export default function HeroSection({ categories = [] }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user && authModalOpen) {
        setAuthModalOpen(false);
        navigate('/createrfq');
      }
    });

    return () => subscription.unsubscribe();
  }, [authModalOpen, navigate]);

  const trendingSearches = [
    t('hero.trending.cocoa'),
    t('hero.trending.fabrics'),
    t('hero.trending.shea'),
    t('hero.trending.phones'),
    t('hero.trending.machinery'),
    t('hero.trending.solar'),
    t('hero.trending.cashew'),
    t('hero.trending.leather')
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    navigate(`/marketplace?${params.toString()}`);
  };

  const handlePostRFQ = () => {
    if (user) {
      navigate('/createrfq');
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-afrikoni-earth via-afrikoni-deep to-afrikoni-chestnut py-14 md:py-20">
      {/* Faint Afrikoni Logo Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]">
        <Logo type="icon" size="xl" link={false} className="scale-150 text-afrikoni-gold" />
      </div>

      {/* Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(212, 168, 87, 0.1) 10px, rgba(212, 168, 87, 0.1) 20px)'
        }}
      />

      <div className="w-full max-w-[1440px] mx-auto px-4 flex flex-col items-center justify-center relative z-10">
        <div className="text-center mb-8 max-w-4xl mx-auto">
          {/* Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-afrikoni-gold mb-3 leading-tight">
              Africa's Trusted B2B Trade Engine
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-afrikoni-cream font-medium">
              Source products, suppliers, and logistics across Africa — on demand, with verified partners only.
            </p>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-afrikoni-cream mb-4 leading-tight px-2"
          >
            Post Your Trade Request. Get Matched. Trade with Confidence.
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-afrikoni-cream/90 mb-6 max-w-3xl mx-auto px-2"
          >
            Beta live · Demand-driven · No fake listings
          </motion.p>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-6 text-sm md:text-base"
          >
            <div className="flex items-center gap-2 text-afrikoni-cream/90">
              <span className="font-semibold text-afrikoni-gold">Trusted by 120+</span>
              <span>African businesses</span>
            </div>
            <span className="text-afrikoni-gold/50">•</span>
            <div className="flex items-center gap-2 text-afrikoni-cream/90">
              <span className="font-semibold text-afrikoni-gold">Protected</span>
              <span>Escrow</span>
            </div>
            <span className="text-afrikoni-gold/50">•</span>
            <div className="flex items-center gap-2 text-afrikoni-cream/90">
              <span className="font-semibold text-afrikoni-gold">AI-Verified</span>
              <span>Suppliers</span>
            </div>
          </motion.div>

          {/* Afrikoni Shield trust strip */}
          <motion.div
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
          </motion.div>

          {/* Universal Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto mb-6"
          >
            <div
              className={`
                w-full flex flex-col sm:flex-row gap-2 bg-afrikoni-offwhite rounded-xl p-2 shadow-afrikoni-xl transition-all border-[1.5px] border-afrikoni-gold
                ${searchFocused ? 'ring-4 ring-afrikoni-gold/50 shadow-afrikoni-xl' : ''}
              `}
            >
              {/* Category Dropdown */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-56 border-0 focus:ring-0 bg-transparent text-afrikoni-earth min-h-[44px]">
                  <SelectValue placeholder={t('categories.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('categories.all')}</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Keyword Search */}
              <Input
                id="hero-search-input"
                name="search"
                placeholder={t('hero.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 w-full border-0 focus:ring-0 text-base sm:text-lg bg-transparent text-afrikoni-earth placeholder:text-afrikoni-earth/60 min-h-[44px]"
              />

              {/* Search Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Button
                  onClick={handleSearch}
                  className="w-full sm:w-auto bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight px-6 sm:px-8 min-h-[44px] touch-manipulation"
                >
                  <Search className="w-5 h-5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('hero.searchButton')}</span>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Primary CTA Buttons - RFQ First */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handlePostRFQ}
                size="lg"
                className="bg-afrikoni-gold hover:bg-afrikoni-goldLight text-afrikoni-chestnut px-8 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all border-2 border-afrikoni-gold"
              >
                Post a Trade Request (RFQ)
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => navigate('/become-supplier')}
                variant="outline"
                size="lg"
                className="border-2 border-afrikoni-gold/50 text-afrikoni-cream hover:bg-afrikoni-gold/20 px-8 py-6 text-lg font-semibold"
              >
                Join as Supplier
              </Button>
            </motion.div>
          </motion.div>

          {/* Trending Search Chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2"
          >
            <span className="text-afrikoni-cream text-sm mr-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {t('hero.trendingSearches')}:
            </span>
            {trendingSearches.map((term, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + idx * 0.05 }}
                onClick={() => {
                  setSearchQuery(term);
                  handleSearch();
                }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-afrikoni-gold/20 hover:bg-afrikoni-gold/30 backdrop-blur-sm text-afrikoni-cream px-4 py-2 rounded-full text-sm font-medium transition-all border border-afrikoni-gold/40"
              >
                {term}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Auth Modal for RFQ */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-afrikoni-chestnut">
              Create an Account to Submit Your Request
            </DialogTitle>
            <DialogDescription className="text-afrikoni-deep mt-2">
              Sign up in 30 seconds to post your trade request and get matched with verified suppliers.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <Button
              onClick={() => {
                setAuthModalOpen(false);
                navigate('/signup?redirect=/createrfq');
              }}
              className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldLight text-afrikoni-chestnut py-6 text-lg font-bold"
            >
              Create Account (30 seconds)
            </Button>
            <Button
              onClick={() => {
                setAuthModalOpen(false);
                navigate('/login?redirect=/createrfq');
              }}
              variant="outline"
              className="w-full border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10 py-6 text-lg"
            >
              Already have an account? Sign in
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
