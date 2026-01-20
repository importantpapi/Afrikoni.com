/**
 * Network Error Handler Utility
 * Provides standardized detection of network-level errors (Failed to fetch, connection errors, etc.)
 * 
 * This utility detects errors that occur BEFORE Supabase can respond, such as:
 * - Network connectivity issues
 * - DNS failures
 * - Connection timeouts
 * - CORS errors
 * - Supabase URL unreachable
 */

/**
 * Detects if an error is a network-level error
 * @param {Error|Object} error - The error object to check
 * @returns {boolean} - True if the error is a network error
 */
export function isNetworkError(error) {
  if (!error) return false;

  const errorMessage = (error?.message || '').toLowerCase();
  const errorCode = error?.code || '';
  const errorName = (error?.name || '').toLowerCase();
  const errorString = error?.toString() || '';
  
  // Comprehensive network error detection
  // Catch: Load failed, fetch failures, connection errors, DNS errors, timeouts
  return (
    errorMessage.includes('load failed') ||
    errorMessage.includes('network error') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('network request failed') ||
    errorMessage.includes('networkerror') ||
    errorMessage.includes('networkerror when attempting to fetch') ||
    errorMessage.includes('supabase.co') || // Catch any Supabase URLs
    errorCode === 'ENOTFOUND' ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ETIMEDOUT' ||
    errorCode === 'ECONNRESET' ||
    errorName === 'networkerror' ||
    errorName === 'typeerror' ||
    // Check if error message contains URL patterns (but don't expose them)
    /https?:\/\/[\w.-]+\.supabase\.co/.test(errorMessage) ||
    /https?:\/\/[\w.-]+\.supabase\.co/.test(errorString) ||
    // Check for project ID patterns (common in Supabase errors)
    /qkeeufeiaphqylsnfhza/.test(errorMessage) ||
    /qkeeufeiaphqylsnfhza/.test(errorString)
  );
}

/**
 * Gets a user-friendly network error message
 * @returns {string} - User-safe error message
 */
export function getNetworkErrorMessage() {
  return "We're having trouble connecting to our servers. Please try again in a moment.";
}

/**
 * Handles a network error by logging and returning user-friendly message
 * @param {Error|Object} error - The network error
 * @param {Object} options - Options for handling
 * @param {boolean} options.logError - Whether to log the error (default: true)
 * @returns {string} - User-friendly error message
 */
export function handleNetworkError(error, options = {}) {
  const { logError = true } = options;

  if (logError) {
    console.error('[NetworkErrorHandler] Network-level error detected:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      // Never log full error object as it may contain URLs
    });
  }

  return getNetworkErrorMessage();
}
