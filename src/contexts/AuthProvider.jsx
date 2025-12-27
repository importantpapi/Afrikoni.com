/**
 * CENTRALIZED AUTH PROVIDER - Single Source of Truth for Authentication
 * 
 * ENFORCES STRICT SEQUENTIAL FLOW:
 * 1. getSession() → Check if user exists
 * 2. If no user → authReady = true (user is null)
 * 3. If user → fetch profile
 * 4. If profile exists → resolve role
 * 5. role must NEVER be null (fallback = "buyer")
 * 6. authReady = true only after role is known
 * 
 * NO QUERY MAY RUN UNTIL authReady === true
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { getUserRole } from '@/utils/roleHelpers';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null); // NEVER null after authReady
  const [authReady, setAuthReady] = useState(false); // True when auth state is fully resolved
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Strict sequential auth resolution
   * STEP 1: Get session
   * STEP 2: If no user → mark ready
   * STEP 3: If user → fetch profile
   * STEP 4: Resolve role (never null)
   * STEP 5: Mark ready
   */
  const resolveAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[AUTH PROVIDER] Step 1: Getting session...');
      
      // STEP 1: Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[AUTH PROVIDER] Session error:', sessionError);
        throw sessionError;
      }

      // STEP 2: If no session/user → mark ready
      if (!session || !session.user) {
        console.log('[AUTH PROVIDER] No session found → authReady = true, role = null');
        setUser(null);
        setProfile(null);
        setRole(null);
        setAuthReady(true);
        setLoading(false);
        return;
      }

      const authUser = session.user;
      console.log('[AUTH PROVIDER] User found:', authUser.id);

      // STEP 3: Fetch profile
      console.log('[AUTH PROVIDER] Step 2: Fetching profile...');
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle(); // Use maybeSingle to handle missing profiles gracefully

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is OK for new users
        console.error('[AUTH PROVIDER] Profile error:', profileError);
        // Continue with null profile - user can still proceed
      }

      const resolvedProfile = profileData || null;
      
      if (resolvedProfile) {
        console.log('[AUTH PROVIDER] Profile found:', resolvedProfile.id);
      } else {
        console.log('[AUTH PROVIDER] No profile found (new user)');
      }

      // STEP 4: Resolve role (NEVER null)
      let resolvedRole = null;
      if (resolvedProfile) {
        resolvedRole = getUserRole(resolvedProfile);
      }
      
      // Fallback to "buyer" if role is still null
      if (!resolvedRole) {
        resolvedRole = 'buyer';
        console.log('[AUTH PROVIDER] Role resolved to default: buyer');
      } else {
        console.log('[AUTH PROVIDER] Role resolved:', resolvedRole);
      }

      // STEP 5: Set state and mark ready
      setUser(authUser);
      setProfile(resolvedProfile);
      setRole(resolvedRole);
      setAuthReady(true);
      setLoading(false);

      console.log('[AUTH PROVIDER] ✅ AUTH READY - User:', authUser.id, 'Role:', resolvedRole);

    } catch (err) {
      console.error('[AUTH PROVIDER] Fatal error in resolveAuth:', err);
      setError(err.message || 'Authentication error');
      setUser(null);
      setProfile(null);
      setRole('buyer'); // Even on error, provide a default role
      setAuthReady(true); // Mark ready even on error so app doesn't hang
      setLoading(false);
    }
  }, []);

  /**
   * Refresh profile (for when profile is updated)
   */
  const refreshProfile = useCallback(async () => {
    if (!user?.id || !authReady) {
      console.warn('[AUTH PROVIDER] Cannot refresh profile: no user or auth not ready');
      return;
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('[AUTH PROVIDER] Error refreshing profile:', profileError);
        return;
      }

      const resolvedProfile = profileData || null;
      setProfile(resolvedProfile);

      // Re-resolve role if profile changed
      let resolvedRole = 'buyer';
      if (resolvedProfile) {
        resolvedRole = getUserRole(resolvedProfile) || 'buyer';
      }
      setRole(resolvedRole);

      console.log('[AUTH PROVIDER] Profile refreshed, role:', resolvedRole);
    } catch (err) {
      console.error('[AUTH PROVIDER] Error refreshing profile:', err);
    }
  }, [user?.id, authReady]);

  /**
   * Listen for auth state changes
   * Only set up after initial auth resolution
   */
  useEffect(() => {
    // Initial auth resolution
    resolveAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH PROVIDER] Auth state change:', event);
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setProfile(null);
          setRole(null);
          setAuthReady(true); // Mark ready even when signed out
          setLoading(false);
          console.log('[AUTH PROVIDER] Signed out → authReady = true');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Re-resolve auth on sign in or token refresh
          await resolveAuth();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [resolveAuth]);

  const value = {
    // Auth state
    user,
    profile,
    role, // NEVER null after authReady (fallback = "buyer")
    authReady, // True when auth state is fully resolved
    loading, // True during initial auth resolution
    error,
    
    // Actions
    refreshProfile,
    refreshAuth: resolveAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

