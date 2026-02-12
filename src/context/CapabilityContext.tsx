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
  kernelError: string | null;
  isSlowConnection: boolean;
};

type CapabilityContextValue = CapabilityData & {
  refreshCapabilities: (forceRefresh?: boolean) => Promise<void>;
  forceRefresh: () => Promise<void>;
  fetchCapabilities: (forceRefresh?: boolean) => Promise<void>;
  resetKernel: () => void;
  reset: () => void;
  invalidate: (tags: string[]) => void;
  invalidateAll: () => void;
  lastInvalidatedAt: number;
  invalidatedTags: Set<string>;
};

const CapabilityContext = createContext<CapabilityContextValue | undefined>(undefined);

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
  isSlowConnection: false,
};

export function CapabilityProvider({ children }: { children: ReactNode }) {
  const { user, profile, authReady } = useAuth();
  const isMounted = useRef(true);
  const hasFetchedRef = useRef(false);
  const fetchedCompanyIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const [capabilities, setCapabilities] = useState<CapabilityData>({
    can_buy: true,
    can_sell: false,
    can_logistics: false,
    sell_status: 'disabled',
    logistics_status: 'disabled',
    company_id: null,
    loading: false,
    ready: false,
    error: null,
    kernelError: null,
    isSlowConnection: false,
  });

  const [lastInvalidatedAt, setLastInvalidatedAt] = useState<number>(0);
  const [invalidatedTags, setInvalidatedTags] = useState<Set<string>>(new Set());
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchCapabilities = useCallback(async (forceRefresh = false) => {
    const targetCompanyId = profile?.company_id;

    if (profile?.is_admin === true) {
      setCapabilities({
        ...SUPER_USER_CAPS,
        company_id: targetCompanyId || null,
        ready: true,
        kernelError: null,
        isSlowConnection: false,
      });
      hasFetchedRef.current = true;
      fetchedCompanyIdRef.current = targetCompanyId || 'admin';
      return;
    }

    if (!forceRefresh && hasFetchedRef.current && fetchedCompanyIdRef.current === targetCompanyId && capabilities?.ready) {
      return;
    }

    if (forceRefresh) {
      hasFetchedRef.current = false;
      fetchedCompanyIdRef.current = null;
    }

    if (!authReady || !user || !targetCompanyId) {
      if (hasFetchedRef.current && capabilities?.ready) return;
      setCapabilities(prev => ({
        ...prev,
        loading: false,
        ready: false,
        company_id: prev?.company_id ?? null,
        isSlowConnection: false,
      }));
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const fetchResolved = { current: false };

    try {
      if (!hasFetchedRef.current) {
        setCapabilities(prev => ({ ...prev, loading: true, error: null, ready: false }));
      }

      const fetchTimer = setTimeout(() => {
        if (!fetchResolved.current && isMounted.current) {
          setIsSlowConnection(true);
        }
      }, 5000);

      const { data, error } = await supabase
        .from('company_capabilities')
        .select('*')
        .eq('company_id', targetCompanyId)
        .maybeSingle();

      fetchResolved.current = true;
      clearTimeout(fetchTimer);

      if (error) throw error;

      if (data) {
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
          kernelError: null,
          isSlowConnection: false,
        });
        setIsSlowConnection(false);
        hasFetchedRef.current = true;
        fetchedCompanyIdRef.current = targetCompanyId;
      } else {
        // Create defaults if missing
        const { data: newData, error: insertError } = await supabase
          .from('company_capabilities')
          .upsert({
            company_id: targetCompanyId,
            can_buy: true,
            can_sell: false,
            can_logistics: false,
            sell_status: 'disabled',
            logistics_status: 'disabled',
          }, { onConflict: 'company_id' })
          .select()
          .single();

        if (insertError) throw insertError;
        if (newData) {
          setCapabilities({
            can_buy: newData.can_buy,
            can_sell: newData.can_sell,
            can_logistics: newData.can_logistics,
            sell_status: newData.sell_status as CapabilityStatus,
            logistics_status: newData.logistics_status as CapabilityStatus,
            company_id: targetCompanyId,
            loading: false,
            ready: true,
            error: null,
            kernelError: null,
            isSlowConnection: false,
          });
          hasFetchedRef.current = true;
          fetchedCompanyIdRef.current = targetCompanyId;
        }
      }
    } catch (err: any) {
      console.error('[CapabilityContext] Error fetching capabilities:', err);
      // ✅ FIX FAIL-OPEN: Set ready:false on error to prevent incomplete auth state
      setCapabilities(prev => ({
        ...prev,
        loading: false,
        ready: false, // CRITICAL: Don't pass gate on error
        kernelError: err.message || 'Sync error',
        isSlowConnection: false,
      }));
    } finally {
      isFetchingRef.current = false;
      // Ensure we mark as ready to prevent boot hang
      if (isMounted.current) {
        hasFetchedRef.current = true;
        fetchedCompanyIdRef.current = targetCompanyId;
      }
    }
  }, [profile?.company_id, profile?.is_admin, authReady, user, capabilities.ready]);

  useEffect(() => {
    if (!authReady) {
      setCapabilities(prev => ({ ...prev, ready: false, isSlowConnection: false }));
      return;
    }
    if (!profile?.company_id) {
      setCapabilities(prev => ({ ...prev, ready: true, company_id: null, isSlowConnection: false }));
      return;
    }
    if (!hasFetchedRef.current || !capabilities.ready) {
      fetchCapabilities();
    }
  }, [authReady, profile?.company_id, fetchCapabilities, capabilities.ready]);

  const resetKernel = useCallback(() => {
    setCapabilities({
      can_buy: false,
      can_sell: false,
      can_logistics: false,
      sell_status: 'disabled',
      logistics_status: 'disabled',
      company_id: null,
      loading: false,
      ready: false,
      error: null,
      kernelError: null,
      isSlowConnection: false,
    });
    hasFetchedRef.current = false;
    fetchedCompanyIdRef.current = null;
    isFetchingRef.current = false;
  }, []);

  const invalidate = useCallback((tags: string[]) => {
    setInvalidatedTags(prev => {
      const next = new Set(prev);
      tags.forEach(tag => next.add(tag));
      return next;
    });
    setLastInvalidatedAt(Date.now());
  }, []);

  const invalidateAll = useCallback(() => {
    setInvalidatedTags(new Set(['*']));
    setLastInvalidatedAt(Date.now());
  }, []);

  const value: CapabilityContextValue = {
    ...capabilities,
    isSlowConnection,
    refreshCapabilities: fetchCapabilities,
    forceRefresh: () => fetchCapabilities(true),
    fetchCapabilities,
    resetKernel,
    reset: resetKernel,
    invalidate,
    invalidateAll,
    lastInvalidatedAt,
    invalidatedTags,
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
    return {
      can_buy: true,
      can_sell: false,
      can_logistics: false,
      sell_status: 'disabled',
      logistics_status: 'disabled',
      company_id: null,
      loading: false,
      ready: true,
      error: null,
      kernelError: null,
      isSlowConnection: false,
      refreshCapabilities: async () => { },
      forceRefresh: async () => { },
      fetchCapabilities: async () => { },
      resetKernel: () => { },
      reset: () => { },
      invalidate: () => { },
      invalidateAll: () => { },
      lastInvalidatedAt: 0,
      invalidatedTags: new Set(),
    };
  }
  return ctx;
}
