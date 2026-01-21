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
        md:hidden w-full transition-all duration-300 z-50
        ${isSticky 
          ? 'fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-lg border-b border-afrikoni-gold/30 py-3 px-4' 
          : 'relative bg-white/80 backdrop-blur-md border-b border-afrikoni-gold/20 py-3 px-4'
        }
      `}
    >
      <div className="max-w-[1440px] mx-auto">
        <div ref={searchContainerRef} className="relative">
          {/* Search Bar - Enhanced with clear white input box */}
          <div
            className={`
              flex items-center gap-2
              bg-white rounded-xl
              shadow-md border-2 border-afrikoni-gold/20
              px-3 md:px-4 py-2.5 md:py-3
              transition-all duration-200
              focus-within:shadow-lg focus-within:border-afrikoni-gold/40
              ${searchFocused ? 'shadow-lg border-afrikoni-gold/40' : ''}
            `}
          >
            <Search className="w-4 h-4 md:w-5 md:h-5 text-afrikoni-gold/60 flex-shrink-0" />
            
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
              className="flex-1 text-sm md:text-base px-2 py-1 focus:outline-none placeholder:text-afrikoni-deep/50 text-afrikoni-chestnut bg-transparent min-h-[44px]"
            />

            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                className="p-1 rounded-full hover:bg-afrikoni-gold/10 text-afrikoni-deep/50 hover:text-afrikoni-chestnut transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Search button */}
            <button
              onClick={handleSearch}
              className="p-2 rounded-full bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/90 active:scale-95 transition-all touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl shadow-lg border border-afrikoni-gold/20 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-afrikoni-gold" />
                  <span className="text-xs font-semibold text-afrikoni-chestnut">AI-Suggested Quick Actions</span>
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
                      className="px-3 py-1.5 bg-afrikoni-gold/10 hover:bg-afrikoni-gold/20 border border-afrikoni-gold/30 rounded-lg text-xs font-medium text-afrikoni-chestnut transition-all active:scale-95 touch-manipulation"
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
                      px-4 py-2 rounded-full text-sm font-medium
                      transition-all duration-200 touch-manipulation
                      whitespace-nowrap flex-shrink-0
                      ${isSelected 
                        ? 'bg-gradient-to-r from-[#E6B85C] via-[#D4A23A] to-[#B88A2E] text-white shadow-md border-0' 
                        : 'bg-afrikoni-cream/80 border border-afrikoni-gold/30 text-afrikoni-chestnut hover:bg-afrikoni-gold/10 hover:border-afrikoni-gold/50'
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


