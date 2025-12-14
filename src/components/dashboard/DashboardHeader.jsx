import React from 'react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Bell, MessageCircle, User } from 'lucide-react';
import NotificationBell from '@/components/notificationbell';

export default function DashboardHeader({ user, company, activeRole, onRoleSwitch }) {
  const roleOptions = [
    { value: 'buyer', label: 'Buyer' },
    { value: 'seller', label: 'Seller' },
    { value: 'admin', label: 'Admin' },
    { value: 'logistics_partner', label: 'Logistics' }
  ].filter(role => {
    // Only show roles user has access to
    if (user?.user_role === 'admin') return true;
    return role.value === user?.user_role || role.value === 'buyer';
  });

  return (
    <div className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-afrikoni-deep/70" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-afrikoni-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {roleOptions.length > 1 && (
            <Select value={activeRole} onValueChange={onRoleSwitch}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(role => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <NotificationBell />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-afrikoni-chestnut">{user?.email}</div>
              {company && (
                <div className="text-xs text-afrikoni-deep">{company.company_name}</div>
              )}
            </div>
            <div className="w-10 h-10 bg-afrikoni-gold rounded-full flex items-center justify-center text-afrikoni-creamfont-semibold">
              {(() => {
                try {
                  return getUserInitial(user || null, null);
                } catch (error) {
                  console.warn('Error getting user initial:', error);
                  return user?.email?.charAt(0)?.toUpperCase() || 'U';
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

