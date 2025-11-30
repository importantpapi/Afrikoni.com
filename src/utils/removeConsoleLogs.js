/**
 * Utility to remove console.logs in production
 * This is a helper script - actual removal should be done via build tools
 * For now, we'll use a babel plugin or manual removal
 */

// In production builds, console.logs should be stripped
// This file is just for reference

export const shouldLog = () => {
  return import.meta.env.DEV;
};

export const safeLog = (...args) => {
  if (shouldLog()) {
    // Only log in development
    // console.log(...args);
  }
};

