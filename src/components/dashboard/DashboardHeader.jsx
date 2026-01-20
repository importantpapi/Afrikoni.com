/**
 * ============================================================================
 * ⚠️ DEPRECATED COMPONENT ⚠️
 * ============================================================================
 * 
 * This component is DEPRECATED and not currently used in the dashboard.
 * 
 * If you need to use this component, update it to use capabilities:
 * - Use `useDashboardKernel()` hook to get `capabilities` and `isAdmin`
 * - Replace `user?.user_role` checks with capability checks
 * - Derive role labels from capabilities (e.g., if can_sell && can_buy, label as 'Hybrid Workspace')
 * 
 * ============================================================================
 */

import React from 'react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Search, Bell, MessageCircle, User } from 'lucide-react';
import NotificationBell from '@/components/notificationbell';
import { getUserInitial } from '@/utils/userHelpers';

export default function DashboardHeader({ user, company, activeRole, onRoleSwitch, capabilities, isAdmin }) {
  // ✅ FINAL CLEANUP: Derive role options from capabilities instead of user.user_role
  const isHybrid = capabilities?.can_buy === true && capabilities?.can_sell === true;
  const isSeller = capabilities?.can_sell === true && capabilities?.sell_status === 'approved';
  const isLogistics = capabilities?.can_logistics === true && capabilities?.logistics_status === 'approved';
  
  const roleOptions = [
    { value: 'buyer', label: 'Buyer' },
    { value: 'seller', label: 'Seller' },
    { value: 'admin', label: 'Admin' },
    { value: 'logistics_partner', label: 'Logistics' }
  ].filter(role => {
    // ✅ FINAL CLEANUP: Use capabilities and isAdmin instead of user.user_role
    if (isAdmin) return true;
    if (role.value === 'buyer') return true; // Everyone can be a buyer
    if (role.value === 'seller' && isSeller) return true;
    if (role.value === 'logistics_partner' && isLogistics) return true;
    return false;
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

