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

  // Default all other /dashboard to buyer
  return 'buyer';
}

// PHASE 5B: DashboardRoleProvider DISABLED - Replaced with CapabilityContext
// This file is kept for reference but should not be used
// All role-based logic has been replaced with capability-based logic
export function DashboardRoleProvider({ children }: { children: React.ReactNode }) {
  // PHASE 5B: This provider is disabled - use CapabilityContext instead
  console.warn('[DashboardRoleContext] DashboardRoleProvider is deprecated. Use CapabilityContext instead.');
  return <>{children}</>;
}

// PHASE 5B: useDashboardRole DISABLED - Throws error to catch any remaining usages
export function useDashboardRole(): DashboardRoleContextValue {
  // PHASE 5B: This hook is disabled - use useCapability() from CapabilityContext instead
  throw new Error('useDashboardRole is deprecated. Use useCapability() from CapabilityContext instead. All role-based logic has been replaced with capability-based logic.');
}