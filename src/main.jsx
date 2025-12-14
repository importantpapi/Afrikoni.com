import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { initSentry } from './utils/sentry';
import { initGA4 } from './utils/analytics';
import { trackPageLoad } from './utils/performance';
import './index.css';

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

