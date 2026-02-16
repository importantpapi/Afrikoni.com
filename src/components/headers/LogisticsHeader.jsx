import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, MessageSquare, Menu } from 'lucide-react';
import { Input } from '@/components/shared/ui/input';
import NotificationBell from '@/components/notificationbell';
import HeaderShell from './HeaderShell';

/**
 * LOGISTICS HEADER - Operations-First Navigation
 * Wrapped in HeaderShell for consistent behavior
 */
export default function LogisticsHeader({
  t,
  setSidebarOpen,
  setSearchOpen,
  userAvatar,
}) {
  return (
    <HeaderShell>
      {/* LEFT — Search Only */}
      <div className="flex flex-1 items-center">
        {/* Search Bar */}
        <div className="relative w-full max-w-[520px]">
          <Search className="w-4 h-4 text-os-accent absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder={
              t?.('common.search') ||
              'Search shipments, routes, partners...'
            }
            className="pl-10 pr-4 h-10 w-full border-os-accent/30
                       focus:border-os-accent focus:ring-2
                       focus:ring-os-accent/20 shadow-sm
                       transition-all text-os-sm bg-white rounded-lg"
            onFocus={() => setSearchOpen?.(true)}
            onBlur={() =>
              setTimeout(() => setSearchOpen?.(false), 200)
            }
          />
        </div>
      </div>

      {/* RIGHT — Properly structured actions */}
      <div className="ml-auto flex items-center gap-6 overflow-visible">
        
        {/* Primary Control */}
        <div className="shrink-0">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-2
                          bg-white border border-os-accent/20 rounded-lg
                          hover:border-os-accent/40 transition-colors h-10
                          whitespace-nowrap">
            <Calendar className="w-4 h-4 text-os-accent" />
            <select className="bg-transparent text-os-sm font-medium
                              text-afrikoni-text-dark border-0 focus:outline-none
                              cursor-pointer">
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
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
                           bg-os-accent rounded-full border-2
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
                       hover:bg-os-accent/10
                       focus:outline-none focus:ring-2 focus:ring-os-accent/30
                       transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Identity — User Avatar */}
        <div className="flex items-center">
          {userAvatar}
        </div>

      </div>
    </HeaderShell>
  );
}
