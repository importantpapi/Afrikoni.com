/**
 * SchemaValidator - Circuit Breaker for Database Schema Integrity
 * 
 * Verifies that critical database tables exist before allowing the application to proceed.
 * This prevents cascading failures when tables are missing due to migration issues.
 */

import { supabase } from '@/api/supabaseClient';

const CRITICAL_TABLES = [
  'profiles',
  'companies',
  'company_capabilities',
  'rfqs'
];

/**
 * Verifies schema integrity by checking for the existence of critical tables
 * Uses limit(0) to minimize query overhead while still validating table existence
 * 
 * @returns {Promise<{valid: boolean, missing: string[], error: string|null}>}
 */
export async function verifySchemaIntegrity() {
  const missing = [];
  const errors = [];

  for (const tableName of CRITICAL_TABLES) {
    try {
      // Use limit(0) to check table existence without fetching data
      const { error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(0);

      if (error) {
        // Check if error is due to missing table
        const errorMessage = error.message?.toLowerCase() || '';
        const isTableMissing = 
          errorMessage.includes('relation') && errorMessage.includes('does not exist') ||
          errorMessage.includes('table') && errorMessage.includes('does not exist') ||
          errorMessage.includes('schema cache') ||
          error.code === '42P01' || // PostgreSQL: relation does not exist
          error.code === 'PGRST202'; // PostgREST: relation not found

        if (isTableMissing) {
          missing.push(tableName);
          errors.push(`Table '${tableName}' does not exist: ${error.message}`);
        } else {
          // Other errors (permissions, etc.) - log but don't fail schema check
          console.warn(`[SchemaValidator] Warning for table '${tableName}':`, error.message);
        }
      }
      // If no error, table exists - continue
    } catch (err) {
      // Network or unexpected errors
      const errorMessage = err.message || 'Unknown error';
      errors.push(`Failed to verify table '${tableName}': ${errorMessage}`);
      
      // If it's a network error, we can't verify - fail safe
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        return {
          valid: false,
          missing: [...missing, tableName],
          error: `Network error while verifying table '${tableName}'. Please check your connection.`,
        };
      }
    }
  }

  if (missing.length > 0) {
    return {
      valid: false,
      missing,
      error: `Critical tables are missing: ${missing.join(', ')}. Please run database migrations.`,
    };
  }

  return {
    valid: true,
    missing: [],
    error: null,
  };
}

/**
 * Gets a user-friendly error message for schema validation failures
 */
export function getSchemaErrorMessage(validationResult) {
  if (validationResult.valid) {
    return null;
  }

  if (validationResult.missing.length > 0) {
    return `Database schema is incomplete. Missing tables: ${validationResult.missing.join(', ')}. Please contact support or run database migrations.`;
  }

  return validationResult.error || 'Database schema validation failed. Please contact support.';
}
