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
  instanceId: string;
  bootTrace: (event: string, metadata?: any) => void;
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
  const { user, profile, authReady, handshakeData } = useAuth() as any;
  const isMounted = useRef(true);
  const hasFetchedRef = useRef(false);
  const fetchedCompanyIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

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
  const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9));

  // ✅ INSTRUMENTATION: Boot Trace Logger
  const bootTrace = useCallback((event: string, metadata: any = {}) => {
    if (typeof window === 'undefined') return;
    const trace = {
      instanceId,
      event: `[Capability] ${event}`,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    window.dispatchEvent(new CustomEvent('afrikoni-boot-trace', { detail: trace }));
    if (import.meta.env.DEV) {
      console.log(`%c[Trace:${instanceId}] ${event}`, 'color: #9cdcfe; font-weight: bold', metadata);
    }
  }, [instanceId]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ✅ SOVEREIGN SYNC: Safety Handshake Timeout
  useEffect(() => {
    if (!capabilities.ready) {
      const timer = setTimeout(() => {
        if (!capabilities.ready && isMounted.current) {
          console.warn('[Capability] ⚠️ Hydration taking too long. Forcing READY state for boot resilience.');
          setCapabilities(prev => ({ ...prev, ready: true, kernelError: 'Hydration Timeout (Recovered)' }));
        }
      }, 25000);
      return () => clearTimeout(timer);
    }
  }, [capabilities.ready]);

  const fetchCapabilities = useCallback(async (forceRefresh = false) => {
    const targetCompanyId = profile?.company_id;
    bootTrace('Fetch Requested', { targetCompanyId, forceRefresh, authReady });

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

    if (!authReady || !user) {
      if (hasFetchedRef.current && capabilities?.ready) return;
      setCapabilities(prev => ({
        ...prev,
        loading: false,
        ready: false,
        company_id: null,
        isSlowConnection: false,
      }));
      return;
    }

    if (!targetCompanyId) {
      setCapabilities(prev => ({
        ...prev,
        loading: false,
        ready: true,
        company_id: null,
        isSlowConnection: false,
      }));
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const { data, error } = await supabase
        .from('company_capabilities')
        .select('*')
        .eq('company_id', targetCompanyId)
        .maybeSingle();

      if (error) throw error;

      if (data && isMounted.current) {
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
        hasFetchedRef.current = true;
        fetchedCompanyIdRef.current = targetCompanyId;
      }
    } catch (err: any) {
      console.error('[CapabilityContext] Error fetching capabilities:', err);
      setCapabilities(prev => ({
        ...prev,
        loading: false,
        ready: false,
        kernelError: err.message || 'Sync error',
        isSlowConnection: false,
      }));
    } finally {
      isFetchingRef.current = false;
      bootTrace('Fetch Concluded');
    }
  }, [profile?.company_id, profile?.is_admin, authReady, user, capabilities.ready, bootTrace]);

  useEffect(() => {
    if (!authReady) {
      setCapabilities(prev => ({ ...prev, ready: false }));
      return;
    }

    // ⚡ PERFORMANCE: Instant Hydration from Handshake
    if (handshakeData?.capabilities) {
      const data = handshakeData.capabilities;
      setCapabilities({
        can_buy: data.can_buy,
        can_sell: data.can_sell,
        can_logistics: data.can_logistics,
        sell_status: data.sell_status as CapabilityStatus,
        logistics_status: data.logistics_status as CapabilityStatus,
        company_id: handshakeData.profile?.company_id || null,
        loading: false,
        ready: true,
        error: null,
        kernelError: null,
        isSlowConnection: false,
      });
      hasFetchedRef.current = true;
      fetchedCompanyIdRef.current = handshakeData.profile?.company_id || null;
      return;
    }

    if (!profile?.company_id) {
      setCapabilities(prev => ({ ...prev, ready: true, company_id: null }));
      return;
    }

    if (!hasFetchedRef.current || !capabilities.ready) {
      fetchCapabilities();
    }
  }, [authReady, profile?.company_id, fetchCapabilities, capabilities.ready, handshakeData]);

  const resetKernel = useCallback(() => {
    setCapabilities({
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
    instanceId,
    bootTrace
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
      instanceId: 'missing-context',
      bootTrace: () => { },
    };
  }
  return ctx;
}
