import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

/**
 * Price Component - Automatically converts and displays prices in selected currency
 * 
 * @param {number} amount - The price amount
 * @param {string} fromCurrency - The currency of the original price (default: 'USD')
 * @param {boolean} showSymbol - Whether to show currency symbol (default: true)
 * @param {string} unit - Unit of measurement (e.g., 'kg', 'unit')
 * @param {boolean} showUnit - Whether to show the unit (default: true)
 * @param {object} className - Additional CSS classes
 * @param {number} minDecimals - Minimum decimal places (default: 2)
 * @param {number} maxDecimals - Maximum decimal places (default: 2)
 */
export default function Price({
  amount,
  fromCurrency = 'USD',
  showSymbol = true,
  unit,
  showUnit = true,
  className = '',
  minDecimals = 2,
  maxDecimals = 2,
  prefix = '',
  suffix = '',
  fallback = 'Price on request'
}) {
  const { formatPrice, currency } = useCurrency();

  if (amount === null || amount === undefined || amount === '') {
    return <span className={className}>{fallback}</span>;
  }

  const formattedPrice = formatPrice(amount, fromCurrency, showSymbol);

  return (
    <span className={className}>
      {prefix}
      {formattedPrice}
      {suffix}
      {showUnit && unit && (
        <span className="text-sm text-afrikoni-deep/70 ml-1">/ {unit}</span>
      )}
    </span>
  );
}

/**
 * PriceRange Component - Displays price ranges with automatic conversion
 */
export function PriceRange({
  min,
  max,
  fromCurrency = 'USD',
  unit,
  className = '',
  showSymbol = true
}) {
  const { formatPrice } = useCurrency();

  if (!min && !max) {
    return <span className={className}>Price on request</span>;
  }

  if (min === max || !max) {
    return (
      <span className={className}>
        {formatPrice(min, fromCurrency, showSymbol)}
        {unit && <span className="text-sm text-afrikoni-deep/70 ml-1">/ {unit}</span>}
      </span>
    );
  }

  return (
    <span className={className}>
      {formatPrice(min, fromCurrency, showSymbol)} – {formatPrice(max, fromCurrency, showSymbol)}
      {unit && <span className="text-sm text-afrikoni-deep/70 ml-1">/ {unit}</span>}
    </span>
  );
}

