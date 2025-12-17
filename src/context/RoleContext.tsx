import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';

export type UserRole = 'buyer' | 'seller' | 'hybrid' | 'logistics';

type RoleContextValue = {
  role: UserRole | null;
  loading: boolean;
  refreshRole: () => Promise<void>;
  isBuyer: boolean;
  isSeller: boolean;
  isHybrid: boolean;
  isLogistics: boolean;
};

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

function normalizeRole(rawRole: string | null | undefined): UserRole | null {
  if (!rawRole) return null;
  const value = rawRole.toLowerCase();
  if (value === 'buyer') return 'buyer';
  if (value === 'seller') return 'seller';
  if (value === 'hybrid') return 'hybrid';
  if (value === 'logistics' || value === 'logistics_partner') return 'logistics';
  return null;
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRole = async () => {
    try {
      const { role: rawRole, profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      const normalized =
        normalizeRole(rawRole) ||
        normalizeRole((profile as any)?.role) ||
        normalizeRole((profile as any)?.user_role);
      setRole(normalized);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('RoleProvider: failed to load role', error);
      }
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: RoleContextValue = {
    role,
    loading,
    refreshRole: loadRole,
    isBuyer: role === 'buyer',
    isSeller: role === 'seller',
    isHybrid: role === 'hybrid',
    isLogistics: role === 'logistics',
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return ctx;
}

export function getDashboardHomePath(role: UserRole | null): string {
  switch (role) {
    case 'buyer':
      return '/dashboard/buyer';
    case 'seller':
      return '/dashboard/seller';
    case 'hybrid':
      return '/dashboard/hybrid';
    case 'logistics':
      return '/dashboard/logistics';
    default:
      return '/dashboard';
  }
}





