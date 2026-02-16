/**
 * Mobile Bottom Navigation
 * 
 * Fixed 72px bottom navigation for mobile viewports
 * - Always visible
 * - Icons + translated labels
 * - Never overlaps content
 * - Safe area support
 * - z-index: 50
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

interface MobileBottomNavProps {
  user?: any;
  userRole?: 'buyer' | 'seller' | 'hybrid' | 'logistics';
}

export default function MobileBottomNav({ user, userRole = 'buyer' }: MobileBottomNavProps) {
  const location = useLocation();
  const { t, i18n } = useLanguage();

  // Ensure translations are initialized
  const isTranslationsReady = i18n.isInitialized;

  // Core navigation items for main site
  // Use unique keys to prevent React duplicate key warnings
  const navItems = [
    { 
      key: 'bottom-nav-home',
      icon: Home, 
      label: isTranslationsReady ? (t('nav.home') || 'Home') : 'Home', 
      path: '/',
      ariaLabel: 'Go to homepage'
    },
    { 
      key: 'bottom-nav-marketplace',
      icon: ShoppingBag, 
      label: isTranslationsReady ? (t('nav.marketplace') || 'Marketplace') : 'Marketplace', 
      path: '/marketplace',
      ariaLabel: 'Browse marketplace'
    },
    { 
      key: 'bottom-nav-rfq',
      icon: FileText, 
      label: isTranslationsReady ? (t('nav.rfq') || 'RFQ') : 'RFQ', 
      path: '/rfq/create-mobile',
      ariaLabel: 'Create RFQ'
    },
    { 
      key: 'bottom-nav-messages',
      icon: MessageSquare, 
      label: isTranslationsReady ? (t('nav.messages') || 'Messages') : 'Messages', 
      path: user ? '/inbox-mobile' : '/login',
      ariaLabel: 'View messages'
    },
    { 
      key: 'bottom-nav-profile',
      icon: User, 
      label: user 
        ? (isTranslationsReady ? (t('nav.profile') || 'Profile') : 'Profile')
        : (isTranslationsReady ? (t('nav.login') || 'Login') : 'Login'), 
      path: user ? '/dashboard' : '/login',
      ariaLabel: user ? 'Go to dashboard' : 'Login or signup'
    }
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50"
      role="navigation"
      aria-label="Main navigation"
      style={{ height: '64px' }}
    >
      {/* Safe area padding for notched devices */}
      <div className="flex items-center justify-around px-1 py-2 pb-safe h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === '/' && location.pathname === '/') ||
            (item.path === '/marketplace' && location.pathname.startsWith('/marketplace')) ||
            (item.path === '/rfq/create-mobile' && location.pathname.startsWith('/rfq')) ||
            (item.path === '/inbox-mobile' && location.pathname.startsWith('/messages')) ||
            (item.path === '/dashboard' && location.pathname.startsWith('/dashboard'));

          return (
            <Link
              key={item.key}
              to={item.path}
              aria-label={item.ariaLabel}
              className="
                flex flex-col items-center justify-center gap-1
                min-w-[60px] min-h-[48px] px-2 py-1.5
                text-gray-400
                transition-colors duration-150
                touch-manipulation
              "
            >
              <Icon
                className={`w-[22px] h-[22px] ${isActive ? 'text-gray-900' : 'text-gray-400'}`}
                strokeWidth={isActive ? 2 : 1.5}
                aria-hidden="true"
              />
              <span
                className={`text-[9px] font-normal leading-tight text-center ${
                  isActive ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeMainNav"
                  className="absolute -top-[0.5px] left-1/2 -translate-x-1/2 w-10 h-[1.5px] bg-gray-900"
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

