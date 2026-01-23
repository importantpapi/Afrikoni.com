import { useMemo, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/context/CapabilityContext';
import { supabase } from '@/api/supabaseClient';

/**
 * useDashboardKernel - Unified Dashboard Kernel Hook
 *
 * ✅ SINGLE REDIRECT OWNER: This hook ONLY computes state, never navigates
 *
 * Provides standardized access to dashboard state and guards:
 * - profileCompanyId: The company ID for data queries
 * - userId: The user ID
 * - user: The user object from AuthProvider
 * - profile: The profile object from AuthProvider
 * - profileStatus: "loading" | "missing" | "ready" | "error"
 * - capabilitiesStatus: "loading" | "ready" | "error"
 * - systemStatus: "loading" | "ready" | "error"
 * - isAdmin: Whether user is admin
 * - canLoadData: Whether it's safe to load data (system ready + has company)
 * - capabilities: Full capabilities object
 *
 * Usage:
 *   const { profileStatus, systemStatus, canLoadData } = useDashboardKernel();
 *
 *   // PostLoginRouter uses profileStatus to decide where to navigate
 *   // Components use systemStatus to know when data can be loaded
 */
export function useDashboardKernel() {
  const { user, profile, authReady, loading: authLoading } = useAuth();
  const capabilities = useCapability();

  // ✅ SINGLE REDIRECT OWNER: Track profile fetch state without navigating
  const [profileFetchStatus, setProfileFetchStatus] = useState('idle'); // idle | loading | ready | missing | error
  const preWarmingTimeoutRef = useRef(null);

  const DEBUG_BOOT = import.meta.env.VITE_DEBUG_BOOT === 'true';

  const result = useMemo(() => {
    const profileCompanyId = profile?.company_id || null;

    // ✅ SINGLE REDIRECT OWNER: Compute profile status (state only, no navigation)
    let profileStatus;
    if (!authReady || authLoading) {
      profileStatus = 'loading';
    } else if (!user) {
      profileStatus = 'error'; // No user means auth failed
    } else if (!profile && profileFetchStatus === 'loading') {
      profileStatus = 'loading'; // Actively fetching profile
    } else if (!profile && profileFetchStatus === 'missing') {
      profileStatus = 'missing'; // Profile confirmed not to exist
    } else if (!profile && profileFetchStatus === 'error') {
      profileStatus = 'error'; // Profile fetch failed
    } else if (profile) {
      profileStatus = 'ready'; // Profile loaded successfully
    } else {
      // Auth is ready, user exists, but profile is null and no explicit fetch status
      profileStatus = 'loading'; // Default to loading (pre-warming state)
    }

    // ✅ SINGLE REDIRECT OWNER: Compute capabilities status
    let capabilitiesStatus;
    if (!capabilities || capabilities.loading) {
      capabilitiesStatus = 'loading';
    } else if (capabilities.error || capabilities.kernelError) {
      capabilitiesStatus = 'error';
    } else if (capabilities.ready) {
      capabilitiesStatus = 'ready';
    } else {
      capabilitiesStatus = 'loading';
    }

    // ✅ SINGLE REDIRECT OWNER: Compute system status
    let systemStatus;
    if (profileStatus === 'loading' || capabilitiesStatus === 'loading') {
      systemStatus = 'loading';
    } else if (profileStatus === 'error' || capabilitiesStatus === 'error') {
      systemStatus = 'error';
    } else if (profileStatus === 'ready' && capabilitiesStatus === 'ready') {
      systemStatus = 'ready';
    } else if (profileStatus === 'missing') {
      systemStatus = 'ready'; // System is ready, just profile is missing (onboarding flow)
    } else {
      systemStatus = 'loading';
    }

    const isSystemReady = systemStatus === 'ready';
    const canLoadData = isSystemReady && !!profileCompanyId;

    // Pre-warming detection (profile fetch in progress)
    const isPreWarming = authReady === true && !authLoading && user && !profile && profileFetchStatus === 'loading';

    if (DEBUG_BOOT && profileStatus !== 'ready') {
      console.log('[useDashboardKernel] Status check:', {
        profileStatus,
        capabilitiesStatus,
        systemStatus,
        profileFetchStatus,
        hasUser: !!user,
        hasProfile: !!profile,
        authReady,
        authLoading
      });
    }

    return {
      profileCompanyId,
      userId: user?.id || null,
      user,
      profile,
      profileStatus,
      capabilitiesStatus,
      systemStatus,
      isAdmin: !!profile?.is_admin,
      isSystemReady,
      canLoadData,
      capabilities,
      isPreWarming,
      isHybrid: capabilities?.can_buy === true && capabilities?.can_sell === true
    };
  }, [user, profile, authReady, authLoading, capabilities, profileFetchStatus, DEBUG_BOOT]);

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

  // ✅ SINGLE REDIRECT OWNER: Profile fetch with retry (NO NAVIGATION)
  // This effect only fetches and updates profileFetchStatus
  // PostLoginRouter will handle navigation based on the status
  useEffect(() => {
    if (result.isPreWarming) {
      setProfileFetchStatus('loading');
      preWarmingTimeoutRef.current = setTimeout(async () => {
        console.warn('[useDashboardKernel] Pre-warming timeout (10s) - attempting profile fetch with exponential backoff');

        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const delayMs = 1000 * Math.pow(2, attempt - 1);
            if (attempt > 1) {
              console.log(`[useDashboardKernel] Retry attempt ${attempt}/${maxRetries} after ${delayMs}ms delay...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }

            // Step 1: Refresh session
            console.log(`[useDashboardKernel] Step 1 (attempt ${attempt}/${maxRetries}): Refreshing session...`);
            await supabase.auth.refreshSession();

            // Step 2: Re-fetch profile
            console.log(`[useDashboardKernel] Step 2 (attempt ${attempt}/${maxRetries}): Re-fetching profile...`);
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profileError) {
                if (profileError.code === 'PGRST116') {
                  if (attempt < maxRetries) {
                    lastError = profileError;
                    continue; // Retry
                  }
                  // Profile confirmed not to exist after all retries
                  console.warn('[useDashboardKernel] Profile not found after all retries - marking as missing');
                  setProfileFetchStatus('missing');
                  return;
                }
                throw profileError;
              }

              if (profileData) {
                console.log(`[useDashboardKernel] ✅ Profile fetch successful (attempt ${attempt}/${maxRetries})`);
                setProfileFetchStatus('ready');
                // Profile will be updated via AuthProvider's onAuthStateChange listener
                return;
              } else {
                // Profile is null after refresh
                console.warn('[useDashboardKernel] Profile is null after refresh - marking as missing');
                setProfileFetchStatus('missing');
                return;
              }
            }

            if (attempt === maxRetries) {
              console.warn('[useDashboardKernel] No session after all retries - marking as error');
              setProfileFetchStatus('error');
              return;
            }
            lastError = new Error('No session found');
          } catch (refreshError) {
            lastError = refreshError;
            console.error(`[useDashboardKernel] Profile fetch error (attempt ${attempt}/${maxRetries}):`, refreshError);

            if (refreshError?.code === 'PGRST116' || refreshError?.message?.includes('not found')) {
              if (attempt < maxRetries) {
                continue; // Retry
              }
              console.warn('[useDashboardKernel] Profile not found after all retries - marking as missing');
              setProfileFetchStatus('missing');
              return;
            }

            if (attempt < maxRetries) {
              continue; // Retry with exponential backoff
            }

            // Last attempt failed
            console.error('[useDashboardKernel] Profile fetch failed after all retries:', lastError);
            setProfileFetchStatus('error');
          }
        }

        // All retries exhausted
        console.error('[useDashboardKernel] Profile fetch failed after all retries:', lastError);
        setProfileFetchStatus('error');
      }, 10000);
    } else {
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

  // ✅ SAFETY FALLBACK: If after 10 seconds we are still not ready, log warning
  // ✅ VIBRANIUM STABILIZATION: Increased from 5s to 10s to allow for slow database responses during initial boot
  // This helps debug spinner deadlocks without forcing readiness (which could hide real errors)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!result.isSystemReady && !result.isPreWarming) {
        console.warn('[useDashboardKernel] Timeout: System still not ready after 10s', {
          authReady,
          authLoading,
          capabilitiesReady: capabilities.ready,
          hasUser: !!user,
          hasProfile: !!profile,
          hasCompanyId: !!profile?.company_id,
          isPreWarming: result.isPreWarming
        });
      }
    }, 10000); // ✅ VIBRANIUM STABILIZATION: Increased from 5s to 10s
    return () => clearTimeout(timer);
  }, [result.isSystemReady, result.isPreWarming, authReady, authLoading, capabilities.ready, user, profile]);

  // ✅ FINAL CLEANUP: Return result object (isPreWarming is already included)
  // Removed duplicate preWarming state return - use isPreWarming from result object
  return result;
}
