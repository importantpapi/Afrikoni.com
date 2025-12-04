/**
 * Sentry Error Tracking Setup
 * 
 * To enable Sentry:
 * 1. Sign up at https://sentry.io (free tier available)
 * 2. Create a project and get your DSN
 * 3. Add VITE_SENTRY_DSN to your .env file
 * 4. Install: npm install @sentry/react
 * 5. Uncomment the code below
 */

// Uncomment when Sentry is set up:
/*
import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Sentry DSN not found. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: dsn,
    environment: import.meta.env.MODE,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production
    // Session Replay
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  });
}

export function captureException(error, context = {}) {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(error, {
      extra: context
    });
  }
}

export function captureMessage(message, level = 'info', context = {}) {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureMessage(message, {
      level,
      extra: context
    });
  }
}
*/

// Placeholder exports for when Sentry is not set up
export function initSentry() {
  // Sentry not configured yet
  if (import.meta.env.DEV) {
    console.log('[Sentry] Error tracking not configured. Add VITE_SENTRY_DSN to enable.');
  }
}

export function captureException(error, context = {}) {
  if (import.meta.env.DEV) {
    console.error('[Sentry] Exception (not sent):', error, context);
  }
}

export function captureMessage(message, level = 'info', context = {}) {
  if (import.meta.env.DEV) {
    console.log(`[Sentry] Message (${level}, not sent):`, message, context);
  }
}

