import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Package, ChevronLeft, ChevronRight, Sprout, Shirt, HardHat, Heart, Home, Smartphone, Coffee, Gem } from 'lucide-react';

// Researched popular African export categories
const popularCategories = [
  {
    name: 'Agriculture & Food',
    description: 'Fresh produce, grains, cocoa, coffee, cashew nuts, and processed foods from across Africa.',
    productCount: '5,847',
    subCategories: ['Cocoa & Coffee', 'Grains & Cereals', 'Fresh Produce', 'Cashew Nuts', '+6 more'],
    icon: Sprout,
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&auto=format&fit=crop'
  },
  {
    name: 'Textiles & Apparel',
    description: 'African print fabrics (Ankara, Kitenge), traditional garments, modern streetwear, and accessories.',
    productCount: '3,023',
    subCategories: ['African Print Fabrics', 'Traditional Garments', 'Modern Streetwear', '+3 more'],
    icon: Shirt,
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&auto=format&fit=crop'
  },
  {
    name: 'Beauty & Personal Care',
    description: 'Natural skincare products, shea butter, black soap, cosmetics for melanin-rich skin tones.',
    productCount: '2,856',
    subCategories: ['Shea Butter & Black Soap', 'Natural Skincare', 'African Cosmetics', '+4 more'],
    icon: Heart,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop'
  },
  {
    name: 'Industrial & Construction',
    description: 'Building materials, machinery, tools, construction equipment, and infrastructure supplies.',
    productCount: '2,534',
    subCategories: ['Building Materials', 'Construction Equipment', 'Machinery & Tools', '+4 more'],
    icon: HardHat,
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop'
  },
  {
    name: 'Home & Living',
    description: 'Locally crafted furniture, home décor, traditional art, and handwoven textiles for modern living.',
    productCount: '1,987',
    subCategories: ['African Furniture', 'Home Décor', 'Traditional Art', '+3 more'],
    icon: Home,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&auto=format&fit=crop'
  },
  {
    name: 'Consumer Electronics',
    description: 'Affordable smartphones, laptops, accessories, power banks, and communication devices.',
    productCount: '1,756',
    subCategories: ['Smartphones & Tablets', 'Laptops & Computers', 'Accessories', '+2 more'],
    icon: Smartphone,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop'
  },
  {
    name: 'Health & Wellness',
    description: 'Traditional medicine, health supplements, natural remedies, and wellness products.',
    productCount: '1,432',
    subCategories: ['Traditional Medicine', 'Health Supplements', 'Natural Remedies', '+2 more'],
    icon: Coffee,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop'
  },
  {
    name: 'Minerals & Gemstones',
    description: 'Precious stones, gemstones, minerals, and natural resources from African mines.',
    productCount: '987',
    subCategories: ['Diamonds & Gemstones', 'Precious Metals', 'Industrial Minerals', '+2 more'],
    icon: Gem,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&auto=format&fit=crop'
  }
];

export default function PopularCategories({ categories = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef(null);

  // Calculate how many items to show per view
  const itemsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 4
  };

  const maxIndex = Math.max(0, popularCategories.length - itemsPerView.desktop);

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  // Touch/swipe support for mobile
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentIndex < popularCategories.length - 1) {
      handleNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrev();
    }
  };

  // Get visible categories based on current index
  const getVisibleCategories = () => {
    return popularCategories.slice(currentIndex, currentIndex + itemsPerView.desktop);
  };

  return (
    <div className="py-12 md:py-16 bg-afrikoni-offwhite">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-12 gap-4"
        >
          <div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-afrikoni-chestnut mb-2">
              Popular African Categories
            </h2>
            <p className="text-sm md:text-base text-afrikoni-deep/70">
              Discover products from Africa's most sought-after categories
            </p>
          </div>
          <Link 
            to={createPageUrl('Categories')} 
            className="text-afrikoni-gold hover:text-afrikoni-goldLight font-semibold flex items-center gap-1 text-sm md:text-base transition-colors whitespace-nowrap"
          >
            View All Categories
            <Package className="w-4 h-4" />
          </Link>
        </motion.div>
        
        {/* Desktop Grid - Shows all 8 categories in 2 rows */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-4 md:gap-6">
            {popularCategories.map((category, idx) => {
              const Icon = category.icon;
              return (
                <div key={idx} className="w-full">
                    <Link to={`/marketplace?category=${encodeURIComponent(category.name.toLowerCase())}`}>
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all hover:shadow-afrikoni-lg overflow-hidden h-full bg-afrikoni-cream">
                          <div className="h-48 bg-gradient-to-br from-afrikoni-cream to-afrikoni-offwhite relative overflow-hidden">
                            {category.image && (
                              <img 
                                src={category.image} 
                                alt={category.name}
                                className="w-full h-full object-cover opacity-90"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="absolute top-4 left-4 w-12 h-12 bg-afrikoni-gold rounded-lg flex items-center justify-center shadow-afrikoni-lg">
                              <Icon className="w-6 h-6 text-afrikoni-chestnut" />
                            </div>
                          </div>
                          <CardContent className="p-5 md:p-6">
                            <h3 className="font-bold text-afrikoni-chestnut mb-2 text-base md:text-lg line-clamp-1">
                              {category.name}
                            </h3>
                            <p className="text-sm text-afrikoni-deep mb-4 line-clamp-2 min-h-[2.5rem]">
                              {category.description}
                            </p>
                            <div className="text-sm font-semibold text-afrikoni-gold mb-2">
                              {category.productCount} products available
                            </div>
                            <div className="text-xs text-afrikoni-deep/70 line-clamp-2">
                              {category.subCategories.slice(0, 2).join(', ')}
                              {category.subCategories.length > 2 && `, ${category.subCategories[2]}`}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Tablet Carousel - Shows 2 at a time */}
        <div className="hidden md:block lg:hidden relative">
          <div className="overflow-hidden rounded-lg">
            <motion.div
              className="flex"
              animate={{ x: `-${currentIndex * 50}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ width: `${Math.ceil(popularCategories.length / 2) * 200}%` }}
            >
              {popularCategories.map((category, idx) => {
                const Icon = category.icon;
                return (
                  <div key={idx} className="flex-shrink-0 w-1/2 px-2">
                    <Link to={`/marketplace?category=${encodeURIComponent(category.name.toLowerCase())}`}>
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all hover:shadow-afrikoni-lg overflow-hidden h-full bg-afrikoni-cream">
                          <div className="h-40 bg-gradient-to-br from-afrikoni-cream to-afrikoni-offwhite relative overflow-hidden">
                            {category.image && (
                              <img 
                                src={category.image} 
                                alt={category.name}
                                className="w-full h-full object-cover opacity-90"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="absolute top-3 left-3 w-10 h-10 bg-afrikoni-gold rounded-lg flex items-center justify-center shadow-afrikoni-lg">
                              <Icon className="w-5 h-5 text-afrikoni-chestnut" />
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-bold text-afrikoni-chestnut mb-2 text-base line-clamp-1">
                              {category.name}
                            </h3>
                            <p className="text-sm text-afrikoni-deep mb-3 line-clamp-2 min-h-[2.5rem]">
                              {category.description}
                            </p>
                            <div className="text-sm font-semibold text-afrikoni-gold mb-2">
                              {category.productCount} products
                            </div>
                            <div className="text-xs text-afrikoni-deep/70 line-clamp-1">
                              {category.subCategories[0]}, {category.subCategories[1]}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>
                  </div>
                );
              })}
            </motion.div>
          </div>
          
          {/* Tablet Navigation */}
          {currentIndex > 0 && (
            <motion.button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-afrikoni-cream border-2 border-afrikoni-gold/30 rounded-full p-2 shadow-afrikoni-lg hover:bg-afrikoni-offwhite z-10"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-afrikoni-gold" />
            </motion.button>
          )}
          {currentIndex < popularCategories.length - 2 && (
            <motion.button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-afrikoni-cream border-2 border-afrikoni-gold/30 rounded-full p-2 shadow-afrikoni-lg hover:bg-afrikoni-offwhite z-10"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-afrikoni-gold" />
            </motion.button>
          )}

          {/* Tablet Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: Math.ceil(popularCategories.length / 2) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx * 2)}
                className={`h-2 rounded-full transition-all ${
                  Math.floor(currentIndex / 2) === idx 
                    ? 'bg-afrikoni-gold w-6' 
                    : 'bg-afrikoni-gold/30 w-2'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Mobile Carousel - Shows 1 at a time */}
        <div 
          className="md:hidden relative"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ height: 'auto' }}
        >
          <div className="overflow-hidden rounded-lg" style={{ height: 'auto' }}>
            <motion.div 
              ref={scrollContainerRef}
              className="flex"
              animate={{ x: `-${currentIndex * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ 
                width: `${popularCategories.length * 100}%`,
                height: 'auto'
              }}
            >
              {popularCategories.map((category, idx) => {
                const Icon = category.icon;
                return (
                  <div 
                    key={idx} 
                    className="flex-shrink-0 flex justify-center"
                    style={{ 
                      width: `${100 / popularCategories.length}%`,
                      height: 'auto'
                    }}
                  >
                    <Link 
                      to={`/marketplace?category=${encodeURIComponent(category.name.toLowerCase())}`}
                      className="block"
                    >
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                        className="category-card"
                        style={{
                          width: '120px',
                          minWidth: '120px',
                          maxWidth: '120px',
                          height: 'auto',
                          aspectRatio: '4 / 5',
                          borderRadius: '16px',
                          flexShrink: 0
                        }}
                      >
                        <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all hover:shadow-afrikoni-lg overflow-hidden bg-afrikoni-cream h-full flex flex-col">
                          <div 
                            className="bg-gradient-to-br from-afrikoni-cream to-afrikoni-offwhite relative overflow-hidden"
                            style={{
                              width: '100%',
                              height: '110px',
                              borderRadius: '16px 16px 0 0'
                            }}
                          >
                            {category.image && (
                              <img 
                                src={category.image} 
                                alt={category.name}
                                style={{
                                  width: '100%',
                                  height: '110px',
                                  objectFit: 'cover',
                                  borderRadius: '16px 16px 0 0'
                                }}
                                loading="lazy"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="absolute top-2 left-2 w-8 h-8 bg-afrikoni-gold rounded-lg flex items-center justify-center shadow-afrikoni-lg">
                              <Icon className="w-4 h-4 text-afrikoni-chestnut" />
                            </div>
                          </div>
                          <CardContent 
                            className="category-card-content flex-1 flex flex-col justify-center"
                            style={{
                              padding: '6px',
                              textAlign: 'center'
                            }}
                          >
                            <h3 
                              className="font-bold text-afrikoni-chestnut mb-1"
                              style={{
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: '1.2'
                              }}
                            >
                              {category.name}
                            </h3>
                            <div 
                              className="text-afrikoni-gold font-semibold"
                              style={{
                                fontSize: '10px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {category.productCount}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>
                  </div>
                );
              })}
            </motion.div>
          </div>
          
          {/* Mobile Navigation */}
          <AnimatePresence>
            {currentIndex > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-afrikoni-cream border-2 border-afrikoni-gold/30 rounded-full p-2 shadow-afrikoni-lg z-10"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5 text-afrikoni-gold" />
              </motion.button>
            )}
            {currentIndex < popularCategories.length - 1 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-afrikoni-cream border-2 border-afrikoni-gold/30 rounded-full p-2 shadow-afrikoni-lg z-10"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5 text-afrikoni-gold" />
              </motion.button>
            )}
          </AnimatePresence>
          
          {/* Mobile Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4 pagination-bullet-container">
            {popularCategories.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className="pagination-bullet rounded-full transition-all"
                style={{
                  width: idx === currentIndex ? '24px' : '8px',
                  height: '8px',
                  backgroundColor: idx === currentIndex ? '#D4A937' : 'rgba(212, 169, 55, 0.3)'
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
