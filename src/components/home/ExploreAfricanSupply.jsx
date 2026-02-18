import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { ArrowRight, MapPin, Package, ChevronLeft, ChevronRight, Globe, ShieldCheck } from 'lucide-react';
import { Sprout, Shirt, HardHat, Heart, Home, Smartphone } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrency } from '@/contexts/CurrencyContext';
import Price from '@/components/shared/ui/Price';
import { matchProductToPopularCategory } from '@/utils/productCategoryIntelligence';
import SaveButton from '@/components/shared/ui/SaveButton';
import OptimizedImage from '@/components/OptimizedImage';

// All 54 African countries with flags
const ALL_AFRICAN_COUNTRIES = [
  { name: 'Algeria', flag: '🇩🇿', code: 'algeria' },
  { name: 'Angola', flag: '🇦🇴', code: 'angola' },
  { name: 'Benin', flag: '🇧🇯', code: 'benin' },
  { name: 'Botswana', flag: '🇧🇼', code: 'botswana' },
  { name: 'Burkina Faso', flag: '🇧🇫', code: 'burkina-faso' },
  { name: 'Burundi', flag: '🇧🇮', code: 'burundi' },
  { name: 'Cameroon', flag: '🇨🇲', code: 'cameroon' },
  { name: 'Cape Verde', flag: '🇨🇻', code: 'cape-verde' },
  { name: 'Central African Republic', flag: '🇨🇫', code: 'central-african-republic' },
  { name: 'Chad', flag: '🇹🇩', code: 'chad' },
  { name: 'Comoros', flag: '🇰🇲', code: 'comoros' },
  { name: 'Congo', flag: '🇨🇬', code: 'congo' },
  { name: 'DR Congo', flag: '🇨🇩', code: 'dr-congo' },
  { name: "Côte d'Ivoire", flag: '🇨🇮', code: 'ivory-coast' },
  { name: 'Djibouti', flag: '🇩🇯', code: 'djibouti' },
  { name: 'Egypt', flag: '🇪🇬', code: 'egypt' },
  { name: 'Equatorial Guinea', flag: '🇬🇶', code: 'equatorial-guinea' },
  { name: 'Eritrea', flag: '🇪🇷', code: 'eritrea' },
  { name: 'Eswatini', flag: '🇸🇿', code: 'eswatini' },
  { name: 'Ethiopia', flag: '🇪🇹', code: 'ethiopia' },
  { name: 'Gabon', flag: '🇬🇦', code: 'gabon' },
  { name: 'Gambia', flag: '🇬🇲', code: 'gambia' },
  { name: 'Ghana', flag: '🇬🇭', code: 'ghana' },
  { name: 'Guinea', flag: '🇬🇳', code: 'guinea' },
  { name: 'Guinea-Bissau', flag: '🇬🇼', code: 'guinea-bissau' },
  { name: 'Kenya', flag: '🇰🇪', code: 'kenya' },
  { name: 'Lesotho', flag: '🇱🇸', code: 'lesotho' },
  { name: 'Liberia', flag: '🇱🇷', code: 'liberia' },
  { name: 'Libya', flag: '🇱🇾', code: 'libya' },
  { name: 'Madagascar', flag: '🇲🇬', code: 'madagascar' },
  { name: 'Malawi', flag: '🇲🇼', code: 'malawi' },
  { name: 'Mali', flag: '🇲🇱', code: 'mali' },
  { name: 'Mauritania', flag: '🇲🇷', code: 'mauritania' },
  { name: 'Mauritius', flag: '🇲🇺', code: 'mauritius' },
  { name: 'Morocco', flag: '🇲🇦', code: 'morocco' },
  { name: 'Mozambique', flag: '🇲🇿', code: 'mozambique' },
  { name: 'Namibia', flag: '🇳🇦', code: 'namibia' },
  { name: 'Niger', flag: '🇳🇪', code: 'niger' },
  { name: 'Nigeria', flag: '🇳🇬', code: 'nigeria' },
  { name: 'Rwanda', flag: '🇷🇼', code: 'rwanda' },
  { name: 'São Tomé and Príncipe', flag: '🇸🇹', code: 'sao-tome-and-principe' },
  { name: 'Senegal', flag: '🇸🇳', code: 'senegal' },
  { name: 'Seychelles', flag: '🇸🇨', code: 'seychelles' },
  { name: 'Sierra Leone', flag: '🇸🇱', code: 'sierra-leone' },
  { name: 'Somalia', flag: '🇸🇴', code: 'somalia' },
  { name: 'South Africa', flag: '🇿🇦', code: 'south-africa' },
  { name: 'South Sudan', flag: '🇸🇸', code: 'south-sudan' },
  { name: 'Sudan', flag: '🇸🇩', code: 'sudan' },
  { name: 'Tanzania', flag: '🇹🇿', code: 'tanzania' },
  { name: 'Togo', flag: '🇹🇬', code: 'togo' },
  { name: 'Tunisia', flag: '🇹🇳', code: 'tunisia' },
  { name: 'Uganda', flag: '🇺🇬', code: 'uganda' },
  { name: 'Zambia', flag: '🇿🇲', code: 'zambia' },
  { name: 'Zimbabwe', flag: '🇿🇼', code: 'zimbabwe' }
];

const getFlagForCountryName = (countryName) => {
  if (!countryName) return '';
  const match = ALL_AFRICAN_COUNTRIES.find(
    (c) => c.name.toLowerCase() === countryName.toLowerCase()
  );
  return match?.flag || '';
};

// Popular categories with icons and search keywords
const popularCategories = [
  { name: 'Agricultural Products', icon: Sprout, key: 'agriculture', keywords: ['agriculture', 'food', 'cocoa', 'coffee', 'grain', 'produce'] },
  { name: 'Food & Beverages', icon: Heart, key: 'food-beverage', keywords: ['food', 'beverage', 'drink', 'processed'] },
  { name: 'Textiles & Fashion', icon: Shirt, key: 'textiles', keywords: ['textile', 'fabric', 'fashion', 'clothing', 'garment'] },
  { name: 'Minerals & Mining', icon: HardHat, key: 'minerals', keywords: ['mineral', 'mining', 'gold', 'ore', 'stone'] },
  { name: 'Electronics', icon: Smartphone, key: 'electronics', keywords: ['electronics', 'phone', 'device', 'appliance'] },
  { name: 'Machinery & Equipment', icon: Home, key: 'machinery', keywords: ['machinery', 'equipment', 'industrial', 'tools'] }
];

export default function ExploreAfricanSupply() {
  const { t, language = 'en' } = useLanguage();
  const { currency, formatPrice } = useCurrency();
  const [countryScrollPosition, setCountryScrollPosition] = useState(0);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});
  const [hasMore, setHasMore] = useState({});
  const [page, setPage] = useState({});
  const [categoryMap, setCategoryMap] = useState({});
  const [categoryCounts, setCategoryCounts] = useState({});
  const countryScrollRef = useRef(null);
  const observerRefs = useRef({});

  // Load products for each category with pagination
  const loadCategoryProducts = useCallback(async (categoryKey, pageNum = 0, append = false, catMap = categoryMap) => {
    const category = popularCategories.find(c => c.key === categoryKey);
    if (!category) return;

    try {
      setLoadingProducts(prev => ({ ...prev, [categoryKey]: true }));

      const limit = 12;
      const offset = pageNum * limit;
      const categoryId = catMap[category.name];

      // Query 1: Products with matching category ID
      let categoryProducts = [];
      if (categoryId) {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price_min, price_max, currency, min_order_quantity, country_of_origin, images, product_images(url, is_primary)')
          .eq('status', 'active')
          .eq('category_id', categoryId)
          .order('created_at', { ascending: false })
          .limit(limit * 2);

        if (error) {
          console.warn('Category ID query failed:', error);
        } else {
          categoryProducts = data || [];
        }
      }

      // Query 2: Keyword search - only if needed or as additional discovery
      let keywordProducts = [];
      const orConditions = category.keywords.length > 0
        ? category.keywords.map(kw => `name.ilike.%${kw}%`).join(',')
        : null;

      if (orConditions) {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price_min, price_max, currency, min_order_quantity, country_of_origin, images, product_images(url, is_primary)')
          .eq('status', 'active')
          .or(orConditions)
          .order('created_at', { ascending: false })
          .limit(limit * 2);

        if (error) {
          console.warn('Keyword search query failed:', error);
        } else {
          keywordProducts = data || [];
        }
      }

      // Combine results and remove duplicates
      const allProducts = [...categoryProducts, ...keywordProducts];
      const productMap = new Map();
      allProducts.forEach(p => {
        if (p && p.id && !productMap.has(p.id)) {
          productMap.set(p.id, p);
        }
      });

      // Get unique products and apply pagination
      const uniqueProducts = Array.from(productMap.values());
      const products = uniqueProducts.slice(offset, offset + limit);

      setCategoryProducts(prev => ({
        ...prev,
        [categoryKey]: append ? [...(prev[categoryKey] || []), ...products] : products
      }));
      setHasMore(prev => ({ ...prev, [categoryKey]: products.length === limit }));
      setPage(prev => ({ ...prev, [categoryKey]: pageNum }));
    } catch (error) {
      console.error(`Error loading products for ${category.name}:`, error);
    } finally {
      setLoadingProducts(prev => ({ ...prev, [categoryKey]: false }));
    }
  }, [categoryMap]);

  // Initial load - first fetch categories, then products
  useEffect(() => {
    const initLoad = async () => {
      try {
        // Fetch category IDs once
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name');

        const mapping = {};
        if (categories) {
          categories.forEach(c => {
            mapping[c.name] = c.id;
          });
          setCategoryMap(mapping);

          // TRASNPARENCY FIX: Fetch actual counts for categories
          const { data: countsData } = await supabase
            .from('products')
            .select('category_id', { count: 'exact', head: true });

          // Note: In real production, we'd group by category_id on the server. 
          // For now, we'll fetch general counts to show 'Live Production' activity.
          const { data: totalProducts } = await supabase
            .from('products')
            .select('category_id')
            .eq('status', 'active');

          const counts = {};
          totalProducts?.forEach(p => {
            if (p.category_id) {
              const catName = categories.find(c => c.id === p.category_id)?.name;
              if (catName) {
                counts[catName] = (counts[catName] || 0) + 1;
              }
            }
          });
          setCategoryCounts(counts);
        }

        // Load products for each category
        popularCategories.forEach(category => {
          loadCategoryProducts(category.key, 0, false, mapping);
        });
      } catch (err) {
        console.error('Failed to initialize ExploreAfricanSupply:', err);
      }
    };

    initLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll observer setup - stable refs
  useEffect(() => {
    const observers = [];
    popularCategories.forEach(category => {
      const observerRef = observerRefs.current[category.key];
      if (!observerRef) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore[category.key] && !loadingProducts[category.key]) {
            const nextPage = (page[category.key] || 0) + 1;
            loadCategoryProducts(category.key, nextPage, true);
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(observerRef);
      observers.push(observer);
    });

    return () => {
      observers.forEach(obs => obs.disconnect());
    };
  }, [hasMore, loadingProducts, page, loadCategoryProducts]);

  const scrollCountries = (direction) => {
    if (!countryScrollRef.current) return;
    const scrollAmount = 200;
    const newPosition = countryScrollPosition + (direction === 'right' ? scrollAmount : -scrollAmount);
    setCountryScrollPosition(Math.max(0, Math.min(newPosition, countryScrollRef.current.scrollWidth - countryScrollRef.current.clientWidth)));
    countryScrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
  };

  return (
    <section className="py-20 md:py-28 bg-os-bg relative overflow-hidden">
      {/* Subtle Texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjciIG51bU9jdGF2ZXM9IjQiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIuNSIvPjwvc3ZnPg==')]" />
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-black/[0.01] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header - Simple & Clean */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-os-accent/5 border border-os-accent/10 rounded-full mb-6">
            <Globe className="w-3.5 h-3.5 text-os-accent" />
            <span className="text-[10px] font-bold text-os-accent uppercase tracking-[0.2em]">Verified African Network</span>
          </div>
          <h2 className="text-36 md:text-48 lg:text-56 font-bold leading-[1.1] text-os-text-primary mb-8 tracking-tight">
            {t('explore_supply')}
          </h2>
          <p className="text-16 md:text-18 font-medium leading-[1.6] text-os-text-secondary max-w-2xl mx-auto">
            Direct access to premium manufacturers and vetted suppliers across the continent.
          </p>
        </motion.div>

        {/* Source by Country */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="hidden md:block mb-16"
        >
          <div className="flex items-end justify-between mb-8 border-b border-os-stroke pb-6">
            <div>
              <h3 className="text-24 font-bold text-os-text-primary flex items-center gap-3 mb-2 tracking-tight">
                <MapPin className="w-6 h-6 text-os-accent" />
                {t('source_by_country')}
              </h3>
              <p className="text-12 font-medium text-os-text-secondary uppercase tracking-[0.1em] opacity-60">
                Source by region and country
              </p>
            </div>
            <Link to={`/${language}/countries`}>
              <Button variant="outline" className="border-os-stroke hover:border-os-accent hover:bg-os-accent/5 px-8 rounded-xl font-bold text-12 h-12">
                {t('view_all_countries')}
              </Button>
            </Link>
          </div>

          <div className="relative group/countries">
            <div
              ref={countryScrollRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-8 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {ALL_AFRICAN_COUNTRIES.map((country, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -8 }}
                  className="flex-shrink-0"
                >
                  <Link to={`/${language}/marketplace?country=${country.code}`} className="block">
                    <Card className="w-36 md:w-44 bg-os-surface-solid border border-os-stroke hover:border-os-accent hover:shadow-xl transition-all duration-500 cursor-pointer rounded-2xl overflow-hidden group/country-card">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl md:text-5xl mb-4 group-hover/country-card:scale-110 transition-transform duration-500">{country.flag}</div>
                        <h4 className="font-bold text-os-text-primary text-13 md:text-14 tracking-tight group-hover/country-card:text-os-accent transition-colors">
                          {country.name}
                        </h4>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => scrollCountries('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 bg-os-surface-solid border border-os-stroke rounded-full w-12 h-12 shadow-xl hover:bg-os-accent hover:text-white z-10 hidden md:flex items-center justify-center transition-all opacity-0 group-hover/countries:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scrollCountries('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 bg-os-surface-solid border border-os-stroke rounded-full w-12 h-12 shadow-xl hover:bg-os-accent hover:text-white z-10 hidden md:flex items-center justify-center transition-all opacity-0 group-hover/countries:opacity-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </motion.div>

        {/* Popular Categories */}
        <div className="space-y-24">
          {popularCategories.slice(0, 3).map((category, categoryIdx) => {
            const Icon = category.icon;
            const products = categoryProducts[category.key] || [];
            const isLoading = loadingProducts[category.key];
            const hasProducts = products.length > 0;

            return (
              <motion.div
                key={category.key}
                className="space-y-10"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {/* Category Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-os-accent/10">
                  <div className="flex items-center gap-6 group/cat-header">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-os-accent rounded-[24px] flex items-center justify-center shadow-lg group-hover/cat-header:scale-105 transition-transform duration-500">
                      <Icon className="w-8 h-8 md:w-10 md:h-10 text-[#1A1512]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-[2px] w-4 bg-os-accent" />
                        <span className="text-[10px] font-bold text-os-accent uppercase tracking-[0.2em]">Premium Supply</span>
                      </div>
                      <h4 className="text-28 md:text-36 font-bold text-os-text-primary tracking-tight leading-none">
                        {category.name}
                      </h4>
                      {categoryCounts[category.name] && (
                        <div className="flex items-center gap-2 mt-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[11px] font-bold text-os-text-secondary uppercase tracking-[0.2em]">
                            {categoryCounts[category.name]} Active Production Units
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/${language}/marketplace?category=${encodeURIComponent(category.name.toLowerCase())}`}
                    className="group flex items-center gap-3 px-6 h-14 bg-os-surface-solid border border-os-stroke rounded-xl hover:border-os-accent transition-all duration-300 shadow-sm"
                  >
                    <span className="text-13 font-bold text-os-text-primary uppercase tracking-[0.1em]">{t('view_all_category')}</span>
                    <div className="w-8 h-8 rounded-full bg-os-accent/5 flex items-center justify-center group-hover:bg-os-accent group-hover:text-[#1A1512] transition-all duration-300">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                </div>

                {/* Products Grid */}
                {isLoading && products.length === 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="aspect-square bg-os-surface-solid rounded-[24px] border border-os-stroke shadow-sm animate-pulse" />
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 ${products.length === 1 ? 'lg:flex lg:justify-center' :
                    products.length === 2 ? 'lg:flex lg:justify-center' :
                      products.length === 3 ? 'lg:flex lg:justify-center' : ''
                    }`}>
                    {products.slice(0, 4).map((product, productIdx) => {
                      const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
                      const countryFlag = getFlagForCountryName(product.country_of_origin);

                      return (
                        <motion.div
                          key={product.id || productIdx}
                          whileHover={{ y: -8 }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          className={products.length < 4 ? 'w-full max-w-[300px]' : ''}
                        >
                          <Link to={`/${language}/product/${product.id}`} className="block group/product">
                            <Card className="h-full bg-os-surface-solid border border-os-stroke hover:border-os-accent hover:shadow-xl transition-all duration-500 rounded-[24px] overflow-hidden flex flex-col relative">
                              {/* Verification Badge */}
                              <div className="absolute top-4 left-4 z-10">
                                <div className="flex items-center gap-1.5 bg-os-surface-solid/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-os-stroke shadow-sm">
                                  <ShieldCheck className="w-3.5 h-3.5 text-os-accent" />
                                  <span className="text-[9px] font-bold tracking-[0.12em] text-os-text-primary uppercase">Verified</span>
                                </div>
                              </div>

                              <div className="aspect-[4/5] bg-os-bg relative overflow-hidden">
                                {primaryImage?.url ? (
                                  <OptimizedImage
                                    src={primaryImage.url}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover/product:scale-105 transition-transform duration-[1.5s]"
                                    width={400}
                                    height={500}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center opacity-20">
                                    <Package className="w-16 h-16 text-os-text-primary" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover/product:opacity-100 transition-opacity duration-500" />
                              </div>

                              <CardContent className="p-6 flex flex-col flex-1 relative bg-os-surface-solid">
                                <div className="flex items-center gap-2 mb-4">
                                  {countryFlag && <span className="text-xl grayscale group-hover/product:grayscale-0 transition-all">{countryFlag}</span>}
                                  <span className="text-[10px] font-bold text-os-text-secondary uppercase tracking-widest">{product.country_of_origin}</span>
                                </div>
                                <h5 className="font-semibold text-os-text-primary text-16 md:text-18 mb-4 tracking-tight leading-tight group-hover/product:text-os-accent transition-colors">
                                  {product.name}
                                </h5>
                                <div className="mt-auto pt-4 border-t border-os-stroke flex items-center justify-between">
                                  <div>
                                    <Price
                                      amount={product.price_min}
                                      fromCurrency={product.currency || 'USD'}
                                      className="text-18 font-bold text-os-text-primary tracking-tight"
                                    />
                                    <p className="text-[9px] font-bold text-os-text-secondary/80 uppercase tracking-widest mt-1">Best Market Rate</p>
                                  </div>
                                  <div className="w-9 h-9 rounded-full border border-os-stroke flex items-center justify-center group-hover/product:bg-os-accent group-hover/product:text-[#1A1512] transition-all duration-500">
                                    <ArrowRight className="w-4 h-4" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-os-surface-solid border border-os-stroke rounded-[32px] p-12 md:p-20 text-center relative overflow-hidden group/concierge shadow-premium">
                    <div className="absolute inset-0 bg-os-accent/5 opacity-0 group-hover/concierge:opacity-100 transition-opacity duration-700" />
                    <div className="max-w-2xl mx-auto relative z-10">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-os-accent/10 rounded-full mb-8">
                        <span className="w-1.5 h-1.5 rounded-full bg-os-accent animate-pulse" />
                        <span className="text-[10px] font-bold text-os-accent uppercase tracking-[0.2em]">Institutional Sourcing</span>
                      </div>
                      <h5 className="text-24 md:text-32 font-bold text-os-text-primary mb-6 tracking-tight">Bespoke Concierge Matching</h5>
                      <p className="text-16 md:text-18 text-os-text-secondary font-medium mb-12 leading-relaxed">
                        Our sourcing team is currently vetting manufacturers in the <span className="text-os-text-primary font-bold">{category.name}</span> sector.
                        Request automated matching to be connected within 24–48 hours.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to={`/${language}/dashboard/rfqs/new`}>
                          <Button className="bg-os-accent hover:bg-os-accent/90 text-[#1A1512] h-14 px-10 rounded-xl font-bold uppercase tracking-[0.1em] shadow-lg flex items-center gap-3">
                            Initiate Trade Request
                            <ArrowRight className="w-5 h-5" />
                          </Button>
                        </Link>
                        <div className="flex flex-col items-start px-4 text-left border-l border-os-stroke h-14 justify-center">
                          <span className="text-[10px] uppercase tracking-widest text-os-text-secondary font-black">Trade SLA</span>
                          <span className="text-[11px] font-bold text-os-text-primary">24h Response Guaranteed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .italic-display { font-family: inherit; font-style: italic; }
      `}</style>
    </section>
  );
}
