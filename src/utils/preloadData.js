/**
 * Preload dashboard data in the background
 * This improves perceived performance by fetching data before user navigates
 */

import { supabase } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';

/**
 * Preload dashboard KPIs and recent data
 * Called when user hovers over dashboard link or when app is idle
 */
export async function preloadDashboardData(role = 'buyer') {
  try {
    // Import supabaseHelpers dynamically to avoid circular dependencies
    const { supabaseHelpers } = await import('@/api/supabaseClient');
    const { companyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
    if (!companyId) return;

    // Preload critical dashboard data in parallel
    const preloadPromises = [
      // KPIs
      supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`)
        .limit(1),
      
      supabase
        .from('rfqs')
        .select('*', { count: 'exact' })
        .eq('buyer_company_id', companyId)
        .limit(1),
      
      supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .limit(1),
      
      // Recent data
      supabase
        .from('orders')
        .select('*')
        .or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`)
        .order('created_at', { ascending: false })
        .limit(5),
      
      supabase
        .from('rfqs')
        .select('*')
        .eq('buyer_company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5),
      
      supabase
        .from('messages')
        .select('*')
        .eq('receiver_company_id', companyId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10)
    ];

    // Use Promise.allSettled to not block on errors
    await Promise.allSettled(preloadPromises);
  } catch (error) {
    // Silently fail - preloading is optional
    if (import.meta.env.DEV) {
      console.debug('Preload failed:', error);
    }
  }
}

/**
 * Preload product data for marketplace
 * Fixed: Remove authenticated joins for anonymous access
 */
export async function preloadMarketplaceData() {
  try {
    // Don't preload on signup/login pages - user hasn't signed up yet
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath === '/signup' || currentPath === '/login' || currentPath.startsWith('/auth/')) {
        return; // Skip preloading on auth pages
      }
    }

    // Preload categories and top products (anonymous-friendly queries)
    const preloadPromises = [
      supabase
        .from('categories')
        .select('*')
        .limit(12),
      
      // Fixed: Remove companies join for anonymous access
      supabase
        .from('products')
        .select('id, title, description, price_min, price_max, currency, status, country_of_origin, created_at, categories(*), product_images(id, url, is_primary)')
        .eq('status', 'active')
        .order('views', { ascending: false })
        .limit(20)
    ];

    await Promise.allSettled(preloadPromises);
  } catch (error) {
    // Silently fail - preloading is optional
    if (import.meta.env.DEV) {
      console.debug('Marketplace preload failed (non-critical):', error);
    }
  }
}

/**
 * Preload images for better perceived performance
 */
export function preloadImage(src) {
  if (!src) return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Preload critical route data on link hover
 */
export function setupLinkPreloading() {
  if (typeof window === 'undefined') return;

  // Preload dashboard on hover
  const dashboardLinks = document.querySelectorAll('a[href*="/dashboard"]');
  dashboardLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      preloadDashboardData();
    }, { once: true });
  });

  // Preload marketplace on hover
  const marketplaceLinks = document.querySelectorAll('a[href*="/marketplace"]');
  marketplaceLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      preloadMarketplaceData();
    }, { once: true });
  });
}

/**
 * Use browser idle time to preload data
 * Fixed: Don't preload on auth pages
 */
export function useIdlePreloading() {
  if (typeof window === 'undefined') return;
  
  // Don't preload on signup/login pages
  const currentPath = window.location.pathname;
  if (currentPath === '/signup' || currentPath === '/login' || currentPath.startsWith('/auth/')) {
    return; // Skip preloading on auth pages
  }

  if (!('requestIdleCallback' in window)) {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadMarketplaceData();
    }, 3000);
    return;
  }

  requestIdleCallback(() => {
    preloadMarketplaceData();
    // Preload dashboard if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        requestIdleCallback(() => {
          preloadDashboardData();
        });
      }
    });
  }, { timeout: 5000 });
}

