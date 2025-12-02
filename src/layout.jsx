import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabaseHelpers, supabase } from '@/api/supabaseClient';
import { createPageUrl } from './utils';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Lock, Shield, Award, CheckCircle, Linkedin, Twitter, Facebook, Instagram, Youtube } from 'lucide-react';
import Navbar from './components/layout/Navbar';
import { Logo } from '@/components/ui/Logo';

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
      <footer className="bg-afrikoni-chestnut text-afrikoni-cream mt-12 md:mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
          <div className="grid md:grid-cols-4 gap-8 md:gap-12 mb-10 md:mb-12">
            {/* Company Info */}
            <div>
              <div className="mb-4">
                <Logo type="full" size="sm" link={true} className="text-afrikoni-cream" />
              </div>
              <p className="text-sm text-afrikoni-cream mb-4">
                Africa's leading B2B marketplace connecting verified suppliers and buyers across 54 countries. Trade with confidence, grow with Africa.
              </p>
              <div className="space-y-2 text-sm mb-6">
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-afrikoni-gold" />
                  <a href="mailto:hello@afrikoni.com" className="hover:text-afrikoni-gold transition-colors">hello@afrikoni.com</a>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 text-afrikoni-gold" />
                  <a href="tel:+2341234567890" className="hover:text-afrikoni-gold transition-colors">+234 (0) 123 456 7890</a>
                </motion.div>
                <motion.div 
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-afrikoni-gold" />
                  <span className="text-afrikoni-gold font-medium">Lagos, Nigeria HQ</span>
                </motion.div>
              </div>
              {/* Additional CTAs */}
              <div className="flex flex-col gap-2">
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

            {/* For Buyers */}
            <div>
              <h4 className="font-semibold text-afrikoni-gold mb-4">For Buyers</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { to: '/products', label: 'Browse Products' },
                  { to: '/suppliers', label: 'Find Suppliers' },
                  { to: '/signup', label: 'Join as Buyer' },
                  { to: '/dashboard/rfqs/new', label: 'Request Quotes' },
                  { to: '/dashboard', label: 'Buyer Central' }
                ].map((item, idx) => (
                  <motion.li
                    key={idx}
                    whileHover={{ x: 4 }}
                  >
                    <Link to={item.to} className="hover:text-afrikoni-gold transition-colors block text-afrikoni-cream">
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* For Sellers */}
            <div>
              <h4 className="font-semibold text-afrikoni-gold mb-4">For Sellers</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { to: '/supplier-hub', label: 'Supplier Hub' },
                  { to: '/signup', label: 'Start Selling' },
                  { to: '/dashboard/products/new', label: 'List Products' },
                  { to: '/dashboard', label: 'Seller Dashboard' },
                  { to: '/verification-center', label: 'Get Verified' }
                ].map((item, idx) => (
                  <motion.li
                    key={idx}
                    whileHover={{ x: 4 }}
                  >
                    <Link to={item.to} className="hover:text-afrikoni-gold transition-colors block text-afrikoni-cream">
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-afrikoni-gold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { to: '/buyer-hub', label: 'How Sourcing Works' },
                  { to: '/supplier-hub', label: 'How Selling Works' },
                  { to: '/order-protection', label: 'Trust & Safety' },
                  { to: '/help', label: 'Help Center' },
                  { to: '/contact', label: 'Contact Us' }
                ].map((item, idx) => (
                  <motion.li
                    key={idx}
                    whileHover={{ x: 4 }}
                  >
                    <Link to={item.to} className="hover:text-afrikoni-gold transition-colors block text-afrikoni-cream">
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trust & Security Section */}
          <div className="border-t border-afrikoni-gold/30 pt-8 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-afrikoni-gold" />
              <h3 className="text-lg font-bold text-afrikoni-gold">Your Trust & Security Are Our Priority</h3>
            </div>
            <p className="text-sm text-afrikoni-cream mb-6">Join 50,000+ businesses trading safely on Afrikoni</p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <Lock className="w-6 h-6 text-afrikoni-gold flex-shrink-0" />
                <div>
                  <div className="font-semibold text-afrikoni-cream mb-1">Secure Payments</div>
                  <div className="text-sm text-afrikoni-cream/80">Bank-grade security with escrow protection</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-afrikoni-gold flex-shrink-0" />
                <div>
                  <div className="font-semibold text-afrikoni-cream mb-1">Verified Suppliers</div>
                  <div className="text-sm text-afrikoni-cream/80">Every supplier thoroughly vetted and verified</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Award className="w-6 h-6 text-afrikoni-gold flex-shrink-0" />
                <div>
                  <div className="font-semibold text-afrikoni-cream mb-1">Quality Guarantee</div>
                  <div className="text-sm text-afrikoni-cream/80">Money-back guarantee on all transactions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-afrikoni-gold/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Logo type="icon" size="sm" link={false} className="text-afrikoni-gold" />
              <div className="flex gap-2">
                <div className="px-3 py-1 border border-afrikoni-gold rounded-full text-xs text-afrikoni-gold">SSL Secured</div>
                <div className="px-3 py-1 border border-afrikoni-gold rounded-full text-xs text-afrikoni-gold">256-bit Encryption</div>
                <div className="px-3 py-1 border border-afrikoni-gold rounded-full text-xs text-afrikoni-gold">ISO Certified</div>
                <div className="px-3 py-1 border border-afrikoni-gold rounded-full text-xs text-afrikoni-gold">Verified Platform</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-3">
                {[
                  { icon: Linkedin, href: '#' },
                  { icon: Twitter, href: '#' },
                  { icon: Facebook, href: '#' },
                  { icon: Instagram, href: '#' },
                  { icon: Youtube, href: '#' }
                ].map((social, idx) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={idx}
                      href={social.href}
                      whileHover={{ scale: 1.2, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-afrikoni-cream/70 hover:text-afrikoni-gold transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <motion.a 
                  href="#" 
                  whileHover={{ x: 2 }}
                  className="text-afrikoni-cream/70 hover:text-afrikoni-gold transition-colors"
                >
                  Privacy Policy
                </motion.a>
                <motion.a 
                  href="#" 
                  whileHover={{ x: 2 }}
                  className="text-afrikoni-cream/70 hover:text-afrikoni-gold transition-colors"
                >
                  Terms & Conditions
                </motion.a>
                <span className="text-afrikoni-cream/70">© 2025 Afrikoni. All rights reserved.</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

