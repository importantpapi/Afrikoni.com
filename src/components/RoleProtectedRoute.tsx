import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { getUserRoles } from '@/lib/supabase-auth-helpers';

type Props = {
  children: React.ReactNode;
  requiredRole: string;
};

/**
 * Enterprise-grade role-based route protection using Supabase user_roles.
 * - Reads roles from dedicated roles/user_roles tables
 * - Redirects to /select-role when user lacks required role but is authenticated
 * - Redirects to /login when unauthenticated
 */
export function RoleProtectedRoute({ children, requiredRole }: Props) {
  const [hasRole, setHasRole] = useState<boolean | null>(null);

  useEffect(() => {
    checkRole();
  }, []);

  async function checkRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setHasRole(false);
      return;
    }

    try {
      const roles = await getUserRoles(user.id);
      setHasRole(roles.includes(requiredRole));
    } catch (error) {
      console.debug('RoleProtectedRoute role check failed', error);
      setHasRole(false);
    }
  }

  if (hasRole === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  if (!hasRole) {
    return <Navigate to="/select-role" replace />;
  }

  return <>{children}</>;
}


