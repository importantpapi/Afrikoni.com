import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { verifySchemaIntegrity, getSchemaErrorMessage } from '@/services/SchemaValidator';

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
  const schemaValidatedRef = useRef(false);
  const profileNullTimeoutRef = useRef(null);

  // ✅ SCHEMA VALIDATION: Verify schema integrity before allowing authReady
  const validateSchema = useCallback(async () => {
    if (schemaValidatedRef.current) {
      return true; // Already validated
    }

    try {
      console.log('[Auth] Validating schema integrity...');
      const validation = await verifySchemaIntegrity();
      
      if (!validation.valid) {
        console.error('[Auth] Schema validation failed:', validation.error);
        const errorMessage = getSchemaErrorMessage(validation);
        // Show error but don't block - allow app to render with error state
        console.error('[Auth] Schema Error:', errorMessage);
        return false;
      }

      schemaValidatedRef.current = true;
      console.log('[Auth] ✅ Schema validation passed');
      return true;
    } catch (err) {
      console.error('[Auth] Schema validation error:', err);
      // Fail safe - allow app to proceed (RLS will enforce security)
      return true;
    }
  }, []);

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
    
      // ✅ CLEANUP: Use .single() to avoid empty array logic that keeps loading state active
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      // Handle profile not found gracefully (PGRST116 = not found)
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Profile not found - this is OK for new users
          console.log('[Auth] Silent refresh - profile not found (new user)');
          
          // ✅ ERROR LOGGING & SILENT REFRESH: If profile remains null > 5s, trigger sessionRefresh
          if (profileNullTimeoutRef.current) {
            clearTimeout(profileNullTimeoutRef.current);
          }
          profileNullTimeoutRef.current = setTimeout(async () => {
            console.warn('[Auth] Profile null for >5s - triggering session refresh');
            try {
              await supabase.auth.refreshSession();
              // Re-fetch profile after refresh
              const { data: refreshedProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              if (refreshedProfile) {
                setProfile(refreshedProfile);
                setRole(refreshedProfile?.role || null);
              }
            } catch (refreshErr) {
              console.error('[Auth] Session refresh error:', refreshErr);
            }
          }, 5000);
        } else {
          console.error('[Auth] Silent refresh profile fetch error:', profileError);
        }
      } else {
        // Profile found - clear timeout
        if (profileNullTimeoutRef.current) {
          clearTimeout(profileNullTimeoutRef.current);
          profileNullTimeoutRef.current = null;
        }
      }

      setUser(session.user);
      setProfile(profileData || null); // Ensure null if not found
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

      // ✅ SCHEMA CIRCUIT BREAKER: Validate schema integrity before proceeding
      const schemaValid = await validateSchema();
      if (!schemaValid) {
        console.error('[Auth] Schema validation failed - blocking authReady');
        // ✅ TOTAL VIBRANIUM RESET: Remove timeout bypass - keep authReady false if schema invalid
        // Instead, set a timeout to show error state but don't bypass circuit breaker
        setTimeout(() => {
          console.error('[Auth] Schema validation timeout - app may have degraded functionality');
          // Don't set authReady=true - keep circuit breaker active
          // Only clear loading state to prevent infinite spinner
          setLoading(false);
          hasInitializedRef.current = true;
        }, 10000);
        return;
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
      
      // ✅ CLEANUP: Use .single() to avoid empty array logic that keeps loading state active
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      // Handle profile not found gracefully
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[Auth] Profile fetch error:', profileError);
      }

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
  }, [validateSchema]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const DEBUG_BOOT = import.meta.env.VITE_DEBUG_BOOT === 'true';

    // ✅ CROSS-TAB SYNC: Set up BroadcastChannel for auth sync
    const authChannel = typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel('auth_sync')
      : null;

    if (authChannel) {
      authChannel.onmessage = (event) => {
        if (event.data === 'LOGOUT') {
          console.log('[Auth] LOGOUT message received via BroadcastChannel - reloading');
          window.location.reload();
        }
      };
    }

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
      // ✅ VIBRANIUM STABILIZATION: Prevent INITIAL_SESSION from firing multiple times
      if (hasInitializedRef.current) {
        console.log('[Auth] Already initialized, skipping');
        return;
      }

      // ✅ VIBRANIUM STABILIZATION: Mark as initializing immediately to prevent race conditions
      hasInitializedRef.current = true;

      try {
        await resolveAuth();
      } catch (err) {
        if (isMounted) {
          console.error('[Auth] Init error:', err);
          setAuthReady(true);
          setLoading(false);
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
        if (DEBUG_BOOT) console.log(`🔐 [AuthProvider] Event: ${event} (hasInitialized: ${hasInitializedRef.current})`);
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRole(null);
          // ✅ Keep authReady true - we're still "ready", just no user
          setAuthReady(true);
          setLoading(false);
          
          // ✅ VIBRANIUM STABILIZATION: Clear all storage on SIGN_OUT
          try {
            if (typeof window !== 'undefined') {
              localStorage.clear();
              sessionStorage.clear();
            }
          } catch (storageError) {
            console.error('[AuthProvider] Storage clear error:', storageError);
          }
          
          // ✅ CROSS-TAB SYNC: Broadcast logout to other tabs
          if (authChannel) {
            authChannel.postMessage('LOGOUT');
          }
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

    // ✅ NETWORK RECOVERY: Listen for online event to re-trigger handshake
    const handleOnline = () => {
      console.log('[Auth] Network online - re-triggering auth handshake');
      if (hasInitializedRef.current && user) {
        // Re-validate schema and refresh session
        schemaValidatedRef.current = false;
        resolveAuth();
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (profileNullTimeoutRef.current) clearTimeout(profileNullTimeoutRef.current);
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      if (authChannel) authChannel.close();
    };
  }, [resolveAuth, silentRefresh, user]); // Include dependencies

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    
    // ✅ CLEANUP: Use .single() to avoid empty array logic
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // Handle profile not found gracefully (PGRST116 = not found)
    if (error) {
      if (error.code === 'PGRST116') {
        // Profile not found - this is OK for new users
        console.log('[Auth] Refresh profile - profile not found (new user)');
      } else {
        console.error('[Auth] Refresh profile error:', error);
      }
    }

    setProfile(data || null); // Ensure null if not found
    setRole(data?.role || null);
  }, [user?.id]);

  // ✅ VIBRANIUM STABILIZATION: Logout function that clears ALL local state
  const logout = useCallback(async () => {
    try {
      console.log('[AuthProvider] Logout called - clearing all state');
      
      // Clear all local state immediately
      setUser(null);
      setProfile(null);
      setRole(null);
      
      // Sign out from Supabase (this will trigger SIGNED_OUT event)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthProvider] Sign out error:', error);
        throw error;
      }
      
      // ✅ VIBRANIUM STABILIZATION: Clear all storage on logout
      try {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
      } catch (storageError) {
        console.error('[AuthProvider] Storage clear error:', storageError);
      }
      
      // ✅ CROSS-TAB SYNC: Broadcast logout to other tabs
      if (authChannel) {
        authChannel.postMessage('LOGOUT');
      }
      
      console.log('[AuthProvider] Logout successful');
    } catch (error) {
      console.error('[AuthProvider] Logout error:', error);
      // Even on error, clear local state
      setUser(null);
      setProfile(null);
      setRole(null);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role,
      authReady,
      loading,
      refreshProfile,
      refreshAuth: resolveAuth,
      logout,
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
