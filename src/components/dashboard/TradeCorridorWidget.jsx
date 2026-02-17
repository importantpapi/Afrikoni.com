import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Globe, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

/**
 * TradeCorridorWidget - Trade OS 2026
 * Shows trade lane performance: Ghana > Belgium, Nigeria > Germany
 */

const SAMPLE_CORRIDORS = [
  { from: 'Ghana', to: 'Belgium', flag_from: '\u{1F1EC}\u{1F1ED}', flag_to: '\u{1F1E7}\u{1F1EA}', volume: 64000, trades: 12, trend: 'up', change: '+8.2%' },
  { from: 'Nigeria', to: 'Germany', flag_from: '\u{1F1F3}\u{1F1EC}', flag_to: '\u{1F1E9}\u{1F1EA}', volume: 45200, trades: 8, trend: 'up', change: '+5.1%' },
  { from: 'Senegal', to: 'France', flag_from: '\u{1F1F8}\u{1F1F3}', flag_to: '\u{1F1EB}\u{1F1F7}', volume: 28500, trades: 6, trend: 'down', change: '-2.3%' },
  { from: 'Burkina Faso', to: 'USA', flag_from: '\u{1F1E7}\u{1F1EB}', flag_to: '\u{1F1FA}\u{1F1F8}', volume: 22500, trades: 4, trend: 'flat', change: '0%' },
  { from: 'Cameroon', to: 'UK', flag_from: '\u{1F1E8}\u{1F1F2}', flag_to: '\u{1F1EC}\u{1F1E7}', volume: 18700, trades: 3, trend: 'up', change: '+12.5%' },
];

function TrendIcon({ trend }) {
  if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
  if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
}

export default function TradeCorridorWidget({ className = '' }) {
  const { profileCompanyId, canLoadData } = useDashboardKernel();
  const [corridors, setCorridors] = useState(SAMPLE_CORRIDORS);

  useEffect(() => {
    if (!canLoadData || !profileCompanyId) return;

    const loadCorridors = async () => {
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('buyer_company_id, seller_company_id, total_amount')
          .or(`buyer_company_id.eq.${profileCompanyId},seller_company_id.eq.${profileCompanyId}`)
          .not('buyer_company_id', 'is', null)
          .not('seller_company_id', 'is', null)
          .limit(200);

        if (error || !orders || orders.length === 0) return;

        const companyIds = Array.from(new Set(
          (orders || []).flatMap(order => [order.buyer_company_id, order.seller_company_id]).filter(Boolean)
        ));

        const { data: companies } = await supabase
          .from('companies')
          .select('id, country, company_name')
          .in('id', companyIds);

        const companyMap = new Map();
        (companies || []).forEach(company => {
          companyMap.set(company.id, company.country || company.company_name || 'Unknown');
        });

        const corridorMap = {};
        (orders || []).forEach(order => {
          const from = companyMap.get(order.seller_company_id) || 'Unknown';
          const to = companyMap.get(order.buyer_company_id) || 'Unknown';
          const key = `${from}\u2192${to}`;
          if (!corridorMap[key]) {
            corridorMap[key] = { from, to, volume: 0, trades: 0 };
          }
          corridorMap[key].volume += parseFloat(order.total_amount || 0) || 0;
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
    <Card className={`border-os-stroke dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-os-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-os-sm font-semibold dark:text-[#F5F0E8] flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Trade Corridors
          </CardTitle>
          <span className="text-os-xs font-mono dark:text-os-text-secondary">{corridors.length} routes</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {(corridors || []).map((corridor, i) => (
            <motion.div
              key={`${corridor.from}-${corridor.to}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-2.5 rounded-lg dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#222] border border-transparent hover:border-os-accent/10 transition-all"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-os-sm">{corridor.flag_from}</span>
                <span className="text-os-sm font-medium dark:text-gray-200 truncate">
                  {corridor.from}
                </span>
                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                <span className="text-os-sm">{corridor.flag_to}</span>
                <span className="text-os-sm font-medium dark:text-gray-200 truncate">
                  {corridor.to}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-os-sm font-bold font-mono dark:text-[#F5F0E8]">
                  ${(corridor.volume / 1000).toFixed(0)}K
                </span>
                <div className="flex items-center gap-0.5">
                  <TrendIcon trend={corridor.trend} />
                  <span className={`text-os-xs font-medium font-mono ${corridor.trend === 'up' ? 'text-emerald-500' :
                      corridor.trend === 'down' ? 'text-os-red' : 'text-gray-400'
                    }`}>
                    {corridor.change}
                  </span>
                </div>
                <Badge variant="outline" className="text-os-xs font-mono dark:border-[#2A2A2A] dark:text-gray-400">
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
