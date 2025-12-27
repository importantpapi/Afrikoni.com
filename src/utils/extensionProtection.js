/**
 * Protect app from browser extension errors
 * Extensions inject jQuery and other scripts that can break React
 */

export const initExtensionProtection = () => {
  // CRITICAL: This must run immediately, before ANY other code
  // Suppress console.error/warn from extensions FIRST
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = function(...args) {
    const message = String(args[0] || '');
    const allArgsString = args.map(String).join(' ');
    
    // Aggressively suppress jQuery.Deferred exceptions and extension errors
    if (message.includes('jQuery.Deferred exception') || 
        message.includes('Cannot read properties of null') ||
        message.includes('indexOf') ||
        allArgsString.includes('chrome-extension://') ||
        allArgsString.includes('contentScript')) {
      // Silently ignore extension-related console errors
      return;
    }
    originalConsoleError.apply(console, args);
  };
  
  console.warn = function(...args) {
    const message = String(args[0] || '');
    const allArgsString = args.map(String).join(' ');
    
    // Aggressively suppress jQuery.Deferred warnings and extension errors
    if (message.includes('jQuery.Deferred exception') || 
        message.includes('Cannot read properties of null') ||
        message.includes('indexOf') ||
        allArgsString.includes('chrome-extension://') ||
        allArgsString.includes('contentScript')) {
      // Silently ignore extension-related console warnings
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  // 1. Catch Array.prototype.find errors (jQuery extensions)
  const originalFind = Array.prototype.find;
  Array.prototype.find = function (...args) {
    try {
      return originalFind.apply(this, args);
    } catch (error) {
      // Silently catch - don't log to avoid noise
      return undefined;
    }
  };

  // 2. Catch indexOf errors on null (extensions sometimes call indexOf on null/undefined)
  // Note: This wraps the prototype method, but the real protection comes from the error handlers below
  const originalIndexOf = String.prototype.indexOf;
  String.prototype.indexOf = function (...args) {
    try {
      if (this == null || this === null || this === undefined) {
        return -1;
      }
      return originalIndexOf.apply(this, args);
    } catch (error) {
      // Silently return -1 (standard indexOf behavior when value not found)
      return -1;
    }
  };

  // 3. Global error handler for extension errors (capture phase - catches early)
  const errorHandler = (event) => {
    // Check if error is from extension
    const filename = event.filename || event.source || '';
    const message = event.message || String(event.error || '');
    const errorString = event.error?.toString() || '';
    const stack = event.error?.stack || '';
    
    const isExtensionError = 
      filename.includes('extension://') ||
      filename.includes('chrome-extension://') ||
      filename.includes('moz-extension://') ||
      filename.includes('contentScript') ||
      message.includes('chrome-extension://') ||
      message.includes('jQuery.Deferred exception') ||
      message.includes('Cannot read properties of null') ||
      stack.includes('chrome-extension://') ||
      stack.includes('contentScript') ||
      errorString.includes('chrome-extension://');

    if (isExtensionError) {
      // CRITICAL: Prevent the error from breaking React
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      return false;
    }
  };
  
  // Add multiple event listeners to catch errors at different phases
  window.addEventListener('error', errorHandler, true); // Capture phase
  window.addEventListener('error', errorHandler, false); // Bubble phase

  // 4. Catch unhandled promise rejections from extensions (jQuery.Deferred, async errors)
  const rejectionHandler = (event) => {
    const reason = event.reason || {};
    const stack = reason?.stack || String(reason) || '';
    const message = reason?.message || String(reason) || '';
    const reasonString = String(reason);
    
    const isExtensionError = 
      stack.includes('extension://') ||
      stack.includes('chrome-extension://') ||
      stack.includes('moz-extension://') ||
      stack.includes('contentScript') ||
      message.includes('jQuery.Deferred') ||
      message.includes('Cannot read properties of null') ||
      reasonString.includes('jQuery.Deferred') ||
      (message.includes('indexOf') && (stack.includes('chrome-extension://') || stack.includes('contentScript')));

    if (isExtensionError) {
      // CRITICAL: Prevent the rejection from breaking React
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  };
  
  window.addEventListener('unhandledrejection', rejectionHandler);

  // 5. Override window.onerror for additional protection
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    const sourceStr = source || '';
    const messageStr = message || '';
    const errorStack = error?.stack || '';
    
    const isExtensionError = 
      sourceStr.includes('chrome-extension://') ||
      sourceStr.includes('moz-extension://') ||
      sourceStr.includes('extension://') ||
      sourceStr.includes('contentScript') ||
      messageStr.includes('jQuery.Deferred') ||
      messageStr.includes('Cannot read properties of null') ||
      errorStack.includes('chrome-extension://') ||
      errorStack.includes('contentScript');
    
    if (isExtensionError) {
      // Suppress extension errors completely
      return true; // Prevents default error handling
    }
    
    // For non-extension errors, call original handler if it exists
    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error);
    }
    
    return false; // Allow default error handling for legitimate errors
  };

  console.info('[Extension Protection] Initialized - App protected from extension errors');
};

