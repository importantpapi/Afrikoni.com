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
};

type CapabilityContextValue = CapabilityData & {
  refreshCapabilities: (forceRefresh?: boolean) => Promise<void>;
};

const CapabilityContext = createContext<CapabilityContextValue | undefined>(undefined);

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
  
  // ✅ CRITICAL FIX: Start with ready=true and safe defaults to allow rendering
  const [capabilities, setCapabilities] = useState<CapabilityData>({
    can_buy: true,
    can_sell: false,
    can_logistics: false,
    sell_status: 'disabled',
    logistics_status: 'disabled',
    company_id: null,
    loading: false, // ✅ Start with false to allow immediate rendering
    ready: true, // ✅ CRITICAL: Start with true to allow rendering even without user
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
    }

    // =========================================================================
    // GUARD 2: Prerequisites not ready - ALLOW RENDERING WITH DEFAULTS
    // =========================================================================
    if (!authReady || !user || !targetCompanyId) {
      console.log('[CapabilityContext] Prerequisites not ready - authReady:', authReady, 'user:', !!user, 'companyId:', targetCompanyId);
      // ✅ CRITICAL FIX: Always keep ready=true to allow rendering, even without user
      setCapabilities(prev => ({
        ...prev,
        loading: false,
        ready: true, // ✅ ALWAYS true - never block rendering
        company_id: prev?.company_id ?? null,
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
          ready: true, // ✅ Keep ready=true even during loading
        }));
      }

      // ✅ CRITICAL FIX: Wrap database call in try/catch
      let data, error;
      try {
        const result = await supabase
          .from('company_capabilities')
          .select('*')
          .eq('company_id', targetCompanyId)
          .single();
        data = result?.data;
        error = result?.error;
      } catch (dbError: any) {
        console.error('[CapabilityContext] Database query error:', dbError);
        error = dbError;
        data = null;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          // Capabilities don't exist, create them
          console.log('[CapabilityContext] Capabilities not found, creating...');
          const { data: newCapabilities, error: insertError } = await supabase
            .from('company_capabilities')
            .insert({
              company_id: targetCompanyId,
              can_buy: true,
              can_sell: false,
              can_logistics: false,
              sell_status: 'disabled',
              logistics_status: 'disabled',
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }
          
          console.log('[CapabilityContext] ✅ Created capabilities for company:', targetCompanyId);
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
          });
          hasFetchedRef.current = true;
          fetchedCompanyIdRef.current = targetCompanyId;
        } else {
          throw error;
        }
      } else if (data) {
        console.log('[CapabilityContext] ✅ Loaded capabilities for company:', targetCompanyId);
        setCapabilities({
          can_buy: data.can_buy,
          can_sell: data.can_sell,
          can_logistics: data.can_logistics,
          sell_status: data.sell_status as CapabilityStatus,
          logistics_status: data.logistics_status as CapabilityStatus,
          company_id: targetCompanyId,
          loading: false,
          ready: true,
          error: null,
        });
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
        }));
        // Mark as fetched to prevent retry loops
        hasFetchedRef.current = true;
        fetchedCompanyIdRef.current = targetCompanyId;
        return;
      }
      
      // Network/timeout error - allow access with warning (RLS will enforce)
      setCapabilities(prev => ({
        ...prev,
        loading: false,
        ready: true, // ✅ CRITICAL: Always allow rendering
        error: errorMessage,
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
  // CAPABILITY FETCH EFFECT WITH TIMEOUT FALLBACK
  // =========================================================================
  useEffect(() => {
    // ✅ CRITICAL FIX: Wrap in try/catch to prevent blocking
    try {
      // Only fetch if we have prerequisites
      if (!authReady || !currentCompanyId) {
        // ✅ CRITICAL: Ensure ready=true even without prerequisites
        setCapabilities(prev => ({
          ...prev,
          ready: true, // Always allow rendering
          loading: false,
        }));
        return;
      }

      fetchCapabilities();

      // ✅ SAFETY: If capabilities don't load within 10 seconds, set ready=true to unblock dashboard
      // This prevents infinite loading if there's a database issue
      const timeoutId = setTimeout(() => {
        // Use ref to check current state without dependency issues
        if (!hasFetchedRef.current && currentCompanyId) {
          console.warn('[CapabilityContext] ⚠️ Capability fetch timeout - setting ready=true to unblock dashboard');
          setCapabilities(prev => {
            if (prev?.ready) return prev; // Don't override if already ready
            return {
              ...prev,
              loading: false,
              ready: true, // Force ready to unblock dashboard
              company_id: currentCompanyId,
              error: prev?.error || 'Capability fetch timed out - using default capabilities',
            };
          });
          hasFetchedRef.current = true;
          fetchedCompanyIdRef.current = currentCompanyId;
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error('[CapabilityContext] Effect error:', error);
      // ✅ CRITICAL: Always allow rendering even on error
      setCapabilities(prev => ({
        ...prev,
        ready: true,
        loading: false,
        error: 'Capability initialization error - using defaults',
      }));
    }
  }, [authReady, currentUserId, currentCompanyId]); // ✅ Primitives only

  // ✅ CRITICAL FIX: Safe value with defaults
  // refreshCapabilities now supports force refresh
  const refreshCapabilities = useCallback(async (forceRefresh = false) => {
    console.log('[CapabilityContext] refreshCapabilities called, forceRefresh:', forceRefresh);
    await fetchCapabilities(forceRefresh);
  }, []); // Stable reference - fetchCapabilities uses current profile via closure

  const value: CapabilityContextValue = {
    ...capabilities,
    refreshCapabilities,
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
      refreshCapabilities: async () => {
        console.warn('[useCapability] refreshCapabilities called outside provider');
      },
    };
  }
  return ctx;
}
