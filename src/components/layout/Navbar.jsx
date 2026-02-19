import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  ChevronDown,
  ShoppingCart,
  LogOut,
  User,
  LayoutDashboard,
  MessageSquare,
  Package,
  FileText,
  Settings,
  GitCompare,
  MapPin,
  Check,
  Bookmark
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Logo } from '@/components/shared/ui/Logo';
import NotificationBell from '@/components/notificationbell';
import { createPageUrl } from '@/utils';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/api/supabaseClient';
import { openWhatsAppCommunity } from '@/utils/whatsappCommunity';
import { autoDetectUserPreferences, getCurrencyForCountry, getLanguageForCountry } from '@/utils/geoDetection';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getUserInitial } from '@/utils/userHelpers';
import { useAuth } from '@/contexts/AuthProvider';
import { useLanguage } from '@/i18n/LanguageContext';
import VerificationBadge from '@/components/shared/ui/VerificationBadge';
import { VerifyButton } from '@/components/verification/VerifyButton';

import { COUNTRY_NAMES, COUNTRY_FLAGS, ALL_COUNTRIES } from '@/utils/countries';

export default function Navbar({ user, onLogout }) {
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { currency: contextCurrency, setCurrency: setContextCurrency } = useCurrency();
  const [megaOpen, setMegaOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [selectedCurrency, setSelectedCurrency] = useState(contextCurrency || 'USD');
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [compareCount, setCompareCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [userRole, setUserRole] = useState(null);

  // Load compare count from localStorage
  useEffect(() => {
    const updateCompareCount = () => {
      try {
        const compareList = JSON.parse(localStorage.getItem('compareProducts') || '[]');
        setCompareCount(compareList.length);
      } catch {
        setCompareCount(0);
      }
    };

    updateCompareCount();
    // Listen for storage changes (when products are added/removed from comparison)
    window.addEventListener('storage', updateCompareCount);
    // Also listen for custom events
    window.addEventListener('compareUpdated', updateCompareCount);

    // Poll for changes (since localStorage events don't fire in same tab)
    const interval = setInterval(updateCompareCount, 1000);

    return () => {
      window.removeEventListener('storage', updateCompareCount);
      window.removeEventListener('compareUpdated', updateCompareCount);
      clearInterval(interval);
    };
  }, []);

  // Close Explore menu on route change
  useEffect(() => {
    setMegaOpen(false);
    setLanguageOpen(false);
    setCurrencyOpen(false);
    setSettingsOpen(false);
    setCountryOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // SAFETY: Never render Public Navbar on Dashboard routes
  // This prevents layout collision if the parent Layout fails to unmount it
  const isDashboardRoute = location.pathname.split('/').includes('dashboard');
  if (isDashboardRoute) {
    return null;
  }

  // Close Explore menu on scroll (mobile)
  useEffect(() => {
    const handleScroll = () => {
      if (megaOpen) {
        setMegaOpen(false);
      }
      // Add shadow when scrolled
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [megaOpen]);

  // Sync selectedCurrency with contextCurrency
  useEffect(() => {
    if (contextCurrency && contextCurrency !== selectedCurrency) {
      setSelectedCurrency(contextCurrency);
    }
  }, [contextCurrency]);

  // Auto-detect user's country, language, and currency on mount
  useEffect(() => {
    const detectPreferences = async () => {
      try {
        // Check if preferences are already saved in localStorage
        const savedCountry = localStorage.getItem('afrikoni_detected_country');
        const savedCurrency = localStorage.getItem('afrikoni_selected_currency') || contextCurrency || 'USD';
        const savedLanguage = localStorage.getItem('afrikoni_selected_language');

        if (savedCountry && savedCurrency && savedLanguage) {
          setDetectedCountry(savedCountry);
          setSelectedCurrency(savedCurrency);
          setContextCurrency(savedCurrency); // Sync with context
          if (savedLanguage && savedLanguage !== language) {
            i18n.changeLanguage(savedLanguage);
          }
        } else {
          // Auto-detect
          const preferences = await autoDetectUserPreferences();
          setDetectedCountry(preferences.countryCode);
          setSelectedCurrency(preferences.currency);
          setContextCurrency(preferences.currency); // Sync with context
          if (preferences.language && preferences.language !== language) {
            i18n.changeLanguage(preferences.language);
          }

          // Save to localStorage
          localStorage.setItem('afrikoni_detected_country', preferences.countryCode);
          localStorage.setItem('afrikoni_selected_currency', preferences.currency);
          localStorage.setItem('afrikoni_selected_language', preferences.language);
        }
      } catch (error) {
        console.warn('Failed to auto-detect preferences:', error);
        // Use defaults
        setDetectedCountry('DEFAULT');
        const defaultCurrency = contextCurrency || 'USD';
        setSelectedCurrency(defaultCurrency);
        setContextCurrency(defaultCurrency);
      }
    };

    detectPreferences();
  }, []);

  // Use centralized AuthProvider
  const { profile: authProfile, role: authRole } = useAuth();
  // ✅ KERNEL-TO-UI ALIGNMENT: Removed useCapability() - Navbar doesn't need capabilities
  // Navbar is rendered outside CapabilityProvider context (in public layout)
  // Capabilities are only needed inside dashboard routes

  // Load user profile to get company_id for profile link
  useEffect(() => {
    // Use auth from context if available
    if (authProfile) {
      setUserProfile(authProfile);
    }
    if (authRole) {
      setUserRole(authRole);
    }

    // Fallback to prop user if auth context not available
    if (!user?.id) {
      setUserRole(null);
      setUserProfile(null);
    }
  }, [user, authProfile, authRole]);

  // ✅ KERNEL ALIGNMENT: Define verification variables used in JSX
  const verificationStatus = authProfile?.verification_status || 'UNVERIFIED';
  const isVerified = verificationStatus === 'VERIFIED';

  // Load categories for mega dropdown
  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name')
          .limit(12); // Show top 12 categories in dropdown

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        // Fallback to empty array on error
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    // Only load when mega menu might be opened
    if (megaOpen || categories.length === 0) {
      loadCategories();
    }
  }, [megaOpen]);

  const languageMap = {
    en: 'EN',
    fr: 'FR',
    ar: 'AR',
    pt: 'PT'
  };

  const selectedLanguageCode = languageMap[language] || 'EN';

  const languages = [
    { code: 'en', display: 'EN', name: 'English', flag: '🇬🇧', label: 'English' },
    { code: 'fr', display: 'FR', name: 'Français', flag: '🇫🇷', label: 'Français (public pages)' },
    { code: 'ar', display: 'AR', name: 'العربية', flag: '🇸🇦', label: 'العربية (الصفحات العامة)' },
    { code: 'pt', display: 'PT', name: 'Português', flag: '🇵🇹', label: 'Português (páginas públicas)' }
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'USD' },
    { code: 'NGN', symbol: '₦', name: 'NGN' },
    { code: 'EUR', symbol: '€', name: 'EUR' },
    { code: 'ZAR', symbol: 'R', name: 'ZAR' }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const toggleMegaMenu = () => {
    setMegaOpen((prev) => !prev);
    setLanguageOpen(false);
    setCurrencyOpen(false);
    setSettingsOpen(false);
    setCountryOpen(false);
    setUserMenuOpen(false);
  };


  const openSettingsMenu = () => {
    setSettingsOpen(true);
    setMegaOpen(false);
    setLanguageOpen(false);
    setCurrencyOpen(false);
    setUserMenuOpen(false);
  };

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    setSettingsOpen(false);
  };

  const handleCurrencyChange = (currCode) => {
    setSelectedCurrency(currCode);
    setContextCurrency(currCode); // Update global currency context
    localStorage.setItem('afrikoni_selected_currency', currCode);
    setSettingsOpen(false);
  };

  const openCountryMenu = () => {
    setCountryOpen(true);
    setCountrySearchQuery(''); // Reset search when opening
    setMegaOpen(false);
    setLanguageOpen(false);
    setCurrencyOpen(false);
    setSettingsOpen(false);
    setUserMenuOpen(false);
  };

  const handleCountryChange = (countryCode) => {
    setDetectedCountry(countryCode);
    localStorage.setItem('afrikoni_detected_country', countryCode);

    // Auto-update currency based on country
    const newCurrency = getCurrencyForCountry(countryCode);
    setSelectedCurrency(newCurrency);
    setContextCurrency(newCurrency); // Update global currency context
    localStorage.setItem('afrikoni_selected_currency', newCurrency);

    // Auto-update language based on country (optional)
    const newLanguage = getLanguageForCountry(countryCode);
    if (newLanguage && newLanguage !== language) {
      i18n.changeLanguage(newLanguage);
    }

    setCountryOpen(false);
  };

  const openUserMenu = () => {
    setUserMenuOpen(true);
    setMegaOpen(false);
    setLanguageOpen(false);
    setCurrencyOpen(false);
    setSettingsOpen(false);
    setCountryOpen(false);
  };

  return (
    <nav className={`fixed top-0 start-0 end-0 w-full bg-[var(--os-surface)] backdrop-blur-xl text-os-text-primary border-b border-os-stroke z-[10000] transition-all duration-300 ${isScrolled ? 'shadow-premium' : 'shadow-none'} overflow-visible`} style={{ height: '72px' }}>
      {/* Top bar */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6 h-full overflow-visible">
        {/* Left: logo + explore + quick link */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 flex-shrink-0 min-w-0 flex-1">
          <div className="max-w-[120px] sm:max-w-[140px] lg:max-w-none flex-shrink-0">
            <Logo type="full" size="sm" link={true} showTagline={false} direction="horizontal" />
          </div>

          {/* Marketplace Link */}
          <Link to={`/${language}/marketplace`} className="hidden sm:flex items-center gap-1 text-os-xs sm:text-os-sm font-semibold text-os-text-primary/70 hover:text-os-accent transition-colors whitespace-nowrap uppercase tracking-widest">
            Marketplace
          </Link>

          {/* How It Works Link */}
          <Link to={`/${language}/how-it-works`} className="hidden sm:flex items-center gap-1 text-os-xs sm:text-os-sm font-semibold text-os-text-primary/70 hover:text-os-accent transition-colors whitespace-nowrap uppercase tracking-widest">
            How It Works
          </Link>

          {compareCount > 0 && (
            <Link to={`/${language}/compare`} className="relative hidden sm:block">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 sm:h-9 px-2 text-afrikoni-cream hover:text-os-accent hover:bg-os-accent/10"
              >
                <GitCompare className="w-4 h-4" />
                <span className="ml-1 hidden lg:inline">Compare</span>
                <span className="ml-1 bg-os-accent text-afrikoni-chestnut text-os-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {compareCount}
                </span>
              </Button>
            </Link>
          )}
        </div>

        {/* Right: country, language/currency, user */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 flex-shrink-0">
          {/* Deliver to Country Selector - Clickable */}
          <div className="relative hidden sm:block">
            <button
              onClick={openCountryMenu}
              className="flex items-center gap-1 px-2.5 py-2 rounded-full border border-os-stroke hover:border-os-accent text-os-xs font-semibold text-os-text-primary/80 transition-all"
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden lg:inline">
                {detectedCountry && detectedCountry !== 'DEFAULT' ? COUNTRY_NAMES[detectedCountry] : 'Select Country'}
              </span>
              <span className="lg:hidden">
                {detectedCountry && detectedCountry !== 'DEFAULT' ? COUNTRY_FLAGS[detectedCountry] || '🌍' : '🌍'}
              </span>
            </button>

            <AnimatePresence>
              {countryOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[60]"
                    onClick={() => setCountryOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute end-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-os-card rounded-lg shadow-2xl border-2 border-os-accent/30 z-[70] p-6 max-h-[600px] overflow-y-auto"
                  >
                    <h3 className="text-os-lg font-bold text-os-text-primary mb-2">Select Delivery Country</h3>
                    <p className="text-os-sm text-os-text-secondary/70 mb-4">
                      Shipping options and costs vary based on your location. Your currency will update automatically.
                    </p>

                    {/* Search input */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="Search country..."
                        value={countrySearchQuery}
                        onChange={(e) => setCountrySearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-os-surface-solid border border-os-stroke rounded-lg focus:outline-none focus:ring-2 focus:ring-os-accent text-os-sm text-os-text-primary"
                        id="country-search"
                        autoFocus
                      />
                    </div>

                    {/* Countries list */}
                    <div className="space-y-1 max-h-[400px] overflow-y-auto">
                      {ALL_COUNTRIES
                        .filter(country =>
                          country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                          country.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
                        )
                        .map((country) => (
                          <button
                            key={country.code}
                            onClick={() => handleCountryChange(country.code)}
                            className={`
                            w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3
                            ${detectedCountry === country.code
                                ? 'bg-os-accent/20 border-2 border-os-accent text-os-text-primary font-medium'
                                : 'bg-os-surface-0 hover:bg-os-accent/10 text-os-text-secondary border-2 border-transparent'
                              }
                          `}
                          >
                            <span className="text-os-xl flex-shrink-0">{country.flag}</span>
                            <div className="flex-1">
                              <div className="font-medium">{country.name}</div>
                              <div className="text-os-xs text-afrikoni-deep/60">{country.currency}</div>
                            </div>
                            {detectedCountry === country.code && (
                              <Check className="w-5 h-5 text-os-accent flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      {ALL_COUNTRIES.filter(country =>
                        country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                        country.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
                      ).length === 0 && (
                          <div className="text-center py-8 text-afrikoni-deep/60 text-os-sm">
                            No countries found matching "{countrySearchQuery}"
                          </div>
                        )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Combined Language & Currency Selector (Alibaba-style) */}
          <div className="relative">
            <button
              onClick={openSettingsMenu}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-md text-os-xs sm:text-os-sm font-medium text-os-text-primary/80 hover:text-os-accent hover:bg-os-accent/10 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden lg:inline whitespace-nowrap">
                {languages.find(l => l.code === language)?.display || 'EN'}-{selectedCurrency || 'USD'}
              </span>
              <span className="lg:hidden">
                {languages.find(l => l.code === language)?.display || 'EN'}
              </span>
              <ChevronDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 flex-shrink-0 ${settingsOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[60]"
                    onClick={() => setSettingsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute end-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-os-card rounded-lg shadow-2xl border-2 border-os-accent/30 z-[70] p-6 max-h-[80vh] overflow-y-auto"
                  >
                    <h3 className="text-os-lg font-bold text-os-text-primary mb-2">Set Language & Currency</h3>
                    <p className="text-os-sm text-os-text-secondary/70 mb-6">
                      Select your preferred language and currency. You can update the settings at any time.
                    </p>

                    {/* Language Section */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <label className="block text-os-sm font-semibold text-os-text-primary">Language</label>
                        <span
                          className="text-os-xs text-afrikoni-deep/60 cursor-help"
                          title="Public pages are translated. Dashboards and internal tools are currently available in English."
                        >
                          ℹ️
                        </span>
                      </div>
                      <div className="space-y-2">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`
                              w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3
                              ${language === lang.code
                                ? 'bg-os-accent/20 border-2 border-os-accent text-os-text-primary font-medium'
                                : 'bg-os-surface-0 hover:bg-os-accent/10 text-os-text-secondary border-2 border-transparent'
                              }
                            `}
                          >
                            <span className="text-os-xl flex-shrink-0">{lang.flag}</span>
                            <span className="flex-1">{lang.label || lang.name}</span>
                            {language === lang.code && (
                              <Check className="w-5 h-5 text-os-accent flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Currency Section */}
                    <div>
                      <label className="block text-os-sm font-semibold text-afrikoni-deep mb-3">Currency</label>
                      <div className="space-y-2">
                        {currencies.map((curr) => (
                          <button
                            key={curr.code}
                            onClick={() => handleCurrencyChange(curr.code)}
                            className={`
                              w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between
                              ${selectedCurrency === curr.code
                                ? 'bg-os-accent/20 border-2 border-os-accent text-os-text-primary font-medium'
                                : 'bg-os-surface-0 hover:bg-os-accent/10 text-os-text-secondary border-2 border-transparent'
                              }
                            `}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-os-lg">{curr.symbol}</span>
                              <span>{curr.name}</span>
                            </span>
                            {selectedCurrency === curr.code && (
                              <Check className="w-5 h-5 text-os-accent flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User / auth actions */}
          {user ? (
            <>
              <div className="hidden lg:flex items-center gap-3">
                {/* Simplified Trade OS Navigation */}
                <Link
                  to="/saved"
                  className="p-2 rounded-md hover:bg-os-accent/10 transition-colors text-os-text-secondary hover:text-os-accent"
                >
                  <Bookmark className="w-5 h-5" />
                </Link>
                <Link
                  to="/messages"
                  className="p-2 rounded-md hover:bg-os-accent/10 transition-colors text-os-text-secondary hover:text-os-accent"
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>
              </div>

              <div className="relative">
                <button
                  onClick={openUserMenu}
                  className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-md hover:bg-os-accent/10 transition-colors"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-os-accent rounded-full flex items-center justify-center text-afrikoni-chestnut font-bold text-os-xs sm:text-os-sm flex-shrink-0">
                    {(() => {
                      try {
                        return getUserInitial(user || null, null);
                      } catch (error) {
                        console.warn('Error getting user initial:', error);
                        return user?.email?.charAt(0)?.toUpperCase() || 'U';
                      }
                    })()}
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 sm:w-4 sm:h-4 text-afrikoni-cream transition-transform duration-200 hidden sm:block ${userMenuOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-[60]"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute end-0 mt-2 w-64 md:w-72 max-w-[90vw] bg-os-card border border-os-accent/20 rounded-lg shadow-os-lg z-[70] overflow-hidden"
                      >
                        <div className="py-1">
                          <div className="px-4 py-3 border-b border-os-accent/20">
                            <div className="font-semibold text-afrikoni-chestnut text-os-sm">
                              {user.email}
                            </div>
                            <div className="text-os-xs text-afrikoni-deep/70">
                              {user.user_role || 'User'}
                            </div>
                            {isVerified ? (
                              <div className="absolute top-2 end-2 bg-os-surface-0/90 backdrop-blur-sm rounded-full shadow-sm">
                                <VerificationBadge status="VERIFIED" size="xs" showLabel variant="badge" />
                              </div>
                            ) : verificationStatus === 'PENDING' ? (
                              <div className="absolute top-2 end-2 bg-os-surface-0/90 backdrop-blur-sm rounded-full shadow-sm">
                                <VerificationBadge status="PENDING" size="xs" variant="badge" />
                              </div>
                            ) : null}
                          </div>
                          <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-os-sm text-afrikoni-deep transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                          </Link>
                          <Link
                            to={userProfile?.company_id ? `/business/${userProfile.company_id}` : '/dashboard/settings'}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-os-accent/10 text-os-sm text-os-text-primary transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            View Profile
                          </Link>
                          <Link
                            to={`/${language}/dashboard/messages`}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-os-accent/10 text-os-sm text-os-text-primary transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <MessageSquare className="w-4 h-4" />
                            Messages
                          </Link>
                          <Link
                            to={`/${language}/dashboard/orders`}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-os-accent/10 text-os-sm text-os-text-primary transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Package className="w-4 h-4" />
                            Orders
                          </Link>
                          <Link
                            to={createPageUrl('RFQManagement')}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-os-accent/10 text-os-sm text-os-text-primary transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <FileText className="w-4 h-4" />
                            RFQs
                          </Link>
                          <Link
                            to="/dashboard/settings"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-os-accent/10 text-os-sm text-os-text-primary transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </Link>
                          <div className="border-t border-os-stroke my-1"></div>
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              openWhatsAppCommunity('profile_sidebar');
                            }}
                            className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-os-accent/10 text-os-sm transition-colors bg-os-accent/5"
                          >
                            <MessageSquare className="w-4 h-4 text-os-accent" />
                            <span className="text-os-accent font-semibold">Join Community 🚀</span>
                          </button>
                          <button
                            onClick={() => {
                              onLogout();
                              setUserMenuOpen(false);
                            }}
                            className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-os-accent/10 text-os-sm text-destructive font-medium transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>

                          {/* 60s Verification Entry Point */}
                          {!isVerified && verificationStatus !== 'PENDING' && (
                            <div className="p-2">
                              <VerifyButton
                                companyId={userProfile?.company_id}
                                className="w-full justify-start bg-os-accent/10 text-os-accent hover:bg-os-accent/20 border-0"
                                variant="ghost"
                              >
                                Get Verified (60s)
                              </VerifyButton>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              {/* Login / Signup Group - Updated CTAs */}
              <Link to="/login" className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 sm:h-9 px-2 sm:px-3 lg:px-4 text-os-text-primary/80 hover:text-os-accent hover:bg-os-accent/10 rounded-full text-os-xs sm:text-os-sm transition-all"
                >
                  Login
                </Button>
              </Link>
              <Link to="/signup" className="hidden sm:block">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="sm"
                    className="h-9 px-4 bg-os-accent text-afrikoni-chestnut hover:bg-os-accentLight rounded-full font-semibold shadow-os-md hover:shadow-os-lg transition-all hover:ring-2 hover:ring-os-accent/50"
                  >
                    Sign Up
                  </Button>
                </motion.div>
              </Link>

              {/* Mobile CTA */}
              <Link to="/signup" className="sm:hidden">
                <Button
                  size="sm"
                  className="h-8 sm:h-9 px-2 sm:px-3 bg-os-accent text-afrikoni-chestnut hover:bg-os-accentLight text-os-xs rounded-full whitespace-nowrap"
                >
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mega dropdown */}
      <AnimatePresence>
        {megaOpen && (
          <>
            <div
              className="fixed inset-0 z-[45] bg-black/20"
              onClick={() => setMegaOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute start-0 top-full w-full bg-os-card shadow-os-lg border-t border-os-stroke z-[50] max-h-[calc(100vh-4rem)] overflow-y-auto"
            >
              <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Main Categories Section - Alibaba Style */}
                <div className="mb-6">
                  <h2 className="text-os-xl sm:text-os-2xl font-bold text-os-text-primary mb-4">Browse All Categories</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {categoriesLoading ? (
                      <div className="col-span-full text-gray-500 text-os-sm py-4">Loading categories...</div>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <Link
                          key={category.id}
                          to={`/marketplace?category=${encodeURIComponent(category.id)}`}
                          onClick={() => setMegaOpen(false)}
                          className="flex flex-col items-center p-3 sm:p-4 rounded-lg border border-os-stroke hover:border-os-accent hover:bg-os-accent/5 transition-all group"
                        >
                          <div className="w-12 h-12 sm:w-14 sm:h-14 mb-2 flex items-center justify-center bg-os-surface-1 rounded-lg group-hover:bg-os-accent/10 transition-colors">
                            <Package className="w-6 h-6 sm:w-7 sm:h-7 text-os-accent" />
                          </div>
                          <span className="text-os-xs sm:text-os-sm font-medium text-gray-700 group-hover:text-os-accent text-center line-clamp-2">
                            {category.name}
                          </span>
                        </Link>
                      ))
                    ) : (
                      <div className="col-span-full text-gray-500 text-os-sm py-4">No categories available</div>
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <Link
                      to="/categories"
                      onClick={() => setMegaOpen(false)}
                      className="inline-flex items-center gap-2 text-os-accent hover:text-os-accent-light font-semibold text-os-sm sm:text-os-base transition-colors"
                    >
                      View All Categories
                      <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                    </Link>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-6"></div>

                {/* Additional Navigation Sections */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

                  {/* Marketplace */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Marketplace</h3>
                    <nav className="flex flex-col gap-2 text-gray-700 text-os-sm">
                      <Link to="/marketplace" onClick={() => setMegaOpen(false)}>Browse Products</Link>
                      <Link to="/trending" onClick={() => setMegaOpen(false)}>Trending</Link>
                      <Link to="/suppliers" onClick={() => setMegaOpen(false)}>Find Suppliers</Link>
                      <Link to="/order-protection" onClick={() => setMegaOpen(false)}>Buyer Protection</Link>
                    </nav>
                  </div>

                  {/* Buyers */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">For Buyers</h3>
                    <nav className="flex flex-col gap-2 text-gray-700 text-os-sm">
                      <Link to="/suppliers" onClick={() => setMegaOpen(false)}>Find Suppliers</Link>
                      <Link to="/rfq" onClick={() => setMegaOpen(false)}>Request Quotation</Link>
                      <Link to="/buyer-hub" onClick={() => setMegaOpen(false)}>Buyer Hub</Link>
                      <Link to="/logistics" onClick={() => setMegaOpen(false)}>Logistics</Link>
                      <Link to="/protection" onClick={() => setMegaOpen(false)}>Trade Shield</Link>
                      <Link to="/inspection" onClick={() => setMegaOpen(false)}>Inspection Services</Link>
                    </nav>
                  </div>

                  {/* Suppliers */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">For Suppliers</h3>
                    <nav className="flex flex-col gap-2 text-gray-700 text-os-sm">
                      <Link to="/become-supplier" onClick={() => setMegaOpen(false)}>Sell on Afrikoni</Link>
                      <Link
                        to={user ? "/dashboard" : "/become-supplier"}
                        onClick={() => {
                          setMegaOpen(false);
                          // ✅ KERNEL-TO-UI ALIGNMENT: Simplified check - dashboard will handle capability routing
                          // If user exists, link to dashboard (dashboard will show appropriate view)
                          // If no user, link to become-supplier page
                          if (!user) {
                            navigate('/become-supplier');
                          }
                        }}
                      >
                        Supplier Dashboard
                      </Link>
                      <Link to="/dashboard/verification-center" onClick={() => setMegaOpen(false)}>KYC Verification</Link>
                      <Link to="/resources" onClick={() => setMegaOpen(false)}>Supplier Resources</Link>
                    </nav>
                  </div>

                  {/* Trust & Safety */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Trust & Safety</h3>
                    <nav className="flex flex-col gap-2 text-gray-700 text-os-sm">
                      <Link to="/protection" onClick={() => setMegaOpen(false)}>Afrikoni Shield</Link>
                      <Link to="/order-protection" onClick={() => setMegaOpen(false)}>Order Protection</Link>
                      <Link to="/anti-fraud" onClick={() => setMegaOpen(false)}>Anti-Fraud</Link>
                      <Link
                        to={user ? "/dashboard/disputes" : "/disputes"}
                        onClick={() => {
                          setMegaOpen(false);
                          if (user) {
                            navigate('/dashboard/disputes');
                          }
                        }}
                      >
                        Dispute Resolution
                      </Link>
                    </nav>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav >
  );
}

