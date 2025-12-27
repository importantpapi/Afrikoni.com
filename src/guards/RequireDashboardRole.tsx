import React, { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useDashboardRole, DashboardRole } from '@/context/DashboardRoleContext';
import { getDashboardHomePath } from '@/context/RoleContext';

type Props = {
  allow: DashboardRole[];
  children: ReactNode;
};

/**
 * Hard role guard for dashboard feature components.
 *
 * - Uses URL-derived DashboardRoleContext only (no profile fallbacks).
 * - If current role is not allowed, silently redirects to that role's home.
 * - No toasts, no visible error, no layout jumps.
 */
export default function RequireDashboardRole({ allow, children }: Props) {
  const { role } = useDashboardRole();
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Normalize role (logistics_partner -> logistics) for comparison
  const normalizedRole = role === 'logistics_partner' ? 'logistics' : role;

  useEffect(() => {
    // Only redirect if role is determined and doesn't match
    // Don't redirect if role is still loading (null/undefined)
    if (normalizedRole && !allow.includes(normalizedRole as DashboardRole)) {
      const target = getDashboardHomePath(normalizedRole as DashboardRole);
      if (location.pathname !== target) {
        // Show user-friendly message before redirect
        const roleLabels: Record<string, string> = {
          buyer: 'Buyer',
          seller: 'Seller',
          hybrid: 'Hybrid',
          logistics: 'Logistics',
          admin: 'Admin'
        };
        const allowedRolesText = allow.map(r => roleLabels[r] || r).join(' and ');
        toast.error(
          `This feature is only available for ${allowedRolesText} users.`,
          { duration: 4000 }
        );
        navigate(target, { replace: true });
      }
    }
  }, [allow, normalizedRole, location.pathname, navigate]);

  // Don't render anything if role doesn't match (but don't redirect if role is still loading)
  if (normalizedRole && !allow.includes(normalizedRole as DashboardRole)) {
    return null;
  }
  
  // If role is still loading, show loading state instead of redirecting
  if (!normalizedRole) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  return <>{children}</>;
}


