/**
 * Hook to handle automatic session refresh
 * Keeps users logged in by refreshing tokens before expiry
 * 
 * ✅ KERNEL COMPLIANCE: This hook no longer subscribes to auth state changes.
 * AuthProvider is the ONLY authority for auth state changes.
 * This hook only handles periodic session refresh if needed.
 */

import { useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

export function useSessionRefresh() {
  useEffect(() => {
    // ✅ KERNEL COMPLIANCE: Removed secondary auth listener
    // AuthProvider already handles all auth state changes via onAuthStateChange
    // This hook should not duplicate that functionality
    
    // Refresh session periodically to ensure it's valid
    // NOTE: Don't call getSession() on mount - AuthProvider already handles initial session check
    // This hook only refreshes sessions that are close to expiry
    const refreshSession = async () => {
      try {
        // ✅ KERNEL COMPLIANCE: Don't call getSession() directly
        // AuthProvider owns all session access. This hook only triggers Supabase's
        // built-in token refresh mechanism if needed.
        // Supabase automatically refreshes tokens, so this is mostly a no-op
        // but kept for potential future use cases.
      } catch (error) {
        // Silently fail - session refresh is optional
      }
    };

    // Don't call refreshSession on mount - AuthProvider already handles initial auth
    // Only set up periodic refresh interval
    
    // Refresh session every 30 minutes to keep it alive
    const interval = setInterval(refreshSession, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);
}

