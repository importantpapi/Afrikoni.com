import React, { useState, useRef, useEffect } from 'react';
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
  // ALWAYS use popularCategories for homepage - they have rich data, images, and proper descriptions
  // Database categories are used elsewhere but not for this curated homepage section
  const displayCategories = popularCategories;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef(null);
  const carouselTrackRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const realCategoryCount = displayCategories.length;

  // Infinite loop: Clone slides for seamless looping
  const CLONE_COUNT = 3;
  const clonedCategories = [
    ...displayCategories.slice(-CLONE_COUNT), // Clones at start
    ...displayCategories, // Original categories
    ...displayCategories.slice(0, CLONE_COUNT) // Clones at end
  ];

  // Calculate card width - larger for better visibility, centered
  const getCardWidth = () => {
    if (typeof window === 'undefined') return '140px';
    const vw = window.innerWidth;
    // Use 70% of viewport width minus padding for one card to be fully visible
    const availableWidth = vw - 64; // 32px padding on each side
    const cardWidth = Math.min(160, Math.max(140, availableWidth * 0.7));
    return `${cardWidth}px`;
  };

  const [cardWidth, setCardWidth] = useState(getCardWidth());

  useEffect(() => {
    const updateCardWidth = () => {
      setCardWidth(getCardWidth());
    };
    window.addEventListener('resize', updateCardWidth);
    return () => window.removeEventListener('resize', updateCardWidth);
  }, []);

  // Initialize scroll position to first real category
  useEffect(() => {
    if (carouselTrackRef.current && realCategoryCount > 0) {
      const cardWidthNum = parseFloat(cardWidth);
      const gap = 16;
      const padding = (window.innerWidth - cardWidthNum) / 2;
      const startPosition = CLONE_COUNT * (cardWidthNum + gap) + padding - (window.innerWidth - cardWidthNum) / 2;
      carouselTrackRef.current.scrollLeft = startPosition;
      setCurrentIndex(0);
    }
  }, [cardWidth, realCategoryCount]);

  // Handle infinite loop scroll
  useEffect(() => {
    const track = carouselTrackRef.current;
    if (!track) return;

    const handleScroll = () => {
      if (isScrolling) return;
      
      const cardWidthNum = parseFloat(cardWidth);
      const gap = 16;
      const cardWithGap = cardWidthNum + gap;
      const scrollLeft = track.scrollLeft;
      const currentCardIndex = Math.round(scrollLeft / cardWithGap);

      // If at cloned end (last 3), jump to real start
      if (currentCardIndex >= realCategoryCount + CLONE_COUNT) {
        setIsScrolling(true);
        track.scrollLeft = CLONE_COUNT * cardWithGap;
        setCurrentIndex(0);
        setTimeout(() => setIsScrolling(false), 50);
        return;
      }

      // If at cloned start (first 3), jump to real end
      if (currentCardIndex < CLONE_COUNT) {
        setIsScrolling(true);
        track.scrollLeft = (realCategoryCount + CLONE_COUNT - 1) * cardWithGap;
        setCurrentIndex(realCategoryCount - 1);
        setTimeout(() => setIsScrolling(false), 50);
        return;
      }

      // Update current index for real categories
      const realIndex = currentCardIndex - CLONE_COUNT;
      if (realIndex >= 0 && realIndex < realCategoryCount) {
        setCurrentIndex(realIndex);
      }
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    
    // Add mouse wheel support for infinite scroll
    const handleWheel = (e) => {
      if (isScrolling) return;
      e.preventDefault();
      const delta = e.deltaY || e.deltaX;
      const cardWidthNum = parseFloat(cardWidth);
      const gap = 16;
      const cardWithGap = cardWidthNum + gap;
      const currentScroll = track.scrollLeft;
      const newScroll = currentScroll + (delta > 0 ? cardWithGap : -cardWithGap);
      
      track.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    };
    
    track.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      track.removeEventListener('scroll', handleScroll);
      track.removeEventListener('wheel', handleWheel);
    };
  }, [cardWidth, realCategoryCount, isScrolling]);

  const handlePrev = () => {
    const track = carouselTrackRef.current;
    if (!track) return;
    
    const cardWidthNum = parseFloat(cardWidth);
    const gap = 16;
    const cardWithGap = cardWidthNum + gap;
    const currentScroll = track.scrollLeft;
    const newScroll = currentScroll - cardWithGap;
    
    track.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
  };

  const handleNext = () => {
    const track = carouselTrackRef.current;
    if (!track) return;
    
    const cardWidthNum = parseFloat(cardWidth);
    const gap = 16;
    const cardWithGap = cardWidthNum + gap;
    const currentScroll = track.scrollLeft;
    const newScroll = currentScroll + cardWithGap;
    
    track.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
  };

  const goToSlide = (index) => {
    const track = carouselTrackRef.current;
    if (!track) return;
    
    const cardWidthNum = parseFloat(cardWidth);
    const gap = 16;
    const padding = (window.innerWidth - cardWidthNum) / 2;
    const cardWithGap = cardWidthNum + gap;
    const targetScroll = (CLONE_COUNT + index) * cardWithGap + padding - (window.innerWidth - cardWidthNum) / 2;
    
    track.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
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
        
        {/* Desktop Grid - Shows all categories in 2 rows */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-4 md:gap-6">
            {displayCategories.map((category, idx) => {
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
                              Products available
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
              style={{ width: `${Math.ceil(displayCategories.length / 2) * 200}%` }}
            >
              {displayCategories.map((category, idx) => {
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
                              Products available
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
          {currentIndex < displayCategories.length - 2 && (
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
            {Array.from({ length: Math.ceil(displayCategories.length / 2) }).map((_, idx) => (
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

        {/* Mobile Carousel - Infinite Loop with Native Scroll */}
        <div className="md:hidden relative" style={{ height: 'auto', paddingBottom: '12px' }}>
          {/* Carousel Track with Native Scroll */}
          <div 
            ref={carouselTrackRef}
            className="carousel-track"
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              paddingLeft: `calc((100vw - ${cardWidth}) / 2)`,
              paddingRight: `calc((100vw - ${cardWidth}) / 2)`,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {clonedCategories.map((category, idx) => {
              const Icon = category.icon || Package;
              const categoryName = category.name || 'Category';
              // Product counts removed - showing "Products available" instead
              const categoryImage = category.image || null;
              
              // Ensure we have the image URL
              const imageUrl = categoryImage || (category.image_url || null);
              
              return (
                <div
                  key={`category-${idx}`}
                  className="category-card"
                  style={{
                    flex: `0 0 ${cardWidth}`,
                    scrollSnapAlign: 'center',
                    height: 'auto',
                    aspectRatio: '4 / 5',
                    borderRadius: '16px',
                    flexShrink: 0
                  }}
                >
                  <Link 
                    to={`/marketplace?category=${encodeURIComponent(categoryName.toLowerCase())}`}
                    className="block h-full"
                  >
                    <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all hover:shadow-afrikoni-lg overflow-hidden bg-afrikoni-cream h-full flex flex-col">
                      <div 
                        className="relative overflow-hidden"
                        style={{
                          width: '100%',
                          height: '110px',
                          borderRadius: '16px 16px 0 0',
                          flexShrink: 0,
                          backgroundColor: '#F3E5C7'
                        }}
                      >
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={categoryName}
                            style={{
                              width: '100%',
                              height: '110px',
                              objectFit: 'cover',
                              borderRadius: '16px 16px 0 0',
                              display: 'block',
                              position: 'relative',
                              zIndex: 1,
                              minHeight: '110px'
                            }}
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.opacity = '0';
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div 
                            className="bg-gradient-to-br from-afrikoni-cream to-afrikoni-offwhite"
                            style={{
                              width: '100%',
                              height: '110px',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              zIndex: 0
                            }}
                          />
                        )}
                        <div 
                          className="absolute top-2 left-2 w-8 h-8 bg-afrikoni-gold rounded-lg flex items-center justify-center shadow-afrikoni-lg z-10"
                          style={{ zIndex: 10 }}
                        >
                          <Icon className="w-4 h-4 text-afrikoni-chestnut" />
                        </div>
                      </div>
                      <CardContent 
                        className="category-card-content flex-1 flex flex-col justify-center"
                        style={{
                          padding: '8px 6px',
                          textAlign: 'center'
                        }}
                      >
                        <h3 
                          className="font-bold text-afrikoni-chestnut mb-1"
                          style={{
                            fontSize: '13px',
                            lineHeight: '1.3',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto'
                          }}
                        >
                          {categoryName}
                        </h3>
                        <div 
                          className="text-afrikoni-gold font-semibold"
                          style={{
                            fontSize: '11px',
                            lineHeight: '1.2'
                          }}
                        >
                          Products available
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Hide scrollbar */}
          <style>{`
            .carousel-track::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {/* Mobile Navigation Arrows - Always visible for infinite loop */}
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-afrikoni-cream border-2 border-afrikoni-gold/30 rounded-full p-2 shadow-afrikoni-lg z-20 hover:bg-afrikoni-offwhite transition-colors"
            aria-label="Previous"
            style={{ zIndex: 20 }}
          >
            <ChevronLeft className="w-5 h-5 text-afrikoni-gold" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-afrikoni-cream border-2 border-afrikoni-gold/30 rounded-full p-2 shadow-afrikoni-lg z-20 hover:bg-afrikoni-offwhite transition-colors"
            aria-label="Next"
            style={{ zIndex: 20 }}
          >
            <ChevronRight className="w-5 h-5 text-afrikoni-gold" />
          </button>
          
          {/* Mobile Dots Indicator - Only for REAL categories */}
          <div className="flex justify-center gap-2 mt-4 pagination-bullet-container">
            {displayCategories.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => goToSlide(idx)}
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
