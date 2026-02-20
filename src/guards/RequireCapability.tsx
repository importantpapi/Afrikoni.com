import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useCapability } from '@/contexts/CapabilityContext';
import { useAuth } from '@/contexts/AuthProvider';
import AccessDenied from '@/components/AccessDenied';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';

type Props = {
  children: ReactNode;
  /**
   * For route-level guards: "buy" | "sell" | "logistics" | null
   */
  require?: 'buy' | 'sell' | 'logistics' | null;
  /**
   * For component-level guards (legacy/flexible)
   */
  canBuy?: boolean;
  canSell?: boolean;
  canLogistics?: boolean;
  canAdmin?: boolean;
  /**
   * If true, requires capability to be approved (not just enabled)
   */
  requireApproved?: boolean;
  /**
   * 'inline' (show message) | 'redirect' (Navigate to dashboard) | 'denied-page' (show AccessDenied)
   */
  mode?: 'inline' | 'redirect' | 'denied-page';
  /**
   * Custom message to show when capability is missing (inline mode only)
   */
  fallbackMessage?: string;
  /**
   * Where to redirect in 'redirect' mode (default: /dashboard)
   */
  redirectTo?: string;
  /**
   * If true, allows access if status is 'pending' even if requireApproved is true
   */
  allowPending?: boolean;
};

/**
 * PHASE 9: Unified RequireCapability Guard
 * 
 * High-integrity gate that consolidates route-level redirects and component-level inline messages.
 * 
 * FEATURES:
 * - Admin Bypass: Admins always pass.
 * - Sync Error Handling: Shows critical database sync error UI if table-fetch fails.
 * - Multi-Mode: Supports redirection for routes and inline messages for components.
 * - Backwards Compatible: Supports both 'require' string and 'canX' boolean props.
 */
export default function RequireCapability({
  children,
  require = null,
  canBuy,
  canSell,
  canLogistics,
  canAdmin,
  requireApproved = false,
  allowPending = false,
  mode = 'inline',
  fallbackMessage,
  redirectTo = '/dashboard'
}: Props) {
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin === true;

  // Admin Override
  if (isAdmin) {
    return <>{children}</>;
  }

  const capability = useCapability();

  // 1. Critical Database Sync Error
  if (capability?.error && !capability?.ready) {
    const isDatabaseSyncError = capability?.error?.includes('Database sync error') ||
      capability?.error?.includes('table') ||
      capability?.error?.includes('does not exist');

    if (isDatabaseSyncError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-afrikoni-ivory p-8">
          <div className="max-w-2xl text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-os-2xl font-bold text-afrikoni-text-dark mb-4">Database Sync Error</h2>
            <p className="text-os-lg text-afrikoni-text-dark/70 mb-6">{capability?.error}</p>
            <div className="bg-afrikoni-sand/50 rounded-lg p-4 text-left">
              <p className="text-os-sm font-semibold mb-2">To fix this:</p>
              <ol className="text-os-sm space-y-1 list-decimal list-inside">
                <li>Run migration: <code>supabase/migrations/20260117_foundation_fix.sql</code></li>
                <li>Contact platform administrator</li>
                <li>Refresh the page</li>
              </ol>
            </div>
          </div>
        </div>
      );
    }
  }

  // 2. Wait for ready
  if (!capability?.ready) {
    return <SpinnerWithTimeout message="Preparing your workspace..." ready={capability?.ready} onRetry={() => window.location.reload()} />;
  }

  // 3. Normalized Capability Check
  let hasAccess = true;
  let missingLabel = '';

  // Handle 'require' prop (Route Logic)
  if (require === 'buy') {
    if (!capability.can_buy) {
      hasAccess = false;
      missingLabel = 'buy';
    }
  } else if (require === 'sell') {
    if (!capability.can_sell) {
      hasAccess = false;
      missingLabel = 'sell';
    } else if (requireApproved && capability.sell_status !== 'approved') {
      hasAccess = false;
      missingLabel = 'approved seller';
    }
  } else if (require === 'logistics') {
    if (!capability.can_logistics) {
      hasAccess = false;
      missingLabel = 'logistics';
    } else if (requireApproved && capability.logistics_status !== 'approved') {
      hasAccess = false;
      missingLabel = 'approved logistics partner';
    }
  }

  // Handle 'canX' props (Component Logic - only if require is not set or passed)
  if (hasAccess) {
    if (canBuy && !capability.can_buy) {
      hasAccess = false;
      missingLabel = 'buy';
    }
    if (canSell && (!capability.can_sell || (requireApproved && !allowPending && capability.sell_status !== 'approved'))) {
      const isAllowedPending = allowPending && capability.sell_status === 'pending';
      if (!isAllowedPending) {
        hasAccess = false;
        missingLabel = requireApproved ? 'approved seller' : 'sell';
      }
    }
    if (canLogistics && (!capability.can_logistics || (requireApproved && !allowPending && capability.logistics_status !== 'approved'))) {
      const isAllowedPending = allowPending && capability.logistics_status === 'pending';
      if (!isAllowedPending) {
        hasAccess = false;
        missingLabel = requireApproved ? 'approved logistics' : 'logistics';
      }
    }
  }

  // 4. Handle Access Denial
  if (!hasAccess) {
    if (mode === 'redirect') {
      return <Navigate to={redirectTo} replace />;
    }

    if (mode === 'denied-page') {
      const AD = AccessDenied as any;
      return <AD message={fallbackMessage || `This feature requires ${missingLabel} capability.`} />;
    }

    // Default: Inline Message
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8 bg-white/50 backdrop-blur-sm rounded-os-lg border border-dashed border-os-accent/20">
        <div className="text-center max-w-md">
          <div className="text-os-accent mb-6">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-os-2xl font-black text-afrikoni-deep mb-3 uppercase tracking-tighter">Feature Locked</h3>
          <p className="text-gray-600 mb-6 font-medium">
            {fallbackMessage || `This enterprise module requires ${missingLabel} capabilities.`}
          </p>
          {(capability.sell_status === 'pending' || capability.logistics_status === 'pending') && (
            <div className="p-4 bg-os-accent/10 rounded-os-md border border-os-accent/20">
              <p className="text-os-sm font-bold text-os-accent">APPLICATION PENDING REVIEW</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
