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
  Building2
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

export default function MobileCategoryGrid() {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    navigate(`/marketplace?category=${encodeURIComponent(category.name)}`);
  };

  return (
    <section className="md:hidden py-4 bg-afrikoni-offwhite">
      <div className="max-w-[1440px] mx-auto px-4">
        <h2 className="text-lg font-bold text-afrikoni-chestnut mb-3">Browse Categories</h2>
        {/* 2x4 Dense Grid */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2">
          {B2B_CATEGORIES.map((category, index) => {
            const Icon = category.icon;
            
            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleCategoryClick(category)}
                className={`
                  flex flex-col items-center justify-center gap-1
                  p-2.5 rounded-lg
                  border border-afrikoni-gold/15
                  ${category.bgColor}
                  hover:border-afrikoni-gold/30 hover:shadow-sm
                  active:scale-95 transition-all duration-200
                  touch-manipulation
                  min-h-[70px]
                `}
              >
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
