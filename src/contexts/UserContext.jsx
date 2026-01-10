/**
 * UserContext - Backward compatibility wrapper for AuthProvider
 * 
 * This context simply re-exports AuthProvider data for backward compatibility
 * during migration. It prevents AuthSessionMissingError by using AuthProvider
 * instead of calling Supabase auth directly.
 * 
 * TODO: Remove this file once all components migrate to useAuth() directly
 */

import { createContext, useContext } from 'react';
import { useAuth } from './AuthProvider';

const UserContext = createContext(null);

/**
 * UserProvider - Wraps AuthProvider for backward compatibility
 * 
 * Simply consumes AuthProvider and re-exports its data.
 * This prevents duplicate auth calls and AuthSessionMissingError for guests.
 */
export function UserProvider({ children }) {
  // Use AuthProvider instead of duplicating auth logic
  const auth = useAuth();

  // Map AuthProvider data to UserContext format for backward compatibility
  const value = {
    user: auth.user,
    profile: auth.profile,
    loading: auth.loading,
    error: auth.error,
    refreshProfile: auth.refreshProfile,
    refreshUserData: auth.refreshAuth, // Map refreshAuth to refreshUserData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * useUser - Backward compatibility hook
 * 
 * Simply re-exports AuthProvider data.
 * Prefer useAuth() for new code.
 */
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

