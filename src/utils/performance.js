/**
 * Performance Monitoring Utilities
 * 
 * Track key performance metrics and operations
 */

import { trackOperation, trackMetric } from './sentry';

/**
 * Track API call performance
 */
export async function trackAPICall(name, apiCall) {
  const startTime = performance.now();
  
  try {
    const result = await trackOperation(name, 'http', async () => {
      return await apiCall();
    });
    
    const duration = performance.now() - startTime;
    trackMetric(`api.${name}.duration`, duration);
    trackMetric(`api.${name}.success`, 1, 'none');
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    trackMetric(`api.${name}.duration`, duration);
    trackMetric(`api.${name}.error`, 1, 'none');
    
    throw error;
  }
}

/**
 * Track page load performance
 */
export function trackPageLoad() {
  if (typeof window === 'undefined' || !window.performance) return;

  // Track Web Vitals
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation) {
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;
    const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
    const firstByte = navigation.responseStart - navigation.fetchStart;

    trackMetric('page.load_time', loadTime);
    trackMetric('page.dom_content_loaded', domContentLoaded);
    trackMetric('page.first_byte', firstByte);
  }

  // Track Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        trackMetric('page.lcp', lastEntry.renderTime || lastEntry.loadTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }
}

/**
 * Track component render performance
 */
export function trackComponentRender(componentName, renderFn) {
  const startTime = performance.now();
  
  const result = trackOperation(`component.${componentName}`, 'react', () => {
    return renderFn();
  });
  
  const duration = performance.now() - startTime;
  trackMetric(`component.${componentName}.render_time`, duration);
  
  return result;
}

/**
 * Track database query performance
 */
export async function trackDBQuery(queryName, queryFn) {
  return trackAPICall(`db.${queryName}`, queryFn);
}

/**
 * Track image load performance
 */
export function trackImageLoad(imageUrl) {
  if (typeof window === 'undefined') return;

  const img = new Image();
  const startTime = performance.now();

  img.onload = () => {
    const duration = performance.now() - startTime;
    trackMetric('image.load_time', duration);
    trackMetric('image.load_success', 1, 'none');
  };

  img.onerror = () => {
    const duration = performance.now() - startTime;
    trackMetric('image.load_time', duration);
    trackMetric('image.load_error', 1, 'none');
  };

  img.src = imageUrl;
}
