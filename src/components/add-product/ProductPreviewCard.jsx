import { MapPin, Package, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/shared/ui/badge';
import { CATEGORIES, CURRENCIES, DELIVERY_REGIONS } from './types';
import { cn } from '@/lib/utils';

export default function ProductPreviewCard({ formData, className }) {
  const category = CATEGORIES.find((c) => c.value === formData.category);
  const currency = CURRENCIES.find((c) => c.value === formData.currency);
  const selectedRegions = DELIVERY_REGIONS.filter((r) => formData.deliveryRegions.includes(r.value));

  const hasImage = formData.imageUrls.length > 0;
  const hasPrice = formData.price;

  return (
    <div className={cn('border border-white/10 rounded-2xl overflow-hidden bg-white/5', className)}>
      <div className="px-4 py-2 bg-white/5 border-b border-white/10">
        <p className="text-xs text-[var(--os-text-secondary)] text-center">
          👁️ Buyer View Preview
        </p>
      </div>

      <div className="aspect-[4/3] bg-black/20 relative">
        {hasImage ? (
          <img src={formData.imageUrls[0]} alt={formData.name || 'Product'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--os-text-secondary)]">
            <Package className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No image yet</p>
          </div>
        )}

        {formData.imageUrls.length > 1 && (
          <span className="absolute bottom-2 right-2 text-xs bg-black/70 text-white px-2 py-0.5 rounded-full">
            +{formData.imageUrls.length - 1} more
          </span>
        )}

        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="bg-black/40 text-xs gap-1 border-white/10">
            <CheckCircle2 className="w-3 h-3 text-white" />
            Verified Supplier
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {category && (
          <Badge variant="secondary" className="text-xs border-white/10 bg-white/10">
            {category.icon} {category.label}
          </Badge>
        )}

        <h3 className="font-semibold text-[var(--os-text-primary)] line-clamp-2">
          {formData.name || 'Product Name'}
        </h3>

        <div className="flex items-baseline gap-1">
          {hasPrice ? (
            <>
              <span className="text-xl font-bold text-[var(--os-text-primary)]">
                {currency?.symbol}{formData.price}
              </span>
              <span className="text-sm text-[var(--os-text-secondary)]">/ {formData.unit}</span>
            </>
          ) : (
            <span className="text-[var(--os-text-secondary)] text-sm">Price not set</span>
          )}
        </div>

        {formData.moq && (
          <div className="flex items-center gap-1.5 text-sm text-[var(--os-text-secondary)]">
            <Package className="w-4 h-4" />
            <span>MOQ: {formData.moq}</span>
          </div>
        )}

        {selectedRegions.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-[var(--os-text-secondary)]">
            <MapPin className="w-4 h-4" />
            <span>{selectedRegions.length === 1 ? selectedRegions[0].label : `${selectedRegions.length} regions`}</span>
          </div>
        )}

        {formData.leadTime && (
          <div className="flex items-center gap-1.5 text-sm text-[var(--os-text-secondary)]">
            <Clock className="w-4 h-4" />
            <span>{formData.leadTime}</span>
          </div>
        )}

        {formData.description && (
          <p className="text-sm text-[var(--os-text-secondary)] line-clamp-2 pt-2 border-t border-white/10">
            {formData.description}
          </p>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="w-full h-10 rounded-lg bg-white/10 flex items-center justify-center text-sm text-white font-medium">
          Request Quote
        </div>
      </div>
    </div>
  );
}
