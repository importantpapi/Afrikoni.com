/**
 * Page Debugging Hook
 * Instruments pages to log mount, data fetching, errors, and performance
 */

import { useEffect } from 'react';

export function usePageDebug(pageName) {
  const logDebug = (message, data = {}, hypothesisId = null) => {
    // Debug logging removed - use browser console in dev mode
    if (import.meta.env.DEV) {
      console.debug(`[${pageName}]`, message, data);
    }
  };

  useEffect(() => {
    logDebug('Page mounted', { timestamp: Date.now() }, 'H1');
    return () => {
      logDebug('Page unmounted', { timestamp: Date.now() }, 'H1');
    };
  }, []);

  return {
    logDataFetch: (operation, result, error = null) => {
      logDebug(`Data fetch: ${operation}`, { 
        success: !error, 
        error: error?.message,
        hasData: !!result?.data,
        dataCount: Array.isArray(result?.data) ? result.data.length : result?.data ? 1 : 0
      }, error ? 'H2' : 'H2');
    },
    logError: (error, context = {}) => {
      logDebug('Page error', { 
        error: error?.message, 
        stack: error?.stack?.substring(0, 200),
        ...context 
      }, 'H5');
    },
    logNavigation: (from, to) => {
      logDebug('Navigation', { from, to }, 'H4');
    },
    logRender: (componentName, props = {}) => {
      logDebug(`Render: ${componentName}`, { propsCount: Object.keys(props).length }, 'H5');
    },
    logPerformance: (operation, duration) => {
      logDebug(`Performance: ${operation}`, { duration }, 'H6');
    },
    logContext: (contextName, value) => {
      logDebug(`Context: ${contextName}`, { hasValue: !!value, valueType: typeof value }, 'H7');
    }
  };
}

