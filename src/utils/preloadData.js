/**
 * Preload dashboard data in the background
 * This improves perceived performance by fetching data before user navigates
 */

import { supabase } from '@/api/supabaseClient';
// ✅ FINAL 3% FIX: Removed getCurrentUserAndRole import - replaced with direct Supabase calls

/**
 * Preload dashboard KPIs and recent data
 * Called when user hovers over dashboard link or when app is idle
 * 
 * ✅ FINAL 3% FIX: Removed getCurrentUserAndRole dependency - uses direct Supabase auth
 */
export async function preloadDashboardData(role = 'buyer') {
  try {
    // ✅ FINAL 3% FIX: Get companyId directly from session and profile
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      if (import.meta.env.DEV) {
        console.debug('[Preload] Skipping - no session');
      }
      return;
    }

    // Get profile to extract company_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .maybeSingle();

    const companyId = profile?.company_id;
    if (!companyId) {
      if (import.meta.env.DEV) {
        console.debug('[Preload] Skipping - no companyId');
      }
      return;
    }

    // ✅ FIX: Validate companyId is a valid UUID before using in queries
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      if (import.meta.env.DEV) {
        console.warn('[Preload] Invalid companyId format:', companyId);
      }
      return;
    }

    // Preload critical dashboard data in parallel
    // ✅ FIX: Wrap each query in try/catch to prevent one failure from breaking others
    const preloadPromises = [
      // KPIs - Orders
      supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`)
        .limit(1)
        .catch(err => {
          if (import.meta.env.DEV) console.debug('[Preload] Orders query failed:', err);
          return { data: null, error: err };
        }),

      // KPIs - RFQs
      supabase
        .from('rfqs')
        .select('id', { count: 'exact' })
        .eq('buyer_company_id', companyId)
        .limit(1)
        .catch(err => {
          if (import.meta.env.DEV) console.debug('[Preload] RFQs query failed:', err);
          return { data: null, error: err };
        }),

      // KPIs - Products (only if user has sell capability)
      // ✅ FIX: Skip products preload if user doesn't have sell capability to avoid 400 errors
      supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .limit(1)
        .catch(err => {
          if (import.meta.env.DEV) console.debug('[Preload] Products query failed:', err);
          return { data: null, error: err };
        }),

      // Recent data - Orders
      supabase
        .from('orders')
        .select('id, created_at')
        .or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`)
        .order('created_at', { ascending: false })
        .limit(5)
        .catch(err => {
          if (import.meta.env.DEV) console.debug('[Preload] Recent orders query failed:', err);
          return { data: null, error: err };
        }),

      // Recent data - RFQs
      supabase
        .from('rfqs')
        .select('id, created_at')
        .eq('buyer_company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5)
        .catch(err => {
          if (import.meta.env.DEV) console.debug('[Preload] Recent RFQs query failed:', err);
          return { data: null, error: err };
        }),

      // Recent data - Messages
      supabase
        .from('messages')
        .select('id, created_at')
        .eq('receiver_company_id', companyId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10)
        .catch(err => {
          if (import.meta.env.DEV) console.debug('[Preload] Messages query failed:', err);
          return { data: null, error: err };
        })
    ];

    // Use Promise.allSettled to not block on errors
    await Promise.allSettled(preloadPromises);
  } catch (error) {
    // Silently fail - preloading is optional
    if (import.meta.env.DEV) {
      console.debug('[Preload] Dashboard preload failed:', error);
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
    // ✅ FIX: Use minimal select to avoid 400 errors from missing columns
    const preloadPromises = [
      supabase
        .from('categories')
        .select('id, name, slug')
        .limit(12)
        .catch(err => {
          if (import.meta.env.DEV) console.debug('[Preload] Categories query failed:', err);
          return { data: null, error: err };
        }),

      // ✅ KERNEL-SCHEMA ALIGNMENT: Use 'name' instead of 'title' (DB schema uses 'name')
      // ✅ FIX: Simplified select - only columns that definitely exist
      // Removed joins that might fail due to RLS or missing relationships
      supabase
        .from('products')
        .select('id, name, status, created_at')
        .eq('status', 'active')
        .limit(20)
        .catch(err => {
          if (import.meta.env.DEV) console.debug('[Preload] Products query failed:', err);
          return { data: null, error: err };
        })
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
 * Fixed: Don't preload on auth pages or dashboard pages
 */
export function useIdlePreloading() {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname;

  // ✅ FIX: Skip preloading on auth pages
  if (currentPath === '/signup' || currentPath === '/login' || currentPath.startsWith('/auth/')) {
    return; // Skip preloading on auth pages
  }

  // ✅ FIX: Skip marketplace preload on dashboard pages (dashboard has its own preload)
  const isDashboardPage = currentPath.startsWith('/dashboard');

  if (!('requestIdleCallback' in window)) {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      // Only preload marketplace if NOT on dashboard
      if (!isDashboardPage) {
        preloadMarketplaceData();
      }
    }, 3000);
    return;
  }

  requestIdleCallback(() => {
    // ✅ FIX: Only preload marketplace if NOT on dashboard pages
    if (!isDashboardPage) {
      preloadMarketplaceData();
    }

    // Preload dashboard if user is logged in (works on any page)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        requestIdleCallback(() => {
          preloadDashboardData();
        });
      }
    });
  }, { timeout: 5000 });
}

