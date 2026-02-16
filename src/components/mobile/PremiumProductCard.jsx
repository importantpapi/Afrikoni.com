/**
 * PREMIUM PRODUCT CARD (MOBILE)
 * Hermès Catalogue Standard
 * 
 * Luxury catalog card feel:
 * - Soft, elegant
 * - Minimal text clutter
 * - Clear hierarchy
 * - Premium spacing
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, MapPin } from 'lucide-react';
import OptimizedImage from '@/components/OptimizedImage';
import { getPrimaryImageFromProduct } from '@/utils/productImages';
import Price from '@/components/shared/ui/Price';
import { cn } from '@/lib/utils';

// Country flags
const COUNTRY_FLAGS = {
  'Nigeria': '🇳🇬', 'Kenya': '🇰🇪', 'Ghana': '🇬🇭', 'South Africa': '🇿🇦',
  'Ethiopia': '🇪🇹', 'Tanzania': '🇹🇿', 'Morocco': '🇲🇦', 'Egypt': '🇪🇬',
  'Senegal': '🇸🇳', 'Côte d\'Ivoire': '🇨🇮', 'Ivory Coast': '🇨🇮'
};

export default function PremiumProductCard({ product, priority = false }) {
  const imageUrl = getPrimaryImageFromProduct(product);
  const countryName = product.country_of_origin || product.companies?.country || '';
  const flag = COUNTRY_FLAGS[countryName] || '🌍';
  const isVerified = product.companies?.verification_status === 'verified';

  return (
    <Link to={`/product?id=${product.id}`} className="block">
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-shadow duration-300"
      >
        {/* Image Zone */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-afrikoni-ivory/30 to-afrikoni-warm-beige/20 overflow-hidden">
          {imageUrl ? (
            <>
              <OptimizedImage
                src={imageUrl}
                alt={product.name || product.title || 'Product'}
                className="w-full h-full object-cover"
                width={400}
                height={300}
                priority={priority}
                quality={90}
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-os-accent/10 flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
                <p className="text-xs text-afrikoni-deep/40 font-medium">Image pending</p>
              </div>
            </div>
          )}

          {/* Verification Badge (Top Right) */}
          {isVerified && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-os-accent/20 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-os-accent" strokeWidth={3} />
              </div>
              <span className="text-[10px] font-bold text-os-accent uppercase tracking-wide">
                Verified
              </span>
            </div>
          )}
        </div>

        {/* Content Zone */}
        <div className="p-4">
          {/* Origin (Subtle, top) */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-base">{flag}</span>
            <span className="text-xs text-afrikoni-deep/50 font-medium">
              {countryName || 'Africa'}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="text-base font-semibold text-afrikoni-deep leading-tight mb-3 line-clamp-2">
            {product.name || product.title}
          </h3>

          {/* Price or RFQ */}
          <div className="flex items-baseline justify-between">
            {product.price_min || product.price ? (
              <div className="flex flex-col">
                <span className="text-[10px] text-afrikoni-deep/40 uppercase tracking-wide mb-0.5">
                  From
                </span>
                <Price
                  amount={product.price_min || product.price}
                  fromCurrency={product.currency || 'USD'}
                  unit={product.unit || 'kg'}
                  className="text-lg font-bold text-afrikoni-deep"
                />
              </div>
            ) : (
              <span className="text-sm font-semibold text-os-accent">
                Request Quote
              </span>
            )}

            {/* Action Arrow */}
            <div className="w-8 h-8 rounded-full bg-os-accent/10 flex items-center justify-center">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="text-os-accent"
              >
                <path
                  d="M2 6h8M7 3l3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
