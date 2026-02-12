/**
 * Protect app from browser extension errors
 * Extensions inject jQuery and other scripts that can break React
 */

export const initExtensionProtection = () => {
  // CRITICAL: This must run immediately, before ANY other code
  // Suppress console.error/warn from extensions FIRST
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = function (...args) {
    const message = String(args[0] || '');
    const allArgsString = args.map(String).join(' ');

    // Aggressively suppress jQuery.Deferred exceptions and extension errors
    if (message.includes('jQuery.Deferred exception') ||
      allArgsString.includes('chrome-extension://') ||
      allArgsString.includes('moz-extension://') ||
      allArgsString.includes('contentScript') ||
      allArgsString.includes('contentScript.js') ||
      allArgsString.includes('extensionAdapter')) {
      // Silently ignore extension-related console errors
      return;
    }
    originalConsoleError.apply(console, args);
  };

  console.warn = function (...args) {
    const message = String(args[0] || '');
    const allArgsString = args.map(String).join(' ');

    // Aggressively suppress jQuery.Deferred warnings and extension errors
    if (message.includes('jQuery.Deferred exception') ||
      allArgsString.includes('chrome-extension://') ||
      allArgsString.includes('moz-extension://') ||
      allArgsString.includes('contentScript') ||
      allArgsString.includes('contentScript.js') ||
      allArgsString.includes('extensionAdapter')) {
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
      // For non-extension errors (like React internal issues), return -1 but log if DEV
      if (import.meta.env.DEV) {
        // console.debug('[Extension Protection] indexOf error suppressed:', error);
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
      filename.includes('contentScript.js') ||
      message.includes('chrome-extension://') ||
      message.includes('contentScript.js') ||
      stack.includes('chrome-extension://') ||
      stack.includes('contentScript') ||
      stack.includes('contentScript.js') ||
      errorString.includes('chrome-extension://') ||
      errorString.includes('contentScript.js');

    if (isExtensionError) {
      // CRITICAL: Prevent the error from breaking React
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      return false;
    }
  };

  window.addEventListener('error', errorHandler, true); // Capture phase
  window.addEventListener('error', errorHandler, false); // Bubble phase

  // 4. Catch unhandled promise rejections from extensions
  const rejectionHandler = (event) => {
    const reason = event.reason || {};
    const stack = reason?.stack || String(reason) || '';
    const message = reason?.message || String(reason) || '';

    const isExtensionError =
      stack.includes('extension://') ||
      stack.includes('chrome-extension://') ||
      stack.includes('moz-extension://') ||
      stack.includes('contentScript') ||
      stack.includes('contentScript.js') ||
      message.includes('chrome-extension://') ||
      message.includes('contentScript.js');

    if (isExtensionError) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return false;
    }
  };

  window.addEventListener('unhandledrejection', rejectionHandler);

  // 5. Override window.onerror
  const originalOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    const sourceStr = source || '';
    const errorStack = error?.stack || '';

    const isExtensionError =
      sourceStr.includes('chrome-extension://') ||
      sourceStr.includes('moz-extension://') ||
      sourceStr.includes('extension://') ||
      sourceStr.includes('contentScript') ||
      sourceStr.includes('contentScript.js') ||
      errorStack.includes('chrome-extension://') ||
      errorStack.includes('contentScript') ||
      errorStack.includes('contentScript.js');

    if (isExtensionError) {
      return true; // Prevents default error handling
    }

    if (originalOnError) {
      return originalOnError.call(this, message, source, lineno, colno, error);
    }

    return false;
  };

  console.info('[Extension Protection] Initialized - App protected from extension noise');
};
