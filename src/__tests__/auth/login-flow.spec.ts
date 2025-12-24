import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getPostLoginRedirect } from '@/lib/post-login-redirect';
import { getUserRoles, getBusinessProfile, getLastSelectedRole } from '@/lib/supabase-auth-helpers';
import { supabase } from '@/api/supabaseClient';

vi.mock('@/api/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    },
  };
});

vi.mock('@/lib/supabase-auth-helpers', () => ({
  getUserRoles: vi.fn(),
  getBusinessProfile: vi.fn(),
  getLastSelectedRole: vi.fn(),
}));

describe('getPostLoginRedirect', () => {
  const mockedSupabase = supabase as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unverified users to verify-email-prompt', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({
      data: { user: { email_confirmed_at: null } },
    });
    (getUserRoles as any).mockResolvedValue(['buyer']);

    const path = await getPostLoginRedirect('user-id');
    expect(path).toBe('/verify-email-prompt');
  });

  it('redirects single-role users directly to their dashboard', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({
      data: { user: { email_confirmed_at: '2024-01-01T00:00:00Z' } },
    });
    (getUserRoles as any).mockResolvedValue(['buyer']);

    const path = await getPostLoginRedirect('user-id');
    expect(path).toBe('/buyer/dashboard');
  });

  it('redirects multi-role users to select-role when no last role', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({
      data: { user: { email_confirmed_at: '2024-01-01T00:00:00Z' } },
    });
    (getUserRoles as any).mockResolvedValue(['buyer', 'seller']);
    (getLastSelectedRole as any).mockResolvedValue(null);

    const path = await getPostLoginRedirect('user-id');
    expect(path).toBe('/select-role');
  });

  it('redirects seller/logistics with pending business profile to account-pending', async () => {
    mockedSupabase.auth.getUser.mockResolvedValue({
      data: { user: { email_confirmed_at: '2024-01-01T00:00:00Z' } },
    });
    (getUserRoles as any).mockResolvedValue(['seller']);
    (getBusinessProfile as any).mockResolvedValue({
      data: { verification_status: 'pending' },
    });

    const path = await getPostLoginRedirect('user-id');
    expect(path).toBe('/account-pending');
  });
});


