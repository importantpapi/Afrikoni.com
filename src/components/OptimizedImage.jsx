import React, { useState, useEffect, useRef } from 'react';
import { getOptimizedImageUrl, generateSrcSet, generateSizes, supportsWebP } from '@/utils/imageOptimization';

/**
 * Optimized image component with Intersection Observer lazy loading, 
 * error handling, progressive loading, and WebP support
 */
export default function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  placeholder = '/placeholder.png',
  width,
  height,
  sizes: customSizes,
  srcSet: customSrcSet,
  priority = false, // If true, load immediately without lazy loading
  quality = 80,
  responsive = true, // Generate responsive srcSet automatically
  ...props 
}) {
  const optimizedSrc = getOptimizedImageUrl(src, { width, height, quality });
  const [imageSrc, setImageSrc] = useState(priority ? optimizedSrc : placeholder);
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);
  
  // Generate responsive srcSet if not provided and responsive is true
  const finalSrcSet = customSrcSet || (responsive && src ? generateSrcSet(src) : undefined);
  const finalSizes = customSizes || (responsive ? generateSizes() : undefined);

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
    if (!isInView || !optimizedSrc) return;

    const img = new Image();
    img.src = optimizedSrc;
    
    img.onload = () => {
      setImageSrc(optimizedSrc);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      // Fallback to original src if optimized fails
      if (optimizedSrc !== src) {
        const fallbackImg = new Image();
        fallbackImg.src = src;
        fallbackImg.onload = () => {
          setImageSrc(src);
          setIsLoading(false);
        };
        fallbackImg.onerror = () => {
          setHasError(true);
          setIsLoading(false);
          setImageSrc(placeholder);
        };
      } else {
        setHasError(true);
        setIsLoading(false);
        setImageSrc(placeholder);
      }
    };
  }, [isInView, optimizedSrc, src, placeholder]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt || ''}
      width={width}
      height={height}
      sizes={finalSizes}
      srcSet={finalSrcSet}
      className={`${className} ${
        isLoading ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'
      } transition-all duration-300`}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...props}
    />
  );
}

