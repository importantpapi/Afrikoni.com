import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables at initialization
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = '[Supabase Client] CRITICAL: Missing environment variables. Signup/auth will fail.';
  console.error(errorMsg, {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    env: import.meta.env.MODE
  });
  // Show error to users in production if env vars are missing
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    // Store error to show in UI
    window.__SUPABASE_ENV_ERROR__ = errorMsg;
  }
  // Continue with undefined - errors will be caught at request time
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Helper functions
export const supabaseHelpers = {
  auth: {
    me: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) return null;
      
      // Get profile if it exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      return {
        id: user.id,
        email: user.email,
        ...profile,
        role: profile?.role
      };
    },
    
    signUp: async (email, password, metadata = {}) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      return { data, error };
    },
    
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return data;
    },
    
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    
    signInWithOAuth: async (provider, redirectTo) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;
      return data;
    },
  },
  
  storage: {
    upload: async (bucket, path, file, options) => {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, options);
      if (error) throw error;
      return data;
    },
    
    download: async (bucket, path) => {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error) throw error;
      return data;
    },
    
    getPublicUrl: (bucket, path) => {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data?.publicUrl;
    },
  },
};

export default supabase;
