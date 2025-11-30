import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3x3, ShoppingBag, Store, Truck, Shield, FileText,
  HelpCircle, Globe, ChevronDown, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';

export default function Navigation({ user, onLogout }) {
  const location = useLocation();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('EN');

  const navLinks = [
    { label: 'All Categories', icon: Grid3x3, path: '/categories', hasDropdown: false },
    { label: 'Marketplace', icon: ShoppingBag, path: '/marketplace', hasDropdown: false },
    { label: 'Buyer Hub', icon: ShoppingBag, path: '/buyer-hub', hasDropdown: false },
    { label: 'Supplier Hub', icon: Store, path: '/supplier-hub', hasDropdown: false },
    { label: 'Logistics & Shipping', icon: Truck, path: '/logistics', hasDropdown: false },
    { label: 'Order Protection', icon: Shield, path: '/order-protection', hasDropdown: false },
    { label: 'RFQ', icon: FileText, path: '/rfq', hasDropdown: false },
    { label: 'Help Center', icon: HelpCircle, path: '/help', hasDropdown: false },
  ];

  const languages = [
    { code: 'EN', name: 'English', flag: '🇬🇧' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'AR', name: 'العربية', flag: '🇸🇦' },
    { code: 'PT', name: 'Português', flag: '🇵🇹' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="hidden lg:flex items-center gap-6">
      {navLinks.map((link, idx) => {
        const Icon = link.icon;
        const active = isActive(link.path);
        
        return (
          <Link
            key={idx}
            to={link.path}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${active 
                ? 'text-afrikoni-gold bg-afrikoni-gold/10' 
                : 'text-afrikoni-deep hover:text-afrikoni-gold hover:bg-afrikoni-gold/5'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{link.label}</span>
            {link.hasDropdown && <ChevronDown className="w-3 h-3 ml-1" />}
          </Link>
        );
      })}

      {/* Language Selector */}
      <div className="relative">
        <button
          onClick={() => setLanguageOpen(!languageOpen)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10 transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>{selectedLanguage}</span>
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
                      w-full text-left px-4 py-2 text-sm hover:bg-afrikoni-gold/10 transition-colors
                      ${selectedLanguage === lang.code ? 'bg-afrikoni-gold/15 text-afrikoni-gold' : 'text-afrikoni-deep'}
                    `}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* CTA: Start Selling */}
      {!user && (
        <Link to="/signup">
          <Button className="bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight">
            Start Selling
          </Button>
        </Link>
      )}
    </nav>
  );
}
