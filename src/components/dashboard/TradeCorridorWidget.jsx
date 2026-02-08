import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Globe, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * TradeCorridorWidget - Shows trade lane performance
 * e.g., Ghana → Belgium, Nigeria → Germany
 */

const SAMPLE_CORRIDORS = [
  { from: 'Ghana', to: 'Belgium', flag_from: '🇬🇭', flag_to: '🇧🇪', volume: 64000, trades: 12, trend: 'up', change: '+8.2%' },
  { from: 'Nigeria', to: 'Germany', flag_from: '🇳🇬', flag_to: '🇩🇪', volume: 45200, trades: 8, trend: 'up', change: '+5.1%' },
  { from: 'Senegal', to: 'France', flag_from: '🇸🇳', flag_to: '🇫🇷', volume: 28500, trades: 6, trend: 'down', change: '-2.3%' },
  { from: 'Burkina Faso', to: 'USA', flag_from: '🇧🇫', flag_to: '🇺🇸', volume: 22500, trades: 4, trend: 'flat', change: '0%' },
  { from: 'Cameroon', to: 'UK', flag_from: '🇨🇲', flag_to: '🇬🇧', volume: 18700, trades: 3, trend: 'up', change: '+12.5%' },
];

function TrendIcon({ trend }) {
  if (trend === 'up') return <TrendingUp className="w-3 h-3 text-afrikoni-green" />;
  if (trend === 'down') return <TrendingDown className="w-3 h-3 text-afrikoni-red" />;
  return <Minus className="w-3 h-3 text-gray-400" />;
}

export default function TradeCorridorWidget({ className = '' }) {
  const { profileCompanyId, canLoadData } = useDashboardKernel();
  const [corridors, setCorridors] = useState(SAMPLE_CORRIDORS);

  useEffect(() => {
    if (!canLoadData || !profileCompanyId) return;

    const loadCorridors = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('buyer_country, seller_country, total_amount')
          .or(`buyer_company_id.eq.${profileCompanyId},seller_company_id.eq.${profileCompanyId}`)
          .not('buyer_country', 'is', null)
          .not('seller_country', 'is', null)
          .limit(200);

        if (error || !data || data.length === 0) return;

        const corridorMap = {};
        data.forEach(order => {
          const key = `${order.seller_country}→${order.buyer_country}`;
          if (!corridorMap[key]) {
            corridorMap[key] = { from: order.seller_country, to: order.buyer_country, volume: 0, trades: 0 };
          }
          corridorMap[key].volume += parseFloat(order.total_amount) || 0;
          corridorMap[key].trades += 1;
        });

        const sorted = Object.values(corridorMap)
          .sort((a, b) => b.volume - a.volume)
          .slice(0, 5)
          .map(c => ({
            ...c,
            flag_from: '',
            flag_to: '',
            trend: 'up',
            change: '+0%',
          }));

        if (sorted.length > 0) setCorridors(sorted);
      } catch (err) {
        console.warn('[TradeCorridorWidget] Error:', err);
      }
    };

    loadCorridors();
  }, [canLoadData, profileCompanyId]);

  return (
    <Card className={`border-afrikoni-gold/20 bg-white dark:bg-[#1A1A1A] rounded-afrikoni-lg shadow-premium ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-afrikoni-charcoal dark:text-[#F5F0E8] flex items-center gap-2">
          <Globe className="w-5 h-5 text-afrikoni-gold" />
          Trade Corridors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {corridors.map((corridor, i) => (
            <motion.div
              key={`${corridor.from}-${corridor.to}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-[#222] hover:bg-afrikoni-gold/5 dark:hover:bg-afrikoni-gold/10 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{corridor.flag_from}</span>
                <span className="text-sm font-medium text-afrikoni-charcoal dark:text-[#F5F0E8] truncate">
                  {corridor.from}
                </span>
                <ArrowRight className="w-3 h-3 text-afrikoni-gold flex-shrink-0" />
                <span className="text-base">{corridor.flag_to}</span>
                <span className="text-sm font-medium text-afrikoni-charcoal dark:text-[#F5F0E8] truncate">
                  {corridor.to}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-afrikoni-charcoal dark:text-[#F5F0E8]">
                  ${(corridor.volume / 1000).toFixed(0)}K
                </span>
                <div className="flex items-center gap-0.5">
                  <TrendIcon trend={corridor.trend} />
                  <span className={`text-[10px] font-medium ${
                    corridor.trend === 'up' ? 'text-afrikoni-green' :
                    corridor.trend === 'down' ? 'text-afrikoni-red' : 'text-gray-400'
                  }`}>
                    {corridor.change}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {corridor.trades}
                </Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
