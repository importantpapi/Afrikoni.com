/**
 * Sticky Search Bar Component
 * Always visible search bar that sticks to top on scroll
 * Inspired by Alibaba, adapted for Afrikoni
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Sparkles } from 'lucide-react';
import SearchSuggestions from '@/components/search/SearchSuggestions';
import { addSearchToHistory } from '@/components/search/SearchHistory';

// Rotating placeholder examples (African B2B focused)
const PLACEHOLDER_EXAMPLES = [
  'Cashew nuts supplier in Benin',
  'Textile manufacturer Morocco',
  'Cocoa beans from Ghana',
  'Coffee exporter Kenya',
  'Shea butter supplier Nigeria',
  'Cotton fabric Tanzania',
  'Palm oil producer Côte d\'Ivoire',
  'Spices exporter Ethiopia'
];

// AI-powered Quick Actions based on popular African trade trends
const AI_QUICK_ACTIONS = [
  { label: 'Shea Butter Bulk', search: 'shea butter bulk supplier' },
  { label: 'Solar Components', search: 'solar panel components' },
  { label: 'Cashew Nuts', search: 'cashew nuts exporter' },
  { label: 'Cocoa Beans', search: 'cocoa beans bulk' },
];

export default function StickySearchBar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(PLACEHOLDER_EXAMPLES[0]);
  const [isSticky, setIsSticky] = useState(false);
  const [selectedFilterChip, setSelectedFilterChip] = useState(null);
  const searchContainerRef = useRef(null);
  const placeholderIntervalRef = useRef(null);

  // Rotate placeholder examples
  useEffect(() => {
    let index = 0;
    placeholderIntervalRef.current = setInterval(() => {
      index = (index + 1) % PLACEHOLDER_EXAMPLES.length;
      setCurrentPlaceholder(PLACEHOLDER_EXAMPLES[index]);
    }, 4000); // Change every 4 seconds

    return () => {
      if (placeholderIntervalRef.current) {
        clearInterval(placeholderIntervalRef.current);
      }
    };
  }, []);

  // Handle scroll to make search bar sticky
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsSticky(scrollY > 100); // Become sticky after 100px scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      addSearchToHistory(searchQuery.trim());
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion);
    handleSearch();
  };

  const handleFilterChipClick = (chipValue) => {
    const newValue = chipValue === selectedFilterChip ? '' : chipValue;
    setSelectedFilterChip(newValue === '' ? null : chipValue);
    setSearchQuery(newValue);
    if (newValue) {
      setShowSuggestions(true);
    }
  };

  return (
    <div
      className={`
        md:hidden w-full transition-all duration-300 z-40
        ${isSticky 
          ? 'fixed top-[80px] left-0 right-0 bg-white/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-b border-os-accent/20 py-3 px-4' 
          : 'relative bg-white/80 backdrop-blur-md border-b border-os-accent/20 py-3 px-4'
        }
      `}
    >
      <div className="max-w-[1440px] mx-auto">
        <div ref={searchContainerRef} className="relative">
          {/* Search Bar - Enhanced with clear white input box */}
          <div
            className={`
              flex items-center gap-2
              bg-white rounded-os-sm
              shadow-sm border-2
              px-3 md:px-4 py-2.5 md:py-3
              transition-all duration-200 ease-out
              focus-within:shadow-[0_0_0_3px_rgba(217,156,85,0.15)] focus-within:border-os-accent/50 focus-within:scale-[1.01]
              ${searchFocused ? 'shadow-[0_0_0_3px_rgba(217,156,85,0.15)] border-os-accent/50 scale-[1.01]' : 'border-os-accent/20'}
            `}
          >
            <Search className="w-4 h-4 md:w-5 md:h-5 text-os-accent/60 flex-shrink-0" />
            
            <input
              type="text"
              placeholder={currentPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  handleSearch();
                }
              }}
              onFocus={() => {
                setSearchFocused(true);
                setShowSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => {
                  setSearchFocused(false);
                }, 200);
              }}
              className="flex-1 text-os-sm md:text-os-base px-2 py-1 focus:outline-none placeholder:text-afrikoni-deep/50 text-afrikoni-chestnut bg-transparent min-h-[44px]"
            />

            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                className="p-1 rounded-full hover:bg-os-accent/10 text-afrikoni-deep/50 hover:text-afrikoni-chestnut transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Search button */}
            <button
              onClick={handleSearch}
              className="p-2 rounded-full bg-os-accent text-afrikoni-chestnut hover:bg-os-accent/90 active:scale-95 transition-all touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* AI-Powered Quick Actions Overlay - Shows when search bar is focused */}
          <AnimatePresence>
            {searchFocused && !searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-os-sm shadow-os-md border border-os-accent/20 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-os-accent" />
                  <span className="text-os-xs font-semibold text-afrikoni-chestnut">AI-Suggested Quick Actions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AI_QUICK_ACTIONS.map((action, index) => (
                    <motion.button
                      key={action.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSearchQuery(action.search);
                        handleSearch();
                      }}
                      className="px-3 py-1.5 bg-os-accent/10 hover:bg-os-accent/20 border border-os-accent/30 rounded-lg text-os-xs font-medium text-afrikoni-chestnut transition-all active:scale-95 touch-manipulation"
                    >
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (searchFocused || searchQuery) && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 z-50"
              >
                <SearchSuggestions
                  query={searchQuery}
                  onSelectSuggestion={handleSelectSuggestion}
                  showHistory={!searchQuery}
                  showTrending={!searchQuery}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter Chips - Premium Pill Filters Under Search Bar */}
          <div className="mt-3 pb-1 overflow-x-auto scrollbar-hide -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            <div className="flex gap-2">
              {['Coffee', 'Cotton', 'Palm Oil', 'Logistics', 'Packaging'].map((chip) => {
                const isSelected = selectedFilterChip === chip;
                return (
                  <motion.button
                    key={chip}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleFilterChipClick(chip)}
                    className={`
                      px-4 py-2 rounded-full text-os-sm font-medium
                      transition-all duration-200 touch-manipulation
                      whitespace-nowrap flex-shrink-0
                      ${isSelected 
                        ? 'bg-gradient-to-r from-[#E6B85C] via-[#D4A23A] to-[#B88A2E] text-white shadow-md border-0' 
                        : 'bg-afrikoni-cream/80 border border-os-accent/30 text-afrikoni-chestnut hover:bg-os-accent/10 hover:border-os-accent/50'
                      }
                    `}
                  >
                    {chip}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


