/**
 * Afrikoni Shield™ - Admin Permission System
 * Admin check using database flag (profiles.is_admin)
 */

/**
 * Check if user is admin
 * Returns TRUE if:
 * - profile.is_admin === true (from database)
 * - user.email === 'youba.thiam@icloud.com' (founder/CEO - always has admin access)
 * 
 * NOTE: To promote a user to admin, update their profile:
 * UPDATE profiles SET is_admin = true WHERE id = 'user-uuid';
 * 
 * @param {Object} user - User object from Supabase auth (may include profile data)
 * @param {Object} profile - Optional profile object (if not included in user)
 * @returns {boolean}
 */
export const isAdmin = (user, profile = null) => {
  if (!user) return false;

  // Founder/CEO always has admin access (youba.thiam@icloud.com)
  const userEmail = user?.email?.toLowerCase();
  if (userEmail === 'youba.thiam@icloud.com') {
    return true;
  }

  // Check profile.is_admin flag (from database)
  // Profile may be passed separately or included in user object
  const profileData = profile || user.profile || user;
  
  // Check database flag
  if (profileData?.is_admin === true) {
    return true;
  }

  // ✅ KERNEL COMPLIANCE: Removed user_metadata.role fallback
  // Admin access is now exclusively determined by profiles.is_admin boolean

  return false;
};
