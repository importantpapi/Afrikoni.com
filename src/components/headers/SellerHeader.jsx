import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, FileText, Menu, MessageSquare } from 'lucide-react';
import { Input } from '@/components/shared/ui/input';
import { Button } from '@/components/shared/ui/button';
import NotificationBell from '@/components/notificationbell';
import HeaderShell from './HeaderShell';

/**
 * SELLER HEADER - Revenue-First Navigation
 * Wrapped in HeaderShell for consistent behavior
 */
export default function SellerHeader({
  t,
  setSidebarOpen,
  setSearchOpen,
  navigate,
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
              t?.('seller.searchPlaceholder') ||
              'Search RFQs, buyers, orders...'
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
        
        {/* Primary Action (+ Secondary) */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => navigate('/dashboard/products/new')}
            variant="outline"
            className="hidden md:flex items-center gap-2
                       border-os-accent/40 text-afrikoni-text-dark
                       hover:bg-os-accent/10 hover:border-os-accent
                       rounded-lg px-4 h-10 transition-all
                       whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="text-os-sm">Add Product</span>
          </Button>

          <Button
            onClick={() => navigate('/dashboard/rfqs')}
            className="flex items-center gap-2 bg-os-accent
                       hover:bg-os-accent/90
                       text-afrikoni-charcoal font-semibold
                       shadow-md rounded-lg px-6 h-11
                       transition-all hover:shadow-os-md
                       whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            <span className="text-os-sm">View RFQs</span>
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
