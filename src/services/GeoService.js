/**
 * GeoService - Singleton geo-location service
 *
 * CRITICAL: This is the ONLY place in the codebase that calls ipapi.co
 *
 * Features:
 * - Request deduplication (in-flight promise lock)
 * - Multi-layer caching (memory + localStorage with 24h TTL)
 * - Exponential backoff retry (max 2 retries)
 * - 5s timeout per request
 * - Safe fallback on all failures
 * - Never throws errors
 */

// ============================================
// MODULE-LEVEL SINGLETON STATE
// ============================================
let cached = null;
let inFlight = null;

// ============================================
// CONFIGURATION
// ============================================
const CACHE_KEY = 'afrikoni_geo_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REQUEST_TIMEOUT_MS = 5000; // 5 seconds
const MAX_RETRIES = 2;
const RETRY_DELAYS = [250, 800]; // Exponential: 250ms, 800ms

const FALLBACK_GEO = {
  ip: '',
  country: 'International',
  country_code: 'INT',
  city: '',
  region: '',
  currency: 'USD'
};

// ============================================
// CACHE HELPERS
// ============================================

function isCacheValid(timestamp) {
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_TTL_MS;
}

function getFromLocalStorage() {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed.ts || !parsed.data) return null;

    if (!isCacheValid(parsed.ts)) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.data;
  } catch (err) {
    // Invalid JSON or storage access denied
    return null;
  }
}

function saveToLocalStorage(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      ts: Date.now()
    }));
  } catch (err) {
    // Storage quota exceeded or access denied - non-critical
  }
}

// ============================================
// NETWORK HELPERS
// ============================================

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeGeoData(raw) {
  // Safely extract fields from ipapi.co response
  return {
    ip: raw?.ip || '',
    country: raw?.country_name || raw?.country || 'International',
    country_code: raw?.country_code || raw?.country || 'INT',
    city: raw?.city || '',
    region: raw?.region || '',
    currency: raw?.currency || 'USD'
  };
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function fetchGeoDataWithRetry() {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Localhost bypass
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        return {
          ip: '127.0.0.1',
          country: 'Belgium',
          country_code: 'BE',
          city: 'Brussels',
          region: 'Brussels',
          currency: 'EUR'
        };
      }

      const response = await fetchWithTimeout('https://ipapi.co/json/', REQUEST_TIMEOUT_MS);

      // Handle rate limiting
      if (response.status === 429) {
        if (attempt < MAX_RETRIES) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          await sleep(Math.min(retryAfter * 1000, 5000)); // Max 5s wait
          continue;
        }
        throw new Error('Rate limited');
      }

      // Handle server errors (retry)
      if (response.status >= 500) {
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAYS[attempt] || 1000);
          continue;
        }
        throw new Error(`Server error: ${response.status}`);
      }

      // Handle client errors (don't retry)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return normalizeGeoData(data);

    } catch (err) {
      lastError = err;

      // Network errors: retry with exponential backoff
      const isNetworkError =
        err.name === 'AbortError' ||
        err.message?.includes('fetch') ||
        err.message?.includes('network');

      if (isNetworkError && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAYS[attempt] || 1000);
        continue;
      }

      // Don't retry on last attempt or non-retryable errors
      break;
    }
  }

  // All retries exhausted or non-retryable error
  throw lastError;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get full geo data
 * @returns {Promise<{ip: string, country: string, country_code: string, city: string, region: string, currency: string}>}
 */
export async function getGeo() {
  // Layer 1: Memory cache
  if (cached) {
    console.debug('[GeoService] cache hit (memory)');
    return cached;
  }

  // Layer 2: localStorage
  const stored = getFromLocalStorage();
  if (stored) {
    console.debug('[GeoService] cache hit (localStorage)');
    cached = stored;
    return stored;
  }

  // Layer 3: Deduplicate in-flight requests
  if (inFlight) {
    console.debug('[GeoService] awaiting in-flight request');
    return inFlight;
  }

  // Layer 4: Network fetch
  console.info('[GeoService] network fetch');

  inFlight = fetchGeoDataWithRetry()
    .then(data => {
      cached = data;
      saveToLocalStorage(data);
      return data;
    })
    .catch(err => {
      console.debug('[GeoService] fetch failed, using fallback:', err.message);
      cached = FALLBACK_GEO;
      return FALLBACK_GEO;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/**
 * Get country data only
 * @returns {Promise<{country: string, country_code: string}>}
 */
export async function getCountry() {
  const geo = await getGeo();
  return {
    country: geo.country,
    country_code: geo.country_code
  };
}

/**
 * Preload geo data (warmup, never throws)
 */
export async function preload() {
  try {
    await getGeo();
  } catch (err) {
    // Silent - preload is opportunistic
  }
}

/**
 * Clear all caches (for testing or manual refresh)
 */
export function clearCache() {
  cached = null;
  inFlight = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (err) {
    // Ignore
  }
}

// Export singleton instance for backward compatibility
export default {
  getGeo,
  getCountry,
  preload,
  clearCache
};
