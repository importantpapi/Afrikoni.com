import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, CheckCircle, Globe, Shield, Lock, TrendingUp, ArrowRight, Store, ShoppingBag, Truck, Users, MessageCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Input } from '@/components/shared/ui/input';
import { Logo } from '@/components/shared/ui/Logo';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/shared/ui/card';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import SearchSuggestions from '@/components/search/SearchSuggestions';
import { addSearchToHistory } from '@/components/search/SearchHistory';
import { cn } from '@/lib/utils';
import { openWhatsAppCommunity } from '@/utils/whatsappCommunity';

// Compact Social Proof Component (Institutional Styling)
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
        const { count: suppliersCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .in('role', ['seller', 'hybrid'])
          .eq('verification_status', 'verified');

        const { data: productsData } = await supabase
          .from('products')
          .select('country_of_origin')
          .eq('status', 'active')
          .limit(100);

        const uniqueCountries = new Set(
          productsData?.map(p => p.country_of_origin).filter(Boolean) || []
        );

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
        console.debug('Error loading social proof stats:', error);
      }
    };
    loadStats();
  }, []);

  if (stats.verifiedSuppliers === 0 && stats.countries === 0 && stats.activeBusinesses === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="flex flex-wrap items-center justify-center gap-4 md:gap-10 mt-10"
    >
      {stats.verifiedSuppliers > 0 && (
        <div className="flex items-center gap-3 text-os-text-secondary/80">
          <CheckCircle className="w-5 h-5 text-os-accent" />
          <span className="text-13 font-medium tracking-wide uppercase">
            <span className="text-os-text-primary font-bold">{stats.verifiedSuppliers}+</span> Verified Suppliers
          </span>
        </div>
      )}
      <div className="flex items-center gap-3 text-os-text-secondary/80">
        <Globe className="w-5 h-5 text-os-accent" />
        <span className="text-13 font-medium tracking-wide uppercase">Active in 54 Countries</span>
      </div>
      {stats.activeBusinesses > 0 && (
        <div className="flex items-center gap-3 text-os-text-secondary/80">
          <Users className="w-5 h-5 text-os-accent" />
          <span className="text-13 font-medium tracking-wide uppercase">
            <span className="text-os-text-primary font-bold">{stats.activeBusinesses}+</span> Businesses
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
  const { user } = useAuth();
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

  // REAL DATA INJECTION: Fetching stats for institutional transparency
  const [stats, setStats] = useState({
    verifiedSuppliers: 0,
    countries: 54,
    activeBusinesses: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { count: suppliersCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .in('role', ['seller', 'hybrid'])
          .eq('verification_status', 'verified');

        const { data: productsData } = await supabase
          .from('products')
          .select('country_of_origin')
          .eq('status', 'active')
          .limit(200);

        const uniqueCountries = new Set(
          productsData?.map(p => p.country_of_origin).filter(Boolean) || []
        );

        const { count: businessesCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .in('verification_status', ['verified', 'pending']);

        setStats({
          verifiedSuppliers: suppliersCount || 0,
          countries: uniqueCountries.size > 0 ? uniqueCountries.size : 54,
          activeBusinesses: businessesCount || 0
        });
      } catch (e) { }
    };
    loadStats();
  }, []);

  const popularCategoryNames = [
    'Agriculture', 'Food & Beverages', 'Textiles & Apparel',
    'Beauty & Personal Care', 'Consumer Electronics', 'Industrial Machinery',
    'Home & Living', 'Automotive', 'Energy & Power', 'Healthcare',
    'Packaging', 'Chemicals'
  ];

  const displayedCategories = useMemo(() => {
    if (categorySearchQuery.trim()) {
      return categories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
      ).slice(0, 15);
    }
    const popular = categories.filter(cat => popularCategoryNames.includes(cat.name)).slice(0, 12);
    const others = categories.filter(cat => !popularCategoryNames.includes(cat.name)).slice(0, 3);
    return [...popular, ...others];
  }, [categories, categorySearchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim()) addSearchToHistory(searchQuery);
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    navigate(`/marketplace?${params.toString()}`);
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (text, type, id) => {
    setSearchQuery(text);
    setShowSuggestions(false);
    if (text.trim()) addSearchToHistory(text);
    const params = new URLSearchParams();
    params.set('q', text);
    if (type === 'category' && id) params.set('category', id);
    navigate(`/marketplace?${params.toString()}`);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('hero-search-input')?.focus();
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="relative bg-[var(--os-bg)] min-h-[850px] flex items-center justify-center py-20 overflow-hidden group/hero">
      {/* Background Texture */}
      <div className="absolute inset-0 z-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjciIG51bU9jdGF2ZXM9IjQiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIuNSIvPjwvc3ZnPg==')]" />

      {/* Premium Backlit Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-os-accent/10 blur-[160px] rounded-full pointer-events-none animate-pulse duration-[10s]" />

      <div className="container relative z-10 mx-auto px-6 md:px-12 h-full flex flex-col justify-center gap-12 lg:gap-20">

        {/* MAIN LAYOUT: Unified Columns */}
        <div className="grid lg:grid-cols-12 gap-10 items-center">

          {/* LEFT: Quick Access (Minimal) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 hidden lg:flex flex-col gap-6"
          >
            <div className="glass-surface p-6 rounded-[24px] border-os-stroke bg-os-surface-solid shadow-premium">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-os-accent animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-os-accent uppercase">Quick Access</span>
              </div>

              <nav className="flex flex-col gap-1">
                {[
                  { name: 'Browse Marketplace', icon: ShoppingBag, path: '/marketplace' },
                  { name: 'Source Suppliers', icon: Store, path: '/suppliers' },
                  { name: 'Global Logistics', icon: Truck, path: '/logistics' },
                  { name: 'Verified Network', icon: Users, path: '/trust' }
                ].map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-os-accent/5 transition-all text-os-text-secondary hover:text-os-text-primary group"
                  >
                    <item.icon className="w-4 h-4 text-os-accent/60 group-hover:text-os-accent" />
                    <span className="text-14 font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* CENTER: Clean Apple-Style Search */}
          <div className="lg:col-span-6 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-40 md:text-64 lg:text-72 font-bold tracking-tight text-os-text-primary mb-6 leading-[0.95]">
                Buy & Sell <br />
                <span className="text-os-accent italic">Across Africa.</span>
              </h1>
              <div className="flex items-center justify-center gap-6 mb-8 mt-2 opacity-60">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-black text-os-text-secondary">
                  <Shield className="w-4 h-4 text-os-accent" />
                  Verified Suppliers
                </div>
                <div className="w-1 h-1 rounded-full bg-os-stroke" />
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-black text-os-text-secondary">
                  <Globe className="w-4 h-4 text-os-accent" />
                  54 African Countries
                </div>
              </div>
              <p className="text-16 md:text-18 text-os-text-secondary/80 max-w-lg mx-auto leading-relaxed font-medium">
                Afrikoni connects global buyers with vetted manufacturers and institutional producers across the continent.
              </p>
            </motion.div>

            {/* THE SEARCH: Billion-Dollar Simplicity */}
            <div ref={searchContainerRef} className="w-full max-w-2xl relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-os-accent/20 via-white/5 to-os-accent/20 rounded-[28px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />

              <div className="relative flex flex-col md:flex-row gap-3 bg-os-surface-solid/90 backdrop-blur-2xl border-2 border-os-stroke p-2 md:p-3 rounded-[28px] shadow-premium">
                <div className="flex-1 relative flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-os-text-secondary/40" />
                  <input
                    id="hero-search-input"
                    type="text"
                    placeholder="Search products or suppliers..."
                    className="w-full bg-transparent border-none text-os-text-primary text-18 font-bold pl-12 pr-4 py-3 focus:outline-none placeholder:text-os-text-secondary/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                  />
                </div>

                <button
                  onClick={() => {
                    if (searchQuery.trim()) addSearchToHistory(searchQuery);
                    navigate(`/marketplace?q=${searchQuery}`);
                    setShowSuggestions(false);
                  }}
                  className="bg-os-accent hover:bg-os-accent/90 text-[#1A1512] px-8 py-4 rounded-[22px] font-bold text-16 transition-all active:scale-95 shadow-lg shadow-os-accent/20"
                >
                  Search
                </button>
              </div>

              {/* Suggestions */}
              <AnimatePresence>
                {showSuggestions && (searchQuery || isSearchFocused) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-4 z-50"
                  >
                    <div className="glass-surface overflow-hidden rounded-[24px]">
                      <SearchSuggestions
                        query={searchQuery}
                        onSelect={(suggestion) => {
                          setSearchQuery(suggestion);
                          if (suggestion.trim()) addSearchToHistory(suggestion);
                          navigate(`/marketplace?q=${suggestion}`);
                          setShowSuggestions(false);
                        }}
                        showHistory={!searchQuery}
                        showTrending={!searchQuery}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* QUICK STATS */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 md:gap-16">
              {[
                { label: 'Markets', value: stats.countries },
                ...(stats.verifiedSuppliers > 0 ? [{ label: 'Verified Suppliers', value: stats.verifiedSuppliers >= 1000 ? `${(stats.verifiedSuppliers / 1000).toFixed(1)}k+` : `${stats.verifiedSuppliers}+` }] : []),
                ...(stats.activeBusinesses > 0 ? [{ label: 'Businesses', value: stats.activeBusinesses >= 1000 ? `${(stats.activeBusinesses / 1000).toFixed(1)}k+` : `${stats.activeBusinesses}+` }] : []),
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-24 font-bold text-os-text-primary mb-1">{stat.value}</p>
                  <p className="text-[10px] font-bold text-os-text-secondary/50 uppercase tracking-[0.2em]">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <button
              onClick={() => openWhatsAppCommunity('hero_section')}
              className="mt-6 inline-flex items-center gap-2 text-14 font-medium text-green-600 hover:text-green-500 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Join our WhatsApp community</span>
            </button>
          </div>

          {/* RIGHT: High-End Feature (Simple) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 hidden lg:flex flex-col gap-6"
          >
            <div className="glass-surface p-6 rounded-[24px] border-os-stroke bg-os-surface-solid shadow-premium flex flex-col gap-8">
              <div>
                <h4 className="text-os-text-primary font-bold mb-2 text-16 uppercase tracking-tight">Need Help Sourcing?</h4>
                <p className="text-os-text-secondary/60 text-13 leading-relaxed font-medium">
                  Our team can help you find and verify the right suppliers for your business.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Growing Fast', value: 'Active', icon: TrendingUp, color: 'text-os-accent' },
                  { label: 'Platform Status', value: 'Verified', icon: Shield, color: 'text-os-accent' }
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-os-accent/5 rounded-2xl border border-os-stroke">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-os-text-secondary/40 uppercase tracking-widest">{item.label}</span>
                      <item.icon className={cn("w-3 h-3", item.color)} />
                    </div>
                    <p className="text-18 font-bold text-os-text-primary">{item.value}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/signup')}
                className="w-full py-4 bg-os-accent hover:bg-os-accent/90 text-[#1A1512] rounded-2xl font-bold text-14 transition-all flex items-center justify-center gap-2 group shadow-lg"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
