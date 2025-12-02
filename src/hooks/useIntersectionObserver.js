import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for Intersection Observer API
 * Useful for lazy loading, infinite scroll, animations on scroll
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsIntersecting(entry.isIntersecting);
          if (entry.isIntersecting && !hasIntersected) {
            setHasIntersected(true);
          }
        });
      },
      {
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0.1,
        ...options
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
      observer.disconnect();
    };
  }, [options.rootMargin, options.threshold, hasIntersected]);

  return [elementRef, isIntersecting, hasIntersected];
}

