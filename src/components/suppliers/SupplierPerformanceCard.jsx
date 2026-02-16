import React from 'react';
import { TrendingUp, Package, Clock, Star, CheckCircle, AlertTriangle, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Progress } from '@/components/shared/ui/progress';
import { cn } from '@/lib/utils';

/**
 * Supplier Performance Card
 * Shows reliability metrics to help buyers make informed decisions
 * Builds trust through transparent, data-driven credibility
 */

export function SupplierPerformanceCard({ 
  supplierId,
  supplierName,
  performanceData = {},
  showDetailed = false,
  className = ''
}) {
  const {
    totalOrders = 0,
    completedOrders = 0,
    onTimeDeliveryRate = 0,
    averageResponseTime = 0, // in hours
    buyerSatisfactionRate = 0,
    repeatBuyerRate = 0,
    activeCountries = 0,
    verificationLevel = 'basic',
    badges = []
  } = performanceData;

  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  const getPerformanceLevel = () => {
    const score = (onTimeDeliveryRate + buyerSatisfactionRate + (completionRate > 0 ? completionRate : 0)) / 3;
    
    if (score >= 90) return { label: 'Outstanding', color: 'green', icon: Award };
    if (score >= 75) return { label: 'Excellent', color: 'blue', icon: TrendingUp };
    if (score >= 60) return { label: 'Good', color: 'amber', icon: CheckCircle };
    return { label: 'Building Track Record', color: 'gray', icon: Package };
  };

  const performanceLevel = getPerformanceLevel();
  const PerformanceIcon = performanceLevel.icon;

  const getResponseTimeLabel = (hours) => {
    if (hours === 0) return 'No data yet';
    if (hours < 2) return 'Very Fast (< 2h)';
    if (hours < 24) return `Fast (${Math.round(hours)}h)`;
    if (hours < 48) return 'Within 2 days';
    return 'Slow (> 2 days)';
  };

  if (!showDetailed) {
    // Compact version for product cards and listings
    return (
      <div className={cn('flex items-center gap-3 text-os-xs', className)}>
        <div className="flex items-center gap-1.5">
          <PerformanceIcon className={`w-4 h-4 text-${performanceLevel.color}-600`} />
          <span className={`font-medium text-${performanceLevel.color}-700`}>
            {performanceLevel.label}
          </span>
        </div>
        {totalOrders > 0 && (
          <>
            <div className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-afrikoni-deep/60" />
              <span className="text-afrikoni-deep/70">{totalOrders} orders</span>
            </div>
            {onTimeDeliveryRate > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-afrikoni-deep/60" />
                <span className="text-afrikoni-deep/70">{onTimeDeliveryRate}% on-time</span>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Detailed version for supplier profiles
  return (
    <Card className={cn('border-os-accent/30', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-os-lg text-afrikoni-chestnut flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-os-accent" />
            Supplier Performance
          </CardTitle>
          <Badge 
            variant={performanceLevel.color === 'green' ? 'success' : 'default'}
            className={`bg-${performanceLevel.color}-100 text-${performanceLevel.color}-700`}
          >
            {performanceLevel.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-afrikoni-deep/60 text-os-xs">
              <Package className="w-4 h-4" />
              <span>Total Orders</span>
            </div>
            <p className="text-os-2xl font-bold text-afrikoni-chestnut">{totalOrders}</p>
            <p className="text-os-xs text-afrikoni-deep/60">
              {completedOrders} completed successfully
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-afrikoni-deep/60 text-os-xs">
              <Clock className="w-4 h-4" />
              <span>On-Time Delivery</span>
            </div>
            <p className="text-os-2xl font-bold text-afrikoni-chestnut">{onTimeDeliveryRate}%</p>
            <Progress value={onTimeDeliveryRate} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-afrikoni-deep/60 text-os-xs">
              <Star className="w-4 h-4" />
              <span>Buyer Satisfaction</span>
            </div>
            <p className="text-os-2xl font-bold text-afrikoni-chestnut">{buyerSatisfactionRate}%</p>
            <Progress value={buyerSatisfactionRate} className="h-2" />
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-os-accent/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-os-sm font-medium text-afrikoni-chestnut">Response Time</p>
              <p className="text-os-xs text-afrikoni-deep/70">
                {getResponseTimeLabel(averageResponseTime)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-os-sm font-medium text-afrikoni-chestnut">Repeat Buyers</p>
              <p className="text-os-xs text-afrikoni-deep/70">
                {repeatBuyerRate}% return for more orders
              </p>
            </div>
          </div>
        </div>

        {/* Verification & Badges */}
        {(badges.length > 0 || activeCountries > 0) && (
          <div className="pt-4 border-t border-os-accent/20 space-y-3">
            {activeCountries > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-os-xs font-medium text-afrikoni-deep/70">Active in:</span>
                <Badge variant="outline" className="text-os-xs">
                  {activeCountries} {activeCountries === 1 ? 'country' : 'countries'}
                </Badge>
              </div>
            )}

            {badges.length > 0 && (
              <div>
                <p className="text-os-xs font-medium text-afrikoni-deep/70 mb-2">Achievements:</p>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="text-os-xs bg-amber-50 text-amber-700 border-amber-200"
                    >
                      <Award className="w-3 h-3 mr-1" />
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Performance Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-os-xs">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-1">
                How we calculate performance:
              </p>
              <ul className="text-blue-800 space-y-0.5">
                <li>• On-time delivery rate (based on confirmed deliveries)</li>
                <li>• Buyer satisfaction (from completed order reviews)</li>
                <li>• Response time (average time to reply to inquiries)</li>
                <li>• Repeat business (percentage of returning buyers)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Trust Note */}
        {totalOrders < 5 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-os-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800">
                <strong>Building Track Record:</strong> This supplier is still building their performance history on Afrikoni. 
                {totalOrders > 0 
                  ? ` They have ${totalOrders} completed order${totalOrders > 1 ? 's' : ''} so far.`
                  : ' All first orders are protected by Afrikoni Trade Shield.'
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Calculate supplier performance metrics from order history
 */
export async function calculateSupplierPerformance(supabase, supplierId) {
  try {
    // Get all completed orders for this supplier
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        created_at,
        estimated_delivery,
        actual_delivery,
        buyer_company_id,
        payment_status,
        reviews (rating, created_at)
      `)
      .eq('seller_company_id', supplierId)
      .in('status', ['delivered', 'completed', 'confirmed']);

    if (error) throw error;

    const totalOrders = orders?.length || 0;
    const completedOrders = orders?.filter(o => o.status === 'completed' || o.status === 'confirmed').length || 0;

    // Calculate on-time delivery rate
    const ordersWithDelivery = orders?.filter(o => o.estimated_delivery && o.actual_delivery) || [];
    const onTimeOrders = ordersWithDelivery.filter(o => 
      new Date(o.actual_delivery) <= new Date(o.estimated_delivery)
    ).length;
    const onTimeDeliveryRate = ordersWithDelivery.length > 0 
      ? Math.round((onTimeOrders / ordersWithDelivery.length) * 100) 
      : 0;

    // Calculate buyer satisfaction from reviews
    const reviews = orders?.flatMap(o => o.reviews || []) || [];
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;
    const buyerSatisfactionRate = Math.round((averageRating / 5) * 100);

    // Calculate repeat buyer rate
    const uniqueBuyers = new Set(orders?.map(o => o.buyer_company_id));
    const buyersWithMultipleOrders = Array.from(uniqueBuyers).filter(buyerId => 
      orders.filter(o => o.buyer_company_id === buyerId).length > 1
    ).length;
    const repeatBuyerRate = uniqueBuyers.size > 0
      ? Math.round((buyersWithMultipleOrders / uniqueBuyers.size) * 100)
      : 0;

    // Get active countries
    const { data: countryData } = await supabase
      .from('orders')
      .select('delivery_country')
      .eq('seller_company_id', supplierId)
      .not('delivery_country', 'is', null);
    
    const activeCountries = new Set(countryData?.map(d => d.delivery_country)).size;

    return {
      totalOrders,
      completedOrders,
      onTimeDeliveryRate,
      averageResponseTime: 0, // TODO: Calculate from messages
      buyerSatisfactionRate,
      repeatBuyerRate,
      activeCountries,
      verificationLevel: 'verified' // From company.verification_status
    };
  } catch (error) {
    console.error('Error calculating supplier performance:', error);
    return {
      totalOrders: 0,
      completedOrders: 0,
      onTimeDeliveryRate: 0,
      averageResponseTime: 0,
      buyerSatisfactionRate: 0,
      repeatBuyerRate: 0,
      activeCountries: 0
    };
  }
}

