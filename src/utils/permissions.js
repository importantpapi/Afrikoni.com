/**
 * Afrikoni Shield™ - Admin Permission System
 * Admin check using database flag (profiles.is_admin)
 */

/**
 * Check if user is admin
 * Returns TRUE if profile.is_admin === true (from database)
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

  const profileData = profile || user.profile || user;

  if (profileData?.is_admin === true) {
    return true;
  }

  return false;
};
