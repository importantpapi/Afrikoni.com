/**
 * RFQ Step 2: Quantity & Destination
 * 
 * Mobile-first inputs for:
 * - Quantity + unit (smart defaults)
 * - Destination country (chip selection)
 */

import React from 'react';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Badge } from '@/components/shared/ui/badge';
import { MapPin } from 'lucide-react';
import { COUNTRY_CURRENCY_MAP } from '@/utils/geoDetection';

// Common units for African trade
const UNITS = [
  { value: 'pieces', label: 'Pieces' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'grams', label: 'Grams' },
  { value: 'tons', label: 'Metric Tons' },
  { value: 'liters', label: 'Liters' },
  { value: 'bags', label: 'Bags (50kg)' },
  { value: 'containers', label: 'Containers (20ft)' },
  { value: 'pallets', label: 'Pallets' },
  { value: 'crates', label: 'Crates' },
];

// African countries list (prioritized)
const AFRICAN_COUNTRIES = [
  'Angola', 'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt',
  'Morocco', 'Senegal', 'Tanzania', 'Ethiopia', 'Cameroon', 'Côte d\'Ivoire',
  'Uganda', 'Algeria', 'Sudan', 'Mozambique', 'Madagascar', 'Mali',
  'Burkina Faso', 'Niger', 'Rwanda', 'Benin', 'Guinea', 'Chad',
  'Zimbabwe', 'Zambia', 'Malawi', 'Gabon', 'Botswana', 'Gambia',
  'Guinea-Bissau', 'Liberia', 'Sierra Leone', 'Togo', 'Mauritania',
  'Namibia', 'Lesotho', 'Eritrea', 'Djibouti', 'South Sudan',
  'Central African Republic', 'Republic of the Congo', 'DR Congo',
  'São Tomé and Príncipe', 'Cape Verde', 'Comoros', 'Mauritius',
  'Somalia', 'Burundi', 'Equatorial Guinea', 'Eswatini', 'Libya', 'Tunisia'
];

export default function RFQStep2QuantityDestination({ formData, updateFormData }) {
  const handleQuantityChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    updateFormData({ quantity: value });
  };

  const handleUnitChange = (unit) => {
    updateFormData({ unit });
  };

  const handleCountrySelect = (country) => {
    updateFormData({ delivery_location: country });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-2">
          Quantity & Destination
        </h1>
        <p className="text-afrikoni-deep/70 text-base">
          How much do you need and where should it be delivered?
        </p>
      </div>

      {/* Quantity Input */}
      <div>
        <Label className="text-sm font-semibold text-afrikoni-deep mb-2 block">
          Quantity *
        </Label>
        <Input
          type="text"
          inputMode="numeric"
          value={formData.quantity || ''}
          onChange={handleQuantityChange}
          placeholder="e.g., 1000"
          className="text-base min-h-[52px] px-4"
          autoFocus
        />
      </div>

      {/* Unit Selection (Chips) */}
      <div>
        <Label className="text-sm font-semibold text-afrikoni-deep mb-3 block">
          Unit *
        </Label>
        <div className="flex flex-wrap gap-2">
          {UNITS.map((unit) => (
            <Badge
              key={unit.value}
              variant={formData.unit === unit.value ? 'default' : 'outline'}
              className={`min-h-[44px] px-4 py-2 cursor-pointer transition-all ${
                formData.unit === unit.value
                  ? 'bg-afrikoni-gold text-afrikoni-chestnut'
                  : 'border-afrikoni-gold/40 hover:bg-afrikoni-gold/10'
              }`}
              onClick={() => handleUnitChange(unit.value)}
            >
              {unit.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Destination Country */}
      <div>
        <Label className="text-sm font-semibold text-afrikoni-deep mb-3 block flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Destination Country *
        </Label>
        <div className="max-h-[300px] overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {AFRICAN_COUNTRIES.map((country) => (
              <Badge
                key={country}
                variant={formData.delivery_location === country ? 'default' : 'outline'}
                className={`min-h-[44px] px-4 py-2 cursor-pointer transition-all text-sm ${
                  formData.delivery_location === country
                    ? 'bg-afrikoni-gold text-afrikoni-chestnut'
                    : 'border-afrikoni-gold/40 hover:bg-afrikoni-gold/10'
                }`}
                onClick={() => handleCountrySelect(country)}
              >
                {country}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

