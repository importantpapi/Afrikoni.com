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
    // Silently return - GA4 ID not configured is expected in some environments
    return;
  }

  try {
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
    script.onerror = () => {
      console.warn('[GA4] Failed to load analytics script');
    };
    document.head.appendChild(script);

    ga4Initialized = true;
    
    if (import.meta.env.DEV) {
      console.info('[GA4] Analytics enabled');
    }
  } catch (error) {
    console.warn('[GA4] Failed to initialize:', error);
  }
}

