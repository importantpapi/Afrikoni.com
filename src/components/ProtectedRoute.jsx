/**
 * ProtectedRoute - Uses centralized AuthProvider
 * 
 * GUARANTEES:
 * - Waits for authReady before checking auth
 * - Uses auth context (no duplicate auth calls)
 * - Always terminates loading (via SpinnerWithTimeout)
 */

import React from 'react';
import { Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { isAdmin } from '@/utils/permissions';
// PHASE 4: Removed getDashboardRoute import (no longer using role-based routing)
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/shared/ui/LoadingScreen';
import AccessDenied from './AccessDenied';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useCapability } from '@/context/CapabilityContext';

/**
 * ✅ SINGLE REDIRECT OWNER: Protects a route - requires authentication
 *
 * This guard ONLY redirects when there is NO authenticated user.
 * It does NOT redirect based on profile or company_id.
 * PostLoginRouter handles all post-auth routing decisions.
 *
 * Redirects to login with return URL preserved if user is not authenticated.
 * Shows loading screens while auth/capabilities are initializing.
 */
export const ProtectedRoute = ({ children, requireAdmin: needsAdmin = false, requireCompanyId: needsCompanyId = false }) => {
  const { user, profile, authReady, loading } = useAuth();
  const { isPreWarming, systemStatus } = useDashboardKernel();
  const capabilities = useCapability();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Show loading during pre-warming (profile fetch in progress)
  if (isPreWarming) {
    return <LoadingScreen message="Synchronizing World..." />;
  }

  // Show loading while auth initializes
  if (!authReady || loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  // Show loading if system status is still loading
  if (systemStatus === 'loading') {
    return <LoadingScreen message="Preparing workspace..." />;
  }

  // ✅ SINGLE REDIRECT OWNER: ONLY redirect when NO user exists
  // Do NOT redirect based on profile/company_id - PostLoginRouter handles that
  if (!user) {
    const next = searchParams.get('next') || location.pathname + location.search;
    navigate(`/login?next=${encodeURIComponent(next)}`);
    toast.error('Please log in to continue', { duration: 3000 });
    return null;
  }

  // ✅ DEPRECATED: requireCompanyId logic removed
  // PostLoginRouter now handles profile-based routing
  // This guard only checks authentication, not profile state
  if (needsCompanyId) {
    console.warn('[ProtectedRoute] requireCompanyId is deprecated - use PostLoginRouter instead');
  }

  // Check admin access if required
  if (needsAdmin) {
    const hasAdminAccess = isAdmin(user, profile);
    if (!hasAdminAccess) {
      console.warn('[ProtectedRoute] ❌ Access denied: Admin-only page');
      return <AccessDenied />;
    }
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

/**
 * PHASE 4: DEPRECATED - RoleProtectedRoute removed
 * Use ProtectedRoute with requireCompanyId instead
 * Capabilities are checked by RLS policies, not route guards
 */

/**
 * PHASE 4: Redirects authenticated users away from auth pages
 * Use on login/signup pages
 * Updated to use company_id instead of role
 */
export const GuestOnlyRoute = ({ children }) => {
  const { user, profile, authReady, loading } = useAuth();

  if (!authReady || loading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (user) {
    // PHASE 4: Navigate to dashboard if company_id exists, else onboarding
    if (profile?.company_id) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/onboarding/company" replace />;
  }

  return <>{children}</>;
};

// Default export for backward compatibility
export default ProtectedRoute;
