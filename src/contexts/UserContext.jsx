import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabaseClient';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user + profile once
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;

      if (!authUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        // Profile might not exist yet (new user), set user but no profile
        console.warn('Profile not found for user:', profileError);
        setUser(authUser);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(authUser);
      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh function for when profile is updated
  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      // If no user, fetch everything
      await fetchUserData();
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.warn('Error refreshing profile:', error);
        return;
      }
      
      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  }, [user?.id, fetchUserData]);

  // Refresh user data (both user and profile)
  const refreshUserData = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    fetchUserData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await fetchUserData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setError(null);
      } else if (event === 'USER_UPDATED') {
        // User metadata updated, refresh user data
        await fetchUserData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        profile, 
        loading, 
        error, 
        refreshProfile,
        refreshUserData 
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

