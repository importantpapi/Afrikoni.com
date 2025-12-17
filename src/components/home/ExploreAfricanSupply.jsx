import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sprout, Shirt, HardHat, Heart, Home, Smartphone } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useCurrency } from '@/contexts/CurrencyContext';
import Price from '@/components/ui/Price';
import { matchProductToPopularCategory } from '@/utils/productCategoryIntelligence';

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
  { name: 'Agriculture & Food', icon: Sprout, key: 'agriculture', keywords: ['agriculture', 'food', 'cocoa', 'coffee', 'grain', 'produce'] },
  { name: 'Textiles & Apparel', icon: Shirt, key: 'textiles', keywords: ['textile', 'fabric', 'apparel', 'clothing', 'garment'] },
  { name: 'Beauty & Personal Care', icon: Heart, key: 'beauty', keywords: ['beauty', 'cosmetic', 'skincare', 'shea', 'soap'] },
  { name: 'Industrial & Construction', icon: HardHat, key: 'industrial', keywords: ['industrial', 'construction', 'machinery', 'equipment', 'building'] },
  { name: 'Home & Living', icon: Home, key: 'home', keywords: ['home', 'furniture', 'decor', 'living', 'household'] },
  { name: 'Consumer Electronics', icon: Smartphone, key: 'electronics', keywords: ['electronics', 'phone', 'mobile', 'smartphone', 'device'] }
];

export default function ExploreAfricanSupply() {
  const { currency, formatPrice } = useCurrency();
  const [countryScrollPosition, setCountryScrollPosition] = useState(0);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});
  const [hasMore, setHasMore] = useState({});
  const [page, setPage] = useState({});
  const countryScrollRef = useRef(null);
  const observerRefs = useRef({});

  // Load products for each category with pagination
  const loadCategoryProducts = useCallback(async (categoryKey, pageNum = 0, append = false) => {
    const category = popularCategories.find(c => c.key === categoryKey);
    if (!category) return;

    try {
      setLoadingProducts(prev => ({ ...prev, [categoryKey]: true }));
      
      const limit = 12;
      const offset = pageNum * limit;

      // Build two queries: one for category match, one for keyword match
      // Then combine and deduplicate results
      
      // Query 1: Products with matching category name in database
      const { data: categoryProducts } = await supabase
        .from('products')
        .select('id, title, price_min, price_max, currency, moq, country_of_origin, product_images(url, is_primary), categories!inner(name)')
        .eq('status', 'active')
        .ilike('categories.name', `%${category.name}%`)
        .order('created_at', { ascending: false })
        .limit(limit * 2);

      // Query 2: Products with keywords in title (using OR for multiple keywords)
      const keywordFilters = category.keywords.map(keyword => `title.ilike.%${keyword}%`);
      
      let keywordQuery = supabase
        .from('products')
        .select('id, title, price_min, price_max, currency, moq, country_of_origin, product_images(url, is_primary), categories(name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit * 2);

      if (keywordFilters.length > 0) {
        keywordQuery = keywordQuery.or(keywordFilters.join(','));
      }

      const { data: keywordProducts } = await keywordQuery;

      // Combine results and remove duplicates
      const allProducts = [...(categoryProducts || []), ...(keywordProducts || [])];
      const productMap = new Map();
      allProducts.forEach(p => {
        if (!productMap.has(p.id)) {
          productMap.set(p.id, p);
        }
      });
      
      // Get unique products and apply pagination
      const uniqueProducts = Array.from(productMap.values());
      const products = uniqueProducts.slice(offset, offset + limit);
      const error = null;

      if (!error && products) {
        setCategoryProducts(prev => ({
          ...prev,
          [categoryKey]: append ? [...(prev[categoryKey] || []), ...products] : products
        }));
        setHasMore(prev => ({ ...prev, [categoryKey]: products.length === limit }));
        setPage(prev => ({ ...prev, [categoryKey]: pageNum }));
      }
    } catch (error) {
      console.error(`Error loading products for ${category.name}:`, error);
    } finally {
      setLoadingProducts(prev => ({ ...prev, [categoryKey]: false }));
    }
  }, []);

  // Initial load
  useEffect(() => {
    popularCategories.forEach(category => {
      loadCategoryProducts(category.key, 0, false);
    });
  }, [loadCategoryProducts]);

  // Infinite scroll observer setup
  useEffect(() => {
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

      return () => observer.disconnect();
    });
  }, [hasMore, loadingProducts, page, loadCategoryProducts]);

  const scrollCountries = (direction) => {
    if (!countryScrollRef.current) return;
    const scrollAmount = 200;
    const newPosition = countryScrollPosition + (direction === 'right' ? scrollAmount : -scrollAmount);
    setCountryScrollPosition(Math.max(0, Math.min(newPosition, countryScrollRef.current.scrollWidth - countryScrollRef.current.clientWidth)));
    countryScrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
  };

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-afrikoni-offwhite">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-afrikoni-chestnut mb-4">
            Explore African Supply
          </h2>
          <p className="text-lg md:text-xl text-afrikoni-deep/80 max-w-3xl mx-auto mb-8">
            Browse verified products by category and country, or fast‑track sourcing with a protected RFQ when you need suppliers to come to you.
          </p>
        </motion.div>

        {/* Source by Country - Slider with all 54 countries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12 md:mb-16"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut flex items-center gap-2">
              <MapPin className="w-5 h-5 md:w-6 md:h-6 text-afrikoni-gold" />
              Source by Country
            </h3>
            <Link to="/countries">
              <Button variant="outline" size="sm" className="border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10">
                View All Countries
              </Button>
            </Link>
          </div>
          
          {/* Country Slider */}
          <div className="relative">
            <div
              ref={countryScrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-4"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {ALL_AFRICAN_COUNTRIES.map((country, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.01 }}
                  whileHover={{ y: -4, scale: 1.05 }}
                  className="flex-shrink-0"
                >
                  <Link to={`/marketplace?country=${country.code}`}>
                    <Card className="w-32 md:w-36 h-auto min-h-[100px] md:min-h-[110px] hover:shadow-afrikoni-lg transition-all cursor-pointer border-afrikoni-gold/20 hover:border-afrikoni-gold/40 bg-afrikoni-offwhite flex items-center justify-center">
                      <CardContent className="p-3 text-center">
                        <div className="text-3xl md:text-4xl mb-2">{country.flag}</div>
                        <h4 className="font-bold text-afrikoni-chestnut text-xs md:text-sm leading-tight whitespace-normal break-words">
                          {country.name}
                        </h4>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {/* Scroll Buttons - Perfectly centered relative to card height */}
            <button
              onClick={() => scrollCountries('left')}
              className="absolute left-2 top-[50px] md:top-[55px] -translate-y-1/2 bg-afrikoni-cream border-2 border-afrikoni-gold/30 rounded-full w-10 h-10 shadow-afrikoni-lg hover:bg-afrikoni-offwhite z-10 hidden md:flex items-center justify-center transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-afrikoni-gold" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => scrollCountries('right')}
              className="absolute right-2 top-[50px] md:top-[55px] -translate-y-1/2 bg-afrikoni-cream border-2 border-afrikoni-gold/30 rounded-full w-10 h-10 shadow-afrikoni-lg hover:bg-afrikoni-offwhite z-10 hidden md:flex items-center justify-center transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-afrikoni-gold" strokeWidth={2.5} />
            </button>
          </div>
          
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </motion.div>

        {/* Popular Categories with Infinite Vertical Scrolling Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-afrikoni-chestnut flex items-center gap-2">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-afrikoni-gold" />
              Popular Categories
            </h3>
          </div>

          <div className="space-y-12">
            {popularCategories.map((category, categoryIdx) => {
              const Icon = category.icon;
              const products = categoryProducts[category.key] || [];
              const isLoading = loadingProducts[category.key];

              return (
                <div key={category.key} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between">
                    <Link 
                      to={`/marketplace?category=${encodeURIComponent(category.name.toLowerCase())}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 bg-afrikoni-gold rounded-lg flex items-center justify-center shadow-afrikoni-lg group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-afrikoni-chestnut" />
                      </div>
                      <h4 className="text-lg md:text-xl font-bold text-afrikoni-chestnut group-hover:text-afrikoni-gold transition-colors">
                        {category.name}
                      </h4>
                      <ArrowRight className="w-5 h-5 text-afrikoni-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>

                  {/* Products Grid with Infinite Scroll */}
                  {isLoading && products.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-64 bg-afrikoni-cream/50 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : products.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map((product, productIdx) => {
                          const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
                          return (
                            <motion.div
                              key={product.id || productIdx}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: (productIdx % 8) * 0.05 }}
                              whileHover={{ y: -4, scale: 1.02 }}
                            >
                              <Link to={`/product/${product.id}`}>
                                <Card className="h-full hover:shadow-afrikoni-lg transition-all cursor-pointer border-afrikoni-gold/30 hover:border-afrikoni-gold/60 bg-[#FFF6E1] overflow-hidden rounded-xl">
                                  <div className="h-40 md:h-48 bg-gradient-to-br from-afrikoni-cream to-afrikoni-offwhite relative overflow-hidden">
                                    {primaryImage?.url ? (
                                      <img
                                        src={primaryImage.url}
                                        alt={product.title || 'Product'}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-afrikoni-gold/10 to-afrikoni-chestnut/10" />
                                    )}
                                  </div>
                                  <CardContent className="p-3 space-y-1.5">
                                    <h5 className="font-semibold text-afrikoni-chestnut text-base md:text-lg leading-snug line-clamp-2">
                                      {product.title}
                                    </h5>
                                    {product.price_min ? (
                                      <div className="text-sm md:text-base text-afrikoni-gold font-bold">
                                        {product.price_max && product.price_max !== product.price_min ? (
                                          <>
                                            <Price 
                                              amount={product.price_min} 
                                              fromCurrency={product.currency || 'USD'}
                                              className="inline"
                                            />
                                            {' - '}
                                            <Price 
                                              amount={product.price_max} 
                                              fromCurrency={product.currency || 'USD'}
                                              className="inline"
                                            />
                                          </>
                                        ) : (
                                          <Price 
                                            amount={product.price_min} 
                                            fromCurrency={product.currency || 'USD'}
                                          />
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-xs md:text-sm text-afrikoni-deep/60 italic">
                                        Price on request
                                      </p>
                                    )}
                                    <div className="flex items-center justify-between pt-1">
                                      {product.moq && (
                                        <p className="text-[11px] md:text-xs text-afrikoni-deep/70">
                                          MOQ: {product.moq}
                                        </p>
                                      )}
                                      {product.country_of_origin && (
                                        <div className="flex items-center gap-1 text-[11px] md:text-xs text-afrikoni-deep/80">
                                          <MapPin className="w-3 h-3 text-afrikoni-deep/70" />
                                          <span>
                                            {(() => {
                                              const city =
                                                product?.city ||
                                                product?.companies?.city ||
                                                product?.companies?.town ||
                                                '';
                                              const country = product.country_of_origin;
                                              if (city && country) return `${city}, ${country}`;
                                              return country;
                                            })()}
                                          </span>
                                          <span>
                                            {getFlagForCountryName(product.country_of_origin)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                      
                      {/* Infinite Scroll Trigger */}
                      {hasMore[category.key] && (
                        <div 
                          ref={(el) => { observerRefs.current[category.key] = el; }}
                          className="h-20 flex items-center justify-center"
                        >
                          {isLoading && (
                            <div className="flex gap-2">
                              <div className="w-2 h-2 bg-afrikoni-gold rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                              <div className="w-2 h-2 bg-afrikoni-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                              <div className="w-2 h-2 bg-afrikoni-gold rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : !isLoading ? (
                    <div className="text-center py-8 text-afrikoni-deep/60">
                      <p>No products found in this category yet.</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
