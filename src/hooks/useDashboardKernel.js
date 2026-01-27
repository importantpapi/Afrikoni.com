import { useMemo, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/context/CapabilityContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';

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
  const navigate = useNavigate(); // ✅ TOTAL VIBRANIUM RESET: Add navigate for pre-warming failure redirect
  
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

  // ✅ NETWORK RECOVERY: Listen for online event to re-trigger handshake
  useEffect(() => {
    const handleOnline = () => {
      console.log('[useDashboardKernel] Network online - checking if handshake needs re-trigger');
      // If system was not ready due to network issues, re-trigger handshake
      if (user && !result.isSystemReady && !result.isPreWarming) {
        console.log('[useDashboardKernel] Re-triggering handshake after network recovery');
        // Force a session refresh to re-sync
        supabase.auth.refreshSession().catch(err => {
          console.error('[useDashboardKernel] Session refresh error after network recovery:', err);
        });
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [user, result.isSystemReady, result.isPreWarming]);

  // ✅ ENTERPRISE FIX: Reduced pre-warming timeout from 10s to 3s
  // If profile doesn't load in 3s, redirect to onboarding immediately
  useEffect(() => {
    if (result.isPreWarming) {
      setPreWarming(true);
      preWarmingTimeoutRef.current = setTimeout(async () => {
        console.warn('[useDashboardKernel] Pre-warming timeout (3s) - redirecting to onboarding');

        // ✅ ENTERPRISE: Don't retry forever - redirect immediately
        // If user has no profile after 3s, they need to create one
        setPreWarming(false);
        navigate('/onboarding/company', { replace: true });
      }, 3000); // ✅ ENTERPRISE: Reduced from 10s to 3s for fast UX
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

  // ✅ ENTERPRISE: Debug timeout reduced to 5s for faster feedback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!result.isSystemReady && !result.isPreWarming) {
        console.warn('[useDashboardKernel] Timeout: System not ready after 5s', {
          authReady,
          authLoading,
          capabilitiesReady: capabilities.ready,
          hasUser: !!user,
          hasProfile: !!profile,
          hasCompanyId: !!profile?.company_id,
        });
      }
    }, 5000); // ✅ ENTERPRISE: Reduced to 5s
    return () => clearTimeout(timer);
  }, [result.isSystemReady, result.isPreWarming, authReady, authLoading, capabilities.ready, user, profile]);

  // ✅ FINAL CLEANUP: Return result object (isPreWarming is already included)
  // Removed duplicate preWarming state return - use isPreWarming from result object
  return result;
}
