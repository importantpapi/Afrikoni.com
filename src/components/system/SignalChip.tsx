import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type SignalTone = 'gold' | 'emerald' | 'amber' | 'blue' | 'neutral';

const toneClasses: Record<SignalTone, string> = {
  gold: 'text-os-gold border-[rgba(212,169,55,0.24)] bg-[rgba(212,169,55,0.12)]',
  emerald: 'text-os-emerald border-emerald-500/30 bg-emerald-500/10',
  amber: 'text-os-amber border-amber-400/30 bg-amber-400/10',
  blue: 'text-os-blue border-sky-400/30 bg-sky-400/10',
  neutral: 'text-[var(--os-text-secondary)] border-white/10 bg-white/5',
};

interface SignalChipProps {
  label: string;
  value?: string | number;
  icon?: LucideIcon;
  tone?: SignalTone;
  className?: string;
}

export function SignalChip({ label, value, icon: Icon, tone = 'neutral', className }: SignalChipProps) {
  return (
    <div className={cn('os-chip border', toneClasses[tone], className)}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      <span className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase">{label}</span>
      {value !== undefined ? (
        <span className="text-[0.75rem] font-semibold tracking-[0.08em]">{value}</span>
      ) : null}
    </div>
  );
}
