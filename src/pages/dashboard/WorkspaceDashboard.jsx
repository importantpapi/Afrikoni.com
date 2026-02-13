import React, { useCallback, useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import OSShell from '@/layouts/OSShell';
import DashboardRealtimeManager from '@/components/dashboard/DashboardRealtimeManager';
import { SyncMonitor } from '@/components/dashboard/SyncMonitor';
import { useTradeSystemState } from '@/hooks/useTradeSystemState';
import { useWorkspaceMode } from '@/contexts/WorkspaceModeContext';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import ErrorBoundary from '@/components/ErrorBoundary';
import { DashboardSkeleton } from '@/components/shared/ui/skeletons';

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
  const navigate = useNavigate();

  // ✅ KERNEL MIGRATION: Get everything from the Single Source of Truth
  const {
    userId,
    user,
    profile,
    isAdmin,
    profileCompanyId,
    capabilities,
    isSystemReady,
    isPreWarming // ✅ FULL-STACK SYNC: Pre-warming state
  } = useDashboardKernel();

  const { systemState, refresh: refreshSystemState } = useTradeSystemState();
  const { mode, setMode } = useWorkspaceMode();
  const { total: notificationCount } = useNotificationCounts();

  // ✅ KERNEL MIGRATION: Realtime Callback (Simplified)
  const handleRealtimeUpdate = useCallback((payload) => {
    // Refresh system state on realtime updates
    refreshSystemState();
  }, [refreshSystemState]);

  // ===========================================================================
  // COMPANY SETUP GUARD - Redirect if user has no company
  // ===========================================================================
  useEffect(() => {
    if (isSystemReady && !profileCompanyId && !location.pathname.includes('/company-info')) {
      console.warn('[WorkspaceDashboard] User has no company - redirecting to company setup');
      navigate('/dashboard/company-info', { replace: true });
    }
  }, [isSystemReady, profileCompanyId, location.pathname, navigate]);

  // ===========================================================================
  // RENDER GUARDS (Standardized via Kernel)
  // ===========================================================================

  // ✅ SKELETON FIX: Consolidated loading check
  // Pre-warming and system readiness are both handled by a single guard
  // This prevents multiple sequential loading screens ("skeleton problem")
  // useDashboardKernel already handles pre-warming timeout (3s → redirect to onboarding)
  if (!isSystemReady) {
    return <DashboardSkeleton />;
  }

  // ✅ KERNEL MIGRATION: Prepare capabilities data for OSShell
  // Kernel already provides memoized capabilities, but OSShell expects specific shape
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
      {/* ✅ OS SHELL REFACTOR: Using modular OSShell architecture */}
      <OSShell
        systemState={systemState}
        capabilities={capabilitiesData}
        user={user}
        profile={profile}
        organization={profile?.company_name ? { name: profile.company_name } : null}
        workspaceMode={mode}
        onToggleMode={() => setMode(mode === 'simple' ? 'operator' : 'simple')}
        onOpenCommandPalette={() => { }} // Controlled within OSShell state now
        notificationCount={notificationCount}
        isAdmin={isAdmin}
      >
        {/* HORIZON 2026: Ambient Orb for Visual Depth */}
        <div className="os-ambient-orb" style={{ top: '10%', right: '20%', opacity: 0.4 }} />
        
        {/* ✅ MOBILE GUARD: Only initialize realtime when system is ready */}
        <DashboardRealtimeManager
          companyId={profileCompanyId}
          userId={userId}
          onUpdate={handleRealtimeUpdate}
          enabled={true}
        />

        <SyncMonitor isSubscribed={true} />

        <ErrorBoundary fallbackMessage="Failed to load dashboard page. Please try again.">
          <Outlet key={location.pathname} context={{ systemState, refreshSystemState }} />
        </ErrorBoundary>
      </OSShell>
    </ErrorBoundary>
  );
}
