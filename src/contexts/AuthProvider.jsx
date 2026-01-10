import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext(null);

/**
 * AuthProvider - Manages authentication state
 * 
 * CRITICAL STABILITY RULES:
 * 1. Once authReady is true, it NEVER goes back to false
 * 2. Loading only flickers on INITIAL load, not on refresh
 * 3. SIGNED_IN/TOKEN_REFRESHED events do silent refresh (no loading state change)
 * 4. This prevents child components from unmounting during token refresh
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // ✅ FIX: Track if initial auth has completed
  const hasInitializedRef = useRef(false);

  // ✅ FIX: Separate function for silent refresh (no loading state change)
  const silentRefresh = useCallback(async () => {
    try {
      console.log('[Auth] Silent refresh...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('[Auth] Silent refresh - no session');
        setUser(null);
        setProfile(null);
        setRole(null);
        return;
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      setUser(session.user);
      setProfile(profileData);
      setRole(profileData?.role || null);
      
      console.log('[Auth] Silent refresh complete');
    } catch (err) {
      console.error('[Auth] Silent refresh error:', err);
      // Don't clear state on error during silent refresh
    }
  }, []);

  // Initial auth resolution (shows loading state)
  const resolveAuth = useCallback(async () => {
    try {
      console.log('[Auth] Resolving...');
      
      // ✅ FIX: Only set loading on INITIAL auth, not on refresh
      if (!hasInitializedRef.current) {
        setLoading(true);
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('[Auth] No session - guest mode');
        setUser(null);
        setProfile(null);
        setRole(null);
        setAuthReady(true);
        setLoading(false);
        hasInitializedRef.current = true;
        return;
      }

      console.log('[Auth] User found:', session.user.id);
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      setUser(session.user);
      setProfile(profileData);
      setRole(profileData?.role || null);
      setAuthReady(true);
      setLoading(false);
      hasInitializedRef.current = true;

      console.log('[Auth] ✅ Resolved:', { role: profileData?.role || 'none' });
    } catch (err) {
      console.error('[Auth] Error:', err);
      setUser(null);
      setProfile(null);
      setRole(null);
      setAuthReady(true);
      setLoading(false);
      hasInitializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    // Safety timeout - force loading to false after 10 seconds
    timeoutId = setTimeout(() => {
      if (isMounted && loading && !hasInitializedRef.current) {
        console.warn('[Auth] Loading timeout - forcing to false');
        setAuthReady(true);
        setLoading(false);
        hasInitializedRef.current = true;
      }
    }, 10000);
    
    const initAuth = async () => {
      // ✅ FIX: Better duplicate prevention
      if (hasInitializedRef.current) {
        console.log('[Auth] Already initialized, skipping');
        return;
      }
      
      try {
        await resolveAuth();
      } catch (err) {
        if (isMounted) {
          console.error('[Auth] Init error:', err);
          setAuthReady(true);
          setLoading(false);
          hasInitializedRef.current = true;
        }
      } finally {
        if (isMounted && timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (!isMounted) return;
        console.log('[Auth] Event:', event);
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRole(null);
          // ✅ Keep authReady true - we're still "ready", just no user
          setAuthReady(true);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // ✅ FIX: Use silent refresh for these events
          // This prevents loading state from flickering and causing child unmounts
          if (hasInitializedRef.current) {
            // Already initialized - do silent refresh
            await silentRefresh();
          } else {
            // First time - do full resolve
            await resolveAuth();
          }
        }
      }
    );

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []); // Empty deps - only run once

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    setProfile(data);
    setRole(data?.role || null);
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role,
      authReady,
      loading,
      refreshProfile,
      refreshAuth: resolveAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
