/**
 * PHASE 5B: SpinnerWithTimeout - Loading spinner with capability-aware timeout
 * 
 * GUARANTEES:
 * - Shows spinner until ready === true OR timeout
 * - If ready === true, timeout NEVER triggers
 * - After timeout (if ready !== true), shows clear error message
 * - NEVER loops infinitely
 */

import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';

export function SpinnerWithTimeout({ 
  message = 'Loading...',
  timeoutMs = 15000, // ✅ TOTAL VIBRANIUM RESET: Increased to 15s for rescue timeout
  ready = false, // PHASE 5B: If true, timeout NEVER triggers
  onRetry,
  className = ''
}) {
  const [timedOut, setTimedOut] = useState(false);

  // PHASE 5B: Cancel timeout if ready === true
  useEffect(() => {
    // ✅ ENHANCED: Defensive check - if ready is explicitly true, cancel timeout immediately
    if (ready === true) {
      console.log('[SpinnerWithTimeout] Ready - canceling timeout');
      setTimedOut(false); // Reset timeout state when ready
      return; // No timer needed
    }

    // Only set timer if NOT ready (ready === false or undefined)
    // ✅ ENHANCED: Ensure timeoutMs is valid (default to 10000ms if invalid)
    const validTimeout = typeof timeoutMs === 'number' && timeoutMs > 0 ? timeoutMs : 10000;
    
    const timer = setTimeout(() => {
      // ✅ ENHANCED: Double-check ready state before timing out
      if (!ready) {
        setTimedOut(true);
        console.warn('[SpinnerWithTimeout] Loading timeout after', validTimeout, 'ms (ready was', ready, ')');
      }
    }, validTimeout);

    return () => clearTimeout(timer);
  }, [timeoutMs, ready]); // PHASE 5B: Depend on ready to cancel timeout

  // PHASE 5B: If ready, don't show timeout message (component should unmount instead)
  if (ready) {
    // Ready state - don't render spinner, let parent render content
    return null;
  }

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
            {/* ✅ TOTAL VIBRANIUM RESET: Add Force Reload button for rescue timeout */}
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Force Reload
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

