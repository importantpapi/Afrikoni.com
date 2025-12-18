import React from 'react';
import { Search, AlertTriangle, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NotificationBell from '@/components/notificationbell';

/**
 * ADMIN HEADER - Enterprise Pattern
 * 
 * KEY: Uses ml-auto to anchor right side (NOT justify-between)
 * Result: Natural spacing, no compression, enterprise-correct
 * NO GOLD - Admin is control, not commerce
 */
export default function AdminHeader({
  t,
  setSearchOpen,
  navigate,
  alertCount = 0,
}) {
  return (
    <header className="h-[68px] w-full border-b bg-red-50/30 border-b border-red-200/50">
      <div className="flex h-full w-full items-center px-8">

        {/* LEFT — Global Admin Search (flexes naturally) */}
        <div className="flex flex-1 items-center">
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

        {/* RIGHT — Anchored actions (ml-auto creates natural spacing) */}
        <div className="ml-auto flex items-center gap-4">

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

          <NotificationBell />

          {/* Avatar handled by DashboardLayout */}
        </div>

      </div>
    </header>
  );
}
