import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3x3, ShoppingBag, Store, Truck, Shield, FileText,
  HelpCircle, Globe, ChevronDown, Menu, X, ShoppingCart,
  LogOut, User, LayoutDashboard, MessageSquare, Package, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import NotificationBell from '@/components/notificationbell';
import { createPageUrl } from '@/utils';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('EN');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const navLinks = [
    { label: 'Marketplace', path: '/marketplace', icon: ShoppingBag },
    { label: 'Buyer Hub', path: '/buyer-hub', icon: ShoppingBag },
    { label: 'Supplier Hub', path: '/supplier-hub', icon: Store },
    { label: 'Logistics & Shipping', path: '/logistics', icon: Truck },
    { label: 'Order Protection', path: '/order-protection', icon: Shield },
    { label: 'RFQ', path: '/rfq', icon: FileText },
    { label: 'Help Center', path: '/help', icon: HelpCircle },
  ];

  const languages = [
    { code: 'EN', name: 'English', flag: '🇬🇧' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'AR', name: 'العربية', flag: '🇸🇦' },
    { code: 'PT', name: 'Português', flag: '🇵🇹' },
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'USD' },
    { code: 'NGN', symbol: '₦', name: 'NGN' },
    { code: 'EUR', symbol: '€', name: 'EUR' },
    { code: 'ZAR', symbol: 'R', name: 'ZAR' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-afrikoni-chestnut border-b border-afrikoni-gold/30 sticky top-0 z-50 w-full">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navbar Container */}
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* LEFT SECTION: Logo + All Categories */}
          <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
            <Logo type="full" size="md" link={true} showTagline={false} />
            
            {/* All Categories Button - Desktop Only */}
            <Link
              to="/categories"
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10 transition-colors"
            >
              <Grid3x3 className="w-4 h-4" />
              <span>All Categories</span>
            </Link>
          </div>

          {/* CENTER SECTION: Navigation Links - Desktop Only */}
          <div className="hidden xl:flex items-center gap-1 lg:gap-2 flex-1 justify-center px-4">
            {navLinks.map((link, idx) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              
              return (
                <Link
                  key={idx}
                  to={link.path}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
                    ${active 
                      ? 'text-afrikoni-gold bg-afrikoni-gold/10' 
                      : 'text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/5'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden 2xl:inline">{link.label}</span>
                  <span className="2xl:hidden">{link.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>

          {/* RIGHT SECTION: Language, Currency, Auth Buttons */}
          <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
            
            {/* Language Selector - Desktop Only */}
            <div className="hidden lg:block relative">
              <button
                onClick={() => {
                  setLanguageOpen(!languageOpen);
                  setCurrencyOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden xl:inline">{selectedLanguage}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              <AnimatePresence>
                {languageOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setLanguageOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-afrikoni-offwhite rounded-lg shadow-afrikoni-lg border border-afrikoni-gold/30 z-50 py-1"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSelectedLanguage(lang.code);
                            setLanguageOpen(false);
                          }}
                          className={`
                            w-full text-left px-4 py-2 text-sm hover:bg-afrikoni-gold/10 transition-colors flex items-center gap-2
                            ${selectedLanguage === lang.code ? 'bg-afrikoni-gold/15 text-afrikoni-gold' : 'text-afrikoni-deep'}
                          `}
                        >
                          <span>{lang.flag}</span>
                          {lang.name}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Currency Selector - Desktop Only */}
            <div className="hidden lg:block relative">
              <button
                onClick={() => {
                  setCurrencyOpen(!currencyOpen);
                  setLanguageOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10 transition-colors"
              >
                <span className="hidden xl:inline">{selectedCurrency}</span>
                <span className="xl:hidden">{currencies.find(c => c.code === selectedCurrency)?.symbol || '$'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              <AnimatePresence>
                {currencyOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setCurrencyOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-afrikoni-offwhite rounded-lg shadow-afrikoni-lg border border-afrikoni-gold/30 z-50 py-1"
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
                            ${selectedCurrency === curr.code ? 'bg-afrikoni-gold/15 text-afrikoni-gold' : 'text-afrikoni-deep'}
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

            {/* User Actions */}
            {user ? (
              <>
                {/* Shopping Cart - Desktop Only */}
                <Link
                  to="/orders"
                  className="hidden lg:block relative p-2 rounded-md hover:bg-afrikoni-gold/10 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5 text-afrikoni-cream hover:text-afrikoni-gold transition-colors" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-afrikoni-gold text-afrikoni-chestnut text-xs rounded-full flex items-center justify-center font-bold">
                    0
                  </span>
                </Link>

                {/* Notification Bell - Desktop Only */}
                <div className="hidden lg:block">
                  <NotificationBell />
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setLanguageOpen(false);
                      setCurrencyOpen(false);
                    }}
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-afrikoni-gold/10 transition-colors"
                  >
                    <div className="w-8 h-8 bg-afrikoni-gold rounded-full flex items-center justify-center text-afrikoni-chestnut font-bold text-sm flex-shrink-0">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-afrikoni-cream transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-56 bg-afrikoni-offwhite border border-afrikoni-gold/20 rounded-lg shadow-afrikoni-xl z-50"
                        >
                          <div className="py-1">
                            <div className="px-4 py-3 border-b border-afrikoni-gold/20">
                              <div className="font-semibold text-afrikoni-chestnut text-sm">{user.email}</div>
                              <div className="text-xs text-afrikoni-deep/70">{user.user_role || 'User'}</div>
                            </div>
                            <Link
                              to="/dashboard"
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-sm text-afrikoni-deep transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              Dashboard
                            </Link>
                            <Link
                              to={createPageUrl('Profile')}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-sm text-afrikoni-deep transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <User className="w-4 h-4" />
                              Profile
                            </Link>
                            <Link
                              to="/messages"
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-sm text-afrikoni-deep transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <MessageSquare className="w-4 h-4" />
                              Messages
                            </Link>
                            <Link
                              to="/orders"
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-sm text-afrikoni-deep transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Package className="w-4 h-4" />
                              Orders
                            </Link>
                            <Link
                              to={createPageUrl('RFQManagement')}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-sm text-afrikoni-deep transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <FileText className="w-4 h-4" />
                              RFQs
                            </Link>
                            <Link
                              to={createPageUrl('Settings')}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-cream text-sm text-afrikoni-deep transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Settings className="w-4 h-4" />
                              Settings
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
                              Logout
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
                {/* Login Button */}
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex items-center h-9 px-4 text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10"
                  >
                    Login
                  </Button>
                </Link>

                {/* Start Selling Button */}
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="hidden lg:flex items-center h-9 px-4 bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight"
                  >
                    Start Selling
                  </Button>
                </Link>

                {/* Sign Up Button - Mobile/Tablet */}
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="lg:hidden h-9 px-3 bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight text-xs"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-afrikoni-gold/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-afrikoni-cream" />
              ) : (
                <Menu className="w-6 h-6 text-afrikoni-cream" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-afrikoni-gold/30 bg-afrikoni-chestnut overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {/* All Categories - Mobile */}
                <Link
                  to="/categories"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10 transition-colors"
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span>All Categories</span>
                </Link>

                {/* Navigation Links - Mobile */}
                {navLinks.map((link, idx) => {
                  const Icon = link.icon;
                  const active = isActive(link.path);
                  
                  return (
                    <Link
                      key={idx}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-md text-afrikoni-cream transition-colors
                        ${active 
                          ? 'text-afrikoni-gold bg-afrikoni-gold/10' 
                          : 'hover:text-afrikoni-gold hover:bg-afrikoni-gold/5'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                {/* Language & Currency - Mobile */}
                <div className="pt-2 border-t border-afrikoni-gold/20 mt-2">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Globe className="w-4 h-4 text-afrikoni-cream" />
                    <span className="text-sm text-afrikoni-cream">Language: {selectedLanguage}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="text-sm text-afrikoni-cream">Currency: {selectedCurrency}</span>
                  </div>
                </div>

                {/* Auth Buttons - Mobile */}
                {!user && (
                  <div className="pt-2 border-t border-afrikoni-gold/20 mt-2 space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2 rounded-md text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10 transition-colors"
                    >
                      Login
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

