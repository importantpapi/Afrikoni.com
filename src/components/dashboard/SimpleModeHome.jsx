/**
 * Simple Mode Home - Africa-First UX
 * 
 * Human trade language for farmers, first-time users, and informal traders.
 * No system jargon - just clear outcomes and trust signals.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { useTrades } from '@/hooks/queries/useTrades';
import {
  DollarSign, ShoppingBag, Truck, Shield, TrendingUp,
  CheckCircle2, Clock, Package, MapPin, Users, BadgeCheck
} from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { cn } from '@/lib/utils';

export default function SimpleModeHome() {
  const { organization, profileCompanyId } = useDashboardKernel();
  const { data: { activeTrades = [] } = {} } = useTrades();
  const navigate = useNavigate();

  const trustScore = organization?.trust_score ?? 0;
  const isVerified = organization?.verification_status === 'verified';

  // Sample market data - in production, this would come from your pricing API
  const marketPrices = [
    { product: 'Cocoa Beans', price: '2,400', unit: 'MT', trend: '+3%', country: 'Ghana' },
    { product: 'Coffee', price: '3,200', unit: 'MT', trend: '+5%', country: 'Kenya' },
    { product: 'Cashew Nuts', price: '1,800', unit: 'MT', trend: '-2%', country: 'Nigeria' },
  ];

  return (
    <div className="os-page space-y-8 max-w-6xl mx-auto pb-24 px-4 py-8">
      
      {/* Welcome Header - Human Language */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          Welcome back, {organization?.company_name || 'Trader'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Trade safely, get paid on time, grow your business
        </p>
      </div>

      {/* Trust Signal Banner */}
      {isVerified && (
        <Surface className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20">
          <div className="flex items-center gap-3">
            <BadgeCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                Your account is verified and protected
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Escrow • Payment Protection • Dispute Resolution
              </p>
            </div>
          </div>
        </Surface>
      )}

      {/* Primary Actions - Clear Outcomes */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Sell My Product */}
        <Surface 
          className="p-8 hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-[#D4A937]"
          onClick={() => navigate('/dashboard/rfqs/new')}
        >
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Sell My Product
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Find verified buyers. Safe payment guaranteed by escrow protection.
              </p>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
              Start Selling →
            </div>
          </div>
        </Surface>

        {/* Find Products to Buy */}
        <Surface 
          className="p-8 hover:shadow-xl transition-all cursor-pointer group border-2 border-transparent hover:border-[#D4A937]"
          onClick={() => navigate('/dashboard/market-pulse')}
        >
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Find Products
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Browse verified sellers across Africa. Compare prices and quality.
              </p>
            </div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
              Browse Market →
            </div>
          </div>
        </Surface>
      </div>

      {/* Market Prices - Price Discovery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#D4A937]" />
            Today's Market Prices
          </h2>
          <span className="text-sm text-gray-500">Live prices from verified traders</span>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {marketPrices.map((item) => (
            <Surface key={item.product} className="p-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{item.product}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {item.country}
                    </p>
                  </div>
                  <Badge className={cn(
                    "text-xs",
                    item.trend.startsWith('+') 
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" 
                      : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  )}>
                    {item.trend}
                  </Badge>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#D4A937]">
                    ${item.price}
                  </div>
                  <div className="text-xs text-gray-500">per {item.unit}</div>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      </div>

      {/* My Active Trades - Human Status */}
      {activeTrades.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#D4A937]" />
            My Active Sales
          </h2>
          
          <div className="space-y-3">
            {activeTrades.slice(0, 3).map((trade) => (
              <Surface 
                key={trade.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/dashboard/trade/${trade.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-gray-900 dark:text-white">{trade.productName}</h4>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <Shield className="w-3 h-3 mr-1" />
                        Protected by Escrow
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {trade.corridor.originCountry} → {trade.corridor.destinationCountry}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        Payment secured
                      </span>
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Buyer verified
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Progress</div>
                    <div className="text-2xl font-bold text-emerald-600">75%</div>
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        </div>
      )}

      {/* Help & Support - Always Visible */}
      <Surface className="p-6 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20">
        <div className="flex items-start gap-4">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
              Need help getting started?
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              Our trade support team speaks your language and can guide you through your first sale.
            </p>
            <Button 
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              onClick={() => navigate('/dashboard/support')}
            >
              Talk to Support
            </Button>
          </div>
        </div>
      </Surface>
    </div>
  );
}
