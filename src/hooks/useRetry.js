/**
 * ✅ TOTAL VIBRANIUM RESET: Generic retry hook for data fetching
 * Provides a simple 3-try retry mechanism for all data-fetching hooks
 * 
 * Usage:
 *   const { executeWithRetry, isRetrying } = useRetry();
 *   
 *   const loadData = async () => {
 *     await executeWithRetry(async () => {
 *       const { data, error } = await supabase.from('table').select();
 *       if (error) throw error;
 *       setData(data);
 *     });
 *   };
 */

import { useState, useCallback } from 'react';

export function useRetry(maxRetries = 3, initialDelay = 1000) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(async (fn, options = {}) => {
    const { 
      onRetryAttempt = null,
      onRetryFailed = null,
      shouldRetry = (error) => {
        // Retry on network errors, timeouts, and transient Supabase errors
        const errorCode = error?.code || '';
        const errorMessage = (error?.message || '').toLowerCase();
        
        // Network errors
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          return true;
        }
        
        // Transient Supabase errors
        if (['PGRST301', 'PGRST204', 'PGRST205'].includes(errorCode)) {
          return true;
        }
        
        // Timeout errors
        if (errorMessage.includes('timeout')) {
          return true;
        }
        
        return false;
      }
    } = options;

    let lastError = null;
    setIsRetrying(true);
    setRetryCount(0);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        setIsRetrying(false);
        setRetryCount(0);
        return result;
      } catch (error) {
        lastError = error;
        setRetryCount(attempt + 1);

        // Check if we should retry this error
        if (!shouldRetry(error)) {
          setIsRetrying(false);
          setRetryCount(0);
          throw error; // Don't retry non-retryable errors
        }

        // Don't retry on last attempt
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
          if (onRetryAttempt) {
            onRetryAttempt(attempt + 1, maxRetries, delay);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Last attempt failed
          setIsRetrying(false);
          setRetryCount(0);
          if (onRetryFailed) {
            onRetryFailed(lastError, maxRetries);
          }
          throw lastError;
        }
      }
    }

    setIsRetrying(false);
    setRetryCount(0);
    throw lastError;
  }, [maxRetries, initialDelay]);

  return {
    executeWithRetry,
    isRetrying,
    retryCount
  };
}
