import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, FileText, MessageSquare, Plus, Zap
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';

// PHASE 6: MobileBottomNav with Central Command Button
export default function MobileBottomNav({
  isBuyer = true,
  isSeller = false,
  isLogistics = false,
  isHybrid = false
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const getNavItems = () => {
    // We want 4 main tabs + 1 central command button
    if (isSeller || isHybrid) {
      return [
        { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
        { icon: Package, label: 'Inventory', path: '/dashboard/products' },
        { divider: true }, // Placeholder for central button
        { icon: ShoppingCart, label: 'Orders', path: '/dashboard/orders' },
        { icon: MessageSquare, label: 'Signals', path: '/dashboard/notifications' }
      ];
    } else {
      return [
        { icon: LayoutDashboard, label: 'Home', path: '/dashboard' },
        { icon: Package, label: 'Browse', path: '/marketplace' },
        { divider: true }, // Placeholder for central button
        { icon: FileText, label: 'RFQs', path: '/dashboard/rfqs' },
        { icon: MessageSquare, label: 'Signals', path: '/dashboard/notifications' }
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-afrikoni-gold/10 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] px-4 pb-safe"
      role="navigation"
    >
      <div className="flex items-center justify-between h-16 max-w-lg mx-auto relative">
        {(navItems || []).map((item, index) => {
          if (item.divider) {
            return (
              <div key="quick-action" className="relative -top-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate('/dashboard/rfqs/new')}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#D4A937] to-[#F5D485] shadow-[0_8px_20px_rgba(212,169,55,0.4)] flex items-center justify-center border-4 border-white dark:border-[#0A0A0A] relative group"
                >
                  <Plus className="w-7 h-7 text-black stroke-[3px]" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-[#D4A937] -z-10"
                  />
                </motion.button>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-tighter text-[#D4A937]">NEW TRADE</span>
              </div>
            );
          }

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
              className={`
                flex flex-col items-center justify-center gap-1
                min-w-[56px] h-full transition-all relative
                ${isActive ? 'text-[#D4A937]' : 'text-gray-400 dark:text-gray-500'}
              `}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <motion.div
                    layoutId="mobileNavGlow"
                    className="absolute -inset-2 bg-[#D4A937]/10 blur-md rounded-full -z-10"
                  />
                )}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wide ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 w-8 h-1 bg-[#D4A937] rounded-t-full"
                  transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
