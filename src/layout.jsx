import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseHelpers, supabase } from '@/api/supabaseClient';
import { createPageUrl } from './utils';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Lock, Shield, Award, CheckCircle, Linkedin, Twitter, Facebook, Instagram, Youtube, ChevronDown, MessageCircle } from 'lucide-react';
// Note: TikTok and Pinterest icons may need to be added via custom SVG or icon library
import Navbar from './components/layout/Navbar';
import { Logo } from '@/components/ui/Logo';
import WhatsAppButton from './components/ui/WhatsAppButton';
import CookieBanner from './components/ui/CookieBanner';
import NewsletterPopup from './components/ui/NewsletterPopup';
import MobileTrustBadge from './components/ui/MobileTrustBadge';

function Footer() {
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
    { to: '/products', label: 'Browse Products' },
    { to: '/suppliers', label: 'Find Suppliers' },
    { to: '/signup', label: 'Join as Buyer' },
    { to: '/dashboard/rfqs/new', label: 'Request Quotes' },
    { to: '/dashboard', label: 'Buyer Central' }
  ];

  const sellerLinks = [
    { to: '/supplier-hub', label: 'Supplier Hub' },
    { to: '/signup', label: 'Start Selling' },
    { to: '/dashboard/products/new', label: 'List Products' },
    { to: '/dashboard', label: 'Seller Dashboard' },
    { to: '/verification-center', label: 'Get Verified' }
  ];

  const companyLinks = [
    { to: '/buyer-hub', label: 'How Sourcing Works' },
    { to: '/supplier-hub', label: 'How Selling Works' },
    { to: '/trust', label: 'Trust Center' },
    { to: '/about', label: 'About Us' },
    { to: '/logistics', label: 'Logistics' },
    { to: '/order-protection', label: 'Trust & Safety' },
    { to: '/help', label: 'Help Center' },
    { to: '/contact', label: 'Contact Us' },
    { to: '/community', label: 'Join Community', icon: MessageCircle, highlight: true }
  ];

  return (
    <footer className="bg-afrikoni-chestnut text-afrikoni-cream mt-12 md:mt-16">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 lg:py-12">
        <div className="grid md:grid-cols-4 gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-10 lg:mb-12">
          {/* Company Info - Always visible */}
          <div>
            <div className="mb-3 md:mb-4">
              <Logo type="full" size="sm" link={true} className="text-afrikoni-cream" />
            </div>
            <p className="text-xs md:text-sm text-afrikoni-cream/90 mb-3 md:mb-4 leading-relaxed">
              Afrikoni — Africa's trusted B2B trade engine.
              <br />
              Connecting suppliers, buyers & logistics across 54 countries.
            </p>
            <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm mb-4 md:mb-6">
              <motion.div 
                whileHover={{ x: 4 }}
                className="flex items-center gap-2"
              >
                <Mail className="w-3 h-3 md:w-4 md:h-4 text-afrikoni-gold flex-shrink-0" />
                <a href="mailto:hello@afrikoni.com" className="hover:text-afrikoni-gold transition-colors break-all">hello@afrikoni.com</a>
              </motion.div>
              <motion.div 
                whileHover={{ x: 4 }}
                className="flex items-center gap-2"
              >
                <Phone className="w-3 h-3 md:w-4 md:h-4 text-afrikoni-gold flex-shrink-0" />
                <a href="tel:+2341234567890" className="hover:text-afrikoni-gold transition-colors">+234 (0) 123 456 7890</a>
              </motion.div>
              <motion.div 
                whileHover={{ x: 4 }}
                className="flex items-center gap-2"
              >
                <MapPin className="w-3 h-3 md:w-4 md:h-4 text-afrikoni-gold flex-shrink-0" />
                <span className="text-afrikoni-gold font-medium">Lagos, Nigeria HQ</span>
              </motion.div>
            </div>
            {/* Additional CTAs - Hidden on mobile */}
            <div className="hidden md:flex flex-col gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/signup">
                  <Button className="w-full bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight text-sm py-2">
                    Become a Supplier
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/signup">
                  <Button variant="secondary" className="w-full text-sm py-2">
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
              <h4 className="font-semibold text-afrikoni-gold text-sm md:text-base">For Buyers</h4>
              <ChevronDown 
                className={`w-4 h-4 md:hidden text-afrikoni-gold transition-transform duration-200 ${
                  openSections.buyers ? 'rotate-180' : ''
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
                  className="space-y-1.5 md:space-y-2 text-xs md:text-sm overflow-hidden md:overflow-visible"
                >
                  {buyerLinks.map((item, idx) => (
                    <motion.li
                      key={idx}
                      whileHover={{ x: 4 }}
                      className="md:block"
                    >
                      <Link to={item.to} className="hover:text-afrikoni-gold transition-colors block text-afrikoni-cream/90 py-1">
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
              <h4 className="font-semibold text-afrikoni-gold text-sm md:text-base">For Sellers</h4>
              <ChevronDown 
                className={`w-4 h-4 md:hidden text-afrikoni-gold transition-transform duration-200 ${
                  openSections.sellers ? 'rotate-180' : ''
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
                  className="space-y-1.5 md:space-y-2 text-xs md:text-sm overflow-hidden md:overflow-visible"
                >
                  {sellerLinks.map((item, idx) => (
                    <motion.li
                      key={idx}
                      whileHover={{ x: 4 }}
                      className="md:block"
                    >
                      <Link to={item.to} className="hover:text-afrikoni-gold transition-colors block text-afrikoni-cream/90 py-1">
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
              <h4 className="font-semibold text-afrikoni-gold text-sm md:text-base">Company</h4>
              <ChevronDown 
                className={`w-4 h-4 md:hidden text-afrikoni-gold transition-transform duration-200 ${
                  openSections.support ? 'rotate-180' : ''
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
                  className="space-y-1.5 md:space-y-2 text-xs md:text-sm overflow-hidden md:overflow-visible"
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
                          className={`hover:text-afrikoni-gold transition-colors block text-afrikoni-cream/90 py-1 flex items-center gap-2 ${item.highlight ? 'text-afrikoni-gold font-semibold' : ''}`}
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
        <div className="border-t border-afrikoni-gold/30 pt-4 md:pt-6 lg:pt-8 mb-4 md:mb-6 lg:mb-8">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Shield className="w-4 h-4 md:w-5 md:h-5 text-afrikoni-gold flex-shrink-0" />
            <h3 className="text-base md:text-lg font-bold text-afrikoni-gold">Your Trust & Security Are Our Priority</h3>
          </div>
          <p className="text-xs md:text-sm text-afrikoni-cream/90 mb-4 md:mb-6">Join 50,000+ businesses trading safely on Afrikoni</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="flex items-start gap-2 md:gap-3">
              <Lock className="w-5 h-5 md:w-6 md:h-6 text-afrikoni-gold flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-afrikoni-cream mb-1 text-xs md:text-sm">Secure Payments</div>
                <div className="text-xs md:text-sm text-afrikoni-cream/80">Bank-grade security with escrow protection</div>
              </div>
            </div>
            <div className="flex items-start gap-2 md:gap-3">
              <Shield className="w-5 h-5 md:w-6 md:h-6 text-afrikoni-gold flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-afrikoni-cream mb-1 text-xs md:text-sm">Verified Suppliers</div>
                <div className="text-xs md:text-sm text-afrikoni-cream/80">Every supplier thoroughly vetted and verified</div>
              </div>
            </div>
            <div className="flex items-start gap-2 md:gap-3 sm:col-span-2 md:col-span-1">
              <Award className="w-5 h-5 md:w-6 md:h-6 text-afrikoni-gold flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-afrikoni-cream mb-1 text-xs md:text-sm">Quality Guarantee</div>
                <div className="text-xs md:text-sm text-afrikoni-cream/80">Money-back guarantee on all transactions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-afrikoni-gold/30 pt-4 md:pt-6 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
            <Logo type="icon" size="sm" link={false} className="text-afrikoni-gold" />
            <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
              <div className="px-2 md:px-3 py-0.5 md:py-1 border border-afrikoni-gold rounded-full text-[10px] md:text-xs text-afrikoni-gold whitespace-nowrap">SSL Secured</div>
              <div className="px-2 md:px-3 py-0.5 md:py-1 border border-afrikoni-gold rounded-full text-[10px] md:text-xs text-afrikoni-gold whitespace-nowrap">256-bit Encryption</div>
              <div className="px-2 md:px-3 py-0.5 md:py-1 border border-afrikoni-gold rounded-full text-[10px] md:text-xs text-afrikoni-gold whitespace-nowrap">ISO Certified</div>
              <div className="px-2 md:px-3 py-0.5 md:py-1 border border-afrikoni-gold rounded-full text-[10px] md:text-xs text-afrikoni-gold whitespace-nowrap">Verified Platform</div>
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
                    className="text-afrikoni-cream/70 hover:text-afrikoni-gold transition-colors"
                    aria-label={social.label}
                  >
                    {Icon ? (
                      <Icon className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <span className="text-xs font-semibold">{social.customIcon}</span>
                    )}
                  </motion.a>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-[10px] md:text-xs lg:text-sm">
              <motion.a 
                href="/privacy" 
                whileHover={{ x: 2 }}
                className="text-afrikoni-cream/70 hover:text-afrikoni-gold transition-colors whitespace-nowrap"
              >
                Privacy Policy
              </motion.a>
              <motion.a 
                href="/terms" 
                whileHover={{ x: 2 }}
                className="text-afrikoni-cream/70 hover:text-afrikoni-gold transition-colors whitespace-nowrap"
              >
                Terms & Conditions
              </motion.a>
              <motion.a 
                href="/cookies" 
                whileHover={{ x: 2 }}
                className="text-afrikoni-cream/70 hover:text-afrikoni-gold transition-colors whitespace-nowrap"
              >
                Cookie Policy
              </motion.a>
              <span className="text-afrikoni-cream/70 whitespace-nowrap">© 2025 Afrikoni. All rights reserved.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on a dashboard route - don't show main layout for dashboard
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    loadUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUser();
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
    } catch (error) {
      // Silently fail for unauthenticated users - this is normal
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabaseHelpers.auth.signOut();
      setUser(null);
      navigate('/');
    } catch (error) {
      // Error logged (removed for production)
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  // If on dashboard route, don't render main layout (dashboard has its own layout)
  if (isDashboardRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-afrikoni-offwhite">
      {/* Navbar */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="bg-afrikoni-offwhite">{children}</main>

      {/* Footer */}
      <Footer />

      {/* WhatsApp Sticky Button */}
      <WhatsAppButton />

      {/* Cookie Banner */}
      <CookieBanner />

      {/* Newsletter Popup */}
      <NewsletterPopup />

      {/* Mobile Trust Badge */}
      <MobileTrustBadge />
    </div>
  );
}
