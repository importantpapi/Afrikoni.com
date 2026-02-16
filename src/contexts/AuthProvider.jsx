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
  const [handshakeData, setHandshakeData] = useState(null);

  const hasInitializedRef = useRef(false);
  const resolvingInProgressRef = useRef(false);
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
    // ✅ BOOT RESILIENCE: Identity Recovery Timeout (Extended for slow networks)
    // If auth resolution takes > 30s, we force authReady: true to break boot loops
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth Resolution Timeout')), 30000)
    );

    try {
      if (resolvingInProgressRef.current) {
        if (import.meta.env.DEV) console.log('[Auth] Resolution already in progress, skipping redundant call.');
        return;
      }

      resolvingInProgressRef.current = true;
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

        // ⚡ PERFORMANCE HARDENING: Zero-Zero Hydra Handshake
        // We collapse profiles, companies, capabilities, and counts into a single RPC.
        const { data: handshake, error: handshakeError } = await supabase
          .rpc('get_institutional_handshake');

        if (handshakeError) {
          console.error('[Auth] Handshake failed, falling back to legacy hydration:', handshakeError);
          // Fallback to legacy single-fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          let resolvedProfile = profileData;
          if (!profileData) {
            resolvedProfile = await ensureProfileExists(session.user);
          }

          setUser(session.user);
          setProfile(resolvedProfile);
          setRole(resolvedProfile?.role || null);
        } else {
          if (import.meta.env.DEV) console.log('[Auth] ⚡ Handshake successful:', handshake);

          setUser(session.user);
          setProfile(handshake.profile);
          setRole(handshake.profile?.role || null);

          // Store the enriched packet in a ref or state for other hooks to consume without re-fetching
          // We can expose these through context
          setHandshakeData(handshake);
        }

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
    } finally {
      resolvingInProgressRef.current = false;
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
        } else if (event === 'INITIAL_SESSION') {
          // Only resolve if not already initialized or in progress
          if (!hasInitializedRef.current && !resolvingInProgressRef.current) {
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
      isRestricted: user ? !user.email_confirmed_at : false,
      handshakeData,
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
