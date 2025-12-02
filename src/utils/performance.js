/**
 * Performance utilities for optimization
 */

/**
 * Preload critical resources
 */
export function preloadResource(href, as = 'script', crossorigin = false) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (crossorigin) {
    link.crossOrigin = 'anonymous';
  }
  document.head.appendChild(link);
}

/**
 * Prefetch resources for faster navigation
 */
export function prefetchResource(href, as = 'script') {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Defer non-critical script execution
 */
export function deferExecution(callback, delay = 0) {
  if (delay === 0) {
    requestIdleCallback ? requestIdleCallback(callback) : setTimeout(callback, 0);
  } else {
    setTimeout(callback, delay);
  }
}

/**
 * Throttle function calls
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function calls
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if user is on slow connection
 */
export function isSlowConnection() {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
    }
  }
  return false;
}

/**
 * Lazy load script
 */
export function loadScript(src, async = true) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Lazy load stylesheet
 */
export function loadStylesheet(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

/**
 * Measure performance metrics
 */
export function measurePerformance(name, fn) {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`${name}-start`);
    const result = fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    const measure = performance.getEntriesByName(name)[0];
    console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
    return result;
  }
  return fn();
}

/**
 * Batch DOM updates for better performance
 */
export function batchDOMUpdates(updates) {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}
