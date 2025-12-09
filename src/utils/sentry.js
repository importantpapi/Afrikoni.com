/**
 * Sentry Error Tracking Setup
 * 
 * To enable Sentry:
 * 1. Sign up at https://sentry.io (free tier available)
 * 2. Create a project and get your DSN
 * 3. Add VITE_SENTRY_DSN to your .env file
 * 4. Restart your dev server or redeploy
 */

import * as Sentry from "@sentry/react";

// Import browserTracingIntegration from @sentry/browser
// @sentry/browser is included as a dependency of @sentry/react
import { browserTracingIntegration } from "@sentry/browser";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] VITE_SENTRY_DSN not set. Error tracking disabled.');
    }
    return;
  }

  // Build integrations array
  const integrations = [];
  
  // Add BrowserTracing for performance monitoring
  // @sentry/browser is included as a dependency of @sentry/react
  try {
    integrations.push(
      browserTracingIntegration({
        tracePropagationTargets: [
          "localhost",
          /^https:\/\/.*\.supabase\.co/,
          /^https:\/\/.*\.afrikoni\.com/,
        ],
        // Enable routing instrumentation for React Router
        enableInp: true, // Enable INP (Interaction to Next Paint) tracking
      })
    );
  } catch (error) {
    // If browserTracingIntegration fails, continue without it
    if (import.meta.env.DEV) {
      console.warn('[Sentry] BrowserTracing integration not available:', error);
    }
  }

  Sentry.init({
    dsn: dsn,
    environment: import.meta.env.MODE,
    integrations: integrations,
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in dev
    // Web Vitals tracking
    enableTracing: true,
    // Track long tasks (performance bottlenecks)
    enableLongTask: true,
  });

  if (import.meta.env.DEV) {
    console.log('[Sentry] Initialized with performance monitoring');
  }
}

export function captureException(error, context = {}) {
  if (typeof window !== 'undefined' && window.Sentry) {
    Sentry.captureException(error, {
      extra: context
    });
  } else if (import.meta.env.DEV) {
    console.error('[Sentry] Exception (not sent - Sentry not initialized):', error, context);
  }
}

export function captureMessage(message, level = 'info', context = {}) {
  if (typeof window !== 'undefined' && window.Sentry) {
    Sentry.captureMessage(message, {
      level,
      extra: context
    });
  } else if (import.meta.env.DEV) {
    console.log(`[Sentry] Message (${level}, not sent - Sentry not initialized):`, message, context);
  }
}

/**
 * Track a custom operation with Sentry
 * Use this to track API calls, database queries, etc.
 * 
 * @param {string} name - Operation name
 * @param {string} op - Operation type (e.g., 'http', 'db', 'task')
 * @param {Function} callback - Function to execute within the span
 * @returns {Promise} Result of the callback
 */
export async function trackOperation(name, op, callback) {
  if (typeof window !== 'undefined' && window.Sentry && Sentry.startSpan) {
    return Sentry.startSpan({
      name,
      op,
    }, callback);
  }
  // Fallback: just execute the callback
  return callback();
}

/**
 * Track a performance metric
 * 
 * @param {string} name - Metric name
 * @param {number} value - Metric value (in milliseconds)
 * @param {string} unit - Unit type ('millisecond', 'second', etc.)
 */
export function trackMetric(name, value, unit = 'millisecond') {
  if (typeof window !== 'undefined' && window.Sentry) {
    Sentry.metrics.distribution(name, value, {
      unit,
    });
  }
}

