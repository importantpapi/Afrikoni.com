/**
 * Global Error Logger Utility
 * 
 * Provides standardized error logging across the application with:
 * - Full error object capture (code, message, details, hint)
 * - RLS (Row Level Security) detection
 * - Context-aware logging for debugging
 * 
 * @param {string} context - The context where the error occurred (e.g., 'loadProducts', 'fetchOrders')
 * @param {Error|Object} error - The error object from Supabase or other sources
 * @param {Object} metadata - Additional metadata to include in the log (e.g., { companyId, userId, table })
 * @returns {Object} The error information object for further processing
 */
export function logError(context, error, metadata = {}) {
  // Extract error information
  const errorInfo = {
    context,
    message: error?.message || error?.toString() || 'Unknown error',
    code: error?.code || null,
    details: error?.details || null,
    hint: error?.hint || null,
    // RLS-specific detection
    isRLSError: error?.code === 'PGRST116' || 
                error?.message?.includes('permission denied') ||
                error?.message?.includes('PGRST116') ||
                error?.message?.toLowerCase().includes('row-level security'),
    ...metadata,
    fullError: error
  };
  
  // Standard error logging
  console.error(`❌ Error in ${context}:`, errorInfo);
  
  // Specialized RLS block logging
  if (errorInfo.isRLSError) {
    console.error('🔒 RLS BLOCK DETECTED:', {
      context,
      table: metadata?.table || 'unknown',
      companyId: metadata?.companyId || null,
      userId: metadata?.userId || null,
      error: errorInfo
    });
  }
  
  return errorInfo;
}

/**
 * Log a warning message with context
 * 
 * @param {string} context - The context where the warning occurred
 * @param {string} message - The warning message
 * @param {Object} metadata - Additional metadata
 */
export function logWarning(context, message, metadata = {}) {
  console.warn(`⚠️ Warning in ${context}:`, {
    message,
    ...metadata
  });
}

/**
 * Log an info message with context
 * 
 * @param {string} context - The context where the info occurred
 * @param {string} message - The info message
 * @param {Object} metadata - Additional metadata
 */
export function logInfo(context, message, metadata = {}) {
  console.log(`ℹ️ Info in ${context}:`, {
    message,
    ...metadata
  });
}
