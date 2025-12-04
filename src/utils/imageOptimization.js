/**
 * Image Optimization Utilities
 * 
 * Provides functions for image optimization, format conversion, and CDN URLs
 */

/**
 * Get optimized image URL with WebP support
 * Falls back to original if WebP not available
 */
export function getOptimizedImageUrl(originalUrl, options = {}) {
  if (!originalUrl) return null;
  
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    fallback = true
  } = options;

  // If URL is from Supabase Storage, we can use transformations
  if (originalUrl.includes('supabase.co/storage')) {
    const url = new URL(originalUrl);
    
    // Supabase Storage supports image transformations via query params
    const params = new URLSearchParams();
    if (width) params.append('width', width);
    if (height) params.append('height', height);
    if (quality) params.append('quality', quality);
    
    if (params.toString()) {
      url.search = params.toString();
      return url.toString();
    }
  }

  // For other URLs, return as-is (CDN or external service should handle optimization)
  return originalUrl;
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(baseUrl, sizes = [400, 800, 1200, 1600]) {
  if (!baseUrl) return '';
  
  return sizes
    .map(size => {
      const optimizedUrl = getOptimizedImageUrl(baseUrl, { width: size });
      return `${optimizedUrl} ${size}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(breakpoints = {
  mobile: '100vw',
  tablet: '50vw',
  desktop: '33vw'
}) {
  return `(max-width: 640px) ${breakpoints.mobile}, (max-width: 1024px) ${breakpoints.tablet}, ${breakpoints.desktop}`;
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP() {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Get best image format for browser
 */
export function getBestImageFormat(originalUrl) {
  if (supportsWebP()) {
    return getOptimizedImageUrl(originalUrl, { format: 'webp' });
  }
  return originalUrl;
}

/**
 * Preload critical images
 */
export function preloadImage(src) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Lazy load image with Intersection Observer
 */
export function lazyLoadImage(imgElement, src, placeholder = '/placeholder.png') {
  if (!imgElement || !src) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: '50px',
      threshold: 0.01
    }
  );

  observer.observe(imgElement);
  imgElement.src = placeholder;
  imgElement.classList.add('lazy');
}

