import React, { useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardRealtimeManager from '@/components/dashboard/DashboardRealtimeManager';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';

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
 */
export default function WorkspaceDashboard() {
  const location = useLocation();
  
  // ✅ KERNEL MIGRATION: Get everything from the Single Source of Truth
  const { 
    userId, 
    profileCompanyId, 
    capabilities, 
    isSystemReady,
    isPreWarming // ✅ FULL-STACK SYNC: Pre-warming state
  } = useDashboardKernel();

  // ✅ KERNEL MIGRATION: Realtime Callback (Simplified)
  const handleRealtimeUpdate = useCallback((payload) => {
    console.log('[WorkspaceDashboard] Realtime update:', payload.table, payload.event);
    // Updates are logged here - child components refresh their own data
    // In the future, this could dispatch to a context or event bus
  }, []);

  // ===========================================================================
  // RENDER GUARDS (Standardized via Kernel)
  // ===========================================================================

  // ✅ SKELETON FIX: Consolidated loading check
  // Pre-warming and system readiness are both handled by a single guard
  // This prevents multiple sequential loading screens ("skeleton problem")
  // useDashboardKernel already handles pre-warming timeout (3s → redirect to onboarding)
  if (!isSystemReady) {
    // Single loading message - no cascading states
    const loadingMessage = isPreWarming ? "Synchronizing..." : "Loading...";
    return <SpinnerWithTimeout message={loadingMessage} ready={isSystemReady} timeoutMs={5000} />;
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
          {/* ✅ REACTIVE READINESS FIX: Force component re-boot on navigation */}
          {/* Outlet renders child routes - key forces re-mount on route change */}
          <Outlet key={location.pathname} />
        </ErrorBoundary>
      </DashboardLayout>
    </ErrorBoundary>
  );
}
