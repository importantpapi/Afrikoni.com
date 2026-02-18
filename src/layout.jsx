import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { createPageUrl } from './utils';
import { Button } from '@/components/shared/ui/button';
import { Mail, Phone, MapPin, Lock, Shield, Award, CheckCircle, Linkedin, Twitter, Facebook, Instagram, Youtube, ChevronDown, MessageCircle } from 'lucide-react';
// Note: TikTok and Pinterest icons may need to be added via custom SVG or icon library
import Navbar from './components/layout/Navbar';
import { useLanguage } from '@/i18n/LanguageContext';
import { Logo } from '@/components/shared/ui/Logo';
import WhatsAppButton from '@/components/shared/ui/WhatsAppButton';
import CookieBanner from '@/components/shared/ui/CookieBanner';

import MobileMainNav from './components/layout/MobileMainNav';
import { PageLoader } from '@/components/shared/ui/skeletons';

// Lazy load MobileLayout outside component to prevent re-creation on every render
const MobileLayout = lazy(() => import('@/layouts/MobileLayout'));

function Footer() {
  const { language = 'en' } = useLanguage();
  const [openSections, setOpenSections] = useState({
    company: false,
    buyers: false,
    sellers: false,
    support: false
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const buyerLinks = [
    { to: `/${language}/products`, label: 'Browse Products' },
    { to: `/${language}/suppliers`, label: 'Find Suppliers' },
    { to: `/${language}/signup`, label: 'Join as Buyer' },
    { to: `/${language}/dashboard/rfqs/new`, label: 'Request Quotes' },
    { to: `/${language}/dashboard`, label: 'Buyer Central' }
  ];

  const sellerLinks = [
    { to: `/${language}/supplier-hub`, label: 'Supplier Hub' },
    { to: `/${language}/signup`, label: 'Start Selling' },
    { to: `/${language}/dashboard/products/new`, label: 'List Products' },
    { to: `/${language}/dashboard`, label: 'Seller Dashboard' },
    { to: `/${language}/dashboard/verification-center`, label: 'Get Verified' }
  ];

  const companyLinks = [
    { to: `/${language}/buyer-hub`, label: 'How Sourcing Works' },
    { to: `/${language}/supplier-hub`, label: 'How Selling Works' },
    { to: `/${language}/trust`, label: 'Marketplace Rules' },
    { to: `/${language}/about`, label: 'About Us' },
    { to: `/${language}/logistics`, label: 'Logistics' },
    { to: `/${language}/order-protection`, label: 'Trust & Safety' },
    { to: `/${language}/pricing`, label: 'Pricing' },
    { to: `/${language}/help`, label: 'Help Center' },
    { to: `/${language}/contact`, label: 'Contact Us' },
    { to: `/${language}/community`, label: 'Join Community', icon: MessageCircle, highlight: true }
  ];

  return (
    <footer className="bg-afrikoni-chestnut text-afrikoni-cream mt-12 md:mt-16" role="contentinfo" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 lg:py-12">
        <div className="grid md:grid-cols-4 gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-10 lg:mb-12">
          {/* Company Info - Always visible */}
          <div>
            <div className="mb-3 md:mb-4">
              <Logo type="full" size="sm" link={true} className="text-afrikoni-cream" />
            </div>
            <p className="text-os-xs md:text-os-sm text-afrikoni-cream/90 mb-3 md:mb-4 leading-relaxed">
              Afrikoni — Building trusted B2B trade infrastructure for Africa.
              <br />
              Connecting suppliers, buyers & logistics across 54 countries.
            </p>
            <div className="space-y-1.5 md:space-y-2 text-os-xs md:text-os-sm mb-4 md:mb-6">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-2"
              >
                <Mail className="w-3 h-3 md:w-4 md:h-4 text-os-accent flex-shrink-0" aria-hidden="true" />
                <a href="mailto:hello@afrikoni.com" className="hover:text-os-accent transition-colors break-all focus-visible-ring">hello@afrikoni.com</a>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-2"
              >
                <Phone className="w-3 h-3 md:w-4 md:h-4 text-os-accent flex-shrink-0" aria-hidden="true" />
                <a href="tel:+32456779368" className="hover:text-os-accent transition-colors">+32 456 77 93 68</a>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-2"
              >
                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-os-accent flex-shrink-0" />
                <span className="text-os-accent font-medium">Brussels, Belgium HQ</span>
              </motion.div>
            </div>
            {/* Additional CTAs - Hidden on mobile */}
            <div className="hidden md:flex flex-col gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/signup">
                  <Button className="w-full bg-os-accent text-afrikoni-chestnut hover:bg-os-accentLight text-os-sm py-2">
                    Become a Supplier
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/signup">
                  <Button variant="secondary" className="w-full text-os-sm py-2">
                    Join as Buyer
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* For Buyers - Accordion on mobile */}
          <div>
            <button
              onClick={() => toggleSection('buyers')}
              className="md:pointer-events-none w-full flex items-center justify-between md:justify-start mb-3 md:mb-4"
            >
              <h4 className="font-semibold text-os-accent text-os-sm md:text-os-base">For Buyers</h4>
              <ChevronDown
                className={`w-4 h-4 md:hidden text-os-accent transition-transform duration-200 ${openSections.buyers ? 'rotate-180' : ''
                  }`}
              />
            </button>
            <AnimatePresence>
              {(openSections.buyers || !isMobile) && (
                <motion.ul
                  initial={isMobile ? { height: 0, opacity: 0 } : false}
                  animate={isMobile ? { height: 'auto', opacity: 1 } : false}
                  exit={isMobile ? { height: 0, opacity: 0 } : false}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 md:space-y-2 text-os-xs md:text-os-sm overflow-hidden md:overflow-visible"
                >
                  {buyerLinks.map((item, idx) => (
                    <motion.li
                      key={idx}
                      whileHover={{ x: 4 }}
                      className="md:block"
                    >
                      <Link to={item.to} className="hover:text-os-accent transition-colors block text-afrikoni-cream/90 py-1">
                        {item.label}
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* For Sellers - Accordion on mobile */}
          <div>
            <button
              onClick={() => toggleSection('sellers')}
              className="md:pointer-events-none w-full flex items-center justify-between md:justify-start mb-3 md:mb-4"
            >
              <h4 className="font-semibold text-os-accent text-os-sm md:text-os-base">For Sellers</h4>
              <ChevronDown
                className={`w-4 h-4 md:hidden text-os-accent transition-transform duration-200 ${openSections.sellers ? 'rotate-180' : ''
                  }`}
              />
            </button>
            <AnimatePresence>
              {(openSections.sellers || !isMobile) && (
                <motion.ul
                  initial={isMobile ? { height: 0, opacity: 0 } : false}
                  animate={isMobile ? { height: 'auto', opacity: 1 } : false}
                  exit={isMobile ? { height: 0, opacity: 0 } : false}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 md:space-y-2 text-os-xs md:text-os-sm overflow-hidden md:overflow-visible"
                >
                  {sellerLinks.map((item, idx) => (
                    <motion.li
                      key={idx}
                      whileHover={{ x: 4 }}
                      className="md:block"
                    >
                      <Link to={item.to} className="hover:text-os-accent transition-colors block text-afrikoni-cream/90 py-1">
                        {item.label}
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Company - Accordion on mobile */}
          <div>
            <button
              onClick={() => toggleSection('support')}
              className="md:pointer-events-none w-full flex items-center justify-between md:justify-start mb-3 md:mb-4"
            >
              <h4 className="font-semibold text-os-accent text-os-sm md:text-os-base">Company</h4>
              <ChevronDown
                className={`w-4 h-4 md:hidden text-os-accent transition-transform duration-200 ${openSections.support ? 'rotate-180' : ''
                  }`}
              />
            </button>
            <AnimatePresence>
              {(openSections.support || !isMobile) && (
                <motion.ul
                  initial={isMobile ? { height: 0, opacity: 0 } : false}
                  animate={isMobile ? { height: 'auto', opacity: 1 } : false}
                  exit={isMobile ? { height: 0, opacity: 0 } : false}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 md:space-y-2 text-os-xs md:text-os-sm overflow-hidden md:overflow-visible"
                >
                  {companyLinks.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <motion.li
                        key={idx}
                        whileHover={{ x: 4 }}
                        className="md:block"
                      >
                        <Link
                          to={item.to}
                          className={`hover:text-os-accent transition-colors block text-afrikoni-cream/90 py-1 flex items-center gap-2 ${item.highlight ? 'text-os-accent font-semibold' : ''}`}
                        >
                          {Icon && <Icon className="w-4 h-4" />}
                          {item.label}
                        </Link>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Trust & Security Section */}
        <div className="border-t border-os-accent/30 pt-4 md:pt-6 lg:pt-8 mb-4 md:mb-6 lg:mb-8">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Shield className="w-4 h-4 md:w-5 md:h-5 text-os-accent flex-shrink-0" />
            <h3 className="text-os-base md:text-os-lg font-bold text-os-accent">Your Trust & Security Are Our Priority</h3>
          </div>
          <p className="text-os-xs md:text-os-sm text-afrikoni-cream/90 mb-4 md:mb-6">Built with verification, secure transactions, and trade protection from day one.</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="flex items-start gap-2 md:gap-3">
              <Lock className="w-5 h-5 md:w-6 md:h-6 text-os-accent flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-afrikoni-cream mb-1 text-os-xs md:text-os-sm">Secure Transactions</div>
                <div className="text-os-xs md:text-os-sm text-afrikoni-cream/80">Trade with protection mechanisms designed to reduce risk and fraud</div>
              </div>

            </div>
            <div className="flex items-start gap-2 md:gap-3">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-os-accent flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-afrikoni-cream mb-1 text-os-xs md:text-os-sm">Verified Suppliers</div>
                <div className="text-os-xs md:text-os-sm text-afrikoni-cream/80">Suppliers complete identity and business verification before gaining full access</div>
              </div>

            </div>
            <div className="flex items-start gap-2 md:gap-3 sm:col-span-2 md:col-span-1">
              <Award className="w-5 h-5 md:w-6 md:h-6 text-os-accent flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-afrikoni-cream mb-1 text-os-xs md:text-os-sm">Trade Protection</div>
                <div className="text-os-xs md:text-os-sm text-afrikoni-cream/80">Clear rules, dispute handling, and enforcement standards</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-os-accent/30 pt-4 md:pt-6 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
            <Logo type="icon" size="sm" link={false} className="text-os-accent" />
            <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
              <div className="px-2 md:px-3 py-0.5 md:py-1 border border-os-accent rounded-full text-os-xs md:text-os-xs text-os-accent whitespace-nowrap">SSL Secured</div>
              <div className="px-2 md:px-3 py-0.5 md:py-1 border border-os-accent rounded-full text-os-xs md:text-os-xs text-os-accent whitespace-nowrap">256-bit Encryption</div>
              <div className="px-2 md:px-3 py-0.5 md:py-1 border border-os-accent rounded-full text-os-xs md:text-os-xs text-os-accent whitespace-nowrap">ISO Certified</div>
              <div className="px-2 md:px-3 py-0.5 md:py-1 border border-os-accent rounded-full text-os-xs md:text-os-xs text-os-accent whitespace-nowrap">Verified Platform</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
            <div className="flex gap-2 md:gap-3">
              {[
                { icon: Instagram, href: 'https://instagram.com/afrikoni_official', label: 'Instagram' },
                { icon: Linkedin, href: 'https://linkedin.com/company/afrikoni', label: 'LinkedIn' },
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Youtube, href: '#', label: 'YouTube' },
                { icon: null, href: '#', label: 'TikTok', customIcon: 'TikTok' },
                { icon: null, href: '#', label: 'Pinterest', customIcon: 'Pinterest' }
              ].map((social, idx) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={idx}
                    href={social.href}
                    target={social.href !== '#' ? '_blank' : undefined}
                    rel={social.href !== '#' ? 'noopener noreferrer' : undefined}
                    whileHover={{ scale: 1.2, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-afrikoni-cream/70 hover:text-os-accent transition-colors"
                    aria-label={social.label}
                  >
                    {Icon ? (
                      <Icon className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <span className="text-os-xs font-semibold">{social.customIcon}</span>
                    )}
                  </motion.a>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-os-xs md:text-os-xs lg:text-os-sm">
              <motion.div whileHover={{ x: 2 }}>
                <Link
                  to={`/${language}/trust`}
                  className="text-afrikoni-cream/70 hover:text-os-accent transition-colors whitespace-nowrap"
                >
                  Marketplace Rules
                </Link>
              </motion.div>
              <motion.div whileHover={{ x: 2 }}>
                <Link
                  to={`/${language}/legal/privacy`}
                  className="text-afrikoni-cream/70 hover:text-os-accent transition-colors whitespace-nowrap"
                >
                  Privacy Policy
                </Link>
              </motion.div>
              <motion.div whileHover={{ x: 2 }}>
                <Link
                  to={`/${language}/legal/terms`}
                  className="text-afrikoni-cream/70 hover:text-os-accent transition-colors whitespace-nowrap"
                >
                  Terms of Use
                </Link>
              </motion.div>
              <motion.div whileHover={{ x: 2 }}>
                <Link
                  to={`/${language}/cookie-policy`}
                  className="text-afrikoni-cream/70 hover:text-os-accent transition-colors whitespace-nowrap"
                >
                  Cookie Policy
                </Link>
              </motion.div>
              <span className="text-afrikoni-cream/70 whitespace-nowrap">© 2026 Afrikoni. All rights reserved.</span>
            </div>
          </div>
        </div>

        {/* Global Disclaimer */}
        <div className="border-t border-os-accent/30 pt-4 md:pt-6">
          <p className="text-os-xs text-afrikoni-cream/70 text-center max-w-4xl mx-auto leading-relaxed">
            Product volumes shown include verified supplier catalogs and partner inventories available during our beta phase.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }) {
  // ✅ KERNEL COMPLIANCE: Use AuthProvider as single source of truth
  // Remove duplicate auth state - AuthProvider owns all auth state
  const { user, loading: authLoading, authReady } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const pathParts = location.pathname.split('/');
  const isDashboardRoute = pathParts.includes('dashboard');
  // Check if we're on a product page (where sticky CTA will be shown)
  const isProductPage = pathParts.includes('product');

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    try {
      // ✅ REFERENCE CLEANUP: Use direct supabase signOut - AuthProvider handles state via SIGNED_OUT event
      // No need for setUser - AuthProvider's onAuthStateChange listener will clear state automatically
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;

      // Clear storage (non-blocking)
      try {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
      } catch (storageError) {
        console.error('[Layout] Storage clear error:', storageError);
      }

      // Hard redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, force redirect
      window.location.href = '/login';
    }
  };

  // ✅ PUBLIC PAGES FIX: Only wait for auth on dashboard routes, not public pages
  // Public pages should render immediately without waiting for auth
  if (isDashboardRoute) {
    // For dashboard routes, wait for auth ready
    if (!authReady || authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-os-bg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-os-accent" />
        </div>
      );
    }
    // Dashboard has its own layout
    return <>{children}</>;
  }

  // Public pages render immediately without auth check

  // On mobile, use MobileLayout (which includes its own header and bottom nav)
  // On desktop, use the traditional layout
  // IMPORTANT: Don't use MobileLayout for dashboard routes (they have their own layout)
  if (isMobile && !isDashboardRoute) {
    try {
      return (
        <div className="min-h-screen bg-os-bg relative overflow-visible transition-colors duration-500">
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-os-accent" /></div>}>
            <MobileLayout user={user}>
              {children}
            </MobileLayout>
          </Suspense>

          {/* WhatsApp Sticky Button - MobileLayout handles positioning */}
          <WhatsAppButton />

          {/* Cookie Banner */}
          <CookieBanner />
        </div>
      );
    } catch (error) {
      // Fallback to desktop layout if MobileLayout fails
      console.error('MobileLayout error:', error);
      // Continue to desktop layout below
    }
  }

  // Desktop layout (unchanged)
  return (
    <div className="min-h-screen bg-os-bg relative overflow-visible transition-colors duration-500">
      {/* ✅ WCAG 2.4.1: Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Navbar - Fixed at top (80px height) */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* Main Content - Add padding-top for navbar (80px), padding-bottom for mobile nav (88px includes safe area) */}
      <main id="main-content" className="bg-os-bg pt-[80px] pb-[88px] md:pb-0 relative overflow-visible" role="main">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation (Main Site) - Hidden on product pages (sticky CTA shown instead) */}
      {!isProductPage && !isDashboardRoute && <MobileMainNav user={user} />}

      {/* WhatsApp Sticky Button */}
      <WhatsAppButton />



      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  );
}
