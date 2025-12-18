import React from 'react';
import { Search, Plus, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notificationbell';

/**
 * SELLER HEADER - Revenue-First Navigation
 * 
 * CORE RULE: Only 1 primary action in top bar.
 * Seller's brain = "Show me demand. I'll supply."
 * 
 * LEFT: Search RFQs / buyers
 * RIGHT: View RFQs (PRIMARY gold), Add Product (secondary), Notifications, Profile
 */
export default function SellerHeader({
  t,
  setSidebarOpen,
  setSearchOpen,
  navigate,
}) {
  return (
    <div className="flex items-center justify-between px-4 lg:px-6 py-3 relative">
      {/* LEFT: Search Bar */}
      <div className="flex items-center gap-2 flex-1 max-w-2xl relative">
        <Search className="w-4 h-4 text-afrikoni-gold absolute left-3 z-10 pointer-events-none" />
        <Input
          placeholder={t('seller.searchPlaceholder') || 'Search RFQs, buyers, orders...'}
          className="pl-10 pr-4 h-10 w-full border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 shadow-sm transition-all text-sm bg-white rounded-lg"
          onFocus={() => setSearchOpen && setSearchOpen(true)}
          onBlur={() => setSearchOpen && setTimeout(() => setSearchOpen(false), 200)}
        />
      </div>

      {/* RIGHT: Primary CTA + Secondary Action + Notifications */}
      <div className="flex items-center gap-3 ml-4">
        {/* SECONDARY: Add Product */}
        <Button
          onClick={() => navigate('/dashboard/products/new')}
          variant="outline"
          className="hidden md:flex items-center gap-2 border-afrikoni-gold/40 text-afrikoni-text-dark hover:bg-afrikoni-gold/10 hover:border-afrikoni-gold rounded-lg px-4 py-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Product</span>
        </Button>

        {/* PRIMARY CTA: View RFQs (Gold) */}
        <Button
          onClick={() => navigate('/dashboard/rfqs')}
          className="flex items-center gap-2 bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal font-semibold shadow-md rounded-lg px-5 py-2.5 transition-all hover:shadow-lg"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden lg:inline text-sm">View RFQs</span>
          <span className="lg:hidden text-sm">RFQs</span>
        </Button>

        {/* Notifications (Icon Only) */}
        <NotificationBell />

        {/* Profile handled by DashboardLayout */}
      </div>
    </div>
  );
}
