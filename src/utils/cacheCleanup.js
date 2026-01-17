/**
 * ✅ TOTAL SYSTEM SYNC: Cache Cleanup Utility
 * 
 * Clears localStorage and sessionStorage keys related to legacy profile/role data
 * that might be feeding the app stale data.
 * 
 * Usage: Call clearLegacyCache() on app initialization or when needed
 */

export function clearLegacyCache() {
  const keysToRemove = [
    // Legacy role/profile keys
    'afrikoni_user_role',
    'afrikoni_role',
    'afrikoni_user_profile',
    'afrikoni_profile',
    'afrikoni_user_data',
    'afrikoni_current_role',
    'afrikoni_selected_role',
    'afrikoni_role_type',
    'afrikoni_buyer_role',
    'afrikoni_seller_role',
    'afrikoni_logistics_role',
    'afrikoni_hybrid_role',
    // Legacy capability keys (if any)
    'afrikoni_capabilities',
    'afrikoni_company_capabilities',
    // Session storage duplicates
    'session_afrikoni_role',
    'session_afrikoni_profile',
    'session_afrikoni_user_data',
  ];

  let clearedCount = 0;
  
  // Clear localStorage
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      clearedCount++;
      console.log(`🧹 Cleared localStorage: ${key}`);
    }
  });

  // Clear sessionStorage
  keysToRemove.forEach(key => {
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
      clearedCount++;
      console.log(`🧹 Cleared sessionStorage: ${key}`);
    }
  });

  // Clear any keys that match patterns
  const patternsToRemove = [
    /^afrikoni_role/,
    /^afrikoni_profile/,
    /^afrikoni_user/,
  ];

  // Clear localStorage by pattern
  Object.keys(localStorage).forEach(key => {
    if (patternsToRemove.some(pattern => pattern.test(key))) {
      localStorage.removeItem(key);
      clearedCount++;
      console.log(`🧹 Cleared localStorage pattern: ${key}`);
    }
  });

  // Clear sessionStorage by pattern
  Object.keys(sessionStorage).forEach(key => {
    if (patternsToRemove.some(pattern => pattern.test(key))) {
      sessionStorage.removeItem(key);
      clearedCount++;
      console.log(`🧹 Cleared sessionStorage pattern: ${key}`);
    }
  });

  console.log(`✅ Cache cleanup complete: ${clearedCount} items cleared`);
  return clearedCount;
}

/**
 * Clear all Afrikoni-related cache (use with caution)
 */
export function clearAllAfrikoniCache() {
  const allKeys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
  const afrikoniKeys = allKeys.filter(key => key.toLowerCase().includes('afrikoni'));
  
  afrikoniKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    console.log(`🧹 Cleared: ${key}`);
  });

  console.log(`✅ Full cache cleanup complete: ${afrikoniKeys.length} items cleared`);
  return afrikoniKeys.length;
}
