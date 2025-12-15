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

  // Logistics universe
  if (
    pathname.startsWith('/dashboard/logistics') ||
    pathname.startsWith('/dashboard/shipments') ||
    pathname.startsWith('/dashboard/logistics-quote') ||
    (pathname.startsWith('/dashboard/orders/') && pathname.includes('/logistics-quote'))
  ) {
    return 'logistics';
  }

  // Seller universe (seller tools that don't have /seller in the path)
  if (
    pathname.startsWith('/dashboard/seller') ||
    pathname.startsWith('/dashboard/sales') ||
    pathname.startsWith('/dashboard/products') ||
    pathname.startsWith('/dashboard/fulfillment') ||
    pathname.startsWith('/dashboard/supplier-analytics') ||
    pathname.startsWith('/dashboard/verification-marketplace') ||
    pathname.startsWith('/dashboard/supplier-rfqs') ||
    pathname.startsWith('/dashboard/performance') ||
    pathname.startsWith('/dashboard/team-members') ||
    pathname.startsWith('/dashboard/subscriptions')
  ) {
    return 'seller';
  }

  // Hybrid is treated as buyer on the frontend
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


