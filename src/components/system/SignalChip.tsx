import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type SignalTone = 'gold' | 'emerald' | 'amber' | 'blue' | 'neutral';

// Premium 2026 Design - Glassmorphism with gradient accents
const toneClasses: Record<SignalTone, { border: string; bg: string; text: string }> = {
  gold: {
    border: 'border-os-accent/20',
    bg: 'bg-os-accent/5',
    text: 'text-os-accent',
  },
  emerald: {
    border: 'border-os-success/20',
    bg: 'bg-os-success/5',
    text: 'text-os-success',
  },
  amber: {
    border: 'border-os-accent/20',
    bg: 'bg-os-accent/5',
    text: 'text-os-accent',
  },
  blue: {
    border: 'border-os-blue/20',
    bg: 'bg-blue-500/5',
    text: 'text-os-blue',
  },
  neutral: {
    border: 'border-os-stroke',
    bg: 'bg-os-surface',
    text: 'text-os-text-secondary',
  },
};

interface SignalChipProps {
  label: string;
  value?: string | number;
  icon?: LucideIcon;
  tone?: SignalTone;
  className?: string;
}

export function SignalChip({ label, value, icon: Icon, tone = 'neutral', className }: SignalChipProps) {
  const styles = toneClasses[tone];

  return (
    <div className={cn('relative group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300', styles.border, styles.bg, className)}>
      {Icon && <Icon className={cn('h-3.5 w-3.5', styles.text)} />}
      <span className={cn('text-os-xs font-semibold tracking-tight', styles.text)}>
        {label}
      </span>
      {value !== undefined && (
        <span className={cn('text-os-xs font-bold px-1.5 bg-os-stroke/20 rounded', styles.text)}>
          {value}
        </span>
      )}
    </div>
  );
}
