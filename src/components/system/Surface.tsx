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
  panel: 'os-panel shadow-premium',
  soft: 'os-panel-soft shadow-subtle',
  glass: 'glass-surface',
  flat: 'bg-os-surface-solid border border-os-stroke rounded-2xl',
  ivory: 'bg-[#FBFBF9] border border-[#00000005] rounded-3xl shadow-premium',
  charcoal: 'bg-[#1A1A1A] border border-[#ffffff08] rounded-3xl shadow-dark',
};

const glowClasses: Record<GlowIntensity, string> = {
  subtle: 'os-glow-subtle',
  normal: 'os-glow',
  strong: 'os-glow-strong',
  sapphire: 'os-glow-sapphire',
  emerald: 'os-glow-emerald',
  gold: 'os-glow-gold shadow-[0_0_20px_rgba(212,169,55,0.15)]',
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
        hover && 'hover:translate-y-[-2px] hover:shadow-premium-xl transition-all duration-300 cursor-pointer',
        'text-os-text-primary overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
