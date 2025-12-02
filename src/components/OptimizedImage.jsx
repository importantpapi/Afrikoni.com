import React, { useState, useEffect, useRef } from 'react';

/**
 * Optimized image component with Intersection Observer lazy loading, 
 * error handling, and progressive loading
 */
export default function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  placeholder = '/placeholder.png',
  width,
  height,
  sizes,
  srcSet,
  priority = false, // If true, load immediately without lazy loading
  ...props 
}) {
  const [imageSrc, setImageSrc] = useState(priority ? src : placeholder);
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !src) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
      observer.disconnect();
    };
  }, [priority, src]);

  // Load image when in view
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      setImageSrc(placeholder);
    };
  }, [isInView, src, placeholder]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt || ''}
      width={width}
      height={height}
      sizes={sizes}
      srcSet={srcSet}
      className={`${className} ${
        isLoading ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'
      } transition-all duration-300`}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...props}
    />
  );
}

