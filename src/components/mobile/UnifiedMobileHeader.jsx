/**
 * UNIFIED MOBILE HEADER
 * Apple iOS + Hermès Luxury Standard
 * 
 * Single cohesive header that includes:
 * - Logo
 * - Search bar
 * - Profile/Language actions
 * - Category chips
 * 
 * NO overlap bugs. Proper z-index stacking.
 * Collapses gracefully on scroll (Apple-style).
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Globe,
  User,
  Menu,
  ChevronDown
} from 'lucide-react';
import { Logo } from '@/components/shared/ui/Logo';
import SearchSuggestions from '@/components/search/SearchSuggestions';
import { addSearchToHistory } from '@/components/search/SearchHistory';
import { useAuth } from '@/contexts/AuthProvider';
import { cn } from '@/lib/utils';

// Popular categories for quick access
const QUICK_CATEGORIES = [
  { id: 'agriculture', label: 'Agriculture', emoji: '🌾' },
  { id: 'textiles', label: 'Textiles', emoji: '👔' },
  { id: 'food', label: 'Food', emoji: '🍫' },
  { id: 'beauty', label: 'Beauty', emoji: '✨' },
  { id: 'manufacturing', label: 'Manufacturing', emoji: '⚙️' },
];

// Rotating search placeholders
const SEARCH_PLACEHOLDERS = [
  'Cashew nuts from Benin',
  'Cocoa beans from Ghana',
  'Shea butter supplier',
  'Cotton fabric from Mali',
  'Coffee beans from Ethiopia',
];

export default function UnifiedMobileHeader({
  user,
  transparent = false,
  title = undefined,
  onBack = undefined,
  showClose = false,
  onClose = undefined
}) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(SEARCH_PLACEHOLDERS[0]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const searchRef = useRef(null);

  const isWizardMode = !!title || !!onBack || showClose;

  // Scroll detection for collapse behavior
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      const scrollY = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Collapsed state after 60px scroll
          setIsScrolled(scrollY > 60);
          lastScrollY = scrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Rotate placeholder text
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % SEARCH_PLACEHOLDERS.length;
      setCurrentPlaceholder(SEARCH_PLACEHOLDERS[index]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSearchFocused(false);
      }
    };
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      addSearchToHistory(searchQuery.trim());
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSuggestions(false);
      setSearchFocused(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion);
    handleSearch();
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    navigate(`/marketplace?category=${categoryId}`);
  };

  // Header height calculation
  const headerHeight = isScrolled ? 64 : 140; // Collapsed vs expanded

  return (
    <>
      {/* Fixed Header Container - Architectural & Stable */}
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-[100]",
          "transition-all duration-500 ease-out overflow-hidden",
          transparent && !isScrolled ? "bg-white/80 backdrop-blur-md" : "bg-white backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        )}
        style={{ height: `${headerHeight}px` }}
        animate={{ height: headerHeight }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Top Bar: Home + Actions */}
          <div className="flex items-center justify-between px-4 py-2">
            {/* Left Action: Back or Logo */}
            {onBack ? (
              <button
                onClick={onBack}
                className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:scale-90 transition-all touch-manipulation"
                aria-label="Go back"
              >
                <ChevronDown className="w-6 h-6 text-afrikoni-deep rotate-90" />
              </button>
            ) : (
              <Link
                to="/"
                className="flex-shrink-0 touch-manipulation active:scale-95 transition-transform"
                aria-label="Home"
              >
                <Logo type="icon" size="sm" link={false} />
              </Link>
            )}

            {/* Center: Title (Wizard Mode) */}
            {title && (
              <div className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-afrikoni-deep truncate max-w-[60%]">
                {title}
              </div>
            )}

            {/* Right Actions: Close or Profile/Language */}
            <div className="flex items-center gap-2">
              {showClose ? (
                <button
                  onClick={onClose || (() => navigate(-1))}
                  className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center bg-afrikoni-ivory/50 active:scale-90 transition-all touch-manipulation"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-afrikoni-deep" />
                </button>
              ) : (
                <>
                  {/* Language/Region */}
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-os-accent/10 active:scale-95 transition-all touch-manipulation"
                    aria-label="Language settings"
                  >
                    <Globe className="w-5 h-5 text-afrikoni-deep/70" />
                  </button>

                  {/* Profile */}
                  <Link
                    to={user ? '/dashboard' : '/login'}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-os-accent/10 active:scale-95 transition-all touch-manipulation"
                    aria-label={user ? 'Profile' : 'Login'}
                  >
                    {user ? (
                      <div className="w-10 h-10 rounded-full bg-os-accent/20 flex items-center justify-center text-sm font-semibold text-os-accent">
                        {user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    ) : (
                      <User className="w-5 h-5 text-afrikoni-deep/70" />
                    )}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Search Bar (Collapses on scroll) - Hidden in Wizard Mode */}
          <AnimatePresence>
            {!isScrolled && !isWizardMode && (
              <motion.div
                initial={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-4"
              >
                <div ref={searchRef} className="relative">
                  {/* Main Search Input */}
                  <div
                    className={cn(
                      "flex items-center gap-3 bg-white rounded-2xl px-4 py-3",
                      "border-2 transition-all duration-200 ease-out",
                      "shadow-sm",
                      searchFocused
                        ? "border-os-accent/40 shadow-[0_0_0_4px_rgba(217,156,85,0.12)] scale-[1.01]"
                        : "border-os-accent/20"
                    )}
                  >
                    <Search className="w-5 h-5 text-os-accent/60 flex-shrink-0" />

                    <input
                      type="text"
                      placeholder={currentPlaceholder}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => {
                        setSearchFocused(true);
                        setShowSuggestions(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch();
                        if (e.key === 'Escape') {
                          setSearchFocused(false);
                          setShowSuggestions(false);
                        }
                      }}
                      className="flex-1 text-base text-afrikoni-deep placeholder:text-afrikoni-deep/40 focus:outline-none bg-transparent"
                      style={{ fontSize: '16px' }} // Prevents iOS zoom
                    />

                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setShowSuggestions(false);
                        }}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-os-accent/10 hover:bg-os-accent/20 active:scale-90 transition-all"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4 text-os-accent" />
                      </button>
                    )}
                  </div>

                  {/* Search Suggestions Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && searchQuery && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-os-accent/10 overflow-hidden z-50"
                      >
                        <SearchSuggestions
                          query={searchQuery}
                          onSelect={handleSelectSuggestion}
                          maxResults={5}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Chips (Hidden when collapsed or in Wizard Mode) */}
          <AnimatePresence>
            {!isScrolled && !isWizardMode && (
              <motion.div
                initial={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-3 overflow-x-auto scrollbar-hide"
              >
                <div className="flex gap-2">
                  {QUICK_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className={cn(
                        "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium",
                        "transition-all duration-200 ease-out",
                        "border-2 touch-manipulation active:scale-95",
                        selectedCategory === category.id
                          ? "bg-os-accent/15 border-os-accent/40 text-os-accent"
                          : "bg-white border-os-accent/20 text-afrikoni-deep/70 hover:border-os-accent/30"
                      )}
                    >
                      <span className="mr-1.5">{category.emoji}</span>
                      {category.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed Search (Shows when scrolled) - Hidden in Wizard Mode */}
          <AnimatePresence>
            {isScrolled && !isWizardMode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-2 flex-1 flex items-center"
              >
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center gap-3 bg-afrikoni-ivory/50 rounded-full px-4 py-2 hover:bg-afrikoni-ivory active:scale-98 transition-all touch-manipulation"
                >
                  <Search className="w-4 h-4 text-os-accent/60 flex-shrink-0" />
                  <span className="text-sm text-afrikoni-deep/50">Search products...</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Spacer to prevent content overlap */}
      <div style={{ height: `${headerHeight}px` }} className="flex-shrink-0" />
    </>
  );
}
