import React from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Package, TrendingUp, Eye, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductStatsBar({ stats }) {
  const statItems = [
    {
      label: 'Total Products',
      value: stats.total || 0,
      icon: Package,
      color: 'text-[#D4A937]'
    },
    {
      label: 'Active',
      value: stats.active || 0,
      icon: TrendingUp,
      color: 'text-emerald-500'
    },
    {
      label: 'Total Views',
      value: stats.totalViews || 0,
      icon: Eye,
      color: 'text-os-blue dark:text-blue-400'
    },
    {
      label: 'Inquiries',
      value: stats.inquiries || 0,
      icon: MessageSquare,
      color: 'text-purple-500 dark:text-purple-400'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.05 }}
          >
            <Card className="border-gray-200 dark:border-[#1E1E1E] bg-white dark:bg-[#141414] rounded-os-sm hover:border-[#D4A937]/20 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-os-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-os-2xl font-bold font-mono text-gray-900 dark:text-[#F5F0E8]">
                      {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
