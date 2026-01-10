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

  // PHASE 5B: Simplified navigation items based on capabilities (not role)
  const getNavItems = () => {
    // If seller or hybrid (buyer + seller), show seller-focused nav
    if (isSeller || isHybrid) {
      return [
        { icon: LayoutDashboard, label: t('dashboard.title') || 'Dashboard', path: '/dashboard' },
        { icon: Package, label: t('dashboard.products') || 'Products', path: '/dashboard/products' },
        { icon: ShoppingCart, label: t('dashboard.orders') || 'Orders', path: '/dashboard/orders' },
        { icon: FileText, label: t('dashboard.rfqs') || 'RFQs', path: '/dashboard/rfqs' },
        { icon: MessageSquare, label: t('dashboard.messages') || 'Messages', path: '/messages' }
      ];
    } else {
      // Buyer-only or logistics-only (default buyer nav)
      return [
        { icon: LayoutDashboard, label: t('dashboard.title') || 'Dashboard', path: '/dashboard' },
        { icon: ShoppingCart, label: t('dashboard.orders') || 'Orders', path: '/dashboard/orders' },
        { icon: FileText, label: t('dashboard.rfqs') || 'RFQs', path: '/dashboard/rfqs' },
        { icon: MessageSquare, label: t('dashboard.messages') || 'Messages', path: '/messages' },
        { icon: Package, label: t('marketplace.browseProducts') || 'Browse', path: '/marketplace' }
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-afrikoni-gold/30 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      role="navigation"
      aria-label="Dashboard navigation"
    >
      {/* Safe area padding for notched devices - 44px minimum tap targets */}
      <div className="flex items-center justify-around px-1 py-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === '/dashboard' && location.pathname.startsWith('/dashboard') && 
             !location.pathname.includes('/orders') && 
             !location.pathname.includes('/rfqs') && 
             !location.pathname.includes('/products') &&
             !location.pathname.includes('/messages'));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
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
                  layoutId="activeBottomNav"
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

