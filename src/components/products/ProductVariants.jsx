import React, { useState, useEffect } from 'react';
import { Package, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/shared/ui/badge';
import { Card, CardContent } from '@/components/shared/ui/card';

export default function ProductVariants({ variants = [], onVariantSelect, selectedVariantId = null }) {
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    if (variants.length > 0) {
      const defaultVariant = variants.find(v => v.id === selectedVariantId) || variants[0];
      setSelectedVariant(defaultVariant);
      if (onVariantSelect) {
        onVariantSelect(defaultVariant);
      }
    }
  }, [variants, selectedVariantId, onVariantSelect]);

  if (!variants || variants.length === 0) {
    return null;
  }

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    if (onVariantSelect) {
      onVariantSelect(variant);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-afrikoni-chestnut flex items-center gap-2">
        <Package className="w-5 h-5" />
        Available Variants
      </h3>
      
      <div className="grid gap-3">
        {variants.map((variant) => {
          const isSelected = selectedVariant?.id === variant.id;
          const attributes = variant.attributes || {};
          
          return (
            <Card
              key={variant.id}
              className={`cursor-pointer transition-all touch-manipulation ${
                isSelected
                  ? 'border-afrikoni-gold ring-2 ring-afrikoni-gold/20 bg-afrikoni-gold/5'
                  : 'border-afrikoni-gold/20 hover:border-afrikoni-gold/40 active:border-afrikoni-gold/60'
              }`}
              onClick={() => handleVariantSelect(variant)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-afrikoni-chestnut">
                        {variant.name || `Variant ${variant.sku || ''}`}
                      </h4>
                      {isSelected && (
                        <Badge className="bg-afrikoni-gold text-afrikoni-cream">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                      {variant.sku && (
                        <Badge variant="outline" className="text-xs">
                          SKU: {variant.sku}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Attributes */}
                    {Object.keys(attributes).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {Object.entries(attributes).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Price and MOQ */}
                    <div className="flex items-center gap-4 text-sm">
                      {variant.price && (
                        <div>
                          <span className="text-afrikoni-deep/70">Price: </span>
                          <span className="font-semibold text-afrikoni-gold">
                            ${variant.price}
                          </span>
                        </div>
                      )}
                      {variant.moq && (
                        <div>
                          <span className="text-afrikoni-deep/70">MOQ: </span>
                          <span className="font-semibold text-afrikoni-chestnut">
                            {variant.moq} units
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

