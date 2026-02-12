import React from 'react';
import { cn } from '@/lib/utils';

type SurfaceVariant = 'panel' | 'soft' | 'glass' | 'flat';
type GlowIntensity = 'subtle' | 'normal' | 'strong' | 'sapphire' | 'emerald';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  glow?: boolean | GlowIntensity;
  hover?: boolean;
}

const variantClasses: Record<SurfaceVariant, string> = {
  panel: 'os-panel',
  soft: 'os-panel-soft',
  glass: 'os-panel-glass',
  flat: 'bg-os-surface-0 border border-os-stroke rounded-2xl',
};

const glowClasses: Record<GlowIntensity, string> = {
  subtle: 'os-glow-subtle',
  normal: 'os-glow',
  strong: 'os-glow-strong',
  sapphire: 'os-glow-sapphire',
  emerald: 'os-glow-emerald',
};

export function Surface({
  variant = 'panel',
  glow = false,
  hover = false,
  className,
  ...props
}: SurfaceProps) {
  const glowClass = glow === true 
    ? glowClasses.normal 
    : glow === false 
    ? '' 
    : glowClasses[glow as GlowIntensity];

  return (
    <div
      className={cn(
        variantClasses[variant],
        glowClass,
        hover && 'os-glow-hover transition-all duration-300',
        'text-[var(--os-text-primary)]',
        className
      )}
      {...props}
    />
  );
}
