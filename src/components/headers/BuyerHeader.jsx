import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notificationbell';

/**
 * BUYER HEADER - Correct Visual Hierarchy
 * 
 * RIGHT SIDE GROUPING:
 * 1. PRIMARY ACTION (pr-6) → Create RFQ
 * 2. UTILITIES (pr-6) → Notifications (with explicit container)
 * 3. IDENTITY → User Menu
 * 
 * This creates professional visual rhythm: Action → Utility → Identity
 */
export default function BuyerHeader({
  t,
  setSearchOpen,
  navigate,
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
                t?.('buyer.searchPlaceholder') ||
                'Search products, suppliers, RFQs...'
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

          {/* PRIMARY ACTION — Create RFQ (breathes with pr-6) */}
          <div className="pr-6">
            <Button
              onClick={() => navigate('/dashboard/rfqs/new')}
              className="flex items-center gap-2 bg-afrikoni-gold
                         hover:bg-afrikoni-gold/90
                         text-afrikoni-charcoal font-semibold
                         shadow-md rounded-lg px-6 h-11
                         transition-all hover:shadow-lg
                         whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Create RFQ</span>
            </Button>
          </div>

          {/* UTILITIES — Notifications (clean, modern spacing) */}
          <NotificationBell />

          {/* IDENTITY — User Menu (handled by DashboardLayout) */}
          <div className="flex items-center">
            {/* User avatar rendered by parent */}
          </div>

        </div>

      </div>
    </header>
  );
}
