import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notificationbell';

/**
 * BUYER HEADER - Deal-First Navigation
 * 
 * CORE RULE: Users only see what helps them complete a deal.
 * Buyer's brain = "I need supply, price, security."
 * 
 * LEFT: Search products / suppliers / RFQs
 * RIGHT: Create RFQ (PRIMARY gold CTA), Notifications, Profile
 */
export default function BuyerHeader({
  t,
  setSidebarOpen,
  setSearchOpen,
  navigate,
}) {
  return (
    <div className="flex items-center justify-between px-2 md:px-3 lg:px-4 py-3 relative">
      {/* LEFT: Search Bar */}
      <div className="flex items-center gap-2 flex-1 max-w-4xl relative">
        <Search className="w-4 h-4 text-afrikoni-gold absolute left-3 z-10 pointer-events-none" />
        <Input
          placeholder={t('buyer.searchPlaceholder') || 'Search products, suppliers, RFQs...'}
          className="pl-10 pr-4 h-10 w-full border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 shadow-sm transition-all text-sm bg-white rounded-lg"
          onFocus={() => setSearchOpen && setSearchOpen(true)}
          onBlur={() => setSearchOpen && setTimeout(() => setSearchOpen(false), 200)}
        />
      </div>

      {/* RIGHT: Primary CTA + Notifications */}
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        {/* PRIMARY CTA: Create RFQ (Gold) */}
        <Button
          onClick={() => navigate('/dashboard/rfqs/new')}
          className="flex items-center gap-2 bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal font-semibold shadow-md rounded-lg px-4 py-2.5 transition-all hover:shadow-lg whitespace-nowrap"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Create RFQ</span>
        </Button>

        {/* Notifications (Icon Only) */}
        <NotificationBell />

        {/* Profile handled by DashboardLayout */}
      </div>
    </div>
  );
}
