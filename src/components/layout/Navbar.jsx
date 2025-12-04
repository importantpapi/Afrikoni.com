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
import { supabase } from '@/api/supabaseClient';

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
    <nav className={`w-full bg-afrikoni-chestnut text-afrikoni-cream border-b border-afrikoni-gold/30 sticky top-0 z-50 transition-shadow duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
      {/* Top bar */}
      <div className="max-w-[1440px] mx-auto px-4 flex items-center justify-between gap-6 h-16 lg:h-20">
        {/* Left: logo + explore + quick link */}
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 flex-shrink-0 min-w-0">
          <div className="max-w-[140px] sm:max-w-none flex-shrink-0">
            <Logo type="full" size="md" link={true} showTagline={false} direction="horizontal" />
          </div>

          <button
            type="button"
            onClick={toggleMegaMenu}
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-afrikoni-cream hover:text-afrikoni-gold transition-colors"
          >
            Explore <span className={`transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          <Link to="/marketplace" className="hidden md:block">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 md:px-4 border-afrikoni-gold/70 text-afrikoni-cream hover:bg-afrikoni-gold/10 rounded-full font-semibold text-xs md:text-sm"
            >
              Browse Products
            </Button>
          </Link>
          
          {compareCount > 0 && (
            <Link to="/compare" className="relative hidden sm:block">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 sm:px-3 text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10"
              >
                <GitCompare className="w-4 h-4" />
                <span className="ml-1 hidden sm:inline">Compare</span>
                <span className="ml-1.5 bg-afrikoni-gold text-afrikoni-chestnut text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {compareCount}
                </span>
              </Button>
            </Link>
          )}
        </div>

        {/* Right: language, currency, user */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={openLanguageMenu}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-md text-sm font-medium text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10 transition-colors"
            >
              <Globe className="w-4 h-4 flex-shrink-0" />
              <span className="hidden lg:inline">{selectedLanguageCode}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${languageOpen ? 'rotate-180' : ''}`} />
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
                  className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-afrikoni-gold/10 transition-colors"
                >
                  <div className="w-8 h-8 bg-afrikoni-gold rounded-full flex items-center justify-center text-afrikoni-chestnut font-bold text-sm flex-shrink-0">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-afrikoni-cream transition-transform duration-200 ${
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
                            to={createPageUrl('Profile')}
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
                            to={createPageUrl('Settings')}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-sm text-afrikoni-deep transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            {t('dashboard.settings')}
                          </Link>
                          <div className="border-t border-afrikoni-gold/20 my-1"></div>
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
              <Link to="/become-supplier" className="hidden lg:inline-block">
                <Button
                  size="sm"
                  className="h-9 px-4 bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight rounded-full font-semibold shadow-afrikoni"
                >
                  Become a Supplier
                </Button>
              </Link>

              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden lg:flex items-center h-9 px-4 text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10 rounded-full"
                >
                  {t('auth.login')}
                </Button>
              </Link>

              <Link to="/become-supplier" className="lg:hidden">
                <Button
                  size="sm"
                  className="h-9 px-3 bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight text-xs rounded-full"
                >
                  Become a Supplier
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
              className="absolute left-0 w-full bg-white shadow-xl border-t border-gray-200 z-[50]"
            >
              <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 max-h-[500px] overflow-y-auto">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Browse by Category</h3>
            <nav className="flex flex-col gap-2 text-gray-700 text-sm">
              <Link to="/categories" onClick={() => setMegaOpen(false)} className="font-medium text-afrikoni-gold hover:text-afrikoni-chestnut">
                All Categories →
              </Link>
              {categoriesLoading ? (
                <div className="text-gray-500 text-xs">Loading categories...</div>
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
                <div className="text-gray-500 text-xs">No categories available</div>
              )}
            </nav>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Marketplace</h3>
            <nav className="flex flex-col gap-2 text-gray-700 text-sm">
              <Link to="/marketplace" onClick={() => setMegaOpen(false)}>Browse Products</Link>
              <Link to="/trending" onClick={() => setMegaOpen(false)}>Trending</Link>
              <Link to="/suppliers" onClick={() => setMegaOpen(false)}>Find Suppliers</Link>
              <Link to="/order-protection" onClick={() => setMegaOpen(false)}>Buyer Protection</Link>
            </nav>
          </div>

          {/* Buyers */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">For Buyers</h3>
            <nav className="flex flex-col gap-2 text-gray-700 text-sm">
              <Link to="/suppliers" onClick={() => setMegaOpen(false)}>Find Suppliers</Link>
              <Link to="/rfq" onClick={() => setMegaOpen(false)}>Request for Quotation</Link>
              <Link to="/buyer-hub" onClick={() => setMegaOpen(false)}>Buyer Hub</Link>
              <Link to="/logistics" onClick={() => setMegaOpen(false)}>Logistics &amp; Shipping</Link>
              <Link to="/protection" onClick={() => setMegaOpen(false)}>Trade Shield</Link>
              <Link to="/inspection" onClick={() => setMegaOpen(false)}>Inspection Services</Link>
            </nav>
          </div>

          {/* Suppliers */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">For Suppliers</h3>
            <nav className="flex flex-col gap-2 text-gray-700 text-sm">
              <Link to="/suppliers" onClick={() => setMegaOpen(false)}>Sell on Afrikoni</Link>
              <Link to="/dashboard" onClick={() => setMegaOpen(false)}>Supplier Dashboard</Link>
              <Link to="/pricing" onClick={() => setMegaOpen(false)}>Pricing</Link>
              <Link to="/verification-center" onClick={() => setMegaOpen(false)}>KYC / Verification</Link>
              <Link to="/resources" onClick={() => setMegaOpen(false)}>Supplier Resources</Link>
            </nav>
          </div>

          {/* Trust & Safety */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Trust &amp; Safety</h3>
            <nav className="flex flex-col gap-2 text-gray-700 text-sm">
              <Link to="/dashboard/risk" onClick={() => setMegaOpen(false)}>Afrikoni Shield</Link>
              <Link to="/order-protection" onClick={() => setMegaOpen(false)}>Order Protection</Link>
              <Link to="/anti-fraud" onClick={() => setMegaOpen(false)}>Anti-Fraud</Link>
              <Link to="/disputes" onClick={() => setMegaOpen(false)}>Dispute Resolution</Link>
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

