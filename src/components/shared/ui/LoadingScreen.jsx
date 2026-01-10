/**
 * Unified Loading Screen Component
 * Used across the app for consistent loading states during auth transitions
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/shared/ui/Logo';
import { useAuth } from '@/contexts/AuthProvider';

/**
 * Full-screen loading indicator shown during app initialization
 */
export const LoadingScreen = ({ 
  message = 'Loading...', 
  showLogo = true,
  size = 'lg'
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-afrikoni-offwhite via-afrikoni-cream to-afrikoni-offwhite flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center">
        {showLogo && (
          <div className="flex justify-center mb-6">
            <Logo type="full" size={size} link={false} showTagline={false} />
          </div>
        )}
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-afrikoni-gold" />
        <p className="text-afrikoni-deep">{message}</p>
      </div>
    </div>
  );
};

/**
 * Auth-aware loading guard
 * Shows loading screen until auth is ready
 */
export const AuthLoadingGuard = ({ children }) => {
  const { authReady } = useAuth();

  if (!authReady) {
    return <LoadingScreen message="Connecting..." />;
  }

  return children;
};

export default LoadingScreen;
