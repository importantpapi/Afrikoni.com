import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sprout, Shirt, HardHat, Heart, Package, ChevronLeft, ChevronRight } from 'lucide-react';

const categoryIcons = {
  'Agriculture': Sprout,
  'Food': Sprout,
  'Textiles': Shirt,
  'Apparel': Shirt,
  'Industrial': HardHat,
  'Construction': HardHat,
  'Beauty': Heart,
  'Health': Heart,
  'Wellness': Heart
};

export default function PopularCategories({ categories = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef(null);

  const popularCategories = [
    {
      name: 'Agriculture & Food',
      description: 'Fresh produce, grains, processed foods, and agricultural products.',
      productCount: '5,847',
      subCategories: ['Grains & Cereals', 'Fresh Produce', '+6 more'],
      icon: Sprout,
      color: 'bg-green-600',
      image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400'
    },
    {
      name: 'Textiles & Apparel',
      description: 'African print fabrics, garments, footwear, and accessories.',
      productCount: '3,023',
      subCategories: ['African Print Fabrics', 'Finished Garments', '+3 more'],
      icon: Shirt,
      color: 'bg-purple-600',
      image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400'
    },
    {
      name: 'Industrial & Construction',
      description: 'Building materials, machinery, tools, and construction equipment.',
      productCount: '2,534',
      subCategories: ['Building Materials', 'Construction Equipment', '+4 more'],
      icon: HardHat,
      color: 'bg-afrikoni-gold',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400'
    },
    {
      name: 'Beauty, Health & Wellness',
      description: 'Natural skincare, traditional medicine, and health products.',
      productCount: '1,987',
      subCategories: ['Natural Skincare Products', 'Shea Butter & Black Soap', '+3 more'],
      icon: Heart,
      color: 'bg-pink-600',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400'
    }
  ];

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < popularCategories.length - 4) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Touch/swipe support
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
    if (isLeftSwipe && currentIndex < popularCategories.length - 4) {
      handleNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrev();
    }
  };

  return (
    <div className="py-12 md:py-16 bg-afrikoni-offwhite">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8 md:mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-afrikoni-chestnut">Popular African Categories</h2>
          <Link to={createPageUrl('Categories')} className="text-afrikoni-gold hover:text-afrikoni-goldLight font-semibold flex items-center gap-1 text-sm md:text-base transition-colors">
            View All Categories
            <Package className="w-4 h-4" />
          </Link>
        </motion.div>
        
        {/* Desktop Grid with Carousel */}
        <div className="hidden md:block relative">
          <div className="flex gap-4 md:gap-6 overflow-hidden">
            <AnimatePresence mode="wait">
              {popularCategories.map((category, idx) => {
                const Icon = category.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="flex-shrink-0 w-full md:w-1/4"
                  >
                    <Link to={createPageUrl('Products') + '?category=' + encodeURIComponent(category.name.toLowerCase())}>
                      <motion.div
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all hover:shadow-afrikoni-lg overflow-hidden h-full">
                          <div className="h-48 bg-gradient-to-br from-afrikoni-cream to-afrikoni-offwhite relative overflow-hidden">
                            {category.image && (
                              <img 
                                src={category.image} 
                                alt={category.name}
                                className="w-full h-full object-cover opacity-80"
                                loading="lazy"
                              />
                            )}
                            <div className="absolute top-4 left-4 w-12 h-12 bg-afrikoni-gold rounded-lg flex items-center justify-center shadow-afrikoni">
                              <Icon className="w-6 h-6 text-afrikoni-chestnut" />
                            </div>
                          </div>
                          <CardContent className="p-5 md:p-6">
                            <h3 className="font-bold text-afrikoni-chestnut mb-2 text-base md:text-lg">{category.name}</h3>
                            <p className="text-sm text-afrikoni-deep mb-4 line-clamp-2">{category.description}</p>
                            <div className="text-sm font-semibold text-afrikoni-gold mb-2">
                              {category.productCount} products available
                            </div>
                            <div className="text-xs text-afrikoni-deep/70">
                              {category.subCategories.join(', ')}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {/* Navigation Arrows */}
          {currentIndex > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-afrikoni-cream border border-afrikoni-gold/30 rounded-full p-2 shadow-afrikoni hover:shadow-afrikoni-lg z-10"
            >
              <ChevronLeft className="w-5 h-5 text-afrikoni-gold" />
            </motion.button>
          )}
          {currentIndex < popularCategories.length - 4 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-afrikoni-cream border border-afrikoni-gold/30 rounded-full p-2 shadow-afrikoni hover:shadow-afrikoni-lg z-10"
            >
              <ChevronRight className="w-5 h-5 text-afrikoni-gold" />
            </motion.button>
          )}
        </div>

        {/* Mobile Carousel */}
        <div 
          className="md:hidden relative"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="overflow-hidden">
            <motion.div 
              ref={scrollContainerRef}
              className="flex"
              animate={{ x: `-${currentIndex * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {popularCategories.map((category, idx) => {
                const Icon = category.icon;
                return (
                  <div key={idx} className="min-w-full px-2">
                    <Link to={createPageUrl('Products') + '?category=' + encodeURIComponent(category.name.toLowerCase())}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 transition-all hover:shadow-afrikoni-lg overflow-hidden">
                          <div className="h-48 bg-gradient-to-br from-afrikoni-cream to-afrikoni-offwhite relative overflow-hidden">
                            {category.image && (
                              <img 
                                src={category.image} 
                                alt={category.name}
                                className="w-full h-full object-cover opacity-80"
                                loading="lazy"
                              />
                            )}
                            <div className="absolute top-4 left-4 w-12 h-12 bg-afrikoni-gold rounded-lg flex items-center justify-center shadow-afrikoni">
                              <Icon className="w-6 h-6 text-afrikoni-chestnut" />
                            </div>
                          </div>
                          <CardContent className="p-5">
                            <h3 className="font-bold text-afrikoni-chestnut mb-2 text-base">{category.name}</h3>
                            <p className="text-sm text-afrikoni-deep mb-4 line-clamp-2">{category.description}</p>
                            <div className="text-sm font-semibold text-afrikoni-gold mb-2">
                              {category.productCount} products available
                            </div>
                            <div className="text-xs text-afrikoni-deep/70">
                              {category.subCategories.join(', ')}
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
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-afrikoni-cream border border-afrikoni-gold/30 hover:bg-afrikoni-offwhite rounded-full p-2 shadow-afrikoni z-10"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-afrikoni-cream border border-afrikoni-gold/30 hover:bg-afrikoni-offwhite rounded-full p-2 shadow-afrikoni z-10"
              >
                <ChevronRight className="w-5 h-5 text-afrikoni-gold" />
              </motion.button>
            )}
          </AnimatePresence>
          
          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {popularCategories.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-afrikoni-gold w-6' : 'bg-zinc-300 w-2'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
