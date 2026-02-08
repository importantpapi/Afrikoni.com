/**
 * Product Card Component
 * Redesigned for Afrikoni UX Upgrade (Phase 1.4)
 * Mobile: 2 columns, Desktop: 4 columns
 * Edge-to-edge images, verified badge, country flag overlays
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, MapPin, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import OptimizedImage from '@/components/OptimizedImage';
import { getPrimaryImageFromProduct } from '@/utils/productImages';
import Price from '@/components/shared/ui/Price';
import VerificationBadge from '@/components/shared/ui/VerificationBadge';

// Country name to flag mapping
const COUNTRY_FLAGS = {
  'Nigeria': '🇳🇬', 'Kenya': '🇰🇪', 'Ghana': '🇬🇭', 'South Africa': '🇿🇦',
  'Ethiopia': '🇪🇹', 'Tanzania': '🇹🇿', 'Uganda': '🇺🇬', 'Egypt': '🇪🇬',
  'Morocco': '🇲🇦', 'Algeria': '🇩🇿', 'Tunisia': '🇹🇳', 'Senegal': '🇸🇳',
  "Côte d'Ivoire": '🇨🇮', 'Ivory Coast': '🇨🇮', 'Cameroon': '🇨🇲', 'Zimbabwe': '🇿🇼',
  'Mozambique': '🇲🇿', 'Madagascar': '🇲🇬', 'Mali': '🇲🇱', 'Burkina Faso': '🇧🇫',
  'Niger': '🇳🇪', 'Rwanda': '🇷🇼', 'Benin': '🇧🇯', 'Guinea': '🇬🇳', 'Chad': '🇹🇩',
  'Zambia': '🇿🇲', 'Malawi': '🇲🇼', 'Somalia': '🇸🇴', 'Burundi': '🇧🇮',
  'Togo': '🇹🇬', 'Sierra Leone': '🇸🇱', 'Libya': '🇱🇾', 'Mauritania': '🇲🇷',
  'Eritrea': '🇪🇷', 'Gambia': '🇬🇲', 'Botswana': '🇧🇼', 'Namibia': '🇳🇦',
  'Gabon': '🇬🇦', 'Lesotho': '🇱🇸', 'Guinea-Bissau': '🇬🇼', 'Liberia': '🇱🇷',
  'Central African Republic': '🇨🇫', 'Congo': '🇨🇬', 'DR Congo': '🇨🇩',
  'São Tomé and Príncipe': '🇸🇹', 'Seychelles': '🇸🇨', 'Cape Verde': '🇨🇻',
  'Comoros': '🇰🇲', 'Mauritius': '🇲🇺', 'Equatorial Guinea': '🇬🇶',
  'Eswatini': '🇸🇿', 'South Sudan': '🇸🇸', 'Angola': '🇦🇴'
};

const getCountryFlag = (countryName) => {
  if (!countryName) return '';
  return COUNTRY_FLAGS[countryName] || '';
};

export default function ProductCard({ product, priority = false }) {
  const imageUrl = getPrimaryImageFromProduct(product);
  const countryName = product.country_of_origin || product.companies?.country || '';
  const flag = getCountryFlag(countryName);
  const verificationStatus = product.companies?.verification_status || 'unverified';
  const isVerified = verificationStatus === 'verified' || verificationStatus === 'VERIFIED';
  
  // Format MOQ
  const moqDisplay = product.min_order_quantity
    ? `MOQ: ${product.min_order_quantity} ${product.moq_unit || product.unit || 'units'}`
    : product.moq
    ? `MOQ: ${product.moq} ${product.unit || 'units'}`
    : 'MOQ: Contact supplier';

  return (
    <Link
      to={`/product?id=${product.id}`}
      className="block h-full"
    >
      <Card className="border border-afrikoni-gold/10 hover:border-afrikoni-gold/30 transition-all h-full bg-white overflow-hidden group">
        {/* Image - Edge-to-edge, square aspect ratio */}
        <div className="relative aspect-square bg-afrikoni-cream overflow-hidden">
          {imageUrl ? (
            <OptimizedImage
              src={imageUrl}
              alt={product.name || product.title || 'Product'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              width={250}
              height={250}
              priority={priority}
              quality={85}
              placeholder="/product-placeholder.svg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-afrikoni-gold/50" />
            </div>
          )}
          
          {/* Verification Badge Overlay - Top-right */}
          {isVerified ? (
            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-full shadow-sm">
              <VerificationBadge status="VERIFIED" size="xs" showLabel variant="badge" />
            </div>
          ) : verificationStatus === 'PENDING' ? (
            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-full shadow-sm">
              <VerificationBadge status="PENDING" size="xs" variant="badge" />
            </div>
          ) : null}

          {/* Country Flag Badge Overlay - Bottom-left */}
          {flag && (
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1 flex items-center gap-1">
              <span className="text-sm">{flag}</span>
              {countryName && countryName.length <= 12 && (
                <span className="text-[10px] text-white font-medium">{countryName}</span>
              )}
            </div>
          )}
        </div>

        {/* Content - Minimal padding */}
        <CardContent className="p-3">
          {/* ✅ KERNEL-SCHEMA ALIGNMENT: Prioritize 'name' over 'title' (DB schema uses 'name') */}
          {/* Product Name - 2 lines max, bold */}
          <h3 className="text-sm md:text-base font-semibold text-afrikoni-chestnut mb-2 line-clamp-2 leading-tight min-h-[40px]">
            {product.name || product.title}
          </h3>

          {/* MOQ - Small, gray */}
          <p className="text-[10px] md:text-xs text-afrikoni-deep/60 mb-2">
            {moqDisplay}
          </p>

          {/* Price or RFQ - Compact */}
          <div className="mt-auto">
            {product.price_min || product.price ? (
              <Price
                amount={product.price_min || product.price}
                fromCurrency={product.currency || 'USD'}
                unit={product.unit || 'kg'}
                className="text-sm md:text-base font-bold text-afrikoni-gold"
              />
            ) : (
              <span className="text-xs md:text-sm text-afrikoni-chestnut font-medium">Request Quote</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

