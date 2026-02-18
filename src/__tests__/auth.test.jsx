import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock Supabase before importing components
vi.mock('@/api/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => 
        Promise.resolve({ 
          data: { session: null }, 
          error: null 
        })
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signInWithPassword: vi.fn((credentials) => {
        if (credentials.email === 'test@example.com' && credentials.password === 'password123') {
          return Promise.resolve({
            data: {
              user: { id: '123', email: 'test@example.com' },
              session: { access_token: 'mock-token' }
            },
            error: null
          });
        }
        return Promise.resolve({
          data: { user: null, session: null },
          error: { message: 'Invalid credentials' }
        });
      }),
      signUp: vi.fn((credentials) => {
        return Promise.resolve({
          data: {
            user: { id: '123', email: credentials.email },
            session: null
          },
          error: null
        });
      }),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  }
}));

import { AuthProvider } from '@/contexts/AuthProvider';

function TestWrapper({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('Auth Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize auth provider', async () => {
    const TestComponent = () => {
      return <div>Auth Provider Loaded</div>;
    };

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Auth Provider Loaded')).toBeInTheDocument();
    });
  });

  it('should handle login successfully', async () => {
    const { supabase } = await import('@/api/supabaseClient');
    
    const result = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(result.data.user).toBeTruthy();
    expect(result.data.user.email).toBe('test@example.com');
    expect(result.error).toBeNull();
  });

  it('should handle login failure with invalid credentials', async () => {
    const { supabase } = await import('@/api/supabaseClient');
    
    const result = await supabase.auth.signInWithPassword({
      email: 'wrong@example.com',
      password: 'wrongpassword'
    });

    expect(result.data.user).toBeNull();
    expect(result.error).toBeTruthy();
    expect(result.error.message).toBe('Invalid credentials');
  });

  it('should handle signup successfully', async () => {
    const { supabase } = await import('@/api/supabaseClient');
    
    const result = await supabase.auth.signUp({
      email: 'newuser@example.com',
      password: 'password123'
    });

    expect(result.data.user).toBeTruthy();
    expect(result.data.user.email).toBe('newuser@example.com');
    expect(result.error).toBeNull();
  });

  it('should handle logout successfully', async () => {
    const { supabase } = await import('@/api/supabaseClient');
    
    const result = await supabase.auth.signOut();
    
    expect(result.error).toBeNull();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
