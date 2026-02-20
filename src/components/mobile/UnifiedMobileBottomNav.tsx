/**
 * UNIFIED MOBILE BOTTOM NAVIGATION (PREMIUM)
 * Apple iOS + Hermès Luxury Standard
 * 
 * Consolidates all mobile navigation logic into a single, high-fidelity component.
 * - Role-aware (Buyer, Seller, Logistics)
 * - Premium animations (Framer Motion)
 * - Safe-area support
 * - Central "Action" button context-aware
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Home,
    ShoppingBag,
    Plus,
    MessageSquare,
    User,
    Search,
    LayoutDashboard,
    Package,
    TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface UnifiedMobileBottomNavProps {
    user?: any;
    userRole?: 'buyer' | 'seller' | 'hybrid' | 'logistics';
}

export default function UnifiedMobileBottomNav({
    user,
    userRole = 'buyer'
}: UnifiedMobileBottomNavProps) {
    const location = useLocation();
    const { language = 'en', t } = useLanguage();

    const isDashboard = location.pathname.includes('/dashboard');

    // Navigation logic tailored by role and context
    const getNavItems = () => {
        const baseItems = [
            {
                key: 'home',
                icon: isDashboard ? LayoutDashboard : Home,
                label: isDashboard ? 'Home' : (t('nav.home') || 'Home'),
                path: isDashboard ? `/${language}/dashboard` : `/${language}`,
            },
            {
                key: 'browse',
                icon: isDashboard ? Package : ShoppingBag,
                label: isDashboard ? 'Inventory' : (t('nav.marketplace') || 'Marketplace'),
                path: isDashboard ? `/${language}/dashboard/products` : `/${language}/marketplace`,
            },
            {
                key: 'action',
                icon: isDashboard ? Plus : Search,
                label: isDashboard ? 'New' : 'Search',
                path: isDashboard ? '#' : `/${language}/marketplace`,
                primary: true, // Central action
            },
            {
                key: 'messages',
                icon: MessageSquare,
                label: t('nav.messages') || 'Messages',
                path: user ? `/${language}/inbox-mobile` : `/${language}/login`,
            },
            {
                key: 'account',
                icon: User,
                label: user ? (t('nav.profile') || 'Account') : (t('nav.login') || 'Login'),
                path: user ? `/${language}/dashboard/settings` : `/${language}/login`,
            }
        ];

        // Role-specific overrides for dashboard
        if (isDashboard) {
            if (userRole === 'seller' || userRole === 'hybrid') {
                baseItems[1].label = 'Products';
            }
            if (userRole === 'logistics') {
                baseItems[1].label = 'Shipments';
                baseItems[1].path = `/${language}/dashboard/shipments`;
            }
        }

        return baseItems;
    };

    const navItems = getNavItems();

    const isActive = (path: string) => {
        if (path === '#' || path === '') return false;
        if (path === `/${language}` || path === `/${language}/dashboard`) {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-os-accent/10 shadow-[0_-4px_32px_rgba(0,0,0,0.06)]"
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
                                item.primary && "mx-1"
                            )}
                        >
                            {/* Active Highlight */}
                            {active && !item.primary && (
                                <motion.div
                                    layoutId="bottomNavHighlight"
                                    className="absolute inset-0 bg-os-accent/8 rounded-2xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            {/* Icon Container */}
                            <div
                                className={cn(
                                    "relative flex items-center justify-center",
                                    "w-11 h-11 rounded-2xl",
                                    "transition-all duration-200 ease-out",
                                    item.primary && [
                                        "bg-gradient-to-br from-os-accent to-os-accent-dark",
                                        "shadow-[0_4px_16px_rgba(217,156,85,0.3)] text-white",
                                        "scale-110"
                                    ],
                                    !item.primary && active && "scale-105"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "transition-all duration-200",
                                        item.primary
                                            ? "w-6 h-6"
                                            : active
                                                ? "w-6 h-6 text-afrikoni-deep"
                                                : "w-5 h-5 text-afrikoni-deep/40"
                                    )}
                                    strokeWidth={active || item.primary ? 2.5 : 2}
                                />
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest relative z-10 scale-90",
                                    "transition-all duration-200",
                                    active || item.primary
                                        ? "text-afrikoni-deep opacity-100"
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
