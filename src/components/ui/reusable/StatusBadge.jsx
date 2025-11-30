import React from 'react';
import { Badge } from '../badge';
import { getStatusLabel, getStatusVariant } from '@/constants/status';
import { cn } from '@/lib/utils';

/**
 * Reusable Status Badge Component
 * Uses centralized status helpers for consistency
 */
export const StatusBadge = React.memo(function StatusBadge({
  status,
  type = 'order', // 'order', 'rfq', 'shipment', 'product', 'payment'
  variant,
  className = '',
  size = 'sm' // 'sm', 'md', 'lg'
}) {
  // Safety check
  if (!status) return null;

  const label = getStatusLabel(status, type);
  const statusVariant = variant || getStatusVariant(status, type);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <Badge
      variant={statusVariant}
      className={cn(sizeClasses[size], className)}
    >
      {label}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Re-export for convenience
export { StatusBadge as default };

