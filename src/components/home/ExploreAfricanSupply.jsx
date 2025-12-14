import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sprout, Shirt, HardHat, Heart, Home, Smartphone, Coffee, Gem } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

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

// Popular categories with icons
const popularCategories = [
  { name: 'Agriculture & Food', icon: Sprout, key: 'agriculture' },
  { name: 'Textiles & Apparel', icon: Shirt, key: 'textiles' },
  { name: 'Beauty & Personal Care', icon: Heart, key: 'beauty' },
  { name: 'Industrial & Construction', icon: HardHat, key: 'industrial' },
  { name: 'Home & Living', icon: Home, key: 'home' },
  { name: 'Consumer Electronics', icon: Smartphone, key: 'electronics' }
];

export default function ExploreAfricanSupply() {
  const [countryScrollPosition, setCountryScrollPosition] = useState(0);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState({});
  const countryScrollRef = useRef(null);
  const categoryScrollRefs = useRef({});

  // Load products for each category
  useEffect(() => {
    const loadCategoryProducts = async () => {
      for (const category of popularCategories) {
        try {
          setLoadingProducts(prev => ({ ...prev, [category.key]: true }));
          
          // Search for products matching category name
          const { data: products, error } = await supabase
            .from('products')
            .select('id, title, price_min, price_max, currency, product_images(url, is_primary)')
            .eq('status', 'active')
            .ilike('title', `%${category.name.split(' ')[0]}%`)
            .limit(10);

          if (!error && products) {
            setCategoryProducts(prev => ({
              ...prev,
              [category.key]: products.slice(0, 6) // Show max 6 products per category
            }));
          }
        } catch (error) {
          console.error(`Error loading products for ${category.name}:`, error);
        } finally {
          setLoadingProducts(prev => ({ ...prev, [category.key]: false }));
        }
      }
    };

    loadCategoryProducts();
  }, []);

  const scrollCountries = (direction) => {
    if (!countryScrollRef.current) return;
    const scrollAmount = 200;
    const newPosition = countryScrollPosition + (direction === 'right' ? scrollAmount : -scrollAmount);
    setCountryScrollPosition(Math.max(0, Math.min(newPosition, countryScrollRef.current.scrollWidth - countryScrollRef.current.clientWidth)));
    countryScrollRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
  };

  const scrollCategory = (categoryKey, direction) => {
    const scrollRef = categoryScrollRefs.current[categoryKey];
    if (!scrollRef) return;
    const scrollAmount = 300;
    scrollRef.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
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
            Browse products by category and country — or post a trade request to source faster.
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
                    <Card className="w-24 md:w-28 h-24 md:h-28 hover:shadow-afrikoni-lg transition-all cursor-pointer border-afrikoni-gold/20 hover:border-afrikoni-gold/40 bg-afrikoni-offwhite flex items-center justify-center">
                      <CardContent className="p-2 text-center">
                        <div className="text-3xl md:text-4xl mb-1">{country.flag}</div>
                        <h4 className="font-bold text-afrikoni-chestnut text-xs md:text-sm line-clamp-2">
                          {country.name}
                        </h4>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
            
            {/* Scroll Buttons */}
            <button
              onClick={() => scrollCountries('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-afrikoni-cream border-2 border-afrikoni-gold/30 rounded-full p-2 shadow-afrikoni-lg hover:bg-afrikoni-offwhite z-10 hidden md:flex items-center justify-center"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-afrikoni-gold" />
            </button>
            <button
              onClick={() => scrollCountries('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-afrikoni-cream border-2 border-afrikoni-gold/30 rounded-full p-2 shadow-afrikoni-lg hover:bg-afrikoni-offwhite z-10 hidden md:flex items-center justify-center"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-afrikoni-gold" />
            </button>
          </div>
          
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </motion.div>

        {/* Popular Categories with Infinite Scrolling Products */}
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

          <div className="space-y-8">
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

                  {/* Products Scrollable Row */}
                  {isLoading ? (
                    <div className="flex gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-48 h-32 bg-afrikoni-cream/50 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : products.length > 0 ? (
                    <div className="relative">
                      <div
                        ref={(el) => { categoryScrollRefs.current[category.key] = el; }}
                        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                          WebkitOverflowScrolling: 'touch'
                        }}
                      >
                        {products.map((product, productIdx) => {
                          const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
                          return (
                            <motion.div
                              key={product.id || productIdx}
                              initial={{ opacity: 0, x: 20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.4, delay: productIdx * 0.1 }}
                              whileHover={{ y: -4, scale: 1.02 }}
                              className="flex-shrink-0"
                            >
                              <Link to={`/products/${product.id}`}>
                                <Card className="w-48 md:w-56 h-40 md:h-48 hover:shadow-afrikoni-lg transition-all cursor-pointer border-afrikoni-gold/20 hover:border-afrikoni-gold/40 bg-afrikoni-cream overflow-hidden">
                                  <div className="h-24 md:h-32 bg-gradient-to-br from-afrikoni-cream to-afrikoni-offwhite relative overflow-hidden">
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
                                    ) : null}
                                  </div>
                                  <CardContent className="p-3">
                                    <h5 className="font-semibold text-afrikoni-chestnut text-sm line-clamp-1 mb-1">
                                      {product.title}
                                    </h5>
                                    {product.price_min && (
                                      <p className="text-xs text-afrikoni-gold font-medium">
                                        From {product.currency || 'USD'} {product.price_min}
                                        {product.price_max && product.price_max !== product.price_min && ` - ${product.price_max}`}
                                      </p>
                                    )}
                                  </CardContent>
                                </Card>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                      
                      {/* Scroll Buttons for Category */}
                      {products.length > 3 && (
                        <>
                          <button
                            onClick={() => scrollCategory(category.key, 'left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 bg-afrikoni-cream border-2 border-afrikoni-gold/30 rounded-full p-2 shadow-afrikoni-lg hover:bg-afrikoni-offwhite z-10 hidden md:flex items-center justify-center"
                            aria-label={`Scroll ${category.name} left`}
                          >
                            <ChevronLeft className="w-4 h-4 text-afrikoni-gold" />
                          </button>
                          <button
                            onClick={() => scrollCategory(category.key, 'right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 bg-afrikoni-cream border-2 border-afrikoni-gold/30 rounded-full p-2 shadow-afrikoni-lg hover:bg-afrikoni-offwhite z-10 hidden md:flex items-center justify-center"
                            aria-label={`Scroll ${category.name} right`}
                          >
                            <ChevronRight className="w-4 h-4 text-afrikoni-gold" />
                          </button>
                        </>
                      )}
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
