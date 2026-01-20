import { useMemo, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/context/CapabilityContext';

/**
 * useDashboardKernel - Unified Dashboard Kernel Hook
 * 
 * Provides standardized access to dashboard state and guards:
 * - profileCompanyId: The company ID for data queries
 * - userId: The user ID
 * - user: The user object from AuthProvider
 * - profile: The profile object from AuthProvider
 * - isAdmin: Whether user is admin
 * - isSystemReady: Whether auth and capabilities are ready
 * - canLoadData: Whether it's safe to load data (system ready + has company)
 * - capabilities: Full capabilities object
 * 
 * Usage:
 *   const { profileCompanyId, canLoadData, isAdmin, user, profile } = useDashboardKernel();
 *   
 *   useEffect(() => {
 *     if (!canLoadData) return;
 *     // Safe to load data
 *   }, [canLoadData]);
 */
export function useDashboardKernel() {
  const { user, profile, authReady, loading: authLoading } = useAuth();
  const capabilities = useCapability();
  
  // ✅ FULL-STACK SYNC: Pre-warming state tracking
  const [preWarming, setPreWarming] = useState(false);
  const preWarmingTimeoutRef = useRef(null);

  const result = useMemo(() => {
    const profileCompanyId = profile?.company_id || null;
    
    // ✅ FULL-STACK SYNC: Pre-warming logic
    // If authReady is true but profile is null, show "Synchronizing World" for 3 seconds
    const isPreWarming = authReady === true && !authLoading && user && !profile;
    
    // ✅ FORENSIC RECOVERY: Ensure authReady is explicitly checked
    // System is ready only when: auth is ready AND not loading AND capabilities are ready AND not pre-warming
    const isSystemReady = authReady === true && !authLoading && capabilities.ready === true && !isPreWarming;
    const canLoadData = isSystemReady && !!profileCompanyId;

    // ✅ KERNEL HARDENING: Profile lag detection - warn if authReady but profile missing
    // This helps debug "Profile Lag" issues in production where user exists but profile hasn't loaded
    if (isPreWarming) {
      console.warn('[useDashboardKernel] Pre-warming: authReady=true, user exists, but profile is missing - showing "Synchronizing World"', {
        userId: user.id,
        userEmail: user.email,
        hasUser: !!user,
        hasProfile: !!profile,
        timestamp: new Date().toISOString()
      });
    }

    return {
      profileCompanyId,
      userId: user?.id || null,
      user,        // ✅ FIX: Export user object for consumption
      profile,     // ✅ FIX: Export profile object for consumption
      isAdmin: !!profile?.is_admin,
      isSystemReady,
      canLoadData,
      capabilities,
      isPreWarming, // ✅ FULL-STACK SYNC: Export pre-warming state
      // ✅ FULL-STACK SYNC: Standardize isHybrid
      isHybrid: capabilities?.can_buy === true && capabilities?.can_sell === true
    };
  }, [user, profile, authReady, authLoading, capabilities]);

  // ✅ FULL-STACK SYNC: Pre-warming timeout (3 seconds)
  useEffect(() => {
    if (result.isPreWarming) {
      setPreWarming(true);
      preWarmingTimeoutRef.current = setTimeout(() => {
        console.warn('[useDashboardKernel] Pre-warming timeout (3s) - defaulting to Access Denied');
        setPreWarming(false);
      }, 3000); // 3 second timeout
    } else {
      setPreWarming(false);
      if (preWarmingTimeoutRef.current) {
        clearTimeout(preWarmingTimeoutRef.current);
        preWarmingTimeoutRef.current = null;
      }
    }

    return () => {
      if (preWarmingTimeoutRef.current) {
        clearTimeout(preWarmingTimeoutRef.current);
      }
    };
  }, [result.isPreWarming]);

  // ✅ SAFETY FALLBACK: If after 5 seconds we are still not ready, log warning
  // This helps debug spinner deadlocks without forcing readiness (which could hide real errors)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!result.isSystemReady && !result.isPreWarming) {
        console.warn('[useDashboardKernel] Timeout: System still not ready after 5s', {
          authReady,
          authLoading,
          capabilitiesReady: capabilities.ready,
          hasUser: !!user,
          hasProfile: !!profile,
          hasCompanyId: !!profile?.company_id,
          isPreWarming: result.isPreWarming
        });
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [result.isSystemReady, result.isPreWarming, authReady, authLoading, capabilities.ready, user, profile]);

  // ✅ FULL-STACK SYNC: Return pre-warming state for UI rendering
  return {
    ...result,
    preWarming // Include pre-warming state in return
  };
}
