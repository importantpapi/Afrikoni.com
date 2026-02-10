import React from 'react';
import { cn } from '@/lib/utils';

type SurfaceVariant = 'panel' | 'soft' | 'glass' | 'flat';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
}

const variantClasses: Record<SurfaceVariant, string> = {
  panel: 'os-panel',
  soft: 'os-panel-soft',
  glass: 'os-panel-glass',
  flat: 'bg-os-surface-0 border border-os-stroke rounded-2xl',
};

export function Surface({ variant = 'panel', className, ...props }: SurfaceProps) {
  return (
    <div
      className={cn(variantClasses[variant], 'text-[var(--os-text-primary)]', className)}
      {...props}
    />
  );
}
