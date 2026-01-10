/**
 * Sticky Search Bar Component
 * Always visible search bar that sticks to top on scroll
 * Inspired by Alibaba, adapted for Afrikoni
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
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

export default function StickySearchBar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(PLACEHOLDER_EXAMPLES[0]);
  const [isSticky, setIsSticky] = useState(false);
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

  return (
    <div
      className={`
        md:hidden w-full transition-all duration-300 z-50
        ${isSticky 
          ? 'fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-md border-b border-afrikoni-gold/20 py-2 px-4' 
          : 'relative'
        }
      `}
    >
      <div className="max-w-[1440px] mx-auto">
        <div ref={searchContainerRef} className="relative">
          {/* Search Bar */}
          <div
            className={`
              flex items-center gap-2
              bg-white rounded-full
              shadow-sm border border-afrikoni-gold/15
              px-3 md:px-4 py-2.5 md:py-3
              transition-all duration-200
              focus-within:shadow-md focus-within:border-afrikoni-gold/30
              ${searchFocused ? 'shadow-md border-afrikoni-gold/30' : ''}
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

          {/* Search Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (searchFocused || searchQuery) && (
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
        </div>
      </div>
    </div>
  );
}


