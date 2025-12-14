/**
 * User Helper Utilities
 * Centralized functions for extracting user names and initials
 */

/**
 * Validates if a name is valid (more than 1 character)
 * @param {string|null|undefined} name - The name to validate
 * @returns {boolean} - True if name is valid
 */
export function isValidName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

/**
 * Extracts user name from various sources in priority order
 * @param {Object} user - User object from auth
 * @param {Object} profile - Profile object from database
 * @returns {string|null} - The extracted name or null
 */
export function extractUserName(user, profile) {
  // Add null safety
  if (!user && !profile) return null;
  
  try {
    // Priority 1: Profile name fields (most reliable)
    if (profile && isValidName(profile.full_name)) {
      return profile.full_name.trim();
    }
    if (profile && isValidName(profile.name)) {
      return profile.name.trim();
    }
    
    // Priority 2: User metadata (from auth provider)
    if (user?.user_metadata && isValidName(user.user_metadata.full_name)) {
      return user.user_metadata.full_name.trim();
    }
    if (user?.user_metadata && isValidName(user.user_metadata.name)) {
      return user.user_metadata.name.trim();
    }
    
    // Priority 3: Direct user fields
    if (user && isValidName(user.full_name)) {
      return user.full_name.trim();
    }
    if (user && isValidName(user.name)) {
      return user.name.trim();
    }
    
    // Priority 4: Extract from email (last resort)
    if (user?.email && typeof user.email === 'string') {
      const emailName = user.email.split('@')[0];
      if (isValidName(emailName)) {
        // Capitalize first letter, lowercase rest
        return emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase();
      }
    }
  } catch (error) {
    console.warn('Error in extractUserName:', error);
  }
  
  return null;
}

/**
 * Gets the first letter of the user's name for avatar display
 * @param {Object} user - User object from auth
 * @param {Object} profile - Profile object from database
 * @returns {string} - Single uppercase letter (defaults to 'U' if no name found)
 */
export function getUserInitial(user, profile) {
  try {
    // Add null safety
    if (!user && !profile) {
      return 'U';
    }
    
    const userName = extractUserName(user, profile);
    
    if (userName && typeof userName === 'string') {
      // Get first letter of first name
      const firstName = userName.trim().split(/\s+/)[0];
      if (firstName && firstName.length > 0) {
        return firstName.charAt(0).toUpperCase();
      }
    }
    
    // Fallback to email first letter
    if (user?.email && typeof user.email === 'string') {
      const emailName = user.email.split('@')[0];
      if (emailName && emailName.length > 0) {
        return emailName.charAt(0).toUpperCase();
      }
    }
  } catch (error) {
    console.warn('Error in getUserInitial:', error);
    // Safe fallback
    if (user?.email && typeof user.email === 'string') {
      return user.email.charAt(0).toUpperCase();
    }
  }
  
  // Final fallback
  return 'U';
}

/**
 * Gets the user's display name (full name or formatted email name)
 * @param {Object} user - User object from auth
 * @param {Object} profile - Profile object from database
 * @returns {string} - Display name
 */
export function getUserDisplayName(user, profile) {
  const userName = extractUserName(user, profile);
  
  if (userName) {
    return userName;
  }
  
  // Fallback to email name
  if (user?.email) {
    const emailName = user.email.split('@')[0];
    if (emailName && emailName.length > 1) {
      return emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase();
    }
  }
  
  return 'User';
}

