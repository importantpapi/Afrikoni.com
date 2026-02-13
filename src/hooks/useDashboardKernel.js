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
  // FIX: Use authReady (not authResolutionComplete) to match CapabilityContext
  const { user, profile, authReady, loading: authLoading } = useAuth();
  const capabilities = useCapability();
  const navigate = useNavigate();

  // FULL-STACK SYNC: Pre-warming state tracking
  const [preWarming, setPreWarming] = useState(false);
  const preWarmingTimeoutRef = useRef(null);

  // ✅ KERNEL RECOVERY: Organization/Company state
  const [organization, setOrganization] = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);

  const result = useMemo(() => {
    const profileCompanyId = profile?.company_id || null;

    // FIX: Use authReady (not authResolutionComplete) to match CapabilityContext
    // Pre-warming shows when auth is ready but profile is null (new user)
    const isPreWarming = authReady === true && !authLoading && user && !profile;

    // FIX: Use authReady for system ready check to match CapabilityContext
    // System is ready when: auth is ready AND not loading AND capabilities are ready AND not pre-warming
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
      isHybrid: capabilities?.can_buy === true && capabilities?.can_sell === true,
      organization,
      orgLoading
    };
  }, [user, profile, authReady, authLoading, capabilities, organization, orgLoading]);

  // ✅ NETWORK RECOVERY: Listen for online event to re-trigger handshake
  useEffect(() => {
    const handleOnline = () => {
      if (import.meta.env.DEV) console.log('[useDashboardKernel] Network online - checking if handshake needs re-trigger');
      // If system was not ready due to network issues, re-trigger handshake
      if (user && !result.isSystemReady && !result.isPreWarming) {
        if (import.meta.env.DEV) console.log('[useDashboardKernel] Re-triggering handshake after network recovery');
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

  // FIX: Increased pre-warming timeout from 2s to 5s to prevent race condition
  // Profile fetch can legitimately take 2-3s on slow networks during auth resolution
  // This timeout should be LONGER than PostLoginRouter's no-profile timeout (3s)
  useEffect(() => {
    if (result.isPreWarming) {
      setPreWarming(true);
      preWarmingTimeoutRef.current = setTimeout(async () => {
        console.warn('[useDashboardKernel] Pre-warming timeout (5s) - redirecting to onboarding');

        // ENTERPRISE: Don't retry forever - redirect after 5s
        // If user has no profile after 5s, they likely need to create one
        setPreWarming(false);
        navigate('/onboarding/company', { replace: true });
      }, 10000); // FIX: Increased to 10s for 2G network resilience
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

  // Debug timeout - log if system not ready after 3s (for troubleshooting)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!result.isSystemReady && !result.isPreWarming) {
        console.warn('[useDashboardKernel] Timeout: System not ready after 3s', {
          authReady,
          authLoading,
          capabilitiesReady: capabilities.ready,
          hasUser: !!user,
          hasProfile: !!profile,
          hasCompanyId: !!profile?.company_id,
        });
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [result.isSystemReady, result.isPreWarming, authReady, authLoading, capabilities.ready, user, profile]);

  // ✅ KERNEL RECOVERY: Fetch Organization data when company ID becomes available
  useEffect(() => {
    if (!result.profileCompanyId) return;

    const fetchOrg = async () => {
      setOrgLoading(true);
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', result.profileCompanyId)
          .single();

        if (!error && data) {
          setOrganization(data);
        }
      } catch (err) {
        console.error('[useDashboardKernel] Failed to fetch organization:', err);
      } finally {
        setOrgLoading(false);
      }
    };

    fetchOrg();

    // Listen for manual refreshes
    const handleRefresh = () => fetchOrg();
    window.addEventListener('refresh-data', handleRefresh);
    return () => window.removeEventListener('refresh-data', handleRefresh);
  }, [result.profileCompanyId]);

  // ✅ FINAL CLEANUP: Return result object (isPreWarming is already included)
  // Removed duplicate preWarming state return - use isPreWarming from result object
  return result;
}
