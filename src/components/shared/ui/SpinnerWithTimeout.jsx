/**
 * SpinnerWithTimeout - Loading spinner with mandatory timeout
 * 
 * GUARANTEES:
 * - Shows spinner for max 5 seconds
 * - After timeout, shows clear error message
 * - NEVER loops infinitely
 */

import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';

export function SpinnerWithTimeout({ 
  message = 'Loading...',
  timeoutMs = 10000, // Increased from 5000ms to 10000ms for initial page loads
  onRetry,
  className = ''
}) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
      console.warn('[SpinnerWithTimeout] Loading timeout after', timeoutMs, 'ms');
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [timeoutMs]);

  if (timedOut) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-afrikoni-offwhite ${className}`}>
        <Card className="p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-afrikoni-text-dark mb-2">
            Loading took too long
          </h2>
          <p className="text-afrikoni-text-dark/70 mb-6">
            This page is taking longer than expected to load. Please try refreshing the page.
          </p>
          <div className="flex gap-3 justify-center">
            {onRetry && (
              <Button
                onClick={onRetry}
                className="bg-afrikoni-gold hover:bg-afrikoni-gold/90"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-afrikoni-offwhite ${className}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold mx-auto mb-4" />
        <p className="text-afrikoni-text-dark/70">{message}</p>
      </div>
    </div>
  );
}

