/**
 * Google Analytics 4 (GA4) Initialization
 * Loads GA4 script dynamically if VITE_GA4_ID is set
 */

let ga4Initialized = false;

export function initGA4() {
  // Don't initialize twice
  if (ga4Initialized) return;
  
  const ga4Id = import.meta.env.VITE_GA4_ID;
  
  if (!ga4Id) {
    if (import.meta.env.DEV) {
      console.log('[GA4] VITE_GA4_ID not set. Analytics disabled.');
    }
    return;
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ga4Id, {
    page_path: window.location.pathname,
  });

  // Load GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
  document.head.appendChild(script);

  ga4Initialized = true;
  
  if (import.meta.env.DEV) {
    console.log('[GA4] Initialized with ID:', ga4Id);
  }
}

