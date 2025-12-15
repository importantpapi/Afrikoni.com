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
    if (!allow.includes(role)) {
      const target = getDashboardHomePath(role);
      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
    }
  }, [allow, role, location.pathname, navigate]);

  if (!allow.includes(role)) {
    return null;
  }

  return <>{children}</>;
}


