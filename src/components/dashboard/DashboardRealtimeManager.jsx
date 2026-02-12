import { memo } from 'react';
import { useRealTimeDashboardData } from '@/hooks/useRealTimeData';

/**
 * =============================================================================
 * DashboardRealtimeManager - HEADLESS WRAPPER COMPONENT
 * =============================================================================
 * 
 * ARCHITECTURAL RULE:
 * This component MUST be rendered in the dashboard LAYOUT (above <Outlet />).
 * It renders NULL and survives all nested route changes.
 * 
 * OWNERSHIP:
 * - This is the ONLY place realtime subscriptions are created
 * - DashboardHome, OrdersPage, RFQsPage, etc. MUST NOT have realtime hooks
 * - Subscriptions survive: tab switches, route changes, token refresh
 * 
 * LIFECYCLE:
 * - Mounts once when user enters /dashboard/*
 * - Unmounts only when user leaves /dashboard/* entirely
 * - Single channel per companyId (delegated to hook)
 * 
 * ✅ DEDUPLICATION FIX:
 * Previously this component had manual supabase.channel() logic AND there was
 * a useRealTimeDashboardData hook doing the same thing = DOUBLE SUBSCRIPTIONS.
 * 
 * Now this component is a pure wrapper that delegates 100% to the hook.
 * Single source of truth = No duplicate channels.
 * 
 * @param {string} companyId - Company ID to subscribe for
 * @param {string} userId - User ID for notifications
 * @param {function} onUpdate - Callback for realtime updates (optional)
 * @param {boolean} enabled - Whether subscriptions should be active
 */
function DashboardRealtimeManager({ companyId, userId, onUpdate, enabled = true }) {
  // ✅ SINGLE SOURCE OF TRUTH
  // Delegate all subscription logic to the production-grade hook.
  // This ensures we don't have duplicate channel logic to maintain.
  useRealTimeDashboardData(companyId, userId, onUpdate, enabled);

  // This component is "logic-only", it renders no UI
  return null;
}

// Memoize to prevent unnecessary re-renders of the wrapper itself
export default memo(DashboardRealtimeManager);
