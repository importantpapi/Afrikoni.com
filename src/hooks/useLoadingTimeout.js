/**
 * Hook to prevent infinite loading states
 * Automatically clears loading state after a timeout
 */
import { useEffect, useRef } from 'react';

export function useLoadingTimeout(isLoading, setIsLoading, timeoutMs = 10000) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      // Set timeout to force loading to false
      timeoutRef.current = setTimeout(() => {
        console.warn(`[useLoadingTimeout] Loading state stuck after ${timeoutMs}ms - forcing to false`);
        setIsLoading(false);
      }, timeoutMs);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else {
      // Clear timeout if loading becomes false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isLoading, setIsLoading, timeoutMs]);
}

