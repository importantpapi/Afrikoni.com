import React, { createContext, useContext, ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';

export type CapabilityStatus = 'disabled' | 'pending' | 'approved';

export type CapabilityData = {
  can_buy: boolean;
  can_sell: boolean;
  can_logistics: boolean;
  sell_status: CapabilityStatus;
  logistics_status: CapabilityStatus;
  company_id: string | null;
  loading: boolean;
  ready: boolean;
  error: string | null;
  kernelError: string | null; // ✅ KERNEL-CENTRIC: Error state for UI retry button
};

type CapabilityContextValue = CapabilityData & {
  refreshCapabilities: (forceRefresh?: boolean) => Promise<void>;
  forceRefresh: () => Promise<void>; // ✅ KERNEL-CENTRIC: Hard reset method
  resetKernel: () => void; // ✅ KERNEL-CENTRIC: Hard reset function
  reset: () => void; // Alias for backward compatibility
};

const CapabilityContext = createContext<CapabilityContextValue | undefined>(undefined);

/**
 * ✅ KERNEL INTEGRATION: SUPER_USER_CAPS constant for Admin users
 * Ensures sell_status and logistics_status are 'approved' to prevent restricted UI elements
 */
const SUPER_USER_CAPS: CapabilityData = {
  can_buy: true,
  can_sell: true,
  can_logistics: true,
  sell_status: 'approved',
  logistics_status: 'approved',
  company_id: null,
  loading: false,
  ready: true,
  error: null,
  kernelError: null,
};

/**
 * CapabilityProvider - Provides company capabilities
 * 
 * STABILITY RULES:
 * 1. Once ready is true, it stays true (prevents child unmounts)
 * 2. Loading only shows on INITIAL fetch, not refresh
 * 3. Re-fetches are silent (no loading state change)
 */
export function CapabilityProvider({ children }: { children: ReactNode }) {
  // ✅ CRITICAL FIX: Wrap useAuth in try/catch to prevent blocking
  let user, profile, authReady;
  try {
    const auth = useAuth();
    user = auth?.user;
    profile = auth?.profile;
    authReady = auth?.authReady ?? false;
  } catch (error) {
    console.warn('[CapabilityContext] Auth context error, using defaults:', error);
    user = null;
    profile = null;
    authReady = false;
  }
  
  const hasFetchedRef = useRef(false);
  const fetchedCompanyIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false); // ✅ Track if fetch is in progress (not loading state)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null); // ✅ Track timeout to clear on success
  
  // ✅ FIX STATE STAGNATION: Start with ready=false to ensure React detects state transitions
  const [capabilities, setCapabilities] = useState<CapabilityData>({
    can_buy: true,
    can_sell: false,
    can_logistics: false,
    sell_status: 'disabled',
    logistics_status: 'disabled',
    company_id: null,
    loading: false, // Start with false - will be set to true when fetch starts
    ready: false, // ✅ FIX: Start false - will transition to true after successful fetch
    error: null,
  });

  // Reset fetch ref when company_id changes (allows re-fetch for new company)
  useEffect(() => {
    if (fetchedCompanyIdRef.current !== profile?.company_id) {
      hasFetchedRef.current = false;
    }
  }, [profile?.company_id]);

  const fetchCapabilities = async (forceRefresh = false) => {
    // ✅ CRITICAL FIX: Safe access with optional chaining
    const targetCompanyId = profile?.company_id;
    
    // =========================================================================
    // ✅ KERNEL HANDSHAKE: IMMEDIATE ADMIN BYPASS (FIRST CHECK)
    // Admins should bypass capability check entirely - if JWT says is_admin, grant everything immediately
    // This prevents the fetch from "hanging" when admins don't have company_id or capability rows
    // ✅ KERNEL INTEGRATION: Use SUPER_USER_CAPS constant to ensure consistent status values
    // =========================================================================
    if (profile?.is_admin === true) {
      console.log('[CapabilityContext] ✅ KERNEL HANDSHAKE: Admin user detected - granting full capabilities immediately (bypassing fetch)');
          setCapabilities({
            ...SUPER_USER_CAPS,
            company_id: targetCompanyId || null, // Preserve company_id if it exists
            ready: true, // ✅ FIX: Set ready=true for admin (immediate grant)
            kernelError: null, // ✅ KERNEL-CENTRIC: Clear error for admin
          });
      hasFetchedRef.current = true;
      fetchedCompanyIdRef.current = targetCompanyId || 'admin'; // Mark as fetched for admin
      return;
    }
    
    // =========================================================================
    // GUARD 1: IDEMPOTENCY - Already fetched for this company_id (unless force refresh)
    // =========================================================================
    if (
      !forceRefresh &&
      hasFetchedRef.current &&
      fetchedCompanyIdRef.current === targetCompanyId &&
      capabilities?.ready
    ) {
      console.log('[CapabilityContext] Already fetched for company_id:', targetCompanyId, '- skipping');
      return;
    }
    
    // If force refresh, reset the fetch flags
    if (forceRefresh) {
      console.log('[CapabilityContext] 🔄 Force refresh requested - resetting fetch flags');
      hasFetchedRef.current = false;
      fetchedCompanyIdRef.current = null;
      // ✅ KERNEL-CENTRIC: Clear kernel error on force refresh
      setCapabilities(prev => ({ ...prev, kernelError: null }));
    }

    // =========================================================================
    // GUARD 2: Prerequisites not ready - KEEP READY=FALSE UNTIL PREREQUISITES MET
    // ✅ VIBRANIUM STABILIZATION: If Kernel is WARM, don't dump state during authReady flicker
    // =========================================================================
    if (!authReady || !user || !targetCompanyId) {
      // ✅ VIBRANIUM STABILIZATION: If Kernel is already WARM (hasFetched === true), 
      // don't dump state just because authReady flickered during silent refresh
      // Allow fetchCapabilities to use cached session if TOKEN_REFRESHED event is in progress
      if (hasFetchedRef.current && capabilities?.ready) {
        console.log('[CapabilityContext] Kernel is WARM - skipping prerequisite check during authReady flicker');
        return; // Keep existing state - Kernel is warm, just authReady flickered
      }
      
      console.log('[CapabilityContext] Prerequisites not ready - authReady:', authReady, 'user:', !!user, 'companyId:', targetCompanyId);
      // ✅ FIX STATE STAGNATION: Keep ready=false until prerequisites are met and capabilities are loaded
      // The useEffect will handle setting ready=true after timeout if needed (for onboarding flow)
      setCapabilities(prev => ({
        ...prev,
        loading: false,
        ready: false, // ✅ FIX: Keep false until prerequisites are met and capabilities are loaded
        company_id: prev?.company_id ?? null,
        kernelError: null, // ✅ KERNEL-CENTRIC: Clear error when prerequisites not met
      }));
      return;
    }
    
    // =========================================================================
    // GUARD 3: Already fetching (prevent concurrent fetches)
    // ✅ FIXED: Use ref instead of loading state to prevent blocking initial fetch
    // =========================================================================
    if (isFetchingRef.current) {
      console.log('[CapabilityContext] Already fetching - skipping concurrent request');
      return;
    }

    // ✅ Mark as fetching BEFORE async operations
    isFetchingRef.current = true;

    try {
      console.log('[CapabilityContext] Fetching capabilities for company:', targetCompanyId);
      
      // ✅ FIX: Only show loading on INITIAL fetch, not refresh
      const isInitialFetch = !hasFetchedRef.current;
      
      if (isInitialFetch) {
        setCapabilities(prev => ({ 
          ...prev, 
          loading: true, 
          error: null,
          ready: false, // ✅ FIX: Keep ready=false during loading - will be set to true after success
        }));
      }

      // ✅ HARDEN CAPABILITY FETCH: Pre-check to ensure company record exists before fetching capabilities
      let companyExists = false;
      try {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('id', targetCompanyId)
          .single();
        
        if (companyError && companyError.code !== 'PGRST116') {
          console.warn('[CapabilityContext] Company pre-check error (non-fatal):', companyError);
        }
        companyExists = !!companyData;
      } catch (companyCheckError: any) {
        console.warn('[CapabilityContext] Company pre-check failed (non-fatal):', companyCheckError);
        // Continue anyway - capabilities fetch will handle missing company
      }

      if (!companyExists) {
        console.warn('[CapabilityContext] Company not found - creating default capabilities');
        // Company doesn't exist - create default capabilities anyway (company might be created later)
      }

      // ✅ CRITICAL FIX: Wrap database call in try/catch with retry logic
      let data, error;
      let fetchAttempt = 0;
      const maxAttempts = 2;
      
      while (fetchAttempt < maxAttempts) {
        fetchAttempt++;
        try {
          // ✅ OPTIMIZE CAPABILITY HANDSHAKE: Use .maybeSingle() to prevent hanging on missing records
          const result = await supabase
            .from('company_capabilities')
            .select('*')
            .eq('company_id', targetCompanyId)
            .maybeSingle();
          
          data = result?.data;
          error = result?.error;
          
          // ✅ OPTIMIZE CAPABILITY HANDSHAKE: Add error log specifically for Supabase response
          if (error) {
            console.error(`[CapabilityContext] Supabase response error (attempt ${fetchAttempt}/${maxAttempts}):`, {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
              status: error.status,
              statusText: error.statusText
            });
          } else if (data) {
            console.log(`[CapabilityContext] ✅ Supabase response success (attempt ${fetchAttempt}/${maxAttempts}):`, {
              company_id: data.company_id,
              can_buy: data.can_buy,
              can_sell: data.can_sell,
              can_logistics: data.can_logistics
            });
          } else {
            console.log(`[CapabilityContext] Supabase response: no data, no error (attempt ${fetchAttempt}/${maxAttempts})`);
          }
          
          // If successful or non-retryable error, break
          if (!error || (error.code !== 'PGRST116' && fetchAttempt === 1)) {
            break;
          }
          
          // If PGRST116 (not found) on first attempt, retry once
          if (error.code === 'PGRST116' && fetchAttempt < maxAttempts) {
            console.log(`[CapabilityContext] Capabilities not found (attempt ${fetchAttempt}/${maxAttempts}) - retrying...`);
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay before retry
            continue;
          }
          
          break;
        } catch (dbError: any) {
          console.error(`[CapabilityContext] Database query error (attempt ${fetchAttempt}/${maxAttempts}):`, {
            message: dbError.message,
            stack: dbError.stack,
            name: dbError.name
          });
          error = dbError;
          data = null;
          
          // Retry on network/timeout errors
          if (fetchAttempt < maxAttempts && (
            dbError.message?.includes('fetch') || 
            dbError.message?.includes('network') || 
            dbError.message?.includes('timeout')
          )) {
            console.log(`[CapabilityContext] Network error detected - retrying...`);
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay before retry
            continue;
          }
          
          break;
        }
      }

      if (error) {
        if (error.code === 'PGRST116') {
          // Capabilities don't exist, create them using upsert for idempotency
          console.log('[CapabilityContext] Capabilities not found, creating/upserting...');
          
          // ✅ CAPABILITY RESILIENCE: Use upsert with retry loop (2 attempts)
          let newCapabilities = null;
          let insertError = null;
          
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              const result = await supabase
                .from('company_capabilities')
                .upsert({
                  company_id: targetCompanyId,
                  can_buy: true,
                  can_sell: false,
                  can_logistics: false,
                  sell_status: 'disabled',
                  logistics_status: 'disabled',
                }, {
                  onConflict: 'company_id'
                })
                .select()
                .single();

              if (result.error) {
                insertError = result.error;
                if (attempt < 2) {
                  console.warn(`[CapabilityContext] Upsert attempt ${attempt} failed, retrying...`, insertError);
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                  continue;
                }
              } else {
                newCapabilities = result.data;
                insertError = null;
                break;
              }
            } catch (upsertErr: any) {
              insertError = upsertErr;
              if (attempt < 2) {
                console.warn(`[CapabilityContext] Upsert attempt ${attempt} error, retrying...`, upsertErr);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                continue;
              }
            }
          }

          if (insertError || !newCapabilities) {
            throw insertError || new Error('Failed to create capabilities after 2 attempts');
          }
          
          console.log('[CapabilityContext] ✅ Created/upserted capabilities for company:', targetCompanyId);
          
          // ✅ ELIMINATE TIMEOUT RACE: Clear timeout immediately upon successful creation
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
            console.log('[CapabilityContext] ✅ Cleared timeout - capabilities created successfully');
          }
          
          setCapabilities({
            can_buy: newCapabilities.can_buy,
            can_sell: newCapabilities.can_sell,
            can_logistics: newCapabilities.can_logistics,
            sell_status: newCapabilities.sell_status as CapabilityStatus,
            logistics_status: newCapabilities.logistics_status as CapabilityStatus,
            company_id: targetCompanyId,
            loading: false,
            ready: true,
            error: null,
            kernelError: null, // ✅ KERNEL-CENTRIC: Clear error on success
          });
          hasFetchedRef.current = true;
          fetchedCompanyIdRef.current = targetCompanyId;
        } else {
          throw error;
        }
      } else if (data) {
        console.log('[CapabilityContext] ✅ Loaded capabilities for company:', targetCompanyId);
        
        // ✅ ELIMINATE TIMEOUT RACE: Clear timeout immediately upon successful database response
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
          console.log('[CapabilityContext] ✅ Cleared timeout - capabilities loaded successfully');
        }
        
        // ✅ CAPABILITY RESILIENCE: Only set ready=true after successful fetch
        setCapabilities({
          can_buy: data.can_buy,
          can_sell: data.can_sell,
          can_logistics: data.can_logistics,
          sell_status: data.sell_status as CapabilityStatus,
          logistics_status: data.logistics_status as CapabilityStatus,
          company_id: targetCompanyId,
          loading: false,
          ready: true, // ✅ Only set ready=true after successful fetch
          error: null,
        });
        hasFetchedRef.current = true;
        fetchedCompanyIdRef.current = targetCompanyId;
      } else {
        // No data and no error - this shouldn't happen, but handle gracefully
        console.warn('[CapabilityContext] No data and no error - using defaults');
        setCapabilities(prev => ({
          ...prev,
          loading: false,
          ready: true, // Still allow rendering with defaults
          company_id: targetCompanyId,
        }));
        hasFetchedRef.current = true;
        fetchedCompanyIdRef.current = targetCompanyId;
      }
    } catch (err: any) {
      console.error('[CapabilityContext] Error fetching capabilities:', err);
      
      // ✅ FOUNDATION FIX: Fail-safe error handling
      // Check if error is due to missing table (critical database sync issue)
      const errorMessage = err.message || 'Failed to load capabilities';
      const isTableMissing = errorMessage.includes('table') || 
                            errorMessage.includes('does not exist') ||
                            errorMessage.includes('schema cache');
      
      if (isTableMissing) {
        // Critical error: Table missing - but STILL ALLOW RENDERING
        console.error('[CapabilityContext] 🔴 CRITICAL: Database table missing. Using defaults.');
        setCapabilities(prev => ({
          ...prev,
          loading: false,
          ready: true, // ✅ CRITICAL: Still allow rendering with defaults
          error: 'Database sync error: Required tables are missing. Please contact support or run database migrations.',
          kernelError: 'Database sync error: Required tables are missing. Please contact support or run database migrations.', // ✅ KERNEL-CENTRIC: Set kernelError
        }));
        // Mark as fetched to prevent retry loops
        hasFetchedRef.current = true;
        fetchedCompanyIdRef.current = targetCompanyId;
        return;
      }
      
      // Network/timeout error - allow access with warning (RLS will enforce)
      // ✅ TOTAL VIBRANIUM RESET: Use kernelError instead of error for consistency
      setCapabilities(prev => ({
        ...prev,
        loading: false,
        ready: true, // ✅ CRITICAL: Always allow rendering
        kernelError: errorMessage, // ✅ TOTAL VIBRANIUM RESET: Use kernelError state
      }));
      
      // Still mark as fetched to prevent retry loops
      if (targetCompanyId) {
        hasFetchedRef.current = true;
        fetchedCompanyIdRef.current = targetCompanyId;
      }
    } finally {
      // ✅ CRITICAL: Always reset fetching flag
      isFetchingRef.current = false;
    }
  };

  // =========================================================================
  // CAPABILITY FETCH EFFECT
  // =========================================================================
  // 
  // STABILITY RULES:
  // 1. Only fetch when company_id CHANGES or on initial load
  // 2. Do NOT re-fetch on user object change (user?.id is primitive)
  // 3. Idempotency guard inside fetchCapabilities prevents duplicate fetches
  //
  // WHY THIS CANNOT LOOP:
  // - authReady: boolean, only goes from false→true once
  // - profile?.company_id: string primitive, stable after profile load
  // - fetchCapabilities has internal idempotency guard
  // =========================================================================
  
  const currentUserId = user?.id || null;
  const currentCompanyId = profile?.company_id || null;
  
  // =========================================================================
  // AUTH CHANGE LISTENER: Reset capabilities on signout
  // =========================================================================
  useEffect(() => {
    const DEBUG_BOOT = import.meta.env.VITE_DEBUG_BOOT === 'true';

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          console.log('[CapabilityContext] SIGNED_OUT detected - resetting capabilities');
          // Reset capabilities to null/defaults on signout
          setCapabilities({
            can_buy: false,
            can_sell: false,
            can_logistics: false,
            sell_status: 'disabled',
            logistics_status: 'disabled',
            company_id: null,
            loading: false,
            ready: true, // Keep ready=true to allow rendering
            error: null,
          });
          // Reset fetch flags
          hasFetchedRef.current = false;
          fetchedCompanyIdRef.current = null;
        } else if (event === 'SIGNED_IN') {
          // ✅ GHOST NAVIGATION FIX: Check if Kernel is already WARM before resetting
          // Only reset if we don't have valid capabilities yet (cold start)
          const hasValidCapabilities = hasFetchedRef.current && fetchedCompanyIdRef.current !== null;

          if (hasValidCapabilities) {
            // ✅ Kernel is WARM - DO NOT RESET (prevents ghost navigation)
            if (DEBUG_BOOT) console.log('[CapabilityContext] SIGNED_IN detected - Kernel is WARM, skipping reset');
            return; // Preserve warm state
          }

          // Cold start - reset to allow initial fetch
          if (DEBUG_BOOT) console.log('[CapabilityContext] SIGNED_IN detected - cold start, resetting fetch flags');
          hasFetchedRef.current = false;
          fetchedCompanyIdRef.current = null;
        } else if (event === 'TOKEN_REFRESHED') {
          // ✅ KERNEL LOCK: Maintain "Warm" state during token refresh
          // During TOKEN_REFRESHED, profile may be momentarily null, but we should NOT reset
          // if we already have valid capabilities loaded. This prevents the 5-second hang.
          
          // Check if we ALREADY have valid capabilities loaded
          const hasValidCapabilities = hasFetchedRef.current && fetchedCompanyIdRef.current !== null;
          
          if (hasValidCapabilities) {
            // ✅ KERNEL LOCK: We have valid capabilities - DO NOT RESET
            // Maintain the current "Ready" state and keep fetch flags intact
            console.log('[CapabilityContext] TOKEN_REFRESHED detected - Kernel is WARM, maintaining capabilities', {
              fetchedCompanyId: fetchedCompanyIdRef.current,
              hasFetched: hasFetchedRef.current
            });
            // DO NOT reset flags - keep Kernel warm
            return; // Exit early - no reset needed
          }
          
          // Only reset if we DON'T have valid capabilities yet
          // This handles the case where TOKEN_REFRESHED fires before initial fetch completes
          console.log('[CapabilityContext] TOKEN_REFRESHED detected - no valid capabilities yet, allowing reset', {
            hasFetched: hasFetchedRef.current,
            fetchedCompanyId: fetchedCompanyIdRef.current
          });
          // Note: We don't reset here because if we don't have capabilities, 
          // the fetch effect will handle it. Resetting here would cause double-booting.
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty deps - only set up listener once

  // ✅ ELIMINATE TIMEOUT RACE: Removed duplicate onAuthStateChange listener
  // The listener above (lines 432-465) already handles SIGNED_OUT, SIGNED_IN, and TOKEN_REFRESHED
  // This duplicate was causing unnecessary resets

  // =========================================================================
  // CAPABILITY FETCH EFFECT WITH TIMEOUT FALLBACK
  // =========================================================================
  useEffect(() => {
    // ✅ CRITICAL FIX: Wrap in try/catch to prevent blocking
    try {
      // Only fetch if we have prerequisites
      if (!authReady || !currentCompanyId) {
        // ✅ FIX STATE STAGNATION: Keep ready=false until prerequisites are met
        // If authReady but no companyId, allow rendering after timeout (for onboarding flow)
        setCapabilities(prev => ({
          ...prev,
          ready: false, // ✅ FIX: Keep false until authReady and companyId are available
          loading: false,
          kernelError: null, // ✅ KERNEL-CENTRIC: Clear error when prerequisites not met
        }));

        // ✅ FIX DEADLOCK: Fail-open after 3s if prerequisites still not met
        // This handles race conditions during auth recovery
        const prerequisiteTimeoutId = setTimeout(() => {
          if (!hasFetchedRef.current) {
            console.warn('[CapabilityContext] Prerequisites timeout - failing open to prevent infinite spinner');
            setCapabilities(prev => ({
              ...prev,
              ready: true, // Fail-open to allow rendering
              loading: false,
              kernelError: !currentCompanyId ? 'Company profile not loaded. Some features may be limited.' : null,
            }));
          }
        }, 3000);

        return () => clearTimeout(prerequisiteTimeoutId);
      }

      // ✅ KERNEL LOCK: Only fetch if we haven't fetched yet (prevents double-booting)
      if (!hasFetchedRef.current) {
        fetchCapabilities();
      } else {
        console.log('[CapabilityContext] ✅ Kernel is WARM - skipping fetch (already loaded)');
      }

      // ✅ HARDEN CAPABILITY FETCH: Reduced timeout from 10s to 5s with automatic retry
      // This prevents infinite loading if there's a database issue
      // ✅ ELIMINATE TIMEOUT RACE: Store timeout ID in ref so it can be cleared on success
      // ✅ KERNEL-CENTRIC: Set kernelError instead of just timing out - UI can show retry button
      timeoutIdRef.current = setTimeout(() => {
        // Use ref to check current state without dependency issues
        if (!hasFetchedRef.current && currentCompanyId) {
          console.warn('[CapabilityContext] ⚠️ Capability fetch timeout (5s) - failing open with error state');
          setCapabilities(prev => {
            if (prev?.ready) return prev; // Don't override if already ready
            return {
              ...prev,
              loading: false,
              ready: true, // ✅ FIX DEADLOCK: Fail-open to allow rendering with error state
              company_id: currentCompanyId,
              error: prev?.error || 'Capability fetch timed out',
              kernelError: 'Capability fetch timed out. Please retry.', // ✅ KERNEL-CENTRIC: Set error for UI
            };
          });
          // Don't mark as fetched - allow retry
          timeoutIdRef.current = null; // Clear ref after timeout fires
        }
      }, 5000); // ✅ Reduced from 10s to 5s timeout

      return () => {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }
      };
    } catch (error) {
      console.error('[CapabilityContext] Effect error:', error);
      // ✅ CRITICAL: Always allow rendering even on error
      setCapabilities(prev => ({
        ...prev,
        ready: true,
        loading: false,
        error: 'Capability initialization error - using defaults',
        kernelError: 'Capability initialization error - using defaults', // ✅ KERNEL-CENTRIC: Set kernelError
      }));
    }
  }, [authReady, currentUserId, currentCompanyId]); // ✅ Primitives only

  // ✅ CRITICAL FIX: Safe value with defaults
  // refreshCapabilities now supports force refresh
  const refreshCapabilities = useCallback(async (forceRefresh = false) => {
    console.log('[CapabilityContext] refreshCapabilities called, forceRefresh:', forceRefresh);
    await fetchCapabilities(forceRefresh);
  }, []); // Stable reference - fetchCapabilities uses current profile via closure

  // ✅ KERNEL-CENTRIC: Hard reset method that clears hasFetched and fetchedCompanyId, then triggers fetch
  const forceRefresh = useCallback(async () => {
    console.log('[CapabilityContext] forceRefresh() called - hard reset');
    hasFetchedRef.current = false;
    fetchedCompanyIdRef.current = null;
    setCapabilities(prev => ({ ...prev, kernelError: null }));
    await fetchCapabilities(true);
  }, []); // Stable reference - fetchCapabilities uses current profile via closure

  // ✅ KERNEL-CENTRIC: Hard reset function that clears capabilities, hasFetched, and fetchedCompanyId
  const resetKernel = useCallback(() => {
    console.log('[CapabilityContext] resetKernel() called - clearing Kernel state');
    setCapabilities({
      can_buy: false,
      can_sell: false,
      can_logistics: false,
      sell_status: 'disabled',
      logistics_status: 'disabled',
      company_id: null,
      loading: false,
      ready: false, // Reset to false - will be set to true on next login
      error: null,
      kernelError: null, // ✅ KERNEL-CENTRIC: Clear kernel error on reset
    });
    // Reset fetch flags
    hasFetchedRef.current = false;
    fetchedCompanyIdRef.current = null;
    isFetchingRef.current = false;
    // Clear any pending timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  // ✅ KERNEL-CENTRIC: Alias for backward compatibility
  const reset = resetKernel;

  const value: CapabilityContextValue = {
    ...capabilities,
    refreshCapabilities,
    forceRefresh, // ✅ KERNEL-CENTRIC: Export forceRefresh method
    resetKernel, // ✅ KERNEL-CENTRIC: Export resetKernel function
    reset, // Alias for backward compatibility
  };

  // ✅ CRITICAL FIX: Always render children, even if context fails
  try {
    return (
      <CapabilityContext.Provider value={value}>
        {children}
      </CapabilityContext.Provider>
    );
  } catch (error) {
    console.error('[CapabilityContext] Provider render error:', error);
    // ✅ CRITICAL: Still render children even if provider fails
    return <>{children}</>;
  }
}

export function useCapability(): CapabilityContextValue {
  // ✅ CRITICAL FIX: Safe access with defaults instead of throwing
  const ctx = useContext(CapabilityContext);
  if (!ctx) {
    console.warn('[useCapability] Used outside CapabilityProvider - returning defaults');
    // ✅ CRITICAL: Return safe defaults instead of throwing
    return {
      can_buy: true,
      can_sell: false,
      can_logistics: false,
      sell_status: 'disabled',
      logistics_status: 'disabled',
      company_id: null,
      loading: false,
      ready: true, // ✅ Always ready to allow rendering
      error: null,
      kernelError: null,
      refreshCapabilities: async () => {
        console.warn('[useCapability] refreshCapabilities called outside provider');
      },
      forceRefresh: async () => {
        console.warn('[useCapability] forceRefresh called outside provider');
      },
      resetKernel: () => {
        console.warn('[useCapability] resetKernel called outside provider');
      },
      reset: () => {
        console.warn('[useCapability] reset called outside provider');
      },
    };
  }
  return ctx;
}
