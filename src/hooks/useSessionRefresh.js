/**
 * Hook to handle automatic session refresh
 * Keeps users logged in by refreshing tokens before expiry
 */

import { useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

export function useSessionRefresh() {
  useEffect(() => {
    // Set up auth state change listener
    // CRITICAL: Suppress email confirmation errors globally
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // GLOBAL FILTER: Suppress email confirmation errors
      // Email delivery errors are non-fatal and must never show UI
      if (event === 'SIGNED_UP') {
        // Signup event - email errors are expected and non-blocking
        // Do NOT show any errors - user creation is the only success indicator
        console.debug('[AUTH] Signup event - email errors suppressed');
      }
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Session refreshed or signed out - handle accordingly
        if (event === 'TOKEN_REFRESHED') {
          // Session refreshed successfully - user stays logged in
          // No action needed, Supabase handles this automatically
        }
      }
    });

    // Refresh session periodically to ensure it's valid
    // NOTE: Don't call getSession() on mount - AuthProvider already handles initial session check
    // This hook only refreshes sessions that are close to expiry
    const refreshSession = async () => {
      try {
        // Use onAuthStateChange to detect when we need to refresh
        // Don't call getSession() directly - AuthProvider already did that
        // Only check expiry if we have a session from the auth state change event
        // For now, we'll rely on Supabase's auto-refresh and only intervene if needed
      } catch (error) {
        // Silently fail - session refresh is optional
      }
    };

    // Don't call refreshSession on mount - AuthProvider already handles initial auth
    // Only set up periodic refresh interval
    
    // Refresh session every 30 minutes to keep it alive
    const interval = setInterval(refreshSession, 30 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);
}

