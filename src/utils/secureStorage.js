/**
 * AFRIKONI SECURE STORAGE UTILITY
 * Encrypts sensitive data before storing in localStorage
 * Prevents XSS attacks from stealing user data
 * 
 * Usage:
 *   secureStorage.set('afrikoni_last_company_id', companyId);
 *   const companyId = secureStorage.get('afrikoni_last_company_id');
 */

import CryptoJS from 'crypto-js';

// Encryption secret - should be unique per deployment
// In production, this should be set via environment variable
const SECRET = import.meta.env.VITE_STORAGE_SECRET || 'afrikoni-2026-secure-storage-key';

/**
 * Secure localStorage wrapper with AES encryption
 */
export const secureStorage = {
  /**
   * Encrypt and store data
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be JSON stringified)
   */
  set: (key, value) => {
    try {
      const jsonString = JSON.stringify(value);
      const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET).toString();
      localStorage.setItem(key, encrypted);
      return true;
    } catch (error) {
      console.error('[SecureStorage] Encryption failed:', error);
      return false;
    }
  },

  /**
   * Retrieve and decrypt data
   * @param {string} key - Storage key
   * @returns {any} Decrypted value or null if not found/invalid
   */
  get: (key) => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        // Decryption failed (wrong key or corrupted data)
        console.warn(`[SecureStorage] Failed to decrypt: ${key}`);
        return null;
      }

      return JSON.parse(jsonString);
    } catch (error) {
      console.error('[SecureStorage] Decryption failed:', error);
      return null;
    }
  },

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   */
  remove: (key) => {
    localStorage.removeItem(key);
  },

  /**
   * Clear all localStorage items
   */
  clear: () => {
    localStorage.clear();
  },

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  has: (key) => {
    return localStorage.getItem(key) !== null;
  }
};

/**
 * Migrate existing unencrypted data to encrypted format
 * Run this once during app initialization
 */
export function migrateToSecureStorage() {
  const KEYS_TO_MIGRATE = [
    'afrikoni_last_company_id',
    'afrikoni_workspace_mode',
    'afr_last_selected_role',
    'active_trade_session'
  ];

  let migrated = 0;

  KEYS_TO_MIGRATE.forEach(key => {
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        // Try to parse as JSON (unencrypted)
        const value = JSON.parse(existing);
        
        // Re-save with encryption
        secureStorage.set(key, value);
        migrated++;
        
        console.log(`[SecureStorage] Migrated: ${key}`);
      } catch {
        // Already encrypted or not JSON - skip
      }
    }
  });

  if (migrated > 0) {
    console.log(`[SecureStorage] Migration complete: ${migrated} items encrypted`);
  }
}

/**
 * Legacy localStorage wrapper (for non-sensitive data)
 * Use this for non-critical data like UI preferences
 */
export const publicStorage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[PublicStorage] Failed to save:', error);
      return false;
    }
  },

  get: (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('[PublicStorage] Failed to read:', error);
      return null;
    }
  },

  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
  has: (key) => localStorage.getItem(key) !== null
};

export default secureStorage;
