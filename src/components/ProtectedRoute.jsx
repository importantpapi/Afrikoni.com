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
import { useCapability } from '@/contexts/CapabilityContext';

/**
 * Protects a route - requires authentication
 * Redirects to login with return URL preserved
 * Optional: requireCompanyId - if true, redirects to company onboarding if company_id is missing
 * 
 * ✅ KERNEL INTEGRATION: Consumes isPreWarming from useDashboardKernel to prevent 'Failed to load' errors
 */
export const ProtectedRoute = ({ children, requireAdmin: needsAdmin = false, requireCompanyId: needsCompanyId = false }) => {
  const { user, profile, authReady, loading } = useAuth();
  const { isPreWarming } = useDashboardKernel();
  const capabilities = useCapability();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // ✅ KERNEL GUARD DEPLOYMENT: Show "Synchronizing World" if Kernel is pre-warming
  // This prevents child components from attempting to load data before Kernel is ready
  // ✅ FIX: Use useEffect for navigation to prevent render-time side effects
  React.useEffect(() => {
    // Only redirect if auth is fully ready and we can make a definitive decision
    if (authReady && !loading && capabilities?.ready) {

      // 1. Redirect to login if not authenticated
      if (!user) {
        const next = searchParams.get('next') || location.pathname + location.search;
        navigate(`/login?next=${encodeURIComponent(next)}`);
        toast.error('Please log in to continue', { duration: 3000 });
        return;
      }

      // 2. Redirect to company onboarding if company_id is missing (and required)
      if (needsCompanyId && profile && !profile.company_id) {
        console.log('[ProtectedRoute] No company_id → redirecting to company onboarding');
        navigate('/onboarding/company', { replace: true });
        return;
      }

      // 3. Admin Check (Authorized) - specific navigation logic if needed, 
      // but usually we just show AccessDenied component which is fine in render.
    }
  }, [authReady, loading, capabilities?.ready, user, profile, needsCompanyId, navigate, location, searchParams]);

  // RENDER: Loading States
  if (isPreWarming) {
    return <LoadingScreen message="Synchronizing World..." />;
  }

  // Show loading while auth initializes
  if (!authReady || loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  // Wait for Kernel capability check if authenticated
  if (user && !capabilities?.ready) {
    return <LoadingScreen message="Waking up the Kernel..." />;
  }

  // RENDER: Guard blocks (Return null while redirecting)
  if (!user) return null;
  if (needsCompanyId && (!profile || !profile.company_id)) return null;

  // RENDER: Admin Permission Check
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
