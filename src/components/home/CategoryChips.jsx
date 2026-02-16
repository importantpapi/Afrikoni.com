/**
 * Category Chips Component
 * Horizontal scrollable category navigation
 * Inspired by Alibaba, adapted for Afrikoni
 */

import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sprout, 
  Package, 
  Shirt, 
  HardHat, 
  Zap, 
  Factory,
  Boxes,
  Truck,
  Building
} from 'lucide-react';

// B2B Categories with icons
const B2B_CATEGORIES = [
  { id: 'agriculture', name: 'Agriculture', icon: Sprout, color: 'text-green-600' },
  { id: 'food-beverage', name: 'Food & Beverage', icon: Package, color: 'text-orange-600' },
  { id: 'textiles', name: 'Textiles', icon: Shirt, color: 'text-pink-600' },
  { id: 'construction', name: 'Construction', icon: HardHat, color: 'text-blue-600' },
  { id: 'energy', name: 'Energy', icon: Zap, color: 'text-yellow-600' },
  { id: 'manufacturing', name: 'Manufacturing', icon: Factory, color: 'text-gray-600' },
  { id: 'packaging', name: 'Packaging', icon: Boxes, color: 'text-purple-600' },
  { id: 'logistics', name: 'Logistics', icon: Truck, color: 'text-indigo-600' },
  { id: 'raw-materials', name: 'Raw Materials', icon: Building, color: 'text-amber-600' },
];

export default function CategoryChips() {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position
  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 200;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category.id);
    // Navigate to marketplace with category filter
    navigate(`/marketplace?category=${encodeURIComponent(category.name)}`);
  };

  return (
    <div className="relative w-full">
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-md border border-os-accent/20 hover:bg-white transition-colors"
          aria-label="Scroll left"
        >
          <span className="text-afrikoni-chestnut">‹</span>
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-2 py-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {B2B_CATEGORIES.map((category, index) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.id;
          
          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => handleCategoryClick(category)}
              className={`
                flex flex-col items-center gap-1 min-w-[80px] max-w-[80px] px-3 py-2 rounded-lg
                transition-all duration-200 touch-manipulation
                ${isActive 
                  ? 'bg-os-accent/20 border-2 border-os-accent shadow-sm' 
                  : 'bg-white/60 border border-afrikoni-chestnut/10 hover:bg-white/80 active:scale-95'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-os-accent' : category.color}`} />
              <span className={`
                text-os-xs font-medium text-center leading-tight
                ${isActive ? 'text-afrikoni-chestnut font-semibold' : 'text-afrikoni-chestnut/80'}
              `}>
                {category.name.split(' ')[0]}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm rounded-full p-2 shadow-md border border-os-accent/20 hover:bg-white transition-colors"
          aria-label="Scroll right"
        >
          <span className="text-afrikoni-chestnut">›</span>
        </button>
      )}
    </div>
  );
}


