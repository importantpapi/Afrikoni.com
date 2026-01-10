import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/context/CapabilityContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardRealtimeManager from '@/components/dashboard/DashboardRealtimeManager';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';

/**
 * =============================================================================
 * WorkspaceDashboard - PERSISTENT DASHBOARD LAYOUT
 * =============================================================================
 * 
 * ARCHITECTURAL OWNERSHIP:
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
 */
export default function WorkspaceDashboard() {
  // ===========================================================================
  // ALL HOOKS FIRST (Rules of Hooks compliance)
  // ===========================================================================
  
  const { user, profile, authReady } = useAuth();
  const capabilities = useCapability();
  
  // Memoize capabilities data for child components
  const capabilitiesData = useMemo(() => ({
    can_buy: capabilities.can_buy,
    can_sell: capabilities.can_sell,
    can_logistics: capabilities.can_logistics,
    sell_status: capabilities.sell_status,
    logistics_status: capabilities.logistics_status,
    isHybrid: capabilities.can_buy && capabilities.can_sell,
  }), [
    capabilities.can_buy,
    capabilities.can_sell,
    capabilities.can_logistics,
    capabilities.sell_status,
    capabilities.logistics_status,
  ]);

  // ===========================================================================
  // REALTIME CALLBACK (uses ref pattern internally)
  // This callback is passed to DashboardRealtimeManager
  // Child components can subscribe to updates via context if needed
  // ===========================================================================
  
  const handleRealtimeUpdate = useCallback((payload) => {
    console.log('[WorkspaceDashboard] Realtime update:', payload.table, payload.event);
    // Updates are logged here - child components refresh their own data
    // In the future, this could dispatch to a context or event bus
  }, []);

  // ===========================================================================
  // DERIVED VALUES (primitives for stability)
  // ===========================================================================
  
  const companyId = profile?.company_id || null;
  const userId = user?.id || null;
  const realtimeEnabled = !!(authReady && capabilities.ready && companyId);

  // ===========================================================================
  // RENDER GUARDS (after all hooks)
  // ===========================================================================
  
  if (!capabilities.ready) {
    return <SpinnerWithTimeout message="Loading workspace..." ready={capabilities.ready} />;
  }

  if (capabilities.error && !capabilities.ready) {
    console.error('[WorkspaceDashboard] Capabilities error - blocking render');
    return <SpinnerWithTimeout message="Loading workspace..." ready={capabilities.ready} />;
  }

  // ===========================================================================
  // RENDER - Layout + RealtimeManager + Outlet
  // ===========================================================================
  
  return (
    <DashboardLayout capabilities={capabilitiesData}>
      {/* 
        CRITICAL: DashboardRealtimeManager renders NULL but owns subscriptions.
        It is placed HERE (in the layout) so it survives route changes.
        Child routes (DashboardHome, OrdersPage, etc.) render via <Outlet />.
      */}
      <DashboardRealtimeManager
        companyId={companyId}
        userId={userId}
        onUpdate={handleRealtimeUpdate}
        enabled={realtimeEnabled}
      />
      
      <ErrorBoundary fallbackMessage="Failed to load dashboard. Please try again.">
        {/* Outlet renders child routes - they may unmount freely */}
        <Outlet />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
