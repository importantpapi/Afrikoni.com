import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NotificationBell from '@/components/notificationbell';

/**
 * LOGISTICS HEADER - Operations-First Navigation
 * 
 * ENTERPRISE STANDARD: NO max-w, NO mx-auto, NO centered container
 * Full-width header that spans cleanly across available width
 * 
 * LEFT: Search with fixed width (not flex)
 * RIGHT: Date range, Notifications, Messages
 */
export default function LogisticsHeader({
  t,
  setSidebarOpen,
  setSearchOpen,
}) {
  return (
    <div className="flex h-full items-center justify-between px-6">
      
      {/* LEFT: Search Bar (Fixed Width) */}
      <div className="flex flex-1 items-center gap-4">
        <div className="w-[380px] lg:w-[420px] relative">
          <Search className="w-4 h-4 text-afrikoni-gold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder={t('common.search') || 'Search shipments, routes, partners...'}
            className="pl-10 pr-4 h-10 w-full border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 shadow-sm transition-all text-sm bg-white rounded-lg"
            onFocus={() => setSearchOpen && setSearchOpen(true)}
            onBlur={() => setSearchOpen && setTimeout(() => setSearchOpen(false), 200)}
          />
        </div>
      </div>

      {/* RIGHT: Date Range + Notifications + Messages */}
      <div className="flex items-center gap-3">
        {/* Date Range Selector */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-white border border-afrikoni-gold/20 rounded-lg hover:border-afrikoni-gold/40 transition-colors h-10">
          <Calendar className="w-4 h-4 text-afrikoni-gold" />
          <select className="bg-transparent text-sm font-medium text-afrikoni-text-dark border-0 focus:outline-none cursor-pointer">
            <option>Today</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
          </select>
        </div>

        {/* Notifications (Icon Only) */}
        <NotificationBell />

        {/* Messages */}
        <Link
          to="/messages"
          className="p-2 rounded-lg hover:bg-afrikoni-sand/20 relative transition-all hover:scale-105"
        >
          <MessageSquare className="w-5 h-5 text-afrikoni-text-dark" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-afrikoni-gold rounded-full border-2 border-afrikoni-ivory"></span>
        </Link>
      </div>

    </div>
  );
}
