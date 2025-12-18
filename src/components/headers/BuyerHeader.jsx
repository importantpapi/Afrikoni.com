import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notificationbell';

/**
 * BUYER HEADER - Deal-First Navigation
 * 
 * PROPER SPACING: Search takes good space, actions on right with breathing room
 * NO compression to one side - proper distribution across full width
 */
export default function BuyerHeader({
  t,
  setSidebarOpen,
  setSearchOpen,
  navigate,
}) {
  return (
    <div className="flex h-full items-center justify-between px-6 gap-6">
      
      {/* LEFT: Search Bar - Takes up good space */}
      <div className="flex items-center flex-1 max-w-2xl">
        <div className="w-full relative">
          <Search className="w-4 h-4 text-afrikoni-gold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder={t('buyer.searchPlaceholder') || 'Search products, suppliers, RFQs...'}
            className="pl-10 pr-4 h-10 w-full border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 shadow-sm transition-all text-sm bg-white rounded-lg"
            onFocus={() => setSearchOpen && setSearchOpen(true)}
            onBlur={() => setSearchOpen && setTimeout(() => setSearchOpen(false), 200)}
          />
        </div>
      </div>

      {/* RIGHT: Primary CTA + Notifications - Proper spacing */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* PRIMARY CTA: Create RFQ (Gold - Visual Priority) */}
        <Button
          onClick={() => navigate('/dashboard/rfqs/new')}
          className="flex items-center gap-2 bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal font-semibold shadow-md rounded-lg px-6 py-2.5 h-11 transition-all hover:shadow-lg whitespace-nowrap"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm font-semibold">Create RFQ</span>
        </Button>

        {/* Notifications (Icon Only) */}
        <NotificationBell />

        {/* Profile handled by DashboardLayout - space reserved */}
        <div className="w-10" /> {/* Reserve space for profile avatar */}
      </div>

    </div>
  );
}
