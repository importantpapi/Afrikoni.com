import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, FileText, MessageSquare
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

// PHASE 5B: MobileBottomNav uses capability flags instead of role
export default function MobileBottomNav({
  isBuyer = true,
  isSeller = false,
  isLogistics = false,
  isHybrid = false
}) {
  const location = useLocation();
  const { t } = useLanguage();

  const getNavItems = () => {
    if (isSeller || isHybrid) {
      return [
        { icon: LayoutDashboard, label: t('dashboard.title') || 'Home', path: '/dashboard' },
        { icon: Package, label: t('dashboard.products') || 'Products', path: '/dashboard/products' },
        { icon: ShoppingCart, label: t('dashboard.orders') || 'Orders', path: '/dashboard/orders' },
        { icon: FileText, label: t('dashboard.rfqs') || 'RFQs', path: '/dashboard/rfqs' },
        { icon: MessageSquare, label: t('dashboard.messages') || 'Signals', path: '/dashboard/notifications' }
      ];
    } else {
      return [
        { icon: LayoutDashboard, label: t('dashboard.title') || 'Home', path: '/dashboard' },
        { icon: ShoppingCart, label: t('dashboard.orders') || 'Orders', path: '/dashboard/orders' },
        { icon: FileText, label: t('dashboard.rfqs') || 'RFQs', path: '/dashboard/rfqs' },
        { icon: MessageSquare, label: t('dashboard.messages') || 'Signals', path: '/dashboard/notifications' },
        { icon: Package, label: t('marketplace.browseProducts') || 'Browse', path: '/marketplace' }
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 dark:bg-[#0A0A0A] border-t dark:border-[#1E1E1E] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      role="navigation"
      aria-label="Dashboard navigation"
    >
      <div className="flex items-center justify-around px-1 py-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path === '/dashboard' && location.pathname.startsWith('/dashboard') &&
             !location.pathname.includes('/orders') &&
             !location.pathname.includes('/rfqs') &&
             !location.pathname.includes('/products') &&
             !location.pathname.includes('/notifications'));

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={`
                flex flex-col items-center justify-center gap-1
                min-w-[44px] min-h-[44px] px-2 py-2
                rounded-lg transition-all duration-200
                touch-manipulation active:scale-95 relative
                ${isActive
                  ? 'text-[#D4A937]'
                  : 'text-gray-400 dark:text-gray-500 active:text-[#D4A937]'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeBottomNav"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  aria-hidden="true"
                />
              )}
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-[#D4A937]' : ''}`}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
              <span
                className={`text-[10px] font-medium leading-tight text-center ${
                  isActive ? 'text-[#D4A937] font-semibold' : ''
                }`}
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
