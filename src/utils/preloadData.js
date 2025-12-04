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
    const { companyId } = await getCurrentUserAndRole(supabase, null);
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
 */
export async function preloadMarketplaceData() {
  try {
    // Preload categories and top products
    const preloadPromises = [
      supabase
        .from('categories')
        .select('*')
        .limit(12),
      
      supabase
        .from('products')
        .select('*, companies(*), categories(*), product_images(*)')
        .eq('status', 'active')
        .order('views', { ascending: false })
        .limit(20)
    ];

    await Promise.allSettled(preloadPromises);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('Marketplace preload failed:', error);
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
 */
export function useIdlePreloading() {
  if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
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

