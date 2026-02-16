/**
 * Supplier Onboarding Insights Component
 * Auto-generates insights for supplier onboarding opportunities
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { Target, MapPin, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { useSupplyGapInsights } from '@/hooks/useTradeIntelligence';

export default function SupplierOnboardingInsights() {
  const { data: supplyGaps, loading } = useSupplyGapInsights();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-os-accent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!supplyGaps || supplyGaps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-os-accent" />
            Supplier Onboarding Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-afrikoni-deep/70">
            <Package className="w-12 h-12 mx-auto mb-3 text-afrikoni-deep/30" />
            <p>No supply gaps detected at this time.</p>
            <p className="text-os-sm mt-2">Market demand is well-served by existing suppliers.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-os-accent" />
          Supplier Onboarding Opportunities
        </CardTitle>
        <p className="text-os-sm text-afrikoni-deep/70 mt-1">
          High-demand categories with low supplier availability
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {supplyGaps.slice(0, 10).map((gap, idx) => (
            <div 
              key={idx} 
              className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-orange-900">
                      {gap.category_name || 'Uncategorized'}
                    </span>
                    <Badge className="bg-orange-200 text-orange-900">
                      {gap.gap_count} {gap.gap_count === 1 ? 'gap' : 'gaps'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-os-sm text-orange-700">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>High demand in {gap.buyer_country || 'Multiple countries'}</span>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-orange-600 flex-shrink-0" />
              </div>
              <div className="mt-3 pt-3 border-t border-orange-200">
                <p className="text-os-xs text-orange-800 font-medium">
                  💡 Opportunity: We need more suppliers in {gap.category_name} for {gap.buyer_country}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-os-xs"
                  onClick={() => {
                    // Navigate to supplier onboarding with pre-filled category/country
                    window.location.href = `/become-supplier?category=${encodeURIComponent(gap.category_name)}&country=${encodeURIComponent(gap.buyer_country)}`;
                  }}
                >
                  Invite Suppliers
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {supplyGaps.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-os-sm text-afrikoni-deep/70">
              +{supplyGaps.length - 10} more opportunities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

