/**
 * Supabase Error Handler Utility
 * Provides consistent error handling for all Supabase queries
 */

import { toast } from 'sonner';

/**
 * Handle Supabase query errors with user-friendly messages
 * @param {Object} error - Supabase error object
 * @param {string} context - Context of the error (e.g., "loading orders", "creating RFQ")
 * @param {Object} options - Additional options
 * @returns {Object} - Error information
 */
export function handleSupabaseError(error, context = 'operation', options = {}) {
  const {
    showToast = true,
    fallbackMessage = null,
    logError = true
  } = options;

  if (!error) {
    return { handled: false };
  }

  // Log error for debugging
  if (logError) {
    console.error(`Supabase error in ${context}:`, error);
  }

  // Determine user-friendly message
  let userMessage = fallbackMessage;
  
  if (!userMessage) {
    switch (error.code) {
      case 'PGRST116':
        // No rows returned
        userMessage = `No data found`;
        break;
      case '23505':
        // Unique violation
        userMessage = `This record already exists`;
        break;
      case '23503':
        // Foreign key violation
        userMessage = `Invalid reference. Please refresh and try again.`;
        break;
      case '42501':
        // Insufficient privilege
        userMessage = `You don't have permission to perform this action`;
        break;
      case 'PGRST301':
        // PostgREST error
        userMessage = `Server error. Please try again.`;
        break;
      default:
        if (error.status === 400) {
          userMessage = `Invalid request. Please check your input.`;
        } else if (error.status === 401) {
          userMessage = `Please log in to continue`;
        } else if (error.status === 403) {
          userMessage = `Access denied. You don't have permission.`;
        } else if (error.status === 404) {
          userMessage = `Resource not found`;
        } else if (error.status >= 500) {
          userMessage = `Server error. Please try again later.`;
        } else {
          userMessage = `Failed to ${context}. Please try again.`;
        }
    }
  }

  // Show toast notification
  if (showToast) {
    toast.error(userMessage, {
      duration: 5000
    });
  }

  return {
    handled: true,
    message: userMessage,
    code: error.code,
    status: error.status,
    originalError: error
  };
}

/**
 * Safe Supabase query wrapper with error handling
 * @param {Promise} queryPromise - Supabase query promise
 * @param {string} context - Context for error messages
 * @param {Object} options - Options for error handling
 * @returns {Promise<{data: any, error: any, handled: boolean}>}
 */
export async function safeSupabaseQuery(queryPromise, context = 'operation', options = {}) {
  try {
    const { data, error } = await queryPromise;

    if (error) {
      const errorInfo = handleSupabaseError(error, context, options);
      return {
        data: null,
        error,
        handled: errorInfo.handled,
        errorMessage: errorInfo.message
      };
    }

    return {
      data,
      error: null,
      handled: false,
      errorMessage: null
    };
  } catch (error) {
    const errorInfo = handleSupabaseError(error, context, options);
    return {
      data: null,
      error,
      handled: errorInfo.handled,
      errorMessage: errorInfo.message
    };
  }
}

/**
 * Retry a Supabase query with exponential backoff
 * @param {Function} queryFn - Function that returns a Supabase query promise
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise}
 */
export async function retrySupabaseQuery(queryFn, maxRetries = 3, initialDelay = 1000) {
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFn();
      
      // If it's a Supabase query result, check for error
      if (result && typeof result === 'object' && 'error' in result) {
        if (!result.error) {
          return result;
        }
        lastError = result.error;
      } else {
        return result;
      }
    } catch (error) {
      lastError = error;
    }

    // Don't retry on last attempt
    if (attempt < maxRetries) {
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

