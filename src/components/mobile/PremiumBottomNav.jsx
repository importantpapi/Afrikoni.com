/**
 * PREMIUM MOBILE BOTTOM NAVIGATION
 * Apple iOS + Hermès Standard
 * 
 * Redesigned for:
 * - Native iOS feel
 * - Soft, calm interactions
 * - Integrated RFQ action (not floating)
 * - Thumb-friendly spacing
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Plus,
  MessageSquare,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PremiumBottomNav({ user }) {
  const location = useLocation();

  const navItems = [
    {
      key: 'home',
      icon: Home,
      label: 'Home',
      path: '/',
      color: 'text-afrikoni-deep'
    },
    {
      key: 'browse',
      icon: Search,
      label: 'Browse',
      path: '/marketplace',
      color: 'text-afrikoni-deep'
    },
    {
      key: 'rfq',
      icon: Plus,
      label: 'RFQ',
      path: '/rfq/create-mobile',
      color: 'text-os-accent',
      primary: true // Central action
    },
    {
      key: 'messages',
      icon: MessageSquare,
      label: 'Messages',
      path: user ? '/inbox-mobile' : '/login',
      color: 'text-afrikoni-deep'
    },
    {
      key: 'account',
      icon: User,
      label: user ? 'Account' : 'Login',
      path: user ? '/dashboard' : '/login',
      color: 'text-afrikoni-deep'
    }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-os-accent/10 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.key}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1",
                "min-w-[64px] min-h-[56px] rounded-2xl",
                "transition-all duration-200 ease-out",
                "touch-manipulation active:scale-95",
                item.primary && "mx-2" // Extra spacing for primary action
              )}
            >
              {/* Background highlight (active state) - Neutral, not gold */}
              {active && !item.primary && (
                <motion.div
                  layoutId="bottomNavHighlight"
                  className="absolute inset-0 bg-afrikoni-deep/6 rounded-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Icon Container */}
              <div
                className={cn(
                  "relative flex items-center justify-center",
                  "w-12 h-12 rounded-2xl",
                  "transition-all duration-200 ease-out",
                  item.primary && [
                    "bg-gradient-to-br from-os-accent to-os-accent-dark",
                    "shadow-[0_4px_16px_rgba(217,156,85,0.25)]",
                    active && "scale-105"
                  ],
                  !item.primary && active && "scale-110"
                )}
              >
                <Icon
                  className={cn(
                    "transition-all duration-200",
                    item.primary
                      ? "w-6 h-6 text-white"
                      : active
                      ? "w-6 h-6 text-afrikoni-deep"
                      : "w-5 h-5 text-afrikoni-deep/50"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wide relative z-10",
                  "transition-all duration-200",
                  item.primary
                    ? "text-os-accent"
                    : active
                    ? "text-afrikoni-deep"
                    : "text-afrikoni-deep/40"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
