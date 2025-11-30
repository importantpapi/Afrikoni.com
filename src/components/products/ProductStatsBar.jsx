import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, TrendingUp, Eye, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductStatsBar({ stats }) {
  const statItems = [
    {
      label: 'Total Products',
      value: stats.total || 0,
      icon: Package,
      color: 'text-afrikoni-gold'
    },
    {
      label: 'Active',
      value: stats.active || 0,
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      label: 'Total Views',
      value: stats.totalViews || 0,
      icon: Eye,
      color: 'text-blue-600'
    },
    {
      label: 'Inquiries',
      value: stats.inquiries || 0,
      icon: MessageSquare,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-afrikoni-deep">{item.label}</p>
                    <p className="text-2xl font-bold text-afrikoni-chestnut">
                      {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                    </p>
                  </div>
                  <Icon className={`w-8 h-8 ${item.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

