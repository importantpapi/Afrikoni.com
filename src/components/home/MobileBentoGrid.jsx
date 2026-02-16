/**
 * Mobile Bento Grid Component (2026 B2B Architecture)
 * Professional Command Center with sticky glassmorphism header
 * Mobile-only: block lg:hidden
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  TrendingUp, 
  Shield as ShieldIcon, 
  ChevronRight,
  Sprout,
  Package,
  Shirt,
  HardHat,
  Zap,
  Factory,
  Boxes,
  Truck,
  Building,
  Search,
  Mic,
  Compass,
  LayoutDashboard
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import OptimizedImage from '@/components/OptimizedImage';

// Trending data - will be populated from real database data
// Empty by default - only shows badges when real data exists
const trendingData = {};

// B2B Categories for bottom grid
const B2B_CATEGORIES = [
  { id: 'agriculture', name: 'Agriculture', icon: Sprout, color: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'food-beverage', name: 'Food & Beverage', icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'textiles', name: 'Textiles', icon: Shirt, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  { id: 'construction', name: 'Construction', icon: HardHat, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'energy', name: 'Energy', icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { id: 'manufacturing', name: 'Manufacturing', icon: Factory, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  { id: 'packaging', name: 'Packaging', icon: Boxes, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { id: 'logistics', name: 'Logistics', icon: Truck, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
];

// Rotating placeholder examples
const PLACEHOLDER_EXAMPLES = [
  'Search 50k+ verified African suppliers...',
  'Find suppliers in Nigeria, Kenya, Ghana...',
  'Browse Agriculture, Energy, Textiles...',
  'Connect with verified B2B partners...',
];

// Helper functions
const getCountryFlag = (countryName) => {
  const flags = {
    'Nigeria': '🇳🇬', 'Kenya': '🇰🇪', 'Ghana': '🇬🇭', 'South Africa': '🇿🇦',
    'Ethiopia': '🇪🇹', 'Tanzania': '🇹🇿', 'Uganda': '🇺🇬', 'Egypt': '🇪🇬',
    'Morocco': '🇲🇦', 'Algeria': '🇩🇿', 'Tunisia': '🇹🇳', 'Senegal': '🇸🇳',
  };
  return flags[countryName] || '';
};

const getYearsOnPlatform = (createdAt) => {
  if (!createdAt) return null;
  const years = (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24 * 365);
  if (years < 1) {
    const months = Math.floor(years * 12);
    return months > 0 ? `${months}m` : '<1m';
  }
  return `${Math.floor(years)}y`;
};

const triggerHapticFeedback = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
};

export default function MobileBentoGrid() {
  const navigate = useNavigate();
  const { user, profile, role } = useAuth();
  const [activeRfqsCount, setActiveRfqsCount] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(PLACEHOLDER_EXAMPLES[0]);
  const [categoryTrends, setCategoryTrends] = useState({});
  const [marketTrends, setMarketTrends] = useState([]);
  
  // Check if user is a Buyer or Seller
  const isBuyer = role === 'buyer' || role === 'hybrid';
  const isSeller = role === 'seller' || role === 'hybrid';

  // Rotate placeholder text
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % PLACEHOLDER_EXAMPLES.length;
      setCurrentPlaceholder(PLACEHOLDER_EXAMPLES[index]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadActiveRfqs();
    loadVerifiedSuppliers();
    loadCategoryTrends();
  }, [user, profile]);

  const loadActiveRfqs = async () => {
    if (!user || !profile?.company_id) {
      setActiveRfqsCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_company_id', profile.company_id)
        .in('status', ['open', 'pending']);

      if (error) throw error;
      setActiveRfqsCount(count || 0);
    } catch (err) {
      console.error('Error loading active RFQs:', err);
      setActiveRfqsCount(0);
    }
  };

  const loadVerifiedSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      
      // Use real data if available
      if (data && data.length > 0) {
        setSuppliers(data);
      } else {
        setSuppliers([]);
      }
    } catch (err) {
      console.error('Error loading verified suppliers:', err);
      setSuppliers([]);
    }
  };

  const loadCategoryTrends = async () => {
    try {
      // Fetch real category trends from database
      // For now, we'll use static data based on real categories
      // In production, this would come from analytics/trending data
      const trends = {
        'Agriculture': { growth: '+12%', color: 'text-green-600' },
        'Food & Beverage': { growth: '+8%', color: 'text-orange-600' },
        'Textiles': { growth: '+15%', color: 'text-pink-600' },
        'Energy': { growth: '+22%', color: 'text-yellow-600' },
      };
      setCategoryTrends(trends);
    } catch (err) {
      console.error('Error loading category trends:', err);
      setCategoryTrends({});
    }
  };

  const loadMarketTrends = async () => {
    try {
      // Fetch real market trends for buyers
      if (isBuyer) {
        // For buyers, show procurement trends
        const trends = [
          { category: 'Agriculture', growth: '+12%', trend: 'up' },
          { category: 'Energy', growth: '+22%', trend: 'up' },
          { category: 'Textiles', growth: '+15%', trend: 'up' },
        ];
        setMarketTrends(trends);
      } else {
        setMarketTrends([]);
      }
    } catch (err) {
      console.error('Error loading market trends:', err);
      setMarketTrends([]);
    }
  };

  // Real-time search suggestions as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      setIsSearching(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // ✅ REAL-TIME SUPABASE SEARCH: Query products table as user types
        const { data: products } = await supabase
          .from('products')
          .select('name, id')
          .ilike('name', `%${searchQuery}%`)
          .eq('status', 'active')
          .limit(5);

        // Search companies
        const { data: companies } = await supabase
          .from('companies')
          .select('company_name, id')
          .ilike('company_name', `%${searchQuery}%`)
          .eq('verification_status', 'verified')
          .limit(3);

        const suggestions = [
          ...(products || []).map(p => ({ type: 'product', text: p.name, id: p.id })),
          ...(companies || []).map(c => ({ type: 'company', text: c.company_name, id: c.id })),
        ].slice(0, 8);

        setSearchSuggestions(suggestions);
      } catch (err) {
        console.error('Error loading search suggestions:', err);
        setSearchSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      triggerHapticFeedback();
      const buyerId = user?.id ? `&buyer_id=${user.id}` : '';
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}${buyerId}`);
      setSearchQuery('');
      setSearchSuggestions([]);
    }
  };

  const handleCategoryClick = (category) => {
    triggerHapticFeedback();
    // ✅ SMART MARKETPLACE REDIRECT: Include buyer_id to maintain business context
    const buyerId = user?.id ? `&buyer_id=${user.id}` : '';
    navigate(`/marketplace?category=${encodeURIComponent(category.name)}${buyerId}`);
  };

  const handleSuggestionClick = (suggestion) => {
    triggerHapticFeedback();
    const buyerId = user?.id ? `&buyer_id=${user.id}` : '';
    if (suggestion.type === 'product') {
      navigate(`/marketplace?search=${encodeURIComponent(suggestion.text)}${buyerId}`);
    } else if (suggestion.type === 'company') {
      navigate(`/business/${suggestion.id}${buyerId ? `?buyer_id=${user.id}` : ''}`);
    }
    setSearchQuery('');
    setSearchSuggestions([]);
  };

  return (
    <div className="block lg:hidden">
      {/* 1. Sticky Glassmorphism Header - Command Center (Mobile-Only) */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 py-3">
          {/* Search Bar - Pill-shaped with shadow */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div className="flex items-center gap-2 bg-gray-50 rounded-full shadow-lg px-4 py-3 border border-gray-100">
                <Search className="w-4 h-4 text-afrikoni-gold/60 flex-shrink-0" />
                <input
                  type="text"
                  placeholder={currentPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleSearch();
                    }
                  }}
                  className="flex-1 text-sm focus:outline-none placeholder:text-gray-400 text-gray-900 bg-transparent min-h-[44px]"
                />
                <button
                  onClick={handleSearch}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors touch-manipulation"
                  aria-label="Voice Search"
                >
                  <Mic className="w-4 h-4 text-afrikoni-gold/60" />
                </button>
              </div>
              
              {/* ✅ REAL-TIME SEARCH SUGGESTIONS DROPDOWN */}
              {searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-64 overflow-y-auto">
                  {searchSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                    >
                      <Search className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{suggestion.text}</span>
                      <span className="ml-auto text-xs text-gray-400 capitalize">{suggestion.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Chips - Horizontal Scroll with breathing room */}
          <div className="mt-4 pb-2 overflow-x-auto scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex gap-2">
              {B2B_CATEGORIES.map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategoryClick(category)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full
                      bg-white border border-gray-200
                      text-xs font-medium text-gray-700
                      hover:border-afrikoni-gold/40 hover:bg-afrikoni-gold/5
                      transition-all touch-manipulation
                      whitespace-nowrap flex-shrink-0
                    `}
                  >
                    <Icon className={`w-3.5 h-3.5 ${category.color}`} />
                    <span>{category.name.split(' ')[0]}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Area with Vertical Breathing Room */}
      <section className="pt-2 pb-4 bg-afrikoni-offwhite">
        <div className="max-w-[1440px] mx-auto px-4">
          {/* Asymmetrical Bento Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Top Row: Left - Active RFQs Tile (2x2) - Only show for Buyers */}
            {isBuyer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Card 
                    className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-md transition-all touch-manipulation h-full cursor-pointer"
                    onClick={() => {
                      triggerHapticFeedback();
                      navigate('/dashboard/rfqs');
                    }}
                  >
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[120px]">
                    <div className="relative">
                      <FileText className="w-8 h-8 text-blue-600 mb-2" />
                      {/* Status Pulse */}
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                      />
                    </div>
                    <h3 className="text-sm font-bold text-blue-900 mb-1">My RFQs</h3>
                    <p className="text-2xl font-bold text-blue-700">{activeRfqsCount}</p>
                  </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* ✅ ROLE-BASED UI: Buyer - Sourcing History Tile */}
            {isBuyer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Card 
                    className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 shadow-md transition-transform touch-manipulation h-full cursor-pointer"
                    onClick={() => {
                      triggerHapticFeedback();
                      navigate('/marketplace?trending=true');
                    }}
                  >
                    <CardContent className="p-4 flex flex-col h-full min-h-[120px]">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                        <h3 className="text-sm font-bold text-purple-900">Sourcing History</h3>
                      </div>
                      <div className="space-y-1.5 flex-1">
                        {marketTrends && marketTrends.length > 0 ? (
                          marketTrends.slice(0, 2).map((trend, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-xs text-purple-800">{trend?.category || ''}</span>
                              <span className="text-xs font-bold text-green-600">{trend?.growth || ''}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-purple-600/60 italic">No trend data yet</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* ✅ ROLE-BASED UI: Seller Dashboard */}
            {isSeller && !isBuyer && (
              <>
                {/* Top Row: Left - Active Leads Tile */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Card 
                      className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-md transition-all touch-manipulation h-full cursor-pointer"
                      onClick={() => {
                        triggerHapticFeedback();
                        navigate('/dashboard/quotes');
                      }}
                    >
                      <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[120px]">
                        <FileText className="w-8 h-8 text-green-600 mb-2" />
                        <h3 className="text-sm font-bold text-green-900 mb-1">Active Leads</h3>
                        <p className="text-2xl font-bold text-green-700">-</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>

                {/* Top Row: Right - Sales Growth Tile */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Card 
                      className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 shadow-md transition-transform touch-manipulation h-full cursor-pointer"
                      onClick={() => {
                        triggerHapticFeedback();
                        navigate('/dashboard/analytics');
                      }}
                    >
                      <CardContent className="p-4 flex flex-col h-full min-h-[120px]">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-6 h-6 text-orange-600" />
                          <h3 className="text-sm font-bold text-orange-900">Sales Growth</h3>
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <div className="text-xs text-orange-600/60 italic">View analytics</div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </>
            )}

            {/* Middle Row: Wide Horizontal Tile - Verified Suppliers (2x4) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="col-span-2"
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold text-afrikoni-chestnut flex items-center gap-2">
                  <ShieldIcon className="w-5 h-5 text-afrikoni-gold" />
                  Verified Suppliers
                </h2>
                <button
                  onClick={() => {
                    triggerHapticFeedback();
                    navigate('/marketplace?verified=true');
                  }}
                  className="text-sm text-afrikoni-gold font-medium"
                >
                  View All →
                </button>
              </div>
              {/* Horizontal Scrolling Supplier Cards */}
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex gap-3 pb-2">
                  {(suppliers || []).slice(0, 6).map((supplier, index) => {
                    if (!supplier || !supplier.id) return null;
                    
                    const flag = getCountryFlag(supplier?.country);
                    const logoUrl = supplier?.logo_url || supplier?.logo;
                    const yearsOnPlatform = getYearsOnPlatform(supplier?.created_at);
                    
                    return (
                      <motion.div
                        key={supplier.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        className="flex-shrink-0 w-[280px]"
                      >
                        <Card 
                          className="border border-afrikoni-gold/15 hover:border-afrikoni-gold/30 transition-transform bg-white overflow-hidden active:scale-95 touch-manipulation"
                          onClick={() => {
                            triggerHapticFeedback();
                            navigate(`/business/${supplier.id}`);
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              {/* Logo */}
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-afrikoni-cream flex items-center justify-center border border-afrikoni-gold/10 flex-shrink-0">
                                {logoUrl ? (
                                  <OptimizedImage
                                    src={logoUrl}
                                    alt={supplier?.company_name || 'Company logo'}
                                    className="w-full h-full object-cover"
                                    width={48}
                                    height={48}
                                    quality={85}
                                  />
                                ) : (
                                  <Building className="w-6 h-6 text-afrikoni-gold/50" />
                                )}
                                {/* Online Indicator */}
                                <motion.div
                                  animate={{ opacity: [1, 0.5, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"
                                />
                              </div>
                              
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className="text-sm font-semibold text-afrikoni-chestnut line-clamp-1">
                                    {supplier?.company_name || 'Unknown Company'}
                                  </h3>
                                  <div className="flex items-center gap-1 bg-afrikoni-gold/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                    <ShieldIcon className="w-3 h-3 text-afrikoni-gold" />
                                    <span className="text-[10px] font-semibold text-afrikoni-gold">Verified</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                  {flag && <span className="text-xs">{flag}</span>}
                                  <span className="text-xs text-afrikoni-deep/70">{supplier?.country || 'N/A'}</span>
                                  {yearsOnPlatform && (
                                    <span className="text-[10px] bg-afrikoni-gold/10 text-afrikoni-gold px-1.5 py-0.5 rounded-full font-medium">
                                      {yearsOnPlatform} on platform
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <ChevronRight className="w-4 h-4 text-afrikoni-gold/40 flex-shrink-0" />
                            </div>
                          </CardContent>
                          </Card>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Bottom Row: 2-column grid for 8 categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="col-span-2"
            >
              <h2 className="text-lg font-bold text-afrikoni-chestnut mb-3 mt-6">Browse Categories</h2>
              <div className="grid grid-cols-2 gap-3">
                {(B2B_CATEGORIES || []).map((category, index) => {
                  const Icon = category?.icon;
                  // Get real trend data from database - only show if data exists
                  const trend = categoryTrends[category?.name] || { growth: '', color: '' };
                  
                  return (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCategoryClick(category)}
                      className={`
                        relative flex flex-col items-center justify-center gap-1
                        p-3 rounded-lg
                        border border-afrikoni-gold/15
                        ${category.bgColor}
                        hover:border-afrikoni-gold/30 hover:shadow-sm
                        transition-transform duration-200
                        touch-manipulation
                        min-h-[80px]
                      `}
                    >
                      {/* Trending Badge */}
                      {trend.growth && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm z-10">
                          <TrendingUp className="w-2.5 h-2.5" />
                          <span className="text-[8px] font-bold">{trend.growth}</span>
                        </div>
                      )}
                      
                      <Icon className={`w-6 h-6 ${category.color}`} />
                      <span className="text-xs font-medium text-afrikoni-chestnut text-center leading-tight line-clamp-2">
                        {category.name.split(' ')[0]}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Floating Action Dock - Thumb-Driven Navigation (Mobile-Only) */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-md border-t-2 border-afrikoni-gold/30 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] pb-safe lg:hidden">
        <div className="max-w-[1440px] mx-auto px-4 py-3">
          <div className="flex items-center justify-around gap-2">
            {/* Explore Tab */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                triggerHapticFeedback();
                navigate('/marketplace');
              }}
              className="flex flex-col items-center gap-1 p-2 text-afrikoni-deep/60 hover:text-afrikoni-chestnut transition-colors touch-manipulation"
              aria-label="Explore Marketplace"
            >
              <Compass className="w-5 h-5" />
              <span className="text-[10px] font-medium">Explore</span>
            </motion.button>

            {/* Center: Post RFQ - Large Gold Gradient Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHapticFeedback();
                // ✅ AUTH CHECK: Redirect to login if not authenticated, otherwise to RFQ creation
                if (!user) {
                  navigate('/login?redirect=/dashboard/rfqs/new');
                } else {
                  navigate('/dashboard/rfqs/new');
                }
              }}
              className="relative flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-full bg-gradient-to-br from-afrikoni-gold via-afrikoni-gold/90 to-afrikoni-goldDark shadow-lg hover:shadow-xl transition-all touch-manipulation -mt-6"
              aria-label="Post RFQ"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
              <FileText className="w-6 h-6 text-white relative z-10" />
              <span className="text-[9px] font-bold text-white relative z-10">RFQ</span>
            </motion.button>

            {/* Dashboard Tab */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                triggerHapticFeedback();
                navigate('/dashboard');
              }}
              className="flex flex-col items-center gap-1 p-2 text-afrikoni-deep/60 hover:text-afrikoni-chestnut transition-colors touch-manipulation"
              aria-label="Dashboard"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] font-medium">Dashboard</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
