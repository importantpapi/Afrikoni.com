import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/ui/Logo';
import { useLanguage } from '@/i18n/LanguageContext';

export default function HeroSection({ categories = [] }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();

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
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-afrikoni-cream mb-4 leading-tight"
          >
            {t('hero.title') || 'The AI-powered B2B marketplace connecting Africa and the world'}
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base md:text-lg lg:text-xl text-afrikoni-cream/90 mb-6 max-w-3xl mx-auto"
          >
            {t('hero.subtitle') || 'Verified African suppliers. Secure escrow payments. Cross-border logistics across 54 countries.'}
          </motion.p>

          {/* Primary CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-wrap justify-center gap-3 mb-4"
          >
            <Button
              onClick={() => navigate('/become-supplier')}
              className="bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight px-6 md:px-8 py-2.5 rounded-full text-sm md:text-base font-semibold shadow-afrikoni"
            >
              Become a Supplier
            </Button>
            <Button
              onClick={() => navigate('/marketplace')}
              variant="outline"
              className="border-afrikoni-gold/70 text-afrikoni-cream hover:bg-afrikoni-gold/10 px-6 md:px-8 py-2.5 rounded-full text-sm md:text-base font-semibold"
            >
              Browse Products
            </Button>
          </motion.div>

          {/* Afrikoni Shield trust strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="inline-flex flex-wrap items-center justify-center gap-2 bg-afrikoni-cream/5 border border-afrikoni-gold/40 rounded-full px-4 py-2 text-[11px] md:text-xs text-afrikoni-cream mb-5"
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
                flex flex-col sm:flex-row gap-2 bg-afrikoni-offwhite rounded-xl p-2 shadow-afrikoni-xl transition-all border-[1.5px] border-afrikoni-gold
                ${searchFocused ? 'ring-4 ring-afrikoni-gold/50 shadow-afrikoni-xl' : ''}
              `}
            >
              {/* Category Dropdown */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-56 border-0 focus:ring-0 bg-transparent text-afrikoni-earth">
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
                placeholder={t('hero.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 border-0 focus:ring-0 text-base sm:text-lg bg-transparent text-afrikoni-earth placeholder:text-afrikoni-earth/60"
              />

              {/* Search Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleSearch}
                  className="bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight px-6 sm:px-8"
                >
                  <Search className="w-5 h-5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('hero.searchButton')}</span>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Trending Search Chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
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
                transition={{ duration: 0.3, delay: 0.4 + idx * 0.05 }}
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
    </div>
  );
}
