/**
 * Mobile Main Navigation (Bottom Nav)
 * 
 * Mobile-first bottom navigation for main site pages (non-dashboard)
 * Designed for one-handed use with 44px+ tap targets
 * 
 * Features:
 * - Thumb-friendly positioning
 * - High contrast for sunlight readability
 * - Clear labels (no icon-only)
 * - Safe area support for notched devices
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  ShoppingBag,
  FileText,
  MessageSquare,
  User
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function MobileMainNav({ user }) {
  const location = useLocation();
  const { t } = useLanguage();

  // Core navigation items for main site
  const navItems = [
    { 
      icon: Home, 
      label: t('nav.home') || 'Home', 
      path: '/',
      ariaLabel: 'Go to homepage'
    },
    { 
      icon: ShoppingBag, 
      label: t('nav.marketplace') || 'Marketplace', 
      path: '/marketplace',
      ariaLabel: 'Browse marketplace'
    },
    { 
      icon: FileText, 
      label: t('nav.rfq') || 'RFQ', 
      path: '/rfq/create-mobile',
      ariaLabel: 'Create RFQ'
    },
    { 
      icon: MessageSquare, 
      label: t('nav.messages') || 'Messages', 
      path: user ? '/inbox-mobile' : '/login',
      ariaLabel: 'View messages'
    },
    { 
      icon: User, 
      label: user ? (t('nav.profile') || 'Profile') : (t('nav.login') || 'Login'), 
      path: user ? '/dashboard' : '/login',
      ariaLabel: user ? 'Go to dashboard' : 'Login or signup'
    }
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-afrikoni-gold/30 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Safe area padding for notched devices */}
      <div className="flex items-center justify-around px-1 py-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === '/' && location.pathname === '/') ||
            (item.path === '/marketplace' && location.pathname.startsWith('/marketplace')) ||
            (item.path === '/rfq-start' && location.pathname.startsWith('/rfq')) ||
            (item.path === '/messages-premium' && location.pathname.startsWith('/messages')) ||
            (item.path === '/dashboard' && location.pathname.startsWith('/dashboard'));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.ariaLabel}
              className={`
                flex flex-col items-center justify-center gap-1 
                min-w-[44px] min-h-[44px] px-2 py-2
                rounded-lg transition-all duration-200
                touch-manipulation active:scale-95
                ${isActive 
                  ? 'text-afrikoni-gold bg-afrikoni-gold/10' 
                  : 'text-afrikoni-deep/70 active:text-afrikoni-gold'
                }
              `}
            >
              <Icon 
                className={`w-6 h-6 ${isActive ? 'text-afrikoni-gold' : 'text-afrikoni-deep/70'}`}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
              <span 
                className={`text-[11px] font-medium leading-tight text-center ${
                  isActive 
                    ? 'text-afrikoni-gold font-semibold' 
                    : 'text-afrikoni-deep/70'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeMainNav"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-afrikoni-gold rounded-b-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

