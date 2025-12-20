import React, { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    // Only redirect if role is determined and doesn't match
    // Don't redirect if role is still loading (null/undefined)
    if (role && !allow.includes(role)) {
      const target = getDashboardHomePath(role);
      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
    }
  }, [allow, role, location.pathname, navigate]);

  // Don't render anything if role doesn't match (but don't redirect if role is still loading)
  if (role && !allow.includes(role)) {
    return null;
  }
  
  // If role is still loading, show loading state instead of redirecting
  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  return <>{children}</>;
}


