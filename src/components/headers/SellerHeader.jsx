import React from 'react';
import { Search, Plus, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notificationbell';
import HeaderShell from './HeaderShell';

/**
 * SELLER HEADER - Revenue-First Navigation
 * Wrapped in HeaderShell for consistent behavior
 */
export default function SellerHeader({
  t,
  setSearchOpen,
  navigate,
}) {
  return (
    <HeaderShell>
      {/* LEFT — Search (flexes naturally) */}
      <div className="flex flex-1 items-center">
        <div className="relative w-full max-w-[520px]">
          <Search className="w-4 h-4 text-afrikoni-gold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder={
              t?.('seller.searchPlaceholder') ||
              'Search RFQs, buyers, orders...'
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

      {/* RIGHT — Properly structured actions */}
      <div className="ml-auto flex items-center gap-6 overflow-visible">
        
        {/* Primary Action (+ Secondary) */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => navigate('/dashboard/products/new')}
            variant="outline"
            className="hidden md:flex items-center gap-2
                       border-afrikoni-gold/40 text-afrikoni-text-dark
                       hover:bg-afrikoni-gold/10 hover:border-afrikoni-gold
                       rounded-lg px-4 h-10 transition-all
                       whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add Product</span>
          </Button>

          <Button
            onClick={() => navigate('/dashboard/rfqs')}
            className="flex items-center gap-2 bg-afrikoni-gold
                       hover:bg-afrikoni-gold/90
                       text-afrikoni-charcoal font-semibold
                       shadow-md rounded-lg px-6 h-11
                       transition-all hover:shadow-lg
                       whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm">View RFQs</span>
          </Button>
        </div>

        {/* Utilities */}
        <div className="flex items-center gap-4 overflow-visible">
          <NotificationBell />
        </div>

        {/* Identity (User Menu handled by DashboardLayout) */}
        <div className="flex items-center gap-2">
          {/* User avatar rendered by parent */}
        </div>

      </div>
    </HeaderShell>
  );
}
