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
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:12',message:'Sentry init error',data:{error:sentryError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
  }
  // #endregion
  console.warn('Sentry initialization failed:', sentryError);
}

try {
  initGA4();
} catch (gaError) {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/8db900e9-13cb-4fbb-a772-e155a234f3a7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:20',message:'GA4 init error',data:{error:gaError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
  }
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

