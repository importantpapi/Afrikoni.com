import { useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/context/CapabilityContext';

/**
 * useDashboardKernel - Unified Dashboard Kernel Hook
 * 
 * Provides standardized access to dashboard state and guards:
 * - profileCompanyId: The company ID for data queries
 * - userId: The user ID
 * - isAdmin: Whether user is admin
 * - isSystemReady: Whether auth and capabilities are ready
 * - canLoadData: Whether it's safe to load data (system ready + has company)
 * - capabilities: Full capabilities object
 * 
 * Usage:
 *   const { profileCompanyId, canLoadData, isAdmin } = useDashboardKernel();
 *   
 *   useEffect(() => {
 *     if (!canLoadData) return;
 *     // Safe to load data
 *   }, [canLoadData]);
 */
export function useDashboardKernel() {
  const { user, profile, authReady, loading: authLoading } = useAuth();
  const capabilities = useCapability();

  const result = useMemo(() => {
    const profileCompanyId = profile?.company_id || null;
    // ✅ FORENSIC RECOVERY: Ensure authReady is explicitly checked
    // System is ready only when: auth is ready AND not loading AND capabilities are ready
    const isSystemReady = authReady === true && !authLoading && capabilities.ready === true;
    const canLoadData = isSystemReady && !!profileCompanyId;

    return {
      profileCompanyId,
      userId: user?.id || null,
      isAdmin: !!profile?.is_admin,
      isSystemReady,
      canLoadData,
      capabilities
    };
  }, [user, profile, authReady, authLoading, capabilities]);

  // ✅ SAFETY FALLBACK: If after 5 seconds we are still not ready, log warning
  // This helps debug spinner deadlocks without forcing readiness (which could hide real errors)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!result.isSystemReady) {
        console.warn('[useDashboardKernel] Timeout: System still not ready after 5s', {
          authReady,
          authLoading,
          capabilitiesReady: capabilities.ready,
          hasUser: !!user,
          hasProfile: !!profile,
          hasCompanyId: !!profile?.company_id
        });
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [result.isSystemReady, authReady, authLoading, capabilities.ready, user, profile]);

  return result;
}
