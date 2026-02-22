import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getPostLoginRedirect } from '@/lib/post-login-redirect';
import { supabase } from '@/api/supabaseClient';

vi.mock('@/api/supabaseClient', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

describe('getPostLoginRedirect', () => {
  const mockedSupabase = supabase as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects users without a company to onboarding', async () => {
    mockedSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({
            data: { company_id: null },
            error: null,
          }),
        }),
      }),
    });
    const path = await getPostLoginRedirect('user-id');
    expect(path).toBe('/onboarding/company');
  });

  it('redirects users with a company to dashboard', async () => {
    mockedSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({
            data: { company_id: 'company-123' },
            error: null,
          }),
        }),
      }),
    });
    const path = await getPostLoginRedirect('user-id');
    expect(path).toBe('/dashboard');
  });

  it('falls back to onboarding on query error', async () => {
    mockedSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'query failed' },
          }),
        }),
      }),
    });
    const path = await getPostLoginRedirect('user-id');
    expect(path).toBe('/onboarding/company');
  });

  it('falls back to onboarding when no profile is returned', async () => {
    mockedSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
    });
    const path = await getPostLoginRedirect('user-id');
    expect(path).toBe('/onboarding/company');
  });
});

