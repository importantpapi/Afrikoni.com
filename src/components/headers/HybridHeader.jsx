import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, MessageCircle, Search, Calendar, MessageSquare, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notificationbell';
import HeaderShell from './HeaderShell';
import { motion } from 'framer-motion';

/**
 * HYBRID HEADER - All/Buyer/Seller Mode Switcher
 * Wrapped in HeaderShell for consistent behavior
 * 
 * Note: This header has additional complexity (role switcher)
 * but still follows the standard right-side pattern
 */
export default function HybridHeader({
  t,
  openWhatsAppCommunity,
  setSidebarOpen,
  setSearchOpen,
  navigate,
  activeView,
  setActiveView,
}) {
  const isBuyerView = activeView === 'buyer';

  return (
    <HeaderShell>
      {/* LEFT — Search Only */}
      <div className="flex flex-1 items-center">
        {/* Search Bar */}
        <div className="relative w-full max-w-[520px]">
          <Search className="w-4 h-4 text-afrikoni-gold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder={t?.('common.search') || 'Search orders, products, suppliers...'}
            className="pl-10 pr-4 h-10 w-full border-afrikoni-gold/30
                       focus:border-afrikoni-gold focus:ring-2
                       focus:ring-afrikoni-gold/20 shadow-sm
                       transition-all text-sm bg-white rounded-lg"
            onFocus={() => setSearchOpen?.(true)}
            onBlur={() => setTimeout(() => setSearchOpen?.(false), 200)}
          />
        </div>
      </div>

      {/* RIGHT — Properly structured actions with role switcher */}
      <div className="ml-auto flex items-center gap-6 overflow-visible">
        {/* Hybrid segmented switcher + Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Hybrid role switcher */}
          <div className="hidden lg:flex items-center gap-0.5 bg-afrikoni-sand/40 p-1 rounded-full border border-afrikoni-gold/20 shadow-sm relative">
          {['all', 'buyer', 'seller'].map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`
                relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 capitalize z-10 min-w-[60px]
                ${activeView === view
                  ? 'text-afrikoni-charcoal'
                  : 'text-afrikoni-text-dark/70 hover:text-afrikoni-text-dark'
                }
              `}
            >
              {view === 'all' ? 'All' : view}
            </button>
          ))}
          <motion.div
            layoutId="activeHybridHeaderView"
            className="absolute top-1 bottom-1 rounded-full bg-afrikoni-gold shadow-afrikoni z-0"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            animate={{
              x:
                activeView === 'all'
                  ? 0
                  : activeView === 'buyer'
                  ? 'calc(33.333% + 0.125rem)'
                  : 'calc(66.666% + 0.25rem)',
              width: 'calc(33.333% - 0.25rem)',
            }}
          />
          </div>

          {/* Quick Create: RFQ in buyer mode, Add Product in seller mode */}
          <Button
            onClick={() =>
              isBuyerView ? navigate('/dashboard/rfqs/new') : navigate('/dashboard/products/new')
            }
            className="flex items-center gap-2 bg-afrikoni-gold
                       hover:bg-afrikoni-gold/90
                       text-afrikoni-charcoal font-semibold
                       shadow-md rounded-lg px-6 h-11
                       transition-all hover:shadow-lg
                       whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">{isBuyerView ? 'Create RFQ' : 'Add Product'}</span>
          </Button>
        </div>

        {/* Utilities — Messages + Notifications + Menu Toggle */}
        <div className="flex items-center gap-4 overflow-visible">
          {/* Messages */}
          <Link
            to="/messages"
            className="flex items-center justify-center w-10 h-10
                       rounded-lg hover:bg-afrikoni-sand/20
                       relative transition-all hover:scale-105"
          >
            <MessageSquare className="w-5 h-5 text-afrikoni-text-dark" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5
                           bg-afrikoni-gold rounded-full border-2
                           border-afrikoni-ivory"></span>
          </Link>

          {/* Notifications */}
          <NotificationBell />

          {/* Menu Toggle — ALWAYS VISIBLE */}
          <button
            onClick={() => setSidebarOpen?.(prev => !prev)}
            className="inline-flex items-center justify-center
                       w-10 h-10 rounded-lg
                       text-afrikoni-charcoal
                       hover:bg-afrikoni-gold/10
                       focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/30
                       transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Identity (User Menu handled by DashboardLayout) */}
        <div className="flex items-center gap-2">
          {/* User avatar rendered by parent */}
        </div>

      </div>
    </HeaderShell>
  );
}


