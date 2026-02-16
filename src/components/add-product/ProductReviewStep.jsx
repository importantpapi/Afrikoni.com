import { AlertCircle, CheckCircle2, AlertTriangle, Image, FileText, DollarSign, Truck } from 'lucide-react';
import { CATEGORIES, CURRENCIES, DELIVERY_REGIONS, SUBCATEGORIES } from './types';
import { cn } from '@/lib/utils';

export default function ProductReviewStep({ formData, onGoToStep }) {
  const category = CATEGORIES.find((c) => c.value === formData.category);
  const subcategories = SUBCATEGORIES[formData.category] || [];
  const subcategory = subcategories.find((s) => s.value === formData.subcategory);
  const currency = CURRENCIES.find((c) => c.value === formData.currency);
  const selectedRegions = DELIVERY_REGIONS.filter((r) => formData.deliveryRegions.includes(r.value));

  const qualityChecks = [
    {
      label: 'Product Photos',
      status: formData.imageUrls.length >= 3 ? 'good' : formData.imageUrls.length > 0 ? 'warning' : 'error',
      message: formData.imageUrls.length >= 3
        ? `${formData.imageUrls.length} photos uploaded`
        : formData.imageUrls.length > 0
          ? `Only ${formData.imageUrls.length} photo${formData.imageUrls.length > 1 ? 's' : ''} - add more for better visibility`
          : 'No photos uploaded - this reduces buyer trust',
      step: 2,
    },
    {
      label: 'Description Quality',
      status: formData.description.length >= 50 ? 'good' : formData.description.length > 0 ? 'warning' : 'error',
      message: formData.description.length >= 50
        ? 'Clear and detailed description'
        : formData.description.length > 0
          ? 'Description is too short - add more details'
          : 'No description provided',
      step: 1,
    },
    {
      label: 'Pricing Information',
      status: formData.price && formData.moq ? 'good' : 'warning',
      message: formData.price && formData.moq
        ? 'Price and MOQ are set'
        : 'Complete pricing information attracts more buyers',
      step: 3,
    },
    {
      label: 'Delivery Coverage',
      status: formData.deliveryRegions.length > 0 ? 'good' : 'error',
      message: formData.deliveryRegions.length > 0
        ? `Ships to ${selectedRegions.length} region${selectedRegions.length > 1 ? 's' : ''}`
        : 'No delivery regions selected',
      step: 3,
    },
  ];

  const hasErrors = qualityChecks.some((c) => c.status === 'error');
  const allGood = qualityChecks.every((c) => c.status === 'good');

  return (
    <div className="space-y-6 animate-fade-in">
      <div
        className={cn(
          'p-4 rounded-os-sm border',
          allGood && 'bg-white/5 border-white/20',
          hasErrors && 'bg-white/5 border-white/20',
          !allGood && !hasErrors && 'bg-white/5 border-white/20'
        )}
      >
        <div className="flex items-center gap-3">
          {allGood ? (
            <CheckCircle2 className="w-8 h-8 text-white" />
          ) : hasErrors ? (
            <AlertCircle className="w-8 h-8 text-white" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-white" />
          )}
          <div>
            <p className="font-semibold text-[var(--os-text-primary)]">
              {allGood
                ? "Your listing looks great!"
                : hasErrors
                  ? "Some required information is missing"
                  : "Almost there! A few improvements recommended"}
            </p>
            <p className="text-os-sm text-[var(--os-text-secondary)]">
              {allGood ? "You're ready to publish and attract buyers." : 'Fix the issues below for better visibility.'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-os-sm font-medium text-[var(--os-text-primary)]">Quality Checklist</p>
        <div className="space-y-2">
          {qualityChecks.map((check, index) => (
            <button
              key={index}
              type="button"
              onClick={() => check.status !== 'good' && onGoToStep(check.step)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                check.status === 'good' && 'bg-white/5 border-white/10',
                check.status === 'warning' && 'bg-white/5 border-white/20 hover:border-white/40 cursor-pointer',
                check.status === 'error' && 'bg-white/5 border-white/20 hover:border-white/40 cursor-pointer'
              )}
              disabled={check.status === 'good'}
            >
              {check.status === 'good' ? (
                <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
              ) : check.status === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-os-sm font-medium text-[var(--os-text-primary)]">{check.label}</p>
                <p className="text-os-xs text-[var(--os-text-secondary)]">{check.message}</p>
              </div>
              {check.status !== 'good' && (
                <span className="text-os-xs text-white font-medium">Fix →</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10">
        <p className="text-os-sm font-medium text-[var(--os-text-primary)]">Product Summary</p>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-os-sm font-medium">{formData.name || 'No name'}</p>
            <p className="text-os-xs text-[var(--os-text-secondary)]">
              {category?.label || 'No category'}
              {subcategory && ` → ${subcategory.label}`}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Image className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-os-sm font-medium">{formData.imageUrls.length} Photos</p>
            {formData.imageUrls.length > 0 && (
              <div className="flex gap-1 mt-1">
                {formData.imageUrls.slice(0, 4).map((url, i) => (
                  <img key={i} src={url} alt="" className="w-10 h-10 rounded object-cover" />
                ))}
                {formData.imageUrls.length > 4 && (
                  <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-os-xs text-[var(--os-text-secondary)]">
                    +{formData.imageUrls.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-os-sm font-medium">
              {formData.price ? `${currency?.symbol}${formData.price} / ${formData.unit}` : 'Price not set'}
            </p>
            <p className="text-os-xs text-[var(--os-text-secondary)]">
              MOQ: {formData.moq || 'Not specified'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-os-sm font-medium">
              {selectedRegions.length > 0
                ? `Ships to ${selectedRegions.length} region${selectedRegions.length > 1 ? 's' : ''}`
                : 'No regions selected'}
            </p>
            <p className="text-os-xs text-[var(--os-text-secondary)]">
              {selectedRegions.slice(0, 3).map(r => r.label).join(', ')}
              {selectedRegions.length > 3 && ` +${selectedRegions.length - 3} more`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
