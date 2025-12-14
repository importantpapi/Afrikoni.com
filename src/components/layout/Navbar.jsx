import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  GitCompare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import NotificationBell from '@/components/notificationbell';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { openWhatsAppCommunity } from '@/utils/whatsappCommunity';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [megaOpen, setMegaOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [compareCount, setCompareCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

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
    setUserMenuOpen(false);
  }, [location.pathname]);

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

  // Load user profile to get company_id for profile link
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        try {
          const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
          const { profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
          if (profile) {
            setUserProfile(profile);
          }
        } catch (error) {
          // Silently fail
        }
      }
    };
    loadUserProfile();
  }, [user]);

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
    { code: 'en', display: 'EN', name: 'English', flag: '🇬🇧' },
    { code: 'fr', display: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', display: 'AR', name: 'العربية', flag: '🇸🇦' },
    { code: 'pt', display: 'PT', name: 'Português', flag: '🇵🇹' }
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
    setUserMenuOpen(false);
  };

  const openLanguageMenu = () => {
    setLanguageOpen(true);
    setMegaOpen(false);
    setCurrencyOpen(false);
    setUserMenuOpen(false);
  };

  const openCurrencyMenu = () => {
    setCurrencyOpen(true);
    setMegaOpen(false);
    setLanguageOpen(false);
    setUserMenuOpen(false);
  };

  const openUserMenu = () => {
    setUserMenuOpen(true);
    setMegaOpen(false);
    setLanguageOpen(false);
    setCurrencyOpen(false);
  };

  return (
    <nav className={`w-full bg-afrikoni-chestnut text-afrikoni-cream border-b border-afrikoni-gold/30 sticky top-0 z-50 transition-shadow duration-300 ${isScrolled ? 'shadow-lg' : ''} relative`}>
      {/* Top bar */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6 h-14 sm:h-16 lg:h-20 overflow-visible">
        {/* Left: logo + explore + quick link */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 flex-shrink-0 min-w-0 flex-1">
          <div className="max-w-[120px] sm:max-w-[140px] lg:max-w-none flex-shrink-0">
            <Logo type="full" size="sm" link={true} showTagline={false} direction="horizontal" />
          </div>

          {/* Post Request - Visually Dominant */}
          <Link to="/createrfq" className="hidden sm:flex items-center gap-1.5">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="sm"
                className="bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight font-bold text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg hover:shadow-xl transition-all"
              >
                Post Request
              </Button>
            </motion.div>
          </Link>

          {/* Marketplace Link */}
          <Link to="/marketplace" className="hidden sm:flex items-center gap-1 text-xs sm:text-sm font-medium text-afrikoni-cream hover:text-afrikoni-gold transition-colors whitespace-nowrap">
            Marketplace
          </Link>

          {/* About Us Link */}
          <Link to="/about" className="hidden sm:flex items-center gap-1 text-xs sm:text-sm font-medium text-afrikoni-cream hover:text-afrikoni-gold transition-colors whitespace-nowrap">
            About Us
          </Link>

          {/* For Enterprise Link */}
          <Link to="/enterprise" className="hidden sm:flex items-center gap-1 text-xs sm:text-sm font-medium text-afrikoni-cream hover:text-afrikoni-gold transition-colors whitespace-nowrap">
            For Enterprise
          </Link>

          {/* How It Works Link */}
          <Link to="/how-it-works" className="hidden sm:flex items-center gap-1 text-xs sm:text-sm font-medium text-afrikoni-cream hover:text-afrikoni-gold transition-colors whitespace-nowrap">
            How It Works
          </Link>

          {/* Community Link */}
          <button
            onClick={() => openWhatsAppCommunity('navbar')}
            className="hidden sm:flex items-center gap-1 text-xs sm:text-sm font-medium text-afrikoni-cream hover:text-afrikoni-gold transition-colors whitespace-nowrap"
          >
            Community
          </button>
          
          {compareCount > 0 && (
            <Link to="/compare" className="relative hidden sm:block">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 sm:h-9 px-2 text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10"
              >
                <GitCompare className="w-4 h-4" />
                <span className="ml-1 hidden lg:inline">{t('nav.compare')}</span>
                <span className="ml-1 bg-afrikoni-gold text-afrikoni-chestnut text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {compareCount}
                </span>
              </Button>
            </Link>
          )}
        </div>

        {/* Right: language, currency, user */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 flex-shrink-0">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={openLanguageMenu}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden lg:inline">{selectedLanguageCode}</span>
              <ChevronDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 ${languageOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {languageOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[60]"
                    onClick={() => setLanguageOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-56 bg-afrikoni-offwhite rounded-lg shadow-afrikoni-lg border border-afrikoni-gold/30 z-[70] py-1"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLanguageOpen(false);
                        }}
                        className={`
                          w-full text-left px-4 py-2.5 text-sm hover:bg-afrikoni-gold/10 transition-colors flex items-center gap-2.5 whitespace-nowrap
                          ${language === lang.code ? 'bg-afrikoni-gold/15 text-afrikoni-gold font-medium' : 'text-afrikoni-deep'}
                        `}
                      >
                        <span className="text-lg flex-shrink-0">{lang.flag}</span>
                        <span className="truncate">{lang.name}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Currency selector */}
          <div className="hidden lg:block relative">
            <button
              onClick={openCurrencyMenu}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10 transition-colors"
            >
              <span className="hidden xl:inline">{selectedCurrency}</span>
              <span className="xl:hidden">
                {currencies.find((c) => c.code === selectedCurrency)?.symbol || '$'}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${currencyOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {currencyOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[60]"
                    onClick={() => setCurrencyOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-48 bg-afrikoni-offwhite rounded-lg shadow-afrikoni-lg border border-afrikoni-gold/30 z-[70] py-1"
                  >
                    {currencies.map((curr) => (
                      <button
                        key={curr.code}
                        onClick={() => {
                          setSelectedCurrency(curr.code);
                          setCurrencyOpen(false);
                        }}
                        className={`
                          w-full text-left px-4 py-2 text-sm hover:bg-afrikoni-gold/10 transition-colors
                          ${selectedCurrency === curr.code ? 'bg-afrikoni-gold/15 text-afrikoni-gold font-medium' : 'text-afrikoni-deep'}
                        `}
                      >
                        {curr.symbol} {curr.name}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User / auth actions */}
          {user ? (
            <>
              <Link
                to="/orders"
                className="hidden lg:block relative p-2 rounded-md hover:bg-afrikoni-gold/10 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-afrikoni-cream hover:text-afrikoni-gold transition-colors" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-afrikoni-gold text-afrikoni-chestnut text-xs rounded-full flex items-center justify-center font-bold">
                  0
                </span>
              </Link>

              <div className="hidden lg:block">
                <NotificationBell />
              </div>

              <div className="relative">
                <button
                  onClick={openUserMenu}
                  className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-md hover:bg-afrikoni-gold/10 transition-colors"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-afrikoni-gold rounded-full flex items-center justify-center text-afrikoni-chestnut font-bold text-xs sm:text-sm flex-shrink-0">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <ChevronDown
                    className={`w-3 h-3 sm:w-4 sm:h-4 text-afrikoni-cream transition-transform duration-200 hidden sm:block ${
                      userMenuOpen ? 'rotate-180' : ''
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
                        className="absolute right-0 mt-2 w-64 md:w-72 max-w-[90vw] bg-afrikoni-offwhite border border-afrikoni-gold/20 rounded-lg shadow-afrikoni-xl z-[70] overflow-hidden"
                      >
                        <div className="py-1">
                          <div className="px-4 py-3 border-b border-afrikoni-gold/20">
                            <div className="font-semibold text-afrikoni-chestnut text-sm">
                              {user.email}
                            </div>
                            <div className="text-xs text-afrikoni-deep/70">
                              {user.user_role || 'User'}
                            </div>
                          </div>
                          <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-sm text-afrikoni-deep transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            {t('dashboard.title')}
                          </Link>
                          <Link
                            to={userProfile?.company_id ? `/business/${userProfile.company_id}` : '/dashboard/settings'}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-sm text-afrikoni-deep transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            {t('common.view')} Profile
                          </Link>
                          <Link
                            to="/messages"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-sm text-afrikoni-deep transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <MessageSquare className="w-4 h-4" />
                            {t('messages.title')}
                          </Link>
                          <Link
                            to="/orders"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-sm text-afrikoni-deep transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Package className="w-4 h-4" />
                            {t('dashboard.orders')}
                          </Link>
                          <Link
                            to={createPageUrl('RFQManagement')}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-sm text-afrikoni-deep transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <FileText className="w-4 h-4" />
                            {t('nav.rfq')}
                          </Link>
                          <Link
                            to="/dashboard/settings"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-sm text-afrikoni-deep transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            {t('dashboard.settings')}
                          </Link>
                          <div className="border-t border-afrikoni-gold/20 my-1"></div>
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              openWhatsAppCommunity('profile_sidebar');
                            }}
                            className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-afrikoni-cream text-sm transition-colors bg-afrikoni-gold/5"
                          >
                            <MessageSquare className="w-4 h-4 text-afrikoni-gold" />
                            <span className="text-afrikoni-gold font-semibold">Join Community 🚀</span>
                          </button>
                          <button
                            onClick={() => {
                              onLogout();
                              setUserMenuOpen(false);
                            }}
                            className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm text-red-600 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            {t('auth.logout')}
                          </button>
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
                      className="h-8 sm:h-9 px-2 sm:px-3 lg:px-4 text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10 rounded-full text-xs sm:text-sm transition-all"
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
                        className="h-9 px-4 bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:ring-2 hover:ring-afrikoni-gold/50"
                      >
                        Sign Up
                      </Button>
                    </motion.div>
                  </Link>

                  {/* Mobile CTA */}
                  <Link to="/signup" className="sm:hidden">
                    <Button
                      size="sm"
                      className="h-8 sm:h-9 px-2 sm:px-3 bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight text-xs rounded-full whitespace-nowrap"
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
              className="absolute left-0 top-full w-full bg-white shadow-xl border-t border-gray-200 z-[50] max-h-[calc(100vh-4rem)] overflow-y-auto"
            >
              <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 overflow-y-auto overscroll-contain" style={{ maxHeight: 'min(500px, calc(100vh - 4rem))' }}>
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('nav.browseByCategory')}</h3>
            <nav className="flex flex-col gap-2 text-gray-700 text-sm">
              <Link to="/categories" onClick={() => setMegaOpen(false)} className="font-medium text-afrikoni-gold hover:text-afrikoni-chestnut">
                {t('nav.allCategories')} →
              </Link>
              {categoriesLoading ? (
                <div className="text-gray-500 text-xs">{t('nav.loadingCategories')}</div>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/marketplace?category=${encodeURIComponent(category.id)}`}
                    onClick={() => setMegaOpen(false)}
                    className="hover:text-afrikoni-gold transition-colors"
                  >
                    {category.name}
                  </Link>
                ))
              ) : (
                <div className="text-gray-500 text-xs">{t('nav.noCategories')}</div>
              )}
            </nav>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('nav.marketplace')}</h3>
            <nav className="flex flex-col gap-2 text-gray-700 text-sm">
              <Link to="/marketplace" onClick={() => setMegaOpen(false)}>{t('nav.browseProducts')}</Link>
              <Link to="/trending" onClick={() => setMegaOpen(false)}>{t('nav.trending')}</Link>
              <Link to="/suppliers" onClick={() => setMegaOpen(false)}>{t('nav.findSuppliers')}</Link>
              <Link to="/order-protection" onClick={() => setMegaOpen(false)}>{t('nav.buyerProtection')}</Link>
            </nav>
          </div>

          {/* Buyers */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('nav.forBuyers')}</h3>
            <nav className="flex flex-col gap-2 text-gray-700 text-sm">
              <Link to="/suppliers" onClick={() => setMegaOpen(false)}>{t('nav.findSuppliers')}</Link>
              <Link to="/rfq" onClick={() => setMegaOpen(false)}>{t('nav.requestQuotation')}</Link>
              <Link to="/buyer-hub" onClick={() => setMegaOpen(false)}>{t('nav.buyerHub')}</Link>
              <Link to="/logistics" onClick={() => setMegaOpen(false)}>{t('nav.logistics')}</Link>
              <Link to="/protection" onClick={() => setMegaOpen(false)}>{t('nav.tradeShield')}</Link>
              <Link to="/inspection" onClick={() => setMegaOpen(false)}>{t('nav.inspectionServices')}</Link>
            </nav>
          </div>

          {/* Suppliers */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('nav.forSuppliers')}</h3>
            <nav className="flex flex-col gap-2 text-gray-700 text-sm">
              <Link to="/suppliers" onClick={() => setMegaOpen(false)}>{t('nav.sellOnAfrikoni')}</Link>
              <Link to="/dashboard" onClick={() => setMegaOpen(false)}>{t('nav.supplierDashboard')}</Link>
              <Link to="/pricing" onClick={() => setMegaOpen(false)}>{t('common.pricing') || 'Pricing'}</Link>
              <Link to="/verification-center" onClick={() => setMegaOpen(false)}>{t('nav.kycVerification')}</Link>
              <Link to="/resources" onClick={() => setMegaOpen(false)}>{t('nav.supplierResources')}</Link>
            </nav>
          </div>

          {/* Trust & Safety */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('nav.trustSafety')}</h3>
            <nav className="flex flex-col gap-2 text-gray-700 text-sm">
              <Link to="/dashboard/risk" onClick={() => setMegaOpen(false)}>{t('nav.afrikoniShield')}</Link>
              <Link to="/order-protection" onClick={() => setMegaOpen(false)}>{t('nav.orderProtection')}</Link>
              <Link to="/anti-fraud" onClick={() => setMegaOpen(false)}>{t('nav.antiFraud')}</Link>
              <Link to="/disputes" onClick={() => setMegaOpen(false)}>{t('nav.disputeResolution')}</Link>
            </nav>
          </div>
        </div>
      </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

