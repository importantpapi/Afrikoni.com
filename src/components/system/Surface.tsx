import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

type SurfaceVariant = 'panel' | 'soft' | 'glass' | 'flat' | 'ivory' | 'charcoal';
type GlowIntensity = 'subtle' | 'normal' | 'strong' | 'sapphire' | 'emerald' | 'gold';

interface SurfaceProps extends Omit<HTMLMotionProps<"div">, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> {
  variant?: SurfaceVariant;
  glow?: boolean | GlowIntensity;
  hover?: boolean;
}

const variantClasses: Record<SurfaceVariant, string> = {
  panel: 'bg-os-card border border-os-stroke rounded-os-md shadow-os-md',
  soft: 'bg-os-card/40 border border-os-stroke/50 rounded-os-md shadow-os-sm backdrop-blur-xl',
  glass: 'glass-surface',
  flat: 'bg-os-surface-solid border border-os-stroke rounded-os-md',
  ivory: 'bg-os-bg border border-os-stroke rounded-os-lg shadow-os-md',
  charcoal: 'bg-black/60 backdrop-blur-3xl border border-white/5 rounded-os-lg shadow-os-lg',
};

const glowClasses: Record<GlowIntensity, string> = {
  subtle: 'os-glow-subtle',
  normal: 'os-glow',
  strong: 'os-glow-strong',
  sapphire: 'os-glow-sapphire',
  emerald: 'os-glow-emerald',
  gold: 'os-glow-gold shadow-[0_0_20px_rgba(197,160,55,0.15)]',
};

/**
 * Surface - The Foundational OS Component
 * 
 * Provides a consistent, premium container with depth, motion, 
 * and varying levels of transparency (Glassmorphism).
 */
export function Surface({
  variant = 'panel',
  glow = false,
  hover = false,
  className,
  children,
  ...props
}: SurfaceProps) {
  const glowClass = glow === true
    ? glowClasses.normal
    : glow === false
      ? ''
      : glowClasses[glow as GlowIntensity];

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        variantClasses[variant],
        glowClass,
        hover && 'hover:translate-y-[-2px] hover:shadow-os-md-xl transition-all duration-300 cursor-pointer',
        'text-os-text-primary overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
