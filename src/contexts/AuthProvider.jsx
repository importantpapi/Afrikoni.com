import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { verifySchemaIntegrity, getSchemaErrorMessage } from '@/services/SchemaValidator';
import { secureStorage } from '@/utils/secureStorage';
import { logger } from '@/utils/logger';

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
      logger.error('Failed to create fallback profile', { error: error.message, userId: user.id });
      return null;
    }

    logger.info('Fallback profile created', { id: user.id, role });
    return data;
  } catch (err) {
    logger.error('Fallback profile creation exception', err);
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
        logger.error('Schema validation failed', { error: validation.error });
        return false;
      }
      schemaValidatedRef.current = true;
      return true;
    } catch (err) {
      logger.error('Schema validation error', err);
      return true;
    }
  }, []);

  const resolveAuth = useCallback(async () => {
    const timeoutRef = { current: null };
    const timeoutPromise = new Promise((_, reject) =>
      timeoutRef.current = setTimeout(() => reject(new Error('Auth Resolution Timeout')), 30000) // ✅ RELIABILITY: Restored to 30s for global connectivity
    );

    try {
      if (resolvingInProgressRef.current) {
        logger.info('Resolution already in progress, skipping redundant call');
        return;
      }

      resolvingInProgressRef.current = true;
      logger.info('Resolving auth...');

      // Race the resolution against the safety timeout
      const resolutionPromise = (async () => {
        try {
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
          // Race the RPC against a 5s timeout to prevent boot hangs
          const handshakePromise = supabase.rpc('get_institutional_handshake');
          const timeoutPromise = new Promise(resolve =>
            setTimeout(() => resolve({
              data: null,
              error: { message: 'Handshake timeout (5s limit exceeded)' }
            }), 5000)
          );

          const { data: handshake, error: handshakeError } = await Promise.race([
            handshakePromise,
            timeoutPromise
          ]);

          if (handshakeError) {
            logger.error('Handshake failed, falling back to legacy hydration', handshakeError);
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
            logger.info('⚡ Handshake successful', handshake);

            setUser(session.user);
            setProfile(handshake.profile);
            setRole(handshake.profile?.role || null);
            setHandshakeData(handshake);
          }

          setAuthReady(true);
          setLoading(false);
          hasInitializedRef.current = true;
        } finally {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
      })();

      await Promise.race([resolutionPromise, timeoutPromise]);
    } catch (err) {
      if (err.message === 'Auth Resolution Timeout') {
        logger.warn('Resolution timed out - Fostering Fail-Open boot sequence');
      } else {
        logger.warn('Resolution failed', { error: err.message });
      }

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
        logger.info('Auth Event', { event });

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRole(null);
          setAuthReady(true);
          setLoading(false);
          secureStorage.remove('afrikoni_last_company_id'); // NOW ENCRYPTED 🔒
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
      secureStorage.remove('afrikoni_last_company_id'); // NOW ENCRYPTED 🔒
    } catch (error) {
      logger.error('Logout error', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role,
      authReady,
      loading,
      hasUser: !!user,
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
