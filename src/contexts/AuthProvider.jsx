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
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const hasInitializedRef = useRef(false);
  const schemaValidatedRef = useRef(false);

  // ✅ SCHEMA VALIDATION
  const validateSchema = useCallback(async () => {
    if (schemaValidatedRef.current) return true;
    try {
      const validation = await verifySchemaIntegrity();
      if (!validation.valid) {
        console.error('[Auth] Schema validation failed:', validation.error);
        return false;
      }
      schemaValidatedRef.current = true;
      return true;
    } catch (err) {
      console.error('[Auth] Schema validation error:', err);
      return true;
    }
  }, []);

  const resolveAuth = useCallback(async () => {
    // ✅ BOOT RESILIENCE: Identity Recovery Timeout
    // If auth resolution takes > 8s, we force authReady: true to break boot loops
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth Resolution Timeout')), 8000)
    );

    try {
      if (import.meta.env.DEV) console.log('[Auth] Resolving...');

      // Race the resolution against the safety timeout
      const resolutionPromise = (async () => {
        const { data: { session } } = await supabase.auth.getSession();

        // Background schema validation (Non-blocking)
        validateSchema();

        if (!session?.user) {
          setUser(null);
          setProfile(null);
          setRole(null);
          setAuthReady(true);
          setLoading(false);
          hasInitializedRef.current = true;
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        let resolvedProfile = profileData || null;

        if (profileError && profileError.code === 'PGRST116') {
          resolvedProfile = await ensureProfileExists(session.user);
        }

        setUser(session.user);
        setProfile(resolvedProfile);
        setRole(resolvedProfile?.role || null);
        setAuthReady(true);
        setLoading(false);
        hasInitializedRef.current = true;
      })();

      await Promise.race([resolutionPromise, timeoutPromise]);
    } catch (err) {
      console.warn('[Auth] Resolution failed or timed out:', err.message);
      // Fail-Open: Allow OS to boot even if auth is taking too long
      setAuthReady(true);
      setLoading(false);
      hasInitializedRef.current = true;
    }
  }, [validateSchema]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (hasInitializedRef.current) return;
      await resolveAuth();
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        if (import.meta.env.DEV) console.log('[Auth] Event:', event);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRole(null);
          setAuthReady(true);
          setLoading(false);
          localStorage.removeItem('afrikoni_last_company_id');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            await resolveAuth();
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [resolveAuth]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setRole(data.role);
    }
  }, [user?.id]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setRole(null);
      localStorage.removeItem('afrikoni_last_company_id');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
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
      logout
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
