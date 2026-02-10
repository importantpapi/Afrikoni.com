import React from 'react';
import { cn } from '@/lib/utils';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneClasses: Record<StatusTone, string> = {
  success: 'text-emerald-200 border-emerald-400/20 bg-emerald-400/10',
  warning: 'text-amber-200 border-amber-400/20 bg-amber-400/10',
  danger: 'text-red-200 border-red-400/20 bg-red-400/10',
  info: 'text-sky-200 border-sky-400/20 bg-sky-400/10',
  neutral: 'text-[var(--os-text-secondary)] border-white/10 bg-white/5',
};

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

export function StatusBadge({ label, tone = 'neutral', className }: StatusBadgeProps) {
  return (
    <span className={cn('os-badge border text-[0.62rem] uppercase tracking-[0.18em]', toneClasses[tone], className)}>
      {label}
    </span>
  );
}
