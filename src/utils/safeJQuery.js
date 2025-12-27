/**
 * Safe Mode Wrapper for Third-Party Scripts
 * Prevents browser extension errors from breaking the application
 * 
 * This handles common issues with extensions that inject scripts:
 * - Grammarly
 * - Password managers (LastPass, 1Password)
 * - Ad blockers
 * - Other content scripts
 * 
 * CRITICAL: Must be called before any other code runs to catch extension errors early
 */

export const initSafeMode = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // ============================================================================
  // 1. Catch unhandled promise rejections (jQuery.Deferred, async errors)
  // ============================================================================
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    const reason = event.reason;
    const stack = reason?.stack || String(reason || '');
    const message = reason?.message || String(reason || '');
    
    // Check if error is from a browser extension
    if (
      stack.includes('contentScript.js') ||
      stack.includes('chrome-extension://') ||
      stack.includes('moz-extension://') ||
      (message.includes('indexOf') && (stack.includes('chrome-extension://') || stack.includes('contentScript.js')))
    ) {
      // Prevent the error from breaking the app
      event.preventDefault();
      // Silent in production, warning in dev
      return;
    }

    // For other errors, use original handler if it exists
    if (originalUnhandledRejection) {
      originalUnhandledRejection(event);
    }
  };

  // ============================================================================
  // 2. Catch synchronous errors from extensions (window.onerror)
  // ============================================================================
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    // Check if error is from a browser extension
    if (
      source?.includes('contentScript.js') ||
      source?.includes('chrome-extension://') ||
      source?.includes('moz-extension://') ||
      (message?.includes('indexOf') && source?.includes('chrome-extension://'))
    ) {
      // Return true to prevent error from bubbling to React
      return true;
    }

    // For other errors, use original handler if it exists
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }

    // Don't suppress legitimate errors
    return false;
  };

  // ============================================================================
  // 3. Add defensive wrapper for Array.find (common extension conflict point)
  // ============================================================================
  const originalFind = Array.prototype.find;
  Array.prototype.find = function(...args) {
    try {
      return originalFind.apply(this, args);
    } catch (error) {
      // Only catch if error is likely from extension
      const errorStack = error?.stack || '';
      if (
        errorStack.includes('contentScript') ||
        errorStack.includes('chrome-extension://') ||
        errorStack.includes('moz-extension://')
      ) {
        // Return undefined instead of throwing (prevents app crash)
        return undefined;
      }
      // Re-throw legitimate errors
      throw error;
    }
  };

  // ============================================================================
  // 4. Handle jQuery.Deferred exceptions (if jQuery is present)
  // ============================================================================
  const wrapJQueryDeferred = () => {
    // Check if jQuery is available
    if (!window.jQuery || !window.jQuery.Deferred) {
      return;
    }

    try {
      // jQuery 3.x uses exceptionHook, but it might not exist
      // We'll override the Deferred function itself to catch errors
      const originalDeferred = window.jQuery.Deferred;
      
      // Wrap Deferred to catch errors during creation
      window.jQuery.Deferred = function(...args) {
        try {
          return originalDeferred.apply(this, args);
        } catch (error) {
          const errorStack = error?.stack || '';
          // If error is from extension, suppress it
          if (
            errorStack.includes('contentScript.js') ||
            errorStack.includes('chrome-extension://') ||
            errorStack.includes('moz-extension://')
          ) {
            // Return a minimal resolved deferred to prevent errors
            const deferred = originalDeferred();
            deferred.resolve();
            return deferred;
          }
          // Re-throw legitimate errors
          throw error;
        }
      };

      // Also try to hook into exceptionHook if it exists (jQuery 3.x)
      if (window.jQuery.Deferred.exceptionHook === undefined) {
        window.jQuery.Deferred.exceptionHook = function(error, stack) {
          // Check if error is from extension
          if (
            stack?.includes('contentScript.js') ||
            stack?.includes('chrome-extension://') ||
            stack?.includes('moz-extension://') ||
            (error?.message?.includes('indexOf') && stack?.includes('chrome-extension://'))
          ) {
            // Suppress extension errors
            return;
          }
          
          // For non-extension errors, log but don't suppress
          // (jQuery will handle it)
        };
      }
    } catch (error) {
      // If wrapping jQuery fails, continue without it (non-critical)
      console.warn('[SafeMode] Could not wrap jQuery:', error);
    }
  };

  // Try to wrap jQuery immediately (if already loaded)
  wrapJQueryDeferred();
  
  // Also try after delays in case jQuery loads later
  if (typeof window !== 'undefined') {
    setTimeout(wrapJQueryDeferred, 50);
    setTimeout(wrapJQueryDeferred, 200);
    setTimeout(wrapJQueryDeferred, 1000);
  }

  // ============================================================================
  // 5. Cleanup on page unload
  // ============================================================================
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      // Restore original Array.find
      Array.prototype.find = originalFind;
      
      // Restore original error handlers
      if (originalErrorHandler) {
        window.onerror = originalErrorHandler;
      }
      if (originalUnhandledRejection) {
        window.onunhandledrejection = originalUnhandledRejection;
      }
    });
  }
};
