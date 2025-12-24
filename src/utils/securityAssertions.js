import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';

/**
 * Shared security assertions for ownership checks.
 * These are defense-in-depth on top of RLS – they should NEVER be relied on
 * instead of database policies, only in addition to them.
 */

async function handleOwnershipViolation(details) {
  console.error('[SECURITY] ownership violation', details);

  try {
    toast.error('Security check failed. Please sign in again.');
  } catch {
    // ignore toast failures
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  try {
    if (typeof window !== 'undefined') {
      if (window.localStorage) window.localStorage.clear();
      if (window.sessionStorage) window.sessionStorage.clear();
      window.location.assign('/login');
    }
  } catch {
    // ignore navigation/storage failures
  }

  throw new Error('SECURITY_OWNERSHIP_VIOLATION');
}

/**
 * Assert that a row is owned by the given company.
 * The check is heuristic and looks at common company id fields:
 * - company_id
 * - buyer_company_id
 * - seller_company_id
 */
export async function assertRowOwnedByCompany(row, companyId, context = 'unknown') {
  if (!row || !companyId) return;

  const candidates = [
    row.company_id,
    row.buyer_company_id,
    row.seller_company_id,
    row.buyer_company?.id,
    row.seller_company?.id,
  ].filter(Boolean);

  if (candidates.length === 0) {
    // No ownership hints – do not block, but log in dev.
    if (import.meta.env.DEV) {
      console.warn('[SECURITY] assertRowOwnedByCompany: no ownership fields found', {
        context,
        row,
      });
    }
    return;
  }

  const isOwned = candidates.some((value) => value === companyId);
  if (!isOwned) {
    await handleOwnershipViolation({ context, companyId, row });
  }
}

/**
 * Assert that a row is owned by the given user.
 * Looks at common fields:
 * - user_id
 * - owner_id
 * - profile_id
 * - id (when the row itself represents the user/profile)
 */
export async function assertRowOwnedByUser(row, userId, context = 'unknown') {
  if (!row || !userId) return;

  const candidates = [
    row.user_id,
    row.owner_id,
    row.profile_id,
    row.id,
  ].filter(Boolean);

  if (candidates.length === 0) {
    if (import.meta.env.DEV) {
      console.warn('[SECURITY] assertRowOwnedByUser: no ownership fields found', {
        context,
        row,
      });
    }
    return;
  }

  const isOwned = candidates.some((value) => value === userId);
  if (!isOwned) {
    await handleOwnershipViolation({ context, userId, row });
  }
}


