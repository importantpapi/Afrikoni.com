/**
 * Trust History Timeline Component
 * Shows trust score evolution over time for a supplier
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { TrendingUp, TrendingDown, Minus, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useTrustEvolution } from '@/hooks/useTradeIntelligence';

export default function TrustHistoryTimeline({ companyId }) {
  const { data: trustData, loading } = useTrustEvolution(companyId);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const trust = trustData?.[0] || null;

  if (!trust) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trust Evolution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-afrikoni-deep/70">
            <Shield className="w-12 h-12 mx-auto mb-3 text-afrikoni-deep/30" />
            <p>No trust history available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trust components
  const trustComponents = [
    {
      label: 'Base Trust Score',
      value: trust.current_trust_score || 50,
      max: 100,
      color: 'afrikoni-gold'
    },
    {
      label: 'Completed Deals',
      value: trust.completed_deals || 0,
      max: Math.max(trust.completed_deals || 0, 10),
      color: 'green'
    },
    {
      label: 'Total Reviews',
      value: trust.total_reviews || 0,
      max: Math.max(trust.total_reviews || 0, 10),
      color: 'blue'
    },
    {
      label: 'Average Rating',
      value: trust.avg_review_rating ? (trust.avg_review_rating * 20) : 0,
      max: 100,
      color: 'purple'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-afrikoni-gold" />
          Trust Evolution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Trust Score */}
          <div className="p-4 bg-afrikoni-gold/10 rounded-lg border border-afrikoni-gold/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-afrikoni-deep">Current Trust Score</span>
              <Badge className={
                trust.current_trust_score >= 80 ? 'bg-green-100 text-green-700' :
                trust.current_trust_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                'bg-orange-100 text-orange-700'
              }>
                {trust.current_trust_score || 50}/100
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${
                  trust.current_trust_score >= 80 ? 'bg-green-500' :
                  trust.current_trust_score >= 60 ? 'bg-yellow-500' :
                  'bg-orange-500'
                }`}
                style={{ width: `${trust.current_trust_score || 50}%` }}
              />
            </div>
          </div>

          {/* Trust Components */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-afrikoni-chestnut">Trust Components</h4>
            {trustComponents.map((component, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-afrikoni-deep/70">{component.label}</span>
                  <span className="text-xs font-medium text-afrikoni-chestnut">
                    {component.label === 'Average Rating' 
                      ? `${(component.value / 20).toFixed(1)}/5`
                      : component.label === 'Base Trust Score'
                      ? `${component.value}/100`
                      : component.value}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all bg-${component.color}-500`}
                    style={{ width: `${Math.min(100, (component.value / component.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-afrikoni-gold/20">
            <div className="text-center p-3 bg-afrikoni-cream rounded-lg">
              <div className="text-2xl font-bold text-afrikoni-chestnut">
                {trust.completed_deals || 0}
              </div>
              <div className="text-xs text-afrikoni-deep/70">Completed Deals</div>
            </div>
            <div className="text-center p-3 bg-afrikoni-cream rounded-lg">
              <div className="text-2xl font-bold text-afrikoni-chestnut">
                {trust.total_reviews || 0}
              </div>
              <div className="text-xs text-afrikoni-deep/70">Total Reviews</div>
            </div>
            {trust.avg_review_rating && (
              <div className="text-center p-3 bg-afrikoni-cream rounded-lg col-span-2">
                <div className="text-2xl font-bold text-afrikoni-gold">
                  {trust.avg_review_rating.toFixed(1)}/5
                </div>
                <div className="text-xs text-afrikoni-deep/70">Average Rating</div>
              </div>
            )}
          </div>

          {/* Trust Status */}
          <div className="pt-4 border-t border-afrikoni-gold/20">
            <div className="flex items-center gap-2">
              {trust.verified && (
                <Badge className="bg-green-100 text-green-700">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {trust.completed_deals >= 10 && (
                <Badge className="bg-blue-100 text-blue-700">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Established
                </Badge>
              )}
              {trust.avg_review_rating >= 4.5 && (
                <Badge className="bg-purple-100 text-purple-700">
                  <Shield className="w-3 h-3 mr-1" />
                  Highly Rated
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

