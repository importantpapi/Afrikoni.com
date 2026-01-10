import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthProvider';

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

export function RoleProvider({ children }: { children: ReactNode }) {
  const { role: authRole, loading: authLoading, refreshProfile } = useAuth();

  const normalizedRole = authRole as UserRole | null;

  const value: RoleContextValue = {
    role: normalizedRole,
    loading: authLoading,
    refreshRole: refreshProfile,
    isBuyer: normalizedRole === 'buyer',
    isSeller: normalizedRole === 'seller',
    isHybrid: normalizedRole === 'hybrid',
    isLogistics: normalizedRole === 'logistics',
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}

export function getDashboardHomePath(role: UserRole | null): string {
  return '/dashboard';
}