import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
// ⚠️ CRITICAL: Initialize extension protection FIRST (before anything else)
// This prevents browser extension errors from breaking React rendering
import { initExtensionProtection } from './utils/extensionProtection';
initExtensionProtection();

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
        <React.StrictMode>
          <ErrorBoundary>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <App />
            </BrowserRouter>
          </ErrorBoundary>
        </React.StrictMode>,
      );
    } catch (error) {
      console.error('[React Render] Error during render:', error);
      // Show fallback UI
      rootElement.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-center; flex-direction: column; font-family: system-ui; padding: 20px;">
          <div style="width: 48px; height: 48px; border: 4px solid #f3f4f6; border-top-color: #d97706; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="margin-top: 16px; color: #6b7280;">Loading Afrikoni...</p>
          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </div>
      `;
      
      // Retry after a delay
      setTimeout(() => {
        try {
          const root = ReactDOM.createRoot(rootElement);
          root.render(
            <React.StrictMode>
              <ErrorBoundary>
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true
                  }}
                >
                  <App />
                </BrowserRouter>
              </ErrorBoundary>
            </React.StrictMode>,
          );
        } catch (retryError) {
          console.error('[React Render] Retry also failed:', retryError);
        }
      }, 500);
    }
  };

  // Use setTimeout with 0 delay to ensure this runs after all synchronous code
  // This helps if extension errors are blocking synchronous execution
  setTimeout(renderApp, 0);
}

