import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NotificationBell from '@/components/notificationbell';

/**
 * LOGISTICS HEADER - Correct Visual Hierarchy
 * 
 * RIGHT SIDE GROUPING:
 * 1. PRIMARY CONTROL (pr-6) → Date Range
 * 2. UTILITIES (pr-6) → Notifications + Messages
 * 3. IDENTITY → User Menu
 */
export default function LogisticsHeader({
  t,
  setSearchOpen,
}) {
  return (
    <header className="h-[68px] w-full border-b bg-background">
      <div className="flex h-full w-full items-center px-8">

        {/* LEFT — Search (flexes naturally) */}
        <div className="flex flex-1 items-center">
          <div className="relative w-full max-w-[520px]">
            <Search className="w-4 h-4 text-afrikoni-gold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              placeholder={
                t?.('common.search') ||
                'Search shipments, routes, partners...'
              }
              className="pl-10 pr-4 h-10 w-full border-afrikoni-gold/30
                         focus:border-afrikoni-gold focus:ring-2
                         focus:ring-afrikoni-gold/20 shadow-sm
                         transition-all text-sm bg-white rounded-lg"
              onFocus={() => setSearchOpen?.(true)}
              onBlur={() =>
                setTimeout(() => setSearchOpen?.(false), 200)
              }
            />
          </div>
        </div>

        {/* RIGHT — Properly grouped with visual hierarchy */}
        <div className="ml-auto flex items-center">

          {/* PRIMARY CONTROL — Date Range (breathes with pr-6) */}
          <div className="pr-6">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-2
                            bg-white border border-afrikoni-gold/20 rounded-lg
                            hover:border-afrikoni-gold/40 transition-colors h-10
                            whitespace-nowrap">
              <Calendar className="w-4 h-4 text-afrikoni-gold" />
              <select className="bg-transparent text-sm font-medium
                                text-afrikoni-text-dark border-0 focus:outline-none
                                cursor-pointer">
                <option>Today</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
          </div>

          {/* UTILITIES — Notifications + Messages (secondary importance) */}
          <div className="flex items-center gap-4 pr-6">
            <NotificationBell />
            
            <Link
              to="/messages"
              className="p-2 rounded-lg hover:bg-afrikoni-sand/20
                         relative transition-all hover:scale-105"
            >
              <MessageSquare className="w-5 h-5 text-afrikoni-text-dark" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5
                             bg-afrikoni-gold rounded-full border-2
                             border-afrikoni-ivory"></span>
            </Link>
          </div>

          {/* IDENTITY — User Menu (handled by DashboardLayout) */}
          <div className="flex items-center">
            {/* User avatar rendered by parent */}
          </div>

        </div>

      </div>
    </header>
  );
}
