import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, MessageCircle, Search, Calendar, MessageSquare, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notificationbell';
import { motion } from 'framer-motion';

/**
 * Hybrid dashboard header.
 * - Includes hybrid role switcher (all/buyer/seller).
 * - Quick create: RFQ in buyer mode, Add Product in seller mode.
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
    <div className="flex items-center justify-between px-2 md:px-4 lg:px-6 py-4 relative overflow-visible">
      {/* Community CTA - Mobile */}
      <div className="md:hidden">
        <button
          onClick={() => openWhatsAppCommunity('dashboard_header_mobile')}
          className="flex items-center gap-2 px-3 py-1.5 bg-afrikoni-gold text-afrikoni-chestnut rounded-full text-xs font-semibold hover:bg-afrikoni-goldLight transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Community
        </button>
      </div>

      {/* Left: Menu + Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          className="md:hidden p-2 rounded-afrikoni hover:bg-afrikoni-sand/20 transition-colors"
        >
          <Menu className="w-5 h-5 text-afrikoni-text-dark" />
        </button>

        {/* Search Bar */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-afrikoni-gold absolute left-3 z-10" />
          <Input
            placeholder={t('common.search') || 'Search orders, products, suppliers...'}
            className="pl-10 pr-4 h-10 w-full border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 shadow-afrikoni transition-all text-sm bg-white rounded-afrikoni"
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          />
        </div>
      </div>

      {/* Right: Community CTA (Desktop) + Role Switcher + Quick Create + Notifications + User */}
      <div className="flex items-center gap-3">
        {/* Community CTA - Desktop */}
        <button
          onClick={() => openWhatsAppCommunity('dashboard_header_desktop')}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-afrikoni-gold text-afrikoni-chestnut rounded-full text-sm font-semibold hover:bg-afrikoni-goldLight transition-colors shadow-afrikoni"
        >
          <MessageCircle className="w-4 h-4" />
          Join Community 🚀
        </button>

        {/* Hybrid segmented switcher */}
        <div className="hidden lg:flex items-center gap-0.5 bg-afrikoni-sand/40 p-1 rounded-full border border-afrikoni-gold/20 shadow-premium relative">
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
          className="hidden lg:flex items-center gap-2 bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal font-semibold shadow-afrikoni rounded-afrikoni px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">{isBuyerView ? 'Create RFQ' : 'Add Product'}</span>
        </Button>

        {/* Date Range Selector */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-white border border-afrikoni-gold/20 rounded-afrikoni hover:border-afrikoni-gold/40 transition-colors">
          <Calendar className="w-4 h-4 text-afrikoni-gold" />
          <select className="bg-transparent text-sm font-medium text-afrikoni-text-dark border-0 focus:outline-none cursor-pointer">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
        </div>

        {/* Notifications (with proper wrapper for consistency) */}
        <div className="flex items-center justify-center w-10 h-10">
          <NotificationBell />
        </div>

        {/* Messages */}
        <Link
          to="/messages"
          className="p-2 rounded-afrikoni hover:bg-afrikoni-sand/20 relative transition-all hover:scale-105"
        >
          <MessageSquare className="w-5 h-5 text-afrikoni-text-dark" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-afrikoni-gold rounded-full border-2 border-afrikoni-ivory"></span>
        </Link>
      </div>
    </div>
  );
}


