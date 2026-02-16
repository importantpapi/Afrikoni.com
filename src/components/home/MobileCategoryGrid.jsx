/**
 * Mobile Category Grid Component (Bento Architecture)
 * 2x4 dense grid layout for mobile homepage
 * Compact Bento tile format to save vertical space
 */

import React from 'react';
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
  Building,
  TrendingUp
} from 'lucide-react';

// B2B Categories with icons (8 categories for 2x4 grid)
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

// Trending data constant - defined at top of file to ensure scope
const trendingData = {
  'Agriculture': { growth: '+12%' },
  'Food': { growth: '+8%' },
  'Textiles': { growth: '+15%' },
  'Energy': { growth: '+22%' },
  'Food & Beverage': { growth: '+8%' }, // Alias for full name
  'Construction': { growth: '' },
  'Manufacturing': { growth: '' },
  'Packaging': { growth: '' },
  'Logistics': { growth: '' },
};

export default function MobileCategoryGrid() {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    navigate(`/marketplace?category=${encodeURIComponent(category.name)}`);
  };

  return (
    <section className="block lg:hidden py-4 bg-afrikoni-offwhite">
      <div className="max-w-[1440px] mx-auto px-4">
        <h2 className="text-lg font-bold text-afrikoni-chestnut mb-3">Browse Categories</h2>
        {/* 2x4 Dense Grid - Professional B2B Layout */}
        <div className="grid grid-cols-2 gap-3">
          {B2B_CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            // Safe mapping: Get trend data with fallback to prevent crashes
            const trend = trendingData[category.name] || { growth: '' };
            
            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleCategoryClick(category)}
                className={`
                  relative flex flex-col items-center justify-center gap-1
                  p-2.5 rounded-lg
                  border border-afrikoni-gold/15
                  ${category.bgColor}
                  hover:border-afrikoni-gold/30 hover:shadow-sm
                  active:scale-95 transition-all duration-200
                  touch-manipulation
                  min-h-[70px]
                `}
              >
                {/* Trending Badge - Only show if growth exists */}
                {trend.growth && (
                  <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm z-10">
                    <TrendingUp className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-bold">{trend.growth}</span>
                  </div>
                )}
                
                <Icon className={`w-5 h-5 ${category.color}`} />
                <span className="text-[10px] font-medium text-afrikoni-chestnut text-center leading-tight line-clamp-2">
                  {category.name.split(' ')[0]}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
