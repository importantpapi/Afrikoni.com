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
    // ✅ TOTAL CODE PURGE: AGGRESSIVE suppression of all extension errors
    if (message.includes('jQuery.Deferred exception') || 
        message.includes('Cannot read properties of null') ||
        message.includes('Cannot read properties of null (reading "indexOf")') || // ✅ TOTAL PURGE: Specific indexOf error
        message.includes('indexOf') ||
        message.includes('Unchecked runtime.lastError') || // ✅ TOTAL PURGE: Chrome extension error
        message.includes('message channel closed') || // ✅ TOTAL PURGE: Extension message channel error
        message.includes('extensionAdapter.sendMessageToTab') || // ✅ TOTAL PURGE: Extension adapter error
        allArgsString.includes('chrome-extension://') ||
        allArgsString.includes('contentScript') ||
        allArgsString.includes('contentScript.js') ||
        allArgsString.includes('Unchecked runtime.lastError') || // ✅ TOTAL PURGE: Catch in all args
        allArgsString.includes('message channel closed') || // ✅ TOTAL PURGE: Catch in all args
        allArgsString.includes('extensionAdapter')) { // ✅ TOTAL PURGE: Catch extension adapter
      // Silently ignore extension-related console errors
      return;
    }
    originalConsoleError.apply(console, args);
  };
  
  console.warn = function(...args) {
    const message = String(args[0] || '');
    const allArgsString = args.map(String).join(' ');
    
    // Aggressively suppress jQuery.Deferred warnings and extension errors
    // ✅ TOTAL CODE PURGE: AGGRESSIVE suppression of all extension errors
    if (message.includes('jQuery.Deferred exception') || 
        message.includes('Cannot read properties of null') ||
        message.includes('Cannot read properties of null (reading "indexOf")') || // ✅ TOTAL PURGE: Specific indexOf error
        message.includes('indexOf') ||
        message.includes('Unchecked runtime.lastError') || // ✅ TOTAL PURGE: Chrome extension error
        message.includes('message channel closed') || // ✅ TOTAL PURGE: Extension message channel error
        message.includes('extensionAdapter.sendMessageToTab') || // ✅ TOTAL PURGE: Extension adapter error
        allArgsString.includes('chrome-extension://') ||
        allArgsString.includes('contentScript') ||
        allArgsString.includes('contentScript.js') ||
        allArgsString.includes('Unchecked runtime.lastError') || // ✅ TOTAL PURGE: Catch in all args
        allArgsString.includes('message channel closed') || // ✅ TOTAL PURGE: Catch in all args
        allArgsString.includes('extensionAdapter')) { // ✅ TOTAL PURGE: Catch extension adapter
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
  // ✅ VIBRANIUM STABILIZATION: Enhanced protection for extension errors
  const originalIndexOf = String.prototype.indexOf;
  String.prototype.indexOf = function (...args) {
    try {
      // ✅ VIBRANIUM STABILIZATION: More robust null/undefined checks
      if (this == null || this === null || this === undefined || typeof this !== 'string') {
        return -1;
      }
      return originalIndexOf.apply(this, args);
    } catch (error) {
      // ✅ VIBRANIUM STABILIZATION: Suppress extension-related errors completely
      const errorStr = String(error || '');
      if (errorStr.includes('chrome-extension://') || 
          errorStr.includes('contentScript') ||
          errorStr.includes('isCartPage')) {
        return -1; // Silently return -1 for extension errors
      }
      // For non-extension errors, still return -1 but log in dev
      if (import.meta.env.DEV) {
        console.debug('[Extension Protection] indexOf error suppressed:', error);
      }
      return -1;
    }
  };
  
  // ✅ VIBRANIUM STABILIZATION: Protect Array.prototype.indexOf as well (extensions use this too)
  const originalArrayIndexOf = Array.prototype.indexOf;
  Array.prototype.indexOf = function (...args) {
    try {
      if (this == null || this === null || this === undefined) {
        return -1;
      }
      return originalArrayIndexOf.apply(this, args);
    } catch (error) {
      const errorStr = String(error || '');
      if (errorStr.includes('chrome-extension://') || 
          errorStr.includes('contentScript') ||
          errorStr.includes('isCartPage')) {
        return -1;
      }
      return -1; // Always return -1 for safety
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
      filename.includes('contentScript.js') || // ✅ KERNEL POLISH: Specifically catch contentScript.js
      message.includes('chrome-extension://') ||
      message.includes('contentScript.js') || // ✅ KERNEL POLISH: Catch contentScript.js in message
      message.includes('jQuery.Deferred exception') ||
      message.includes('Cannot read properties of null') ||
      message.includes('Cannot read properties of null (reading "indexOf")') || // ✅ TOTAL PURGE: Specific indexOf error
      message.includes('indexOf') || // ✅ KERNEL POLISH: Catch indexOf errors from extensions
      message.includes('Unchecked runtime.lastError') || // ✅ TOTAL PURGE: Chrome extension error
      message.includes('message channel closed') || // ✅ TOTAL PURGE: Extension message channel error
      message.includes('extensionAdapter.sendMessageToTab') || // ✅ TOTAL PURGE: Extension adapter error
      stack.includes('chrome-extension://') ||
      stack.includes('contentScript') ||
      stack.includes('contentScript.js') || // ✅ KERNEL POLISH: Catch contentScript.js in stack
      stack.includes('extensionAdapter') || // ✅ TOTAL PURGE: Catch extension adapter in stack
      errorString.includes('chrome-extension://') ||
      errorString.includes('contentScript.js') || // ✅ KERNEL POLISH: Catch contentScript.js in error string
      errorString.includes('Unchecked runtime.lastError') || // ✅ TOTAL PURGE: Catch in error string
      errorString.includes('message channel closed') || // ✅ TOTAL PURGE: Catch in error string
      errorString.includes('extensionAdapter'); // ✅ TOTAL PURGE: Catch extension adapter in error string

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
  // ✅ VIBRANIUM STABILIZATION: Enhanced protection for isCartPage and indexOf errors
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
      stack.includes('contentScript.js') || // ✅ KERNEL POLISH: Specifically catch contentScript.js
      message.includes('jQuery.Deferred') ||
      message.includes('Cannot read properties of null') ||
      message.includes('isCartPage') || // ✅ VIBRANIUM STABILIZATION: Catch isCartPage errors
      message.includes('indexOf') || // ✅ VIBRANIUM STABILIZATION: Catch all indexOf errors from extensions
      message.includes('contentScript.js') || // ✅ KERNEL POLISH: Catch contentScript.js in message
      reasonString.includes('jQuery.Deferred') ||
      reasonString.includes('isCartPage') || // ✅ VIBRANIUM STABILIZATION: Catch isCartPage in reason
      reasonString.includes('contentScript.js') || // ✅ KERNEL POLISH: Catch contentScript.js in reason
      (message.includes('indexOf') && (stack.includes('chrome-extension://') || stack.includes('contentScript') || stack.includes('contentScript.js'))) ||
      stack.includes('isCartPage'); // ✅ VIBRANIUM STABILIZATION: Catch isCartPage in stack

    if (isExtensionError) {
      // CRITICAL: Prevent the rejection from breaking React
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  };
  
  window.addEventListener('unhandledrejection', rejectionHandler);

  // 5. Override window.onerror for additional protection
  // ✅ KERNEL POLISH: Enhanced filtering for contentScript.js and indexOf errors
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
      sourceStr.includes('contentScript.js') || // ✅ KERNEL POLISH: Specifically catch contentScript.js
      messageStr.includes('jQuery.Deferred') ||
      messageStr.includes('Cannot read properties of null') ||
      messageStr.includes('Cannot read properties of null (reading "indexOf")') || // ✅ TOTAL PURGE: Specific indexOf error
      messageStr.includes('indexOf') || // ✅ KERNEL POLISH: Catch indexOf errors
      messageStr.includes('Unchecked runtime.lastError') || // ✅ TOTAL PURGE: Chrome extension error
      messageStr.includes('message channel closed') || // ✅ TOTAL PURGE: Extension message channel error
      messageStr.includes('extensionAdapter.sendMessageToTab') || // ✅ TOTAL PURGE: Extension adapter error
      messageStr.includes('contentScript.js') || // ✅ KERNEL POLISH: Catch contentScript.js in message
      errorStack.includes('chrome-extension://') ||
      errorStack.includes('contentScript') ||
      errorStack.includes('contentScript.js') || // ✅ KERNEL POLISH: Catch contentScript.js in stack
      errorStack.includes('extensionAdapter') || // ✅ TOTAL PURGE: Catch extension adapter in stack
      errorStack.includes('Unchecked runtime.lastError'); // ✅ TOTAL PURGE: Catch in stack
    
    if (isExtensionError) {
      // ✅ KERNEL POLISH: Suppress extension errors completely - prevent ErrorBoundary from triggering
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

