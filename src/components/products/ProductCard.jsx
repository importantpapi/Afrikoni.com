/**
 * Product Card Component
 * Redesigned for Afrikoni UX Upgrade (Phase 1.4)
 * Mobile: 2 columns, Desktop: 4 columns
 * Edge-to-edge images, verified badge, country flag overlays
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, MapPin, Package, Zap, Truck, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import OptimizedImage from '@/components/OptimizedImage';
import { getPrimaryImageFromProduct } from '@/utils/productImages';
import Price from '@/components/shared/ui/Price';
import VerificationBadge from '@/components/shared/ui/VerificationBadge';
import { cn } from '@/lib/utils';

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
      className="block h-full group"
    >
      <Card className="border-none bg-gradient-to-br from-afrikoni-ivory to-white overflow-hidden transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1 rounded-2xl relative shadow-[0_4px_16px_rgba(0,0,0,0.08)] h-full flex flex-col">
        {/* IMAGE ZONE - Visual First (Premium Luxury) */}
        <div className="relative h-48 overflow-hidden rounded-t-2xl bg-gradient-to-br from-afrikoni-ivory/30 to-afrikoni-warm-beige/20">
          {imageUrl ? (
            <>
              <OptimizedImage
                src={imageUrl}
                alt={product.name || product.title || 'Product'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                width={400}
                height={300}
                priority={priority}
                quality={95}
              />
              <div className="absolute inset-0 bg-black/5" />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-afrikoni-ivory/50 to-afrikoni-warm-beige/30 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjciIG51bU9jdGF2ZXM9IjQiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIuNSIvPjwvc3ZnPg==')]" />
              <Package className="w-12 h-12 text-os-accent/30 mb-3 relative z-10" />
              <p className="text-xs font-semibold text-os-text-secondary/40 relative z-10">Product Image Pending</p>
            </div>
          )}
        </div>

        {/* CONTENT ZONE - Premium Hierarchy */}
        <CardContent className="p-5 flex flex-col flex-1 bg-transparent">
          {/* Trust Layer - Always Visible (Luxury Differentiator) */}
          <div className="flex items-center gap-2 text-xs text-os-text-secondary mb-3">
            {isVerified && (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-3.5 bg-os-accent/10 rounded-full flex items-center justify-center border border-os-accent/30">
                    <Check className="w-2 h-2 text-os-accent" />
                  </div>
                  <span className="text-[10px] font-semibold text-os-accent">Verified</span>
                </div>
                <span>•</span>
              </>
            )}
            <span className="flex items-center gap-1">
              {flag && <span>{flag}</span>}
              <span className="text-[10px] font-medium">{countryName || 'Africa'}</span>
            </span>
          </div>

          {/* Product Identity */}
          <h3 className="text-lg font-semibold tracking-tight text-os-text-primary line-clamp-2 mb-1 leading-tight">
            {product.name || product.title}
          </h3>

          {/* Trade Meta */}
          <div className="mt-auto pt-3 space-y-2">
            {product.price_min || product.price ? (
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] font-medium text-os-text-secondary">From</span>
                <Price
                  amount={product.price_min || product.price}
                  fromCurrency={product.currency || 'USD'}
                  unit={product.unit || 'kg'}
                  className="text-base font-semibold text-os-text-primary"
                />
              </div>
            ) : (
              <span className="text-sm font-semibold text-os-accent">Request Quote</span>
            )}

            <p className="text-[10px] uppercase tracking-wide text-os-text-secondary">
              {moqDisplay}
            </p>

            {/* Primary Action - Subtle Luxury */}
            <div className="pt-3 mt-3 border-t border-os-stroke/30">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-os-accent group-hover:underline transition-all">
                View Producer →
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
