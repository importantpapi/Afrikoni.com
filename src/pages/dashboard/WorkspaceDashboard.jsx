import React, { useCallback, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardRealtimeManager from '@/components/dashboard/DashboardRealtimeManager';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';

const DEBUG_BOOT = import.meta.env.VITE_DEBUG_BOOT === 'true';

/**
 * =============================================================================
 * WorkspaceDashboard - THE KERNEL HOST
 * =============================================================================
 *
 * ARCHITECTURAL OWNERSHIP:
 * - This component is now a pure Kernel Consumer
 * - No longer imports useAuth() or useCapability() directly
 * - Gets all state from useDashboardKernel() - Single Source of Truth
 * - This component OWNS the dashboard layout
 * - This component OWNS the realtime subscriptions (via DashboardRealtimeManager)
 * - Child routes render inside <Outlet /> and may unmount freely
 * - Realtime subscriptions survive all tab/route changes
 *
 * LIFECYCLE:
 * - Mounts when user enters /dashboard/*
 * - NEVER unmounts during tab navigation
 * - Unmounts only when leaving /dashboard/* entirely
 *
 * REALTIME:
 * - DashboardRealtimeManager is rendered HERE (above Outlet)
 * - It renders null but owns the single Supabase channel
 * - Child pages (DashboardHome, OrdersPage, etc.) do NOT have realtime hooks
 *
 * ✅ KERNEL MIGRATION COMPLETE:
 * - Eliminated useAuth() import - Kernel provides userId
 * - Eliminated useCapability() import - Kernel provides capabilities
 * - Eliminated useMemo for capabilities - Kernel already memoized
 * - Unified state machine via isSystemReady flag
 * - No double initialization lag
 *
 * ✅ GHOST NAVIGATION FIX:
 * - Removed key={location.pathname} from Outlet
 * - Component now mounts ONCE per session
 */
export default function WorkspaceDashboard() {
  const location = useLocation();
  const mountCountRef = useRef(0);

  // ✅ KERNEL MIGRATION: Get everything from the Single Source of Truth
  const {
    userId,
    profileCompanyId,
    capabilities,
    isSystemReady,
    isPreWarming // ✅ FULL-STACK SYNC: Pre-warming state
  } = useDashboardKernel();

  // Debug logging (only in debug mode)
  useEffect(() => {
    if (DEBUG_BOOT) {
      mountCountRef.current += 1;
      console.log(`🚀 [WorkspaceDashboard] MOUNTED (count: ${mountCountRef.current}) at ${location.pathname}`);
      return () => {
        console.log(`🔴 [WorkspaceDashboard] UNMOUNTED from ${location.pathname}`);
      };
    }
  }, [location.pathname]);

  useEffect(() => {
    if (DEBUG_BOOT) {
      console.log(`🔄 [WorkspaceDashboard] Route changed to: ${location.pathname} (no remount)`);
    }
  }, [location.pathname]);

  // ✅ KERNEL MIGRATION: Realtime Callback (Simplified)
  const handleRealtimeUpdate = useCallback((payload) => {
    console.log('[WorkspaceDashboard] Realtime update:', payload.table, payload.event);
    // Updates are logged here - child components refresh their own data
    // In the future, this could dispatch to a context or event bus
  }, []);

  // ===========================================================================
  // RENDER GUARDS (Standardized via Kernel)
  // ===========================================================================

  // ✅ FULL-STACK SYNC: Pre-warming state - show "Synchronizing World" message
  if (isPreWarming) {
    return <SpinnerWithTimeout message="Synchronizing World..." ready={false} timeoutMs={3000} />;
  }

  if (!isSystemReady) {
    return <SpinnerWithTimeout message="Initializing Workspace..." ready={isSystemReady} />;
  }

  // ✅ KERNEL MIGRATION: Prepare capabilities data for DashboardLayout
  // Kernel already provides memoized capabilities, but DashboardLayout expects specific shape
  const capabilitiesData = {
    can_buy: capabilities.can_buy,
    can_sell: capabilities.can_sell,
    can_logistics: capabilities.can_logistics,
    sell_status: capabilities.sell_status,
    logistics_status: capabilities.logistics_status,
    isHybrid: capabilities.can_buy && capabilities.can_sell,
  };

  // ===========================================================================
  // RENDER - Layout + RealtimeManager + Outlet
  // ===========================================================================

  return (
    <ErrorBoundary fallbackMessage="Dashboard layout error. Please refresh the page.">
      {/* ✅ KERNEL MIGRATION: Pass Kernel capabilities directly to the Layout */}
      <DashboardLayout capabilities={capabilitiesData}>
        {/*
          CRITICAL: DashboardRealtimeManager renders NULL but owns subscriptions.
          It is placed HERE (in the layout) so it survives route changes.
          Child routes (DashboardHome, OrdersPage, etc.) render via <Outlet />.

          ✅ KERNEL MIGRATION: Use profileCompanyId from Kernel
          This ensures realtime subscriptions never attempt with undefined company ID
        */}
        <DashboardRealtimeManager
          companyId={profileCompanyId}
          userId={userId}
          onUpdate={handleRealtimeUpdate}
          enabled={isSystemReady && !!profileCompanyId}
        />

        <ErrorBoundary fallbackMessage="Failed to load dashboard page. Please try again.">
          {/* ✅ GHOST NAVIGATION FIX: Removed key={location.pathname} to prevent forced remounts */}
          {/* Outlet renders child routes WITHOUT forcing remount on navigation */}
          <Outlet />
        </ErrorBoundary>
      </DashboardLayout>
    </ErrorBoundary>
  );
}
