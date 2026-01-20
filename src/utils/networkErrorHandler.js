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

  // ✅ GLOBAL REFACTOR: Sanitize PGRST error codes and technical SQL errors
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';
  
  // Map PGRST error codes to user-friendly messages
  const pgrstErrorMap = {
    'PGRST116': 'The requested information was not found.',
    'PGRST301': 'You do not have permission to access this resource.',
    '23505': 'This record already exists.',
    '42501': 'You do not have permission to perform this action.',
    '42P01': 'Database configuration error. Please contact support.',
  };
  
  // Check if it's a known PGRST error code
  if (pgrstErrorMap[errorCode]) {
    if (logError) {
      console.error('[NetworkErrorHandler] Database error detected:', {
        code: errorCode,
        userMessage: pgrstErrorMap[errorCode],
        // Never log full error object as it may contain URLs or technical details
      });
    }
    return pgrstErrorMap[errorCode];
  }

  // Check if it's a network error
  if (isNetworkError(error)) {
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

  // Generic error - sanitize message
  if (logError) {
    console.error('[NetworkErrorHandler] Error detected:', {
      code: errorCode,
      // Never log full error object as it may contain URLs or technical details
    });
  }

  // Sanitize error message - remove URLs and technical details
  let sanitizedMessage = errorMessage
    .replace(/https?:\/\/[\w.-]+\.supabase\.co[^\s]*/gi, '[network error]')
    .replace(/qkeeufeiaphqylsnfhza[^\s]*/gi, '[network error]')
    .replace(/[\w-]+\.supabase\.co/gi, '[network error]')
    .replace(/PGRST\d+/g, '[database error]')
    .replace(/\d{5}/g, '[error code]'); // Replace SQL error codes

  // Return user-friendly message or sanitized message
  return sanitizedMessage || 'An error occurred. Please try again.';
}
