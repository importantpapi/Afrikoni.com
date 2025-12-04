/**
 * Analytics hook for tracking page views and events
 * Integrated with Google Analytics 4 (GA4)
 */

// Check if gtag is available (Google Analytics loaded)
const isGA4Available = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

export function useAnalytics() {
  const trackPageView = (pageName, additionalData = {}) => {
    if (isGA4Available()) {
      window.gtag('event', 'page_view', {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        ...additionalData
      });
    }
    
    // Also track in GA4 with custom event
    if (isGA4Available()) {
      window.gtag('event', 'view_page', {
        page_name: pageName,
        ...additionalData
      });
    }
    
    if (import.meta.env.DEV) {
      console.log('[Analytics] Page View:', pageName, additionalData);
    }
  };

  const trackEvent = (eventName, eventData = {}) => {
    if (isGA4Available()) {
      window.gtag('event', eventName, eventData);
    }
    
    if (import.meta.env.DEV) {
      console.log('[Analytics] Event:', eventName, eventData);
    }
  };

  // Convenience methods for common events
  const trackSignUp = (method = 'email') => {
    trackEvent('sign_up', { method });
  };

  const trackLogin = (method = 'email') => {
    trackEvent('login', { method });
  };

  const trackProductView = (productId, productName, category) => {
    trackEvent('view_item', {
      item_id: productId,
      item_name: productName,
      item_category: category,
      currency: 'USD',
      value: 0 // Can be updated with actual price if available
    });
  };

  const trackRFQCreated = (rfqId, category) => {
    trackEvent('create_rfq', {
      rfq_id: rfqId,
      category: category
    });
  };

  const trackOrderCompleted = (orderId, value, currency = 'USD') => {
    trackEvent('purchase', {
      transaction_id: orderId,
      value: value,
      currency: currency
    });
  };

  const trackSearch = (searchTerm, resultsCount) => {
    trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount
    });
  };

  return {
    trackPageView,
    trackEvent,
    trackSignUp,
    trackLogin,
    trackProductView,
    trackRFQCreated,
    trackOrderCompleted,
    trackSearch
  };
}

