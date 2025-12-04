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

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.log('[Sentry] VITE_SENTRY_DSN not set. Error tracking disabled.');
    }
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

  if (import.meta.env.DEV) {
    console.log('[Sentry] Initialized successfully');
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

