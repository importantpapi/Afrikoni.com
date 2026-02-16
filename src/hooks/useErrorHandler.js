import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

/**
 * Reusable error handler hook with retry functionality
 * Provides consistent error handling across the app
 */
export function useErrorHandler() {
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((error, options = {}) => {
    const {
      message = 'Something went wrong. Please try again.',
      showToast = true,
      logError = true,
      onRetry = null,
      silent = false
    } = options;

    // Log error in development
    if (logError && import.meta.env.DEV) {
      console.error('Error:', error);
    }

    // Set error state
    if (!silent) {
      setError({
        message: error?.message || message,
        originalError: error,
        onRetry
      });
    }

    // Show toast notification
    // GLOBAL FILTER: Suppress email confirmation errors
    if (showToast && !silent) {
      // Check if this is an email confirmation error
      const errorMessage = error?.message || message || '';
      const isEmailError = 
        errorMessage.toLowerCase().includes('confirmation email') ||
        (errorMessage.toLowerCase().includes('error sending') && errorMessage.toLowerCase().includes('email')) ||
        (errorMessage.toLowerCase().includes('email delivery') && errorMessage.toLowerCase().includes('error'));
      
      if (isEmailError) {
        // Suppress email errors - they are non-fatal
        console.warn('[AUTH] Suppressed email confirmation error:', errorMessage);
        return; // Don't show toast, don't set error state
      }
      
      toast.error(message, {
        duration: 5000,
        action: onRetry ? {
          label: 'Retry',
          onClick: async () => {
            setIsRetrying(true);
            try {
              await onRetry();
              toast.success('Operation successful');
            } catch (retryError) {
              handleError(retryError, { ...options, showToast: true });
            } finally {
              setIsRetrying(false);
            }
          }
        } : undefined
      });
    }

    // Send to error tracking (Sentry)
    if (!silent && import.meta.env.PROD) {
      import('@/utils/sentry').then(({ captureException }) => {
        captureException(error, { 
          context: options.context || {},
          tags: options.tags || {}
        });
      }).catch(() => {
        // Silently fail if Sentry is not available
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(async (retryFn) => {
    if (!retryFn) return;
    
    setIsRetrying(true);
    clearError();
    
    try {
      await retryFn();
      toast.success('Operation successful');
    } catch (retryError) {
      handleError(retryError, { onRetry: retryFn });
    } finally {
      setIsRetrying(false);
    }
  }, [handleError, clearError]);

  return {
    error,
    isRetrying,
    handleError,
    clearError,
    retry
  };
}

/**
 * Error display component with retry button
 */
export function ErrorDisplay({ error, onRetry, className = '' }) {
  if (!error) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-os-sm font-semibold text-red-800 mb-1">Error</h3>
          <p className="text-os-sm text-red-700">{error.message || 'An error occurred'}</p>
          {onRetry && (
            <button
              onClick={() => onRetry()}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-os-sm font-medium text-red-800 bg-red-100 hover:bg-red-200 rounded-md transition-colors min-h-[44px] min-w-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

