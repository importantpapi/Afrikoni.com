/**
 * Afrikoni Shield™ - Admin Permission System
 * Simple admin check with hardcoded CEO email override
 */

/**
 * Check if user is admin
 * Returns TRUE if:
 * - user.email === "youba.thiam@icloud.com" (super-admin hardcoded)
 * - OR user.user_metadata?.role === "admin"
 * 
 * This ensures the CEO account is always admin even if metadata is missing.
 * 
 * @param {Object} user - User object from Supabase auth
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  if (!user) return false;

  // Super-admin (CEO) - check email (case-insensitive)
  const email = user.email?.toLowerCase();
  if (email === "youba.thiam@icloud.com") return true;

  // Metadata admin
  return user.user_metadata?.role === "admin";
};
