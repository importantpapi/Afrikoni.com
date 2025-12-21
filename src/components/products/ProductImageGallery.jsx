import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ProductImageGallery component
 * @param {Array} images - Array of image URLs or objects with {url, alt_text}
 * @param {string} productTitle - Product title for fallback alt text
 */
export default function ProductImageGallery({ images = [], productTitle = 'Product' }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-afrikoni-cream rounded-xl flex items-center justify-center">
        <p className="text-afrikoni-deep/70">No images available</p>
      </div>
    );
  }

  // Normalize images array - handle both URL strings and objects
  const normalizedImages = images.map(img => {
    if (typeof img === 'string') {
      return { url: img, alt_text: `${productTitle} image` };
    }
    return {
      url: img.url || img,
      alt_text: img.alt_text || img.alt || `${productTitle} image`
    };
  });

  const getImageUrl = (img) => {
    return typeof img === 'string' ? img : (img.url || img);
  };

  const getImageAlt = (img, index) => {
    if (typeof img === 'string') {
      return `${productTitle} - Image ${index + 1}`;
    }
    return img.alt_text || img.alt || `${productTitle} - Image ${index + 1}`;
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % normalizedImages.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + normalizedImages.length) % normalizedImages.length);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div
          className="relative aspect-square bg-afrikoni-cream rounded-xl overflow-hidden group cursor-pointer"
          onTouchStart={() => setShowLightbox(true)}
          onClick={() => setShowLightbox(true)}
        >
          <img
            src={getImageUrl(normalizedImages[selectedImage])}
            alt={getImageAlt(normalizedImages[selectedImage], selectedImage + 1)}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          
          {/* Click to view indicator */}
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm">
            <ZoomIn className="w-4 h-4" />
            <span className="text-xs md:text-sm">Click to view</span>
          </div>

          {/* Navigation Arrows - Always visible on mobile, hover on desktop */}
          {normalizedImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white p-2.5 md:p-2.5 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation active:scale-95 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white p-2.5 md:p-2.5 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation active:scale-95 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {normalizedImages.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-2 md:gap-3">
            {normalizedImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all touch-manipulation active:scale-95 min-w-[64px] min-h-[64px] ${
                  selectedImage === idx
                    ? 'border-afrikoni-gold ring-2 ring-afrikoni-gold/20'
                    : 'border-afrikoni-gold/20 hover:border-afrikoni-gold/40 active:border-afrikoni-gold/60'
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                <img
                  src={getImageUrl(normalizedImages[idx])}
                  alt={getImageAlt(normalizedImages[idx], idx + 1)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLightbox(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-7xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={getImageUrl(normalizedImages[selectedImage])}
                alt={getImageAlt(normalizedImages[selectedImage], selectedImage + 1)}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
              
              <button
                onClick={() => setShowLightbox(false)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white p-2.5 md:p-2 rounded-full touch-manipulation active:scale-95 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                aria-label="Close lightbox"
              >
                <X className="w-6 h-6" />
              </button>

              {normalizedImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white p-2.5 md:p-2 rounded-full touch-manipulation active:scale-95 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 active:bg-black/80 text-white p-2.5 md:p-2 rounded-full touch-manipulation active:scale-95 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {normalizedImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          selectedImage === idx ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

