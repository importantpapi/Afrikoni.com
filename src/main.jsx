import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
// ⚠️ CRITICAL: Initialize extension protection FIRST (before anything else)
// This prevents browser extension errors from breaking React rendering
import { initExtensionProtection } from './utils/extensionProtection';
initExtensionProtection();

// ✅ TOTAL SYSTEM SYNC: Clear legacy cache on app initialization
import { clearLegacyCache } from './utils/cacheCleanup';
if (typeof window !== 'undefined') {
  clearLegacyCache();
}

import { initSentry } from './utils/sentry';
import { initGA4 } from './utils/analytics';
import { trackPageLoad } from './utils/performance';
import { toast } from 'sonner';
import './i18n';
import './index.css';


// Import test utility for email service (available in browser console)
if (import.meta.env.DEV) {
  import('@/utils/testEmailService').catch(() => {
    // Silently fail if test utility can't be loaded
  });
}

// Initialize error tracking and analytics
try {
  initSentry();
} catch (sentryError) {
  // #region agent log (silent - only in dev with server available)
  // Agent logging disabled to prevent console noise
  // #endregion
  console.warn('Sentry initialization failed:', sentryError);
}

try {
  initGA4();
} catch (gaError) {
  // #region agent log (silent - only in dev with server available)
  // Agent logging disabled to prevent console noise
  // #endregion
  console.warn('GA4 initialization failed:', gaError);
}

// Track initial page load performance
if (typeof window !== 'undefined') {
  // Wait for page to fully load
  if (document.readyState === 'complete') {
    trackPageLoad();
  } else {
    window.addEventListener('load', trackPageLoad);
  }
}

// Defensive check before React renders
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found! Check index.html');
  document.body.innerHTML = '<h1>Error: Root element missing</h1>';
} else {
  // Wrap React render in try-catch and use setTimeout to ensure it runs even if blocked
  const renderApp = () => {
    try {
      const root = ReactDOM.createRoot(rootElement);
      root.render(
        // ✅ STABILIZE BOOT: Temporarily disabled StrictMode to prevent double mounting
        // This stops the "🚀 Afrikoni app booting twice" and prevents 5s timeout
        // <React.StrictMode>
          <ErrorBoundary>
            <ThemeProvider>
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true
                }}
              >
                <App />
              </BrowserRouter>
            </ThemeProvider>
          </ErrorBoundary>
        // </React.StrictMode>,
      );
    } catch (e) {
      console.error('[React Render] Error during render:', e);
      document.body.innerHTML = '<pre>App failed to start. Check console.</pre>';
      console.error(e);
    }
  };

  // Use setTimeout with 0 delay to ensure this runs after all synchronous code
  // This helps if extension errors are blocking synchronous execution
  setTimeout(renderApp, 0);
}

