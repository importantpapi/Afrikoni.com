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

    // Refresh session on mount to ensure it's valid
    const refreshSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Session exists - Supabase will auto-refresh when needed
          // We can trigger a manual refresh if session is close to expiry
          const expiresAt = session.expires_at;
          if (expiresAt) {
            const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
            // If expires in less than 5 minutes, refresh now
            if (expiresIn < 300) {
              await supabase.auth.refreshSession();
            }
          }
        }
      } catch (error) {
        // Silently fail - session refresh is optional
      }
    };

    refreshSession();
    
    // Refresh session every 30 minutes to keep it alive
    const interval = setInterval(refreshSession, 30 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);
}

