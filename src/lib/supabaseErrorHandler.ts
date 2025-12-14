import { PostgrestError } from '@supabase/supabase-js';

/**
 * Global Supabase Error Handler
 * Provides consistent error handling and user-friendly error messages
 */
export function handleSupabaseError(error: PostgrestError | null, context: string): string | null {
  if (!error) return null;

  console.error(`[${context}] Supabase Error:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });

  const errorMessages: Record<string, string> = {
    '42501': 'Permission denied. Please check your access rights.',
    '23505': 'This record already exists.',
    '23503': 'Cannot delete - referenced by other records.',
    'PGRST301': 'Resource not found.',
    '42P01': 'Table does not exist.',
    '42703': 'Column does not exist.',
    'PGRST116': 'No rows found.',
    '400': 'Invalid request. Please check your input.',
    '401': 'Authentication required. Please log in.',
    '403': 'Access forbidden. You do not have permission.',
    '404': 'Resource not found.',
    '500': 'Server error. Please try again later.',
  };

  return errorMessages[error.code || ''] || errorMessages[String(error.code)] || 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is a specific type
 */
export function isSupabaseError(error: any, code?: string): error is PostgrestError {
  if (!error) return false;
  if (code) return error.code === code;
  return typeof error.code === 'string' && typeof error.message === 'string';
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: PostgrestError | null, context: string): string {
  if (!error) return '';
  return handleSupabaseError(error, context) || error.message || 'An unexpected error occurred.';
}

