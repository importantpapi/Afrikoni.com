/**
 * Security utilities for input validation and sanitization
 */

/**
 * Validates UUID format
 * @param {string} uuid - UUID string to validate
 * @returns {boolean} - True if valid UUID format
 */
export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates and sanitizes numeric input
 * @param {any} value - Value to validate
 * @param {object} options - Validation options
 * @returns {number|null} - Parsed number or null if invalid
 */
export function validateNumeric(value, options = {}) {
  const { min = null, max = null, allowNegative = false } = options;
  
  if (value === null || value === undefined || value === '') return null;
  
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  if (isNaN(num)) return null;
  if (!allowNegative && num < 0) return null;
  if (min !== null && num < min) return null;
  if (max !== null && num > max) return null;
  
  return num;
}

/**
 * Sanitizes string input to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates that a company_id belongs to the authenticated user
 * @param {object} supabase - Supabase client
 * @param {string} companyId - Company ID to verify
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<boolean>} - True if company belongs to user
 */
export async function verifyCompanyOwnership(supabase, companyId, userId) {
  if (!companyId || !userId) return false;
  
  try {
    // Check profiles table first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();
    
    if (!profileError && profile?.company_id === companyId) {
      return true;
    }
    
    // Fallback to users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();
    
    if (!userError && user?.company_id === companyId) {
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

