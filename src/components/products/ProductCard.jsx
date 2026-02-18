import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheck, Package, Clock, Award, MoveRight } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import OptimizedImage from '@/components/OptimizedImage';
import { getPrimaryImageFromProduct } from '@/utils/productImages';
import Price from '@/components/shared/ui/Price';
import SaveButton from '@/components/shared/ui/SaveButton';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// Country name to flag mapping (retained for contextual intelligence)
const getCountryFlagEmoji = (name) => {
  if (!name) return '🌍';
  const mapping = {
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
  return mapping[name] || '🌍';
};

export default function ProductCard({ product, priority = false }) {
  const { t } = useTranslation();
  const { lang = 'en' } = useParams();
  const imageUrl = getPrimaryImageFromProduct(product);

  // Resolve country with fallback to company data
  const countryName = product.country_of_origin || product.company_country || product.companies?.country || '';
  const flag = getCountryFlagEmoji(countryName);
  const isVerified = !!(product.companies?.verified || product.companies?.verification_status === 'verified' || product.companies?.verification_status === 'VERIFIED');

  // Format MOQ
  const moqDisplay = product.min_order_quantity
    ? `${product.min_order_quantity} ${product.moq_unit || product.unit || t('marketplace.units') || 'units'}`
    : product.moq
      ? `${product.moq} ${product.unit || t('marketplace.units') || 'units'}`
      : t('marketplace.contactSupplier') || 'Contact supplier';

  return (
    <Link
      to={`/${lang}/product/${product.id}`}
      className="block h-full group"
    >
      <Card className="border border-os-stroke bg-os-bg overflow-hidden transition-all duration-500 hover:shadow-os-lg rounded-[20px] relative h-full flex flex-col">
        {/* IMAGE ZONE - Luxury Framing (Hermes Style) */}
        <div className="relative aspect-[4/5] overflow-hidden bg-os-surface-solid">
          {/* Save Button Overlay */}
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <SaveButton itemId={product.id} itemType="product" className="bg-os-surface-solid/90 backdrop-blur-md border-none shadow-sm" />
          </div>

          {/* Verification Badge - Simple & Premium */}
          {isVerified && (
            <div className="absolute top-4 left-4 z-10">
              <div className="flex items-center gap-2 bg-os-accent px-3 py-1.5 rounded-full shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1A1512]" />
                <span className="text-[10px] font-black tracking-widest text-[#1A1512] uppercase">{t('marketplace.verified')}</span>
              </div>
            </div>
          )}

          {imageUrl ? (
            <OptimizedImage
              src={imageUrl}
              alt={product.name || product.title || 'Product'}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              width={400}
              height={500}
              priority={priority}
              quality={95}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjciIG51bU9jdGF2ZXM9IjQiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIuNSIvPjwvc3ZnPg==')]" />
              <Package className="w-10 h-10 text-os-text-secondary/20 mb-2 relative z-10" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-os-text-secondary/40 relative z-10">
                {t('marketplace.noProductsDescription')?.split('.')[0] || 'Sourcing Original Imagery'}
              </p>
            </div>
          )}

          {/* Luxury Gradient Overlay (Bottom) */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#221A15]/5 to-transparent pointer-events-none" />
        </div>

        {/* CONTENT ZONE - Premium Hierarchy */}
        <CardContent className="p-5 flex flex-col flex-1 h-[180px]">
          {/* Origin & Meta Layer */}
          <div className="flex items-center justify-between mb-2 h-4">
            <div className="flex items-center gap-2 text-[10px] font-black text-os-text-secondary uppercase tracking-[0.2em] opacity-60">
              <span className="text-14 grayscale-[0.2] group-hover:grayscale-0 transition-all">{flag}</span>
              {countryName ? (
                <span className="truncate max-w-[120px]">{t('marketplace.origin')}: {countryName}</span>
              ) : (
                <span className="text-os-accent/70 italic">{t('marketplace.verificationPending')}</span>
              )}
            </div>
          </div>

          {/* Product Identity */}
          <h3 className="text-16 font-semibold tracking-tight text-os-text-primary line-clamp-2 mb-3 h-10 leading-snug group-hover:text-os-accent transition-colors duration-300 uppercase">
            {product.name || product.title || t('marketplace.premiumSourcing') || 'Premium Sourcing'}
          </h3>

          {/* Trade Intelligence (Compact) */}
          <div className="flex flex-wrap gap-1.5 mb-4 h-9 overflow-hidden">
            {product.lead_time_min_days && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-os-stroke/20 rounded-md text-[9px] font-bold uppercase text-os-text-secondary tracking-wider">
                <Clock className="w-3 h-3 text-os-accent/70" />
                <span>{product.lead_time_min_days}-{product.lead_time_max_days}D {t('marketplace.delivery')}</span>
              </div>
            )}
            {product.certifications && product.certifications.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-os-accent/5 border border-os-accent/10 rounded-md text-[9px] font-bold uppercase text-os-accent tracking-wider">
                <Award className="w-3 h-3" />
                <span>{product.certifications[0]}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-500/5 border border-green-500/10 rounded-md text-[9px] font-bold uppercase text-green-600 tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              <span>{t('marketplace.protectedTrade')}</span>
            </div>
          </div>

          {/* Price & Action Layer */}
          <div className="mt-auto pt-4 border-t border-os-stroke/40 flex items-center justify-between">
            <div className="flex flex-col">
              {product.price_min || product.price ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <Price
                      amount={product.price_min || product.price}
                      fromCurrency={product.currency || 'USD'}
                      unit={product.unit || t('marketplace.units') || 'kg'}
                      className="text-18 font-bold text-os-text-primary tracking-tight"
                    />
                  </div>
                  <span className="text-[10px] text-os-text-secondary font-bold uppercase tracking-[0.1em]">
                    {t('marketplace.moq')}: {moqDisplay}
                  </span>
                </>
              ) : (
                <span className="text-12 font-black text-os-accent uppercase tracking-[0.15em]">{t('marketplace.directQuoteOnly')}</span>
              )}
            </div>

            <div className="w-10 h-10 rounded-full bg-os-surface-solid border border-os-stroke flex items-center justify-center shadow-sm group-hover:bg-os-accent group-hover:border-os-accent group-hover:text-[#221A15] transition-all duration-500">
              <MoveRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
