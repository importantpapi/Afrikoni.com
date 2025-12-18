import React from 'react';
import { Search, AlertTriangle, Sparkles, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NotificationBell from '@/components/notificationbell';
import HeaderShell from './HeaderShell';

/**
 * ADMIN HEADER - Control-First Navigation
 * Wrapped in HeaderShell for consistent behavior
 * NO GOLD - Admin is control, not commerce
 */
export default function AdminHeader({
  t,
  setSidebarOpen,
  setSearchOpen,
  navigate,
  alertCount = 0,
  userAvatar,
}) {
  return (
    <HeaderShell>
      {/* LEFT — Global Admin Search Only */}
      <div className="flex flex-1 items-center">
        {/* Search Bar */}
        <div className="relative w-full max-w-[520px]">
          <Search className="w-4 h-4 text-red-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder={
              t?.('admin.searchPlaceholder') ||
              'Global search: users, RFQs, transactions...'
            }
            className="pl-10 pr-4 h-10 w-full border-red-200
                       focus:border-red-400 focus:ring-2
                       focus:ring-red-100 shadow-sm
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
        
        {/* Primary Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => navigate('/dashboard/admin/alerts')}
            variant="outline"
            className="flex items-center gap-2 border-red-300
                       text-red-700 hover:bg-red-50 hover:border-red-400
                       rounded-lg px-4 h-10 transition-all relative
                       whitespace-nowrap"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Alerts</span>
            {alertCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-600
                               text-white px-1.5 py-0.5 text-xs min-w-[20px]
                               h-5 flex items-center justify-center">
                {alertCount}
              </Badge>
            )}
          </Button>

          <Button
            onClick={() => navigate('/dashboard/koniai')}
            className="flex items-center gap-2 bg-purple-600
                       hover:bg-purple-700 text-white rounded-lg px-4 h-10
                       transition-all shadow-sm font-medium
                       whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">KoniAI</span>
          </Button>
        </div>

        {/* Utilities — Messages + Notifications + Menu Toggle */}
        <div className="flex items-center gap-4 overflow-visible">
          {/* Messages */}
          <Link
            to="/messages"
            className="flex items-center justify-center w-10 h-10
                       rounded-lg hover:bg-red-50
                       relative transition-all hover:scale-105"
          >
            <MessageSquare className="w-5 h-5 text-red-700" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5
                           bg-red-600 rounded-full border-2
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
                       hover:bg-red-50
                       focus:outline-none focus:ring-2 focus:ring-red-300
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
