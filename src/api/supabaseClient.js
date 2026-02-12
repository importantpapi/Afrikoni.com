import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables at initialization
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = '❌ Supabase ENV variables are missing';
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
    realtime: {
      // ✅ ENTERPRISE STABILITY: Increase timeout to 30s
      // Default 10s is too aggressive for:
      // - Localhost dev mode (slower connections)
      // - Mobile networks (variable latency)
      // - Tab sleep/wake cycles (needs time to reconnect)
      timeout: 30000,
      // Heartbeat to keep connection alive during idle periods
      heartbeatIntervalMs: 15000,
    },
  }
);

// ✅ ENTERPRISE RESILIENCE: Retry strategy for transient failures
/**
 * Retry wrapper for Supabase queries with exponential backoff
 * Handles network hiccups, rate limits, and temporary service issues
 * 
 * @param {Function} queryFn - Async function that returns a Supabase query
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} baseDelay - Base delay in ms (default: 1000)
 * @returns {Promise} The query result
 */
export async function withRetry(queryFn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await queryFn();
      
      // If we have an error property in the result, check if it's retryable
      if (result.error) {
        const error = result.error;
        
        // Don't retry auth errors, validation errors, or not found
        if (
          error.code === 'PGRST116' || // Not found
          error.code === 'PGRST301' || // JWT expired
          error.message?.includes('JWT') ||
          error.message?.includes('permission') ||
          error.message?.includes('violates') ||
          error.status === 401 ||
          error.status === 403 ||
          error.status === 422
        ) {
          return result; // Return immediately, don't retry
        }
        
        // For other errors, retry
        lastError = error;
        
        // If this is the last attempt, return the error
        if (attempt === maxRetries - 1) {
          return result;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`[Supabase Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Success
      return result;
    } catch (err) {
      lastError = err;
      
      // If this is the last attempt, throw
      if (attempt === maxRetries - 1) {
        throw err;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`[Supabase Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`, err.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

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
    
    uploadFile: async (file, bucket, path, options = {}) => {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (!bucket || !path) {
        throw new Error('Bucket and path are required');
      }

      // Validate Supabase client is initialized
      if (!supabase) {
        throw new Error('Supabase client not initialized. Check environment variables.');
      }

      // Default options
      const uploadOptions = {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
        ...options
      };

      try {
        // Upload file
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(path, file, uploadOptions);

        if (error) {
          console.error('[Storage Upload Error]', {
            bucket,
            path,
            error: error.message,
            code: error.statusCode,
            details: error
          });
          
          // Provide user-friendly error messages
          if (error.message?.includes('Bucket not found')) {
            throw new Error(`Storage bucket "${bucket}" not found. Please contact support.`);
          } else if (error.message?.includes('The resource already exists')) {
            // Try with upsert if file exists
            const { data: upsertData, error: upsertError } = await supabase.storage
              .from(bucket)
              .update(path, file, { ...uploadOptions, upsert: true });
            
            if (upsertError) {
              throw new Error(`File already exists and update failed: ${upsertError.message}`);
            }
            
            // Get URL for updated file
            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(upsertData.path);
            
            const fileUrl = publicUrl || `${supabaseUrl}/storage/v1/object/public/${bucket}/${upsertData.path}`;
            
            return {
              file_url: fileUrl,
              path: upsertData.path,
              id: upsertData.id
            };
          } else if (error.message?.includes('JWT')) {
            throw new Error('Authentication required. Please log in and try again.');
          } else if (error.message?.includes('permission') || error.message?.includes('denied')) {
            throw new Error('Permission denied. You may not have access to upload files.');
          } else {
            throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
          }
        }

        if (!data || !data.path) {
          throw new Error('Upload succeeded but no data returned');
        }

        // Get public URL - try multiple methods
        let fileUrl = null;
        
        // Method 1: Use getPublicUrl (preferred)
        const { data: urlData, error: urlError } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        if (!urlError && urlData?.publicUrl) {
          fileUrl = urlData.publicUrl;
        }

        // Method 2: Construct manually if getPublicUrl fails
        if (!fileUrl && supabaseUrl) {
          fileUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${data.path}`;
        }

        if (!fileUrl) {
          console.error('[Storage URL Error]', {
            bucket,
            path: data.path,
            urlData,
            urlError,
            supabaseUrl
          });
          throw new Error('Failed to generate file URL. Upload succeeded but URL cannot be generated.');
        }

        console.log('[Storage Upload Success]', {
          bucket,
          path: data.path,
          url: fileUrl,
          size: file.size,
          type: file.type
        });

        return {
          file_url: fileUrl,
          path: data.path,
          id: data.id
        };
      } catch (error) {
        console.error('[Storage Upload Exception]', {
          bucket,
          path,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
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
