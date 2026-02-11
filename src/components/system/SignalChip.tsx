import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type SignalTone = 'gold' | 'emerald' | 'amber' | 'blue' | 'neutral';

// Premium 2026 Design - Glassmorphism with gradient accents
const toneClasses: Record<SignalTone, { border: string; bg: string; text: string; glow: string }> = {
  gold: {
    border: 'border-[#D4A937]/30',
    bg: 'bg-gradient-to-br from-[#D4A937]/15 to-[#D4A937]/5',
    text: 'text-[#D4A937]',
    glow: 'shadow-[0_0_12px_rgba(212,169,55,0.2)]'
  },
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_12px_rgba(52,211,153,0.2)]'
  },
  amber: {
    border: 'border-amber-400/30',
    bg: 'bg-gradient-to-br from-amber-400/15 to-amber-400/5',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_12px_rgba(251,191,36,0.2)]'
  },
  blue: {
    border: 'border-sky-400/30',
    bg: 'bg-gradient-to-br from-sky-400/15 to-sky-400/5',
    text: 'text-sky-400',
    glow: 'shadow-[0_0_12px_rgba(56,189,248,0.2)]'
  },
  neutral: {
    border: 'border-white/15',
    bg: 'bg-gradient-to-br from-white/10 to-white/5',
    text: 'text-gray-300',
    glow: 'shadow-[0_0_8px_rgba(255,255,255,0.1)]'
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
    <motion.div
      className={cn(
        'relative group',
        className
      )}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Glassmorphism container */}
      <div className={cn(
        'relative flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-xl',
        'transition-all duration-300',
        styles.border,
        styles.bg,
        styles.glow,
        'hover:border-opacity-50'
      )}>
        {/* Icon with subtle animation */}
        {Icon && (
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon className={cn('h-3.5 w-3.5', styles.text)} />
          </motion.div>
        )}

        {/* Label */}
        <span className={cn(
          'text-[0.65rem] font-bold uppercase tracking-[0.2em]',
          styles.text,
          'opacity-80'
        )}>
          {label}
        </span>

        {/* Value with gradient background */}
        {value !== undefined && (
          <div className={cn(
            'px-2 py-0.5 rounded-md',
            'bg-white/10 backdrop-blur-sm',
            'border border-white/10'
          )}>
            <span className={cn(
              'text-[0.75rem] font-bold tracking-[0.08em]',
              styles.text
            )}>
              {value}
            </span>
          </div>
        )}

        {/* Hover glow effect */}
        <motion.div
          className={cn(
            'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            styles.bg
          )}
          style={{ filter: 'blur(8px)', zIndex: -1 }}
        />
      </div>
    </motion.div>
  );
}
