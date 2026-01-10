import React from 'react';
import { TrendingDown, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function BulkPricingTiers({ product }) {
  const { formatPrice } = useCurrency();
  
  // Generate mock pricing tiers based on product data
  // In production, this would come from product_variants or a pricing_tiers table
  const generatePricingTiers = () => {
    const basePrice = parseFloat(product.price_min || product.price || 0);
    const moq = parseFloat(product.min_order_quantity || product.moq || 1);
    const productCurrency = product.currency || 'USD';
    
    if (!basePrice) return [];
    
    const tiers = [
      { minQty: moq, maxQty: moq * 10, discount: 0, label: 'Standard' },
      { minQty: moq * 10 + 1, maxQty: moq * 50, discount: 5, label: 'Bulk' },
      { minQty: moq * 50 + 1, maxQty: moq * 100, discount: 10, label: 'Wholesale' },
      { minQty: moq * 100 + 1, maxQty: null, discount: 15, label: 'Volume' }
    ];
    
    return tiers.map(tier => {
      const priceInProductCurrency = basePrice * (1 - tier.discount / 100);
      const savingsInProductCurrency = basePrice * (tier.discount / 100);
      
      return {
        ...tier,
        price: priceInProductCurrency,
        savings: savingsInProductCurrency,
        productCurrency
      };
    }).filter(tier => tier.minQty >= moq);
  };

  const pricingTiers = generatePricingTiers();

  if (pricingTiers.length === 0) {
    return null;
  }

  return (
    <Card className="border-afrikoni-gold/20">
      <CardHeader className="border-b border-afrikoni-gold/10">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-afrikoni-gold" />
          Bulk Pricing Tiers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          {pricingTiers.map((tier, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-afrikoni-offwhite rounded-lg border border-afrikoni-gold/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-afrikoni-gold" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-afrikoni-chestnut">{tier.label}</span>
                    {tier.discount > 0 && (
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        {tier.discount}% OFF
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-afrikoni-deep/70">
                    {tier.minQty.toLocaleString()}
                    {tier.maxQty ? ` - ${tier.maxQty.toLocaleString()}` : '+'} units
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-afrikoni-gold">
                  {formatPrice(tier.price, tier.productCurrency, true)}
                </div>
                {tier.savings > 0 && (
                  <p className="text-xs text-green-600">
                    Save {formatPrice(tier.savings, tier.productCurrency, true)}/unit
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-afrikoni-deep/70 mt-4 text-center">
          * Pricing tiers are estimates. Contact supplier for exact pricing based on your order quantity.
        </p>
      </CardContent>
    </Card>
  );
}

