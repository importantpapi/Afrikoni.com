import React, { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export type DashboardRole = 'buyer' | 'seller' | 'hybrid' | 'logistics';

type DashboardRoleContextValue = {
  role: DashboardRole;
  isBuyer: boolean;
  isSeller: boolean;
  isHybrid: boolean;
  isLogistics: boolean;
};

const DashboardRoleContext = createContext<DashboardRoleContextValue | undefined>(undefined);

function normalizeRoleFromPath(pathname: string): DashboardRole {
  // URL is the single source of truth
  if (pathname.startsWith('/dashboard/logistics')) return 'logistics';
  if (pathname.startsWith('/dashboard/seller')) return 'seller';
  if (pathname.startsWith('/dashboard/hybrid')) return 'buyer';
  // Default all other /dashboard and /dashboard/buyer to buyer
  return 'buyer';
}

export function DashboardRoleProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const value = useMemo<DashboardRoleContextValue>(() => {
    const role = normalizeRoleFromPath(location.pathname);
    return {
      role,
      isBuyer: role === 'buyer',
      isSeller: role === 'seller',
      isHybrid: role === 'hybrid',
      isLogistics: role === 'logistics',
    };
  }, [location.pathname]);

  return (
    <DashboardRoleContext.Provider value={value}>
      {children}
    </DashboardRoleContext.Provider>
  );
}

export function useDashboardRole(): DashboardRoleContextValue {
  const ctx = useContext(DashboardRoleContext);
  if (!ctx) {
    throw new Error('useDashboardRole must be used within a DashboardRoleProvider');
  }
  return ctx;
}


