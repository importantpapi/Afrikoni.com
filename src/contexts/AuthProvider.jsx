import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { verifySchemaIntegrity, getSchemaErrorMessage } from '@/services/SchemaValidator';

/**
 * Client-side fallback: Create profile when database trigger doesn't fire.
 */
async function ensureProfileExists(user) {
  if (!user?.id) return null;

  const role = user.user_metadata?.intended_role || user.user_metadata?.role || 'buyer';
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      console.error('[Auth] Failed to create fallback profile:', error.message);
      return null;
    }

    console.log('[Auth] ✅ Fallback profile created:', { id: user.id, role });
    return data;
  } catch (err) {
    console.error('[Auth] Fallback profile creation exception:', err);
    return null;
  }
}

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
  // FIX: New flag that's only true when auth resolution is FULLY complete
  // This prevents race conditions where other components react to authReady
  // before profile fetch has completed
  const [authResolutionComplete, setAuthResolutionComplete] = useState(false);

  // FIX: Track if initial auth has completed
  const hasInitializedRef = useRef(false);
  const schemaValidatedRef = useRef(false);
  const profileNullTimeoutRef = useRef(null);
  // FIX: Lock to prevent race conditions during boot sequence
  const isResolvingRef = useRef(false);
  // FIX: Queue events that arrive during resolution
  const pendingEventRef = useRef(null);

  // ✅ SCHEMA VALIDATION: Verify schema integrity before allowing authReady
  const validateSchema = useCallback(async () => {
    if (schemaValidatedRef.current) {
      return true; // Already validated
    }

    try {
      if (import.meta.env.DEV) console.log('[Auth] Validating schema integrity...');
      const validation = await verifySchemaIntegrity();

      if (!validation.valid) {
        console.error('[Auth] Schema validation failed:', validation.error);
        const errorMessage = getSchemaErrorMessage(validation);
        // Show error but don't block - allow app to render with error state
        console.error('[Auth] Schema Error:', errorMessage);
        return false;
      }

      schemaValidatedRef.current = true;
      if (import.meta.env.DEV) console.log('[Auth] ✅ Schema validation passed');
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
      if (import.meta.env.DEV) console.log('[Auth] Silent refresh...');

      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        if (import.meta.env.DEV) console.log('[Auth] Silent refresh - no session');
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

      let resolvedProfile = profileData || null;

      // Handle profile not found gracefully (PGRST116 = not found)
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Profile not found - create it client-side as fallback
          console.log('[Auth] Silent refresh - profile not found, creating fallback profile');
          resolvedProfile = await ensureProfileExists(session.user);
        } else {
          console.error('[Auth] Silent refresh profile fetch error:', profileError);
        }
      }

      setUser(session.user);
      setProfile(resolvedProfile);
      setRole(resolvedProfile?.role || null);

      console.log('[Auth] Silent refresh complete');
    } catch (err) {
      console.error('[Auth] Silent refresh error:', err);
      // Don't clear state on error during silent refresh
    }
  }, []);

  // Initial auth resolution (shows loading state)
  const resolveAuth = useCallback(async () => {
    // ✅ FIX: Acquire lock to prevent concurrent execution
    if (isResolvingRef.current) {
      console.log('[Auth] Resolution already in progress, skipping');
      return;
    }
    isResolvingRef.current = true;

    try {
      if (import.meta.env.DEV) console.log('[Auth] Resolving...');

      // ✅ FIX: Only set loading on INITIAL auth, not on refresh
      if (!hasInitializedRef.current) {
        setLoading(true);
      }

      // ✅ SCHEMA VALIDATION FIX: Run validation in background with timeout (non-blocking)
      // Schema validation should NEVER block auth - it's informational only
      // RLS policies enforce security at database level regardless
      const validateSchemaWithTimeout = async () => {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Schema validation timeout')), 3000)
          );
          const validationPromise = validateSchema();
          const schemaValid = await Promise.race([validationPromise, timeoutPromise]);
          if (!schemaValid) {
            console.warn('[Auth] Schema validation failed - proceeding with degraded mode');
          } else {
            console.log('[Auth] ✅ Schema validation passed');
          }
        } catch (err) {
          console.warn('[Auth] Schema validation skipped (timeout or error):', err.message);
        }
      };
      // Fire-and-forget - don't await, don't block auth flow
      const { data: { session } } = await supabase.auth.getSession();

      // ✅ MOVED: Schema validation now runs AFTER getting session to avoid blocking critical path
      // Fire-and-forget - don't await, don't block auth flow
      validateSchemaWithTimeout();

      if (!session?.user) {
        console.log('[Auth] No session - guest mode');
        setUser(null);
        setProfile(null);
        setRole(null);
        setAuthReady(true);
        setLoading(false);
        setAuthResolutionComplete(true); // FIX: Signal that resolution is fully complete
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

      let resolvedProfile = profileData || null;

      // Handle profile not found - create as fallback
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('[Auth] Profile not found during resolution - creating fallback profile');
          resolvedProfile = await ensureProfileExists(session.user);
        } else {
          console.error('[Auth] Profile fetch error:', profileError);
        }
      }

      setUser(session.user);
      setProfile(resolvedProfile);
      setRole(resolvedProfile?.role || null);
      setAuthReady(true);
      setLoading(false);
      setAuthResolutionComplete(true); // FIX: Signal that resolution is fully complete (with profile)
      hasInitializedRef.current = true;

      console.log('[Auth] ✅ Resolved:', { role: resolvedProfile?.role || 'none' });
    } catch (err) {
      console.error('[Auth] Error:', err);
      setUser(null);
      setProfile(null);
      setRole(null);
      setAuthReady(true);
      setLoading(false);
      setAuthResolutionComplete(true); // FIX: Signal completion even on error (allows routing)
      hasInitializedRef.current = true;
    } finally {
      // ✅ FIX: Release lock and process any pending events
      isResolvingRef.current = false;

      // Process queued event if any
      if (pendingEventRef.current) {
        const pendingEvent = pendingEventRef.current;
        pendingEventRef.current = null;
        console.log('[Auth] Processing queued event:', pendingEvent);
        if (pendingEvent === 'SIGNED_IN' || pendingEvent === 'TOKEN_REFRESHED') {
          // Use silent refresh for queued events since we just completed initial resolution
          silentRefresh();
        }
      }
    }
  }, [validateSchema, silentRefresh]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

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
        console.warn('[Auth] Loading timeout (10s) - forcing resolution complete');
        setAuthReady(true);
        setLoading(false);
        setAuthResolutionComplete(true); // FIX: Signal completion on timeout
        hasInitializedRef.current = true;
      }
    }, 10000);

    const initAuth = async () => {
      // ✅ FIX: Check both hasInitialized AND isResolving to prevent duplicate calls
      if (hasInitializedRef.current || isResolvingRef.current) {
        console.log('[Auth] Already initialized or resolving, skipping');
        return;
      }

      try {
        await resolveAuth();
      } catch (err) {
        if (isMounted) {
          console.error('[Auth] Init error:', err);
          setAuthReady(true);
          setLoading(false);
          setAuthResolutionComplete(true); // FIX: Signal completion on error
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
        if (import.meta.env.DEV) console.log('[Auth] Event:', event);

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
          // ✅ FIX: Check lock before processing event
          if (isResolvingRef.current) {
            // Resolution in progress - queue this event for later
            console.log('[Auth] Resolution in progress, queuing event:', event);
            pendingEventRef.current = event;
            return;
          }

          // ✅ FIX: Use silent refresh for these events after initialization
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

    let resolvedProfile = data || null;

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[Auth] Refresh profile - profile not found, creating fallback');
        resolvedProfile = await ensureProfileExists(user);
      } else {
        console.error('[Auth] Refresh profile error:', error);
      }
    }

    setProfile(resolvedProfile);
    setRole(resolvedProfile?.role || null);
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
      // Note: This is handled by the SIGNED_OUT event handler in useEffect
      // which has access to the authChannel. No need to duplicate here.

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
      hasUser: !!user, // FIX: Add hasUser for login.jsx and signup.jsx compatibility
      profile,
      role,
      authReady,
      authResolutionComplete, // FIX: New flag for downstream components to wait for full resolution
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
