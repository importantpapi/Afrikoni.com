import { DollarSign, Package, Truck, Clock, MapPin, Lightbulb } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Checkbox } from '@/components/shared/ui/checkbox';
import { UNITS, CURRENCIES, DELIVERY_REGIONS, MOQ_SUGGESTIONS } from './types';
import { cn } from '@/lib/utils';

export default function ProductPricingStep({ formData, onUpdate }) {
  const moqSuggestions = MOQ_SUGGESTIONS[formData.category] || MOQ_SUGGESTIONS.agricultural;
  const selectedCurrency = CURRENCIES.find((c) => c.value === formData.currency);

  const toggleRegion = (region) => {
    const current = formData.deliveryRegions;
    if (current.includes(region)) {
      onUpdate({ deliveryRegions: current.filter((r) => r !== region) });
    } else {
      onUpdate({ deliveryRegions: [...current, region] });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-os-sm font-medium text-[var(--os-text-primary)]">
          <DollarSign className="w-4 h-4 text-white" />
          Pricing
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-os-sm font-medium">
              Price per Unit <span className="text-white/70">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--os-text-secondary)] text-os-sm">
                {selectedCurrency?.symbol || '$'}
              </span>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => onUpdate({ price: e.target.value })}
                placeholder="0.00"
                className="h-12 pl-8 os-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-os-sm font-medium">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => onUpdate({ currency: value })}
            >
              <SelectTrigger className="h-12 os-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-os-sm font-medium">Unit of Measurement</Label>
          <Select
            value={formData.unit}
            onValueChange={(value) => onUpdate({ unit: value })}
          >
            <SelectTrigger className="h-12 os-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-os-sm font-medium text-[var(--os-text-primary)]">
          <Package className="w-4 h-4 text-white" />
          Order Quantity
        </div>

        <div className="space-y-2">
          <Label htmlFor="moq" className="text-os-sm font-medium">
            Minimum Order Quantity (MOQ) <span className="text-white/70">*</span>
          </Label>
          <Input
            id="moq"
            value={formData.moq}
            onChange={(e) => onUpdate({ moq: e.target.value })}
            placeholder="e.g., 500 kg"
            className="h-12 os-input"
          />

          <div className="flex flex-wrap gap-2 mt-2">
            {moqSuggestions.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'text-os-xs h-7 border-white/20',
                  formData.moq === suggestion && 'bg-white text-black border-white'
                )}
                onClick={() => onUpdate({ moq: suggestion })}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxQuantity" className="text-os-sm font-medium">
            Maximum Supply Capacity
            <span className="text-os-xs text-[var(--os-text-secondary)] font-normal ml-2">(optional)</span>
          </Label>
          <Input
            id="maxQuantity"
            value={formData.maxQuantity}
            onChange={(e) => onUpdate({ maxQuantity: e.target.value })}
            placeholder="e.g., 50 tons per month"
            className="h-12 os-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-os-sm font-medium">Availability Status</Label>
        <Select
          value={formData.availability}
          onValueChange={(value) => onUpdate({ availability: value })}
        >
          <SelectTrigger className="h-12 os-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in_stock">In Stock - Ready to Ship</SelectItem>
            <SelectItem value="made_to_order">Made to Order</SelectItem>
            <SelectItem value="seasonal">Seasonal Availability</SelectItem>
            <SelectItem value="pre_order">Pre-Order Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--os-text-secondary)]" />
          <Label htmlFor="leadTime" className="text-os-sm font-medium">
            Lead Time
            <span className="text-os-xs text-[var(--os-text-secondary)] font-normal ml-2">(optional)</span>
          </Label>
        </div>
        <Input
          id="leadTime"
          value={formData.leadTime}
          onChange={(e) => onUpdate({ leadTime: e.target.value })}
          placeholder="e.g., 7-14 days after order confirmation"
          className="h-12 os-input"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[var(--os-text-secondary)]" />
          <Label className="text-os-sm font-medium">
            Delivery Regions <span className="text-white/70">*</span>
          </Label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DELIVERY_REGIONS.map((region) => {
            const isSelected = formData.deliveryRegions.includes(region.value);
            return (
              <label
                key={region.value}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                  isSelected
                    ? 'border-white/40 bg-white/10'
                    : 'border-white/10 hover:border-white/40'
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => toggleRegion(region.value)}
                />
                <span className="text-os-sm text-[var(--os-text-primary)]">{region.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
        <Lightbulb className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-os-sm font-medium text-[var(--os-text-primary)]">Competitive Pricing</p>
          <p className="text-os-xs text-[var(--os-text-secondary)] mt-0.5">
            Buyers compare prices. Be transparent about MOQ and include bulk discounts.
          </p>
        </div>
      </div>
    </div>
  );
}
