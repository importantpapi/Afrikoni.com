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
  const { language = 'en', t } = useLanguage();

  // Core navigation items for main site
  // Use unique keys to prevent React duplicate key warnings
  const navItems = [
    {
      key: 'main-nav-home',
      icon: Home,
      label: t('nav.home') || 'Home',
      path: `/${language}`,
      ariaLabel: 'Go to homepage'
    },
    {
      key: 'main-nav-marketplace',
      icon: ShoppingBag,
      label: t('nav.marketplace') || 'Marketplace',
      path: `/${language}/marketplace`,
      ariaLabel: 'Browse marketplace'
    },
    {
      key: 'main-nav-rfq',
      icon: FileText,
      label: t('nav.rfq') || 'RFQ',
      path: `/${language}/rfq/create-mobile`,
      ariaLabel: 'Create RFQ'
    },
    {
      key: 'main-nav-messages',
      icon: MessageSquare,
      label: t('nav.messages') || 'Messages',
      path: user ? `/${language}/inbox-mobile` : `/${language}/login`,
      ariaLabel: 'View messages'
    },
    {
      key: 'main-nav-profile',
      icon: User,
      label: user ? (t('nav.profile') || 'Profile') : (t('nav.login') || 'Login'),
      path: user ? `/${language}/dashboard` : `/${language}/login`,
      ariaLabel: user ? 'Go to dashboard' : 'Login or signup'
    }
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl border-t border-os-accent/20 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Safe area padding for notched devices */}
      <div className="flex items-center justify-around px-1 py-3 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const pathParts = location.pathname.split('/');
          const isActive = location.pathname === item.path ||
            (item.path === `/${language}` && location.pathname === `/${language}`) ||
            (item.path === `/${language}/marketplace` && location.pathname.startsWith(`/${language}/marketplace`)) ||
            (item.key === 'main-nav-rfq' && (pathParts.includes('rfq') || pathParts.includes('requests'))) ||
            (item.key === 'main-nav-messages' && (pathParts.includes('inbox') || pathParts.includes('messages'))) ||
            (item.key === 'main-nav-profile' && (pathParts.includes('dashboard') || pathParts.includes('login')));

          return (
            <Link
              key={item.key}
              to={item.path}
              aria-label={item.ariaLabel}
              className={`
                flex flex-col items-center justify-center gap-1 
                min-w-[48px] min-h-[48px] px-2 py-2
                rounded-xl transition-all duration-200 ease-out
                touch-manipulation active:scale-[0.92]
                ${isActive
                  ? 'text-os-accent bg-os-accent/12 shadow-sm scale-105'
                  : 'text-afrikoni-deep/70 hover:text-os-accent hover:bg-os-accent/5'
                }
              `}
            >
              <Icon
                className={`w-6 h-6 ${isActive ? 'text-os-accent' : 'text-afrikoni-deep/70'}`}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
              <span
                className={`text-os-xs font-medium leading-tight text-center ${isActive
                    ? 'text-os-accent font-semibold'
                    : 'text-afrikoni-deep/70'
                  }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeMainNav"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-os-accent rounded-b-full"
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

