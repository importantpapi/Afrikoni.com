import React, { createContext, useContext, ReactNode, useEffect, useState, useRef } from 'react';
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
  refreshCapabilities: () => Promise<void>;
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
  const { user, profile, authReady } = useAuth();
  const hasFetchedRef = useRef(false);
  const fetchedCompanyIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false); // ✅ Track if fetch is in progress (not loading state)
  
  const [capabilities, setCapabilities] = useState<CapabilityData>({
    can_buy: true,
    can_sell: false,
    can_logistics: false,
    sell_status: 'disabled',
    logistics_status: 'disabled',
    company_id: null,
    loading: true,
    ready: false,
    error: null,
  });

  // Reset fetch ref when company_id changes (allows re-fetch for new company)
  useEffect(() => {
    if (fetchedCompanyIdRef.current !== profile?.company_id) {
      hasFetchedRef.current = false;
    }
  }, [profile?.company_id]);

  const fetchCapabilities = async () => {
    const targetCompanyId = profile?.company_id;
    
    // =========================================================================
    // GUARD 1: IDEMPOTENCY - Already fetched for this company_id
    // =========================================================================
    if (
      hasFetchedRef.current &&
      fetchedCompanyIdRef.current === targetCompanyId &&
      capabilities.ready
    ) {
      console.log('[CapabilityContext] Already fetched for company_id:', targetCompanyId, '- skipping');
      return;
    }

    // =========================================================================
    // GUARD 2: Prerequisites not ready
    // =========================================================================
    if (!authReady || !user || !targetCompanyId) {
      console.log('[CapabilityContext] Prerequisites not ready - authReady:', authReady, 'user:', !!user, 'companyId:', targetCompanyId);
      // ✅ FIX: Keep ready true if it was already true (prevents child unmounts)
      setCapabilities(prev => ({
        ...prev,
        loading: false,
        ready: prev.ready ? true : false,
        company_id: prev.company_id,
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
        setCapabilities(prev => ({ ...prev, loading: true, error: null }));
      }

      const { data, error } = await supabase
        .from('company_capabilities')
        .select('*')
        .eq('company_id', targetCompanyId)
        .single();

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
      // ✅ FIX: On error, set ready to true if we have a companyId (allow dashboard to load)
      // This prevents infinite loading if capabilities table has issues
      setCapabilities(prev => ({
        ...prev,
        loading: false,
        ready: targetCompanyId ? true : prev.ready, // Set ready if we have companyId
        error: err.message || 'Failed to load capabilities',
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
    // Only fetch if we have prerequisites
    if (!authReady || !currentCompanyId) {
      return;
    }

    fetchCapabilities();

    // ✅ SAFETY: If capabilities don't load within 15 seconds, set ready=true to unblock dashboard
    // This prevents infinite loading if there's a database issue
    const timeoutId = setTimeout(() => {
      // Use ref to check current state without dependency issues
      if (!hasFetchedRef.current && currentCompanyId) {
        console.warn('[CapabilityContext] ⚠️ Capability fetch timeout - setting ready=true to unblock dashboard');
        setCapabilities(prev => {
          if (prev.ready) return prev; // Don't override if already ready
          return {
            ...prev,
            loading: false,
            ready: true, // Force ready to unblock dashboard
            company_id: currentCompanyId,
            error: prev.error || 'Capability fetch timed out - using default capabilities',
          };
        });
        hasFetchedRef.current = true;
        fetchedCompanyIdRef.current = currentCompanyId;
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeoutId);
  }, [authReady, currentUserId, currentCompanyId]); // ✅ Primitives only

  const value: CapabilityContextValue = {
    ...capabilities,
    refreshCapabilities: fetchCapabilities,
  };

  return (
    <CapabilityContext.Provider value={value}>
      {children}
    </CapabilityContext.Provider>
  );
}

export function useCapability(): CapabilityContextValue {
  const ctx = useContext(CapabilityContext);
  if (!ctx) {
    throw new Error('useCapability must be used within a CapabilityProvider');
  }
  return ctx;
}
