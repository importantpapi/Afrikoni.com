import React from 'react';
import { Search, AlertTriangle, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NotificationBell from '@/components/notificationbell';

/**
 * ADMIN HEADER - Control-First Navigation
 * 
 * PROPER SPACING: Search takes good space, actions on right with breathing room
 * NO compression to one side - proper distribution across full width
 * NO GOLD BUTTONS - Admin is not commerce
 */
export default function AdminHeader({
  t,
  setSidebarOpen,
  setSearchOpen,
  navigate,
  alertCount = 0,
}) {
  return (
    <div className="flex h-full items-center justify-between px-6 gap-6 bg-red-50/30 border-b border-red-200/50">
      
      {/* LEFT: Global Admin Search - Takes up good space */}
      <div className="flex items-center flex-1 max-w-2xl">
        <div className="w-full relative">
          <Search className="w-4 h-4 text-red-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            placeholder={t('admin.searchPlaceholder') || 'Global search: users, RFQs, transactions...'}
            className="pl-10 pr-4 h-10 w-full border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 shadow-sm transition-all text-sm bg-white rounded-lg"
            onFocus={() => setSearchOpen && setSearchOpen(true)}
            onBlur={() => setSearchOpen && setTimeout(() => setSearchOpen(false), 200)}
          />
        </div>
      </div>

      {/* RIGHT: Admin Control Actions + Notifications - Proper spacing */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Priority Alerts (Red - Control Priority) */}
        <Button
          onClick={() => navigate('/dashboard/admin/alerts')}
          variant="outline"
          className="flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 rounded-lg px-4 py-2 h-10 transition-all relative whitespace-nowrap"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Alerts</span>
          {alertCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-600 text-white px-1.5 py-0.5 text-xs min-w-[20px] h-5 flex items-center justify-center">
              {alertCount}
            </Badge>
          )}
        </Button>

        {/* KoniAI Admin Panel (Purple - Intelligence) */}
        <Button
          onClick={() => navigate('/dashboard/koniai')}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 h-10 transition-all shadow-sm font-medium whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">KoniAI</span>
        </Button>

        {/* Notifications (Icon Only) */}
        <NotificationBell />

        {/* Profile handled by DashboardLayout - space reserved */}
        <div className="w-10" /> {/* Reserve space for profile avatar */}
      </div>

    </div>
  );
}
