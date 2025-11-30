import React, { useState } from 'react';

/**
 * Optimized image component with lazy loading and error handling
 */
export default function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  placeholder = '/placeholder.png',
  ...props 
}) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    if (!src) return;

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
  }, [src, placeholder]);

  return (
    <img
      src={imageSrc}
      alt={alt || ''}
      className={`${className} ${isLoading ? 'opacity-50' : 'opacity-100'} transition-opacity`}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}

