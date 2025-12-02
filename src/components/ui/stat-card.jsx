import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip } from './tooltip';

export function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  trendValue,
  className,
  color = 'orange',
  animated = true,
  tooltip
}) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);
  const cardRef = useRef(null);

  const colors = {
    orange: {
      bg: 'bg-afrikoni-gold/20',
      text: 'text-afrikoni-gold',
      icon: 'text-afrikoni-gold'
    },
    blue: {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      icon: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      icon: 'text-green-600'
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      icon: 'text-purple-600'
    }
  };

  const colorScheme = colors[color] || colors.orange;

  useEffect(() => {
    if (!animated || !cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const rawString = (value ?? '0').toString();
          const numericValue = parseFloat(rawString.replace(/[^0-9.]/g, '')) || 0;
          const duration = 2000;
          const startTime = Date.now();

          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = numericValue * easeOutQuart;

            if (rawString.includes('+')) {
              setDisplayValue(Math.floor(current).toLocaleString() + '+');
            } else if (rawString.includes('$')) {
              setDisplayValue('$' + Math.floor(current).toLocaleString());
            } else if (rawString.includes('%')) {
              setDisplayValue(Math.floor(current) + '%');
            } else {
              setDisplayValue(Math.floor(current).toLocaleString());
            }

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(value);
            }
          };

          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [value, animated]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.15 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className={cn('rounded-xl border border-afrikoni-gold/20 bg-afrikoni-offwhite p-5 md:p-6 shadow-afrikoni hover:shadow-afrikoni-lg transition-all cursor-default', className)}
    >
      <div className="flex items-start justify-between mb-4">
        <Tooltip content={tooltip || label} position="top">
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colorScheme.bg)}>
            {Icon && <Icon className={cn('w-7 h-7', colorScheme.icon)} />}
          </div>
        </Tooltip>
        {trend && (
          <div className={cn(
            'text-xs font-semibold flex items-center gap-1',
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          )}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </div>
        )}
      </div>
      <div className={cn('text-3xl md:text-4xl font-bold mb-1', colorScheme.text)}>
        {displayValue}
      </div>
      <div className="text-sm md:text-base text-afrikoni-deep font-medium">
        {label}
      </div>
    </motion.div>
  );
}

