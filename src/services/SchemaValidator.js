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
 * Uses parallel requests with head:true to minimize query overhead
 *
 * FIX: Parallelized table checks to reduce total time from ~3200ms to ~800ms
 * This prevents schema validation from timing out on slow networks
 *
 * @returns {Promise<{valid: boolean, missing: string[], error: string|null}>}
 */
export async function verifySchemaIntegrity() {
  const missing = [];
  const errors = [];

  // FIX: Run all table checks in parallel instead of sequentially
  // This reduces total time from 4 × ~800ms = 3200ms to ~800ms (single round-trip)
  const checkTable = async (tableName) => {
    try {
      // Use head:true with minimal select for fastest possible check
      const { error } = await supabase
        .from(tableName)
        .select('id', { head: true })
        .limit(1);

      if (error) {
        // Check if error is due to missing table
        const errorMessage = error.message?.toLowerCase() || '';
        const isTableMissing =
          errorMessage.includes('relation') && errorMessage.includes('does not exist') ||
          errorMessage.includes('table') && errorMessage.includes('does not exist') ||
          errorMessage.includes('schema cache') ||
          error.code === '42P01' || // PostgreSQL: relation does not exist
          error.code === 'PGRST202'; // PostgREST: relation not found

        return { tableName, missing: isTableMissing, error: isTableMissing ? error.message : null, warning: !isTableMissing ? error.message : null };
      }
      return { tableName, missing: false, error: null, warning: null };
    } catch (err) {
      const errorMessage = err.message || 'Unknown error';
      // Network errors - return as error but don't block
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        return { tableName, missing: false, error: null, warning: null, networkError: errorMessage };
      }
      return { tableName, missing: false, error: null, warning: errorMessage };
    }
  };

  // Execute all checks in parallel
  const results = await Promise.all(CRITICAL_TABLES.map(checkTable));

  // Process results
  for (const result of results) {
    if (result.networkError) {
      // Network error on any table - fail safe but don't block
      console.warn(`[SchemaValidator] Network error checking '${result.tableName}':`, result.networkError);
      return {
        valid: true, // Fail open - RLS will enforce security
        missing: [],
        error: null,
      };
    }
    if (result.missing) {
      missing.push(result.tableName);
      errors.push(`Table '${result.tableName}' does not exist: ${result.error}`);
    }
    if (result.warning) {
      console.warn(`[SchemaValidator] Warning for table '${result.tableName}':`, result.warning);
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
