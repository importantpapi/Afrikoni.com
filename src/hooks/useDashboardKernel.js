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

  // ✅ KERNEL HANDSHAKE: Pre-warming timeout (10 seconds) with exponential backoff retry
  // ✅ GLOBAL REFACTOR: Increased timeout from 5s to 10s, added exponential backoff (3 retries)
  useEffect(() => {
    if (result.isPreWarming) {
      setPreWarming(true);
      preWarmingTimeoutRef.current = setTimeout(async () => {
        console.warn('[useDashboardKernel] Pre-warming timeout (10s) - attempting Kernel Handshake with exponential backoff');
        
        // ✅ KERNEL HANDSHAKE: Exponential backoff retry (3 attempts: 1s, 2s, 4s)
        const maxRetries = 3;
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const delayMs = 1000 * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s
            if (attempt > 1) {
              console.log(`[useDashboardKernel] Retry attempt ${attempt}/${maxRetries} after ${delayMs}ms delay...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
            
            // Step 1: Refresh session to get updated metadata
            console.log(`[useDashboardKernel] Step 1 (attempt ${attempt}/${maxRetries}): Refreshing session...`);
            await supabase.auth.refreshSession();
            
            // Step 2: Re-fetch profile after session refresh
            console.log(`[useDashboardKernel] Step 2 (attempt ${attempt}/${maxRetries}): Re-fetching profile after session refresh...`);
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single(); // ✅ GLOBAL REFACTOR: Use .single() instead of .maybeSingle()
              
              if (profileError) {
                // Handle PGRST116 (not found) - redirect to onboarding
                if (profileError.code === 'PGRST116') {
                  if (attempt < maxRetries) {
                    lastError = profileError;
                    continue; // Retry
                  }
                  // Last attempt - profile doesn't exist, redirect to onboarding
                  console.warn('[useDashboardKernel] Profile not found after all retries - redirecting to onboarding');
                  console.log('🧭 [NAVIGATION] useDashboardKernel → /onboarding/company (profile not found)');
                  navigate('/onboarding/company', { replace: true });
                  return;
                }
                // Other errors - throw
                throw profileError;
              }
              
              if (profileData) {
                console.log(`[useDashboardKernel] ✅ Kernel Handshake successful (attempt ${attempt}/${maxRetries}) - profile loaded`);
                // Profile will be updated via AuthProvider's onAuthStateChange listener
                return; // Don't clear preWarming yet - let AuthProvider update state
              } else {
                // Profile is null after refresh - redirect to onboarding
                console.warn('[useDashboardKernel] Profile is null after refresh - redirecting to onboarding');
                console.log('🧭 [NAVIGATION] useDashboardKernel → /onboarding/company (profile null after refresh)');
                navigate('/onboarding/company', { replace: true });
                return;
              }
            }
            
            // No session - this shouldn't happen, but handle it
            if (attempt === maxRetries) {
              console.warn('[useDashboardKernel] No session after all retries - defaulting to Access Denied');
              setPreWarming(false);
              return;
            }
            lastError = new Error('No session found');
          } catch (refreshError) {
            lastError = refreshError;
            console.error(`[useDashboardKernel] Kernel Handshake error (attempt ${attempt}/${maxRetries}):`, refreshError);
            
            // Handle PGRST116 (not found) - redirect to onboarding
            if (refreshError?.code === 'PGRST116' || refreshError?.message?.includes('not found')) {
              if (attempt < maxRetries) {
                continue; // Retry
              }
              // Last attempt - profile not found, redirect to onboarding
              console.warn('[useDashboardKernel] Profile not found after all retries - redirecting to onboarding');
              console.log('🧭 [NAVIGATION] useDashboardKernel → /onboarding/company (error handling)');
              navigate('/onboarding/company', { replace: true });
              return;
            }
            
            // Other errors - retry if not last attempt
            if (attempt < maxRetries) {
              continue; // Retry with exponential backoff
            }
            
            // Last attempt failed - log and clear preWarming
            console.error('[useDashboardKernel] Kernel Handshake failed after all retries:', lastError);
            setPreWarming(false);
          }
        }
        
        // All retries exhausted
        console.error('[useDashboardKernel] Kernel Handshake failed after all retries:', lastError);
        setPreWarming(false);
        // ✅ TOTAL VIBRANIUM RESET: Redirect to login on pre-warming failure
        console.error('[useDashboardKernel] Pre-warming failed - redirecting to login');
        console.log('🧭 [NAVIGATION] useDashboardKernel → /login (pre-warming failed)');
        navigate('/login?error=profile_sync_failed', { replace: true });
      }, 10000); // ✅ GLOBAL REFACTOR: Increased timeout from 5s to 10s
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
