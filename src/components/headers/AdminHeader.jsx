import React from 'react';
import { Search, AlertTriangle, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NotificationBell from '@/components/notificationbell';

/**
 * ADMIN HEADER - Control-First Navigation
 * 
 * CORE RULE: No gold buttons. No commerce CTAs.
 * Admin's brain = "Control risk. Ensure trust."
 * 
 * LEFT: Global Search (users, RFQs, transactions)
 * RIGHT: Alerts (priority color), KoniAI Admin Panel, Profile
 */
export default function AdminHeader({
  t,
  setSidebarOpen,
  setSearchOpen,
  navigate,
  alertCount = 0,
}) {
  return (
    <div className="flex items-center justify-between px-4 lg:px-6 py-3 relative bg-afrikoni-ivory border-b border-red-200/30">
      {/* LEFT: Global Admin Search */}
      <div className="flex items-center gap-2 flex-1 max-w-2xl relative">
        <Search className="w-4 h-4 text-red-600 absolute left-3 z-10 pointer-events-none" />
        <Input
          placeholder={t('admin.searchPlaceholder') || 'Global search: users, RFQs, transactions...'}
          className="pl-10 pr-4 h-10 w-full border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 shadow-sm transition-all text-sm bg-white rounded-lg"
          onFocus={() => setSearchOpen && setSearchOpen(true)}
          onBlur={() => setSearchOpen && setTimeout(() => setSearchOpen(false), 200)}
        />
      </div>

      {/* RIGHT: Admin Actions + Notifications */}
      <div className="flex items-center gap-3 ml-4">
        {/* Priority Alerts */}
        <Button
          onClick={() => navigate('/dashboard/admin/alerts')}
          variant="outline"
          className="hidden md:flex items-center gap-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 rounded-lg px-4 py-2 transition-all relative"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Alerts</span>
          {alertCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-600 text-white px-1.5 py-0.5 text-xs">
              {alertCount}
            </Badge>
          )}
        </Button>

        {/* KoniAI Admin Panel */}
        <Button
          onClick={() => navigate('/dashboard/koniai')}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 transition-all shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden lg:inline text-sm font-medium">KoniAI</span>
        </Button>

        {/* Notifications (Icon Only) */}
        <NotificationBell />

        {/* Profile handled by DashboardLayout */}
      </div>
    </div>
  );
}

