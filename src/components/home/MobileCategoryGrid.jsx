/**
 * Mobile Category Grid Component
 * Elite institutional design - precision filters, not friendly tags
 * Hermès restraint: minimal gold, maximum calm
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// B2B Categories - precision hierarchy (show 5, expand to see rest)
const B2B_CATEGORIES = [
  { id: 'agriculture', name: 'Agricultural Products' },
  { id: 'food-beverage', name: 'Food & Beverages' },
  { id: 'textiles', name: 'Textiles & Fashion' },
  { id: 'minerals', name: 'Minerals & Mining' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'machinery', name: 'Machinery & Equipment' },
  { id: 'manufacturing', name: 'Manufacturing' },
  { id: 'packaging', name: 'Packaging' }
];

export default function MobileCategoryGrid() {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const handleCategoryClick = (category) => {
    navigate(`/marketplace?category=${encodeURIComponent(category.name)}`);
  };

  // Show 5 initially, expand to show all
  const displayedCategories = showAll ? B2B_CATEGORIES : B2B_CATEGORIES.slice(0, 5);

  return (
    <section className="block lg:hidden py-8 bg-os-bg">
      <div className="max-w-[1440px] mx-auto px-4">
        <h2 className="text-[14px] font-medium text-gray-500 uppercase tracking-wider mb-5">Categories</h2>

        {/* Elite precision filters - compact, calm hierarchy */}
        <div className="space-y-1.5">
          {displayedCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="
                w-full flex items-center justify-between
                px-3.5 py-3
                bg-white
                border border-gray-100
                rounded-[8px]
                hover:bg-gray-50
                active:bg-gray-100
                transition-all duration-150
                touch-manipulation
              "
            >
              <span className="text-[14px] font-normal text-gray-900">
                {category.name}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            </button>
          ))}
        </div>

        {/* Expand/collapse - subtle control */}
        {!showAll && B2B_CATEGORIES.length > 5 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full mt-2 text-[12px] font-normal text-gray-400 hover:text-gray-600 transition-colors py-2"
          >
            Show {B2B_CATEGORIES.length - 5} more
          </button>
        )}
      </div>
    </section>
  );
}
