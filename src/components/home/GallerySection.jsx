import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Gallery section with lazy-loaded image grid
 * Optimized for mobile with lightbox view
 */
export default function GallerySection() {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(null);

  // Curated gallery images - limited selection for better presentation
  const galleryImages = [
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1522204523234-8729aa67e2e6?q=80&w=800&auto=format&fit=crop',
      alt: 'African business professionals networking at Afrikoni',
      title: 'Business Networking'
    },
    {
      id: 2,
      src: 'https://images.unsplash.com/photo-1552664730-d307ca8849d1?q=80&w=800&auto=format&fit=crop',
      alt: 'African marketplace and B2B trade platform',
      title: 'Marketplace'
    },
    {
      id: 3,
      src: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop',
      alt: 'Shipping and logistics solutions across Africa',
      title: 'Logistics'
    },
    {
      id: 4,
      src: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=800&auto=format&fit=crop',
      alt: 'Verified African products and goods',
      title: 'Products'
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-afrikoni-chestnut mb-4">
            {t('gallery.title') || 'Gallery'}
          </h2>
          <p className="text-lg text-afrikoni-deep max-w-2xl mx-auto">
            {t('gallery.subtitle') || 'See Afrikoni in action across Africa'}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {galleryImages.map((image, idx) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 grayscale-[0.1] brightness-[0.95] contrast-[1.05] saturate-[0.9]"
                style={{
                  filter: 'grayscale(10%) brightness(95%) contrast(105%) saturate(90%)'
                }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <p className="font-semibold text-sm">{image.title}</p>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/90 rounded-full p-2">
                  <ZoomIn className="w-4 h-4 text-afrikoni-chestnut" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white hover:text-afrikoni-gold transition-colors z-10"
                aria-label="Close lightbox"
              >
                <X className="w-8 h-8" />
              </motion.button>
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}


