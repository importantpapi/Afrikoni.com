import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, FileText, MessageSquare
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function MobileBottomNav({ userRole = 'buyer' }) {
  const location = useLocation();
  const { t } = useLanguage();

  // Simplified navigation items for mobile bottom nav
  const getNavItems = () => {
    if (userRole === 'seller' || userRole === 'hybrid') {
      return [
        { icon: LayoutDashboard, label: t('dashboard.title') || 'Dashboard', path: '/dashboard' },
        { icon: Package, label: t('dashboard.products') || 'Products', path: '/dashboard/products' },
        { icon: ShoppingCart, label: t('dashboard.orders') || 'Orders', path: '/dashboard/orders' },
        { icon: FileText, label: t('dashboard.rfqs') || 'RFQs', path: '/dashboard/rfqs' },
        { icon: MessageSquare, label: t('dashboard.messages') || 'Messages', path: '/messages' }
      ];
    } else {
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-afrikoni-charcoal border-t border-afrikoni-gold/20 shadow-lg">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
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
              className={`
                flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px] min-h-[60px] touch-manipulation
                ${isActive 
                  ? 'text-afrikoni-gold bg-afrikoni-gold/10' 
                  : 'text-afrikoni-sand/70 hover:text-afrikoni-gold'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-afrikoni-gold' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-afrikoni-gold' : 'text-afrikoni-sand/70'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeBottomNav"
                  className="absolute top-0 left-0 right-0 h-1 bg-afrikoni-gold rounded-b-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

