import React, { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRole, UserRole, getDashboardHomePath } from '@/context/RoleContext';

type Props = {
  allowedRoles: UserRole[];
  children: ReactNode;
};

export default function RoleDashboardRoute({ allowedRoles, children }: Props) {
  const { role, loading } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!role) return;
    if (!allowedRoles.includes(role)) {
      // Silently push the user back to their own dashboard home
      const target = getDashboardHomePath(role);
      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
    }
  }, [allowedRoles, role, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-afrikoni-offwhite">
        <div className="h-10 w-10 rounded-full border-2 border-afrikoni-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  // If role is missing or not allowed, content will be replaced by redirect effect above.
  return <>{children}</>;
}




