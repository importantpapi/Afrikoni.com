/**
 * Pending Reviews Badge Component
 * Displays real-time count of pending reviews for admin sidebar
 * Uses hardened RLS-safe query and optimized subscriptions
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { usePendingReviewsCount } from '@/hooks/usePendingReviewsCount';

export default function PendingReviewsBadge({ className = '' }) {
  const { pendingCount, isLoading } = usePendingReviewsCount();

  // Don't show badge if no pending reviews
  if (isLoading || pendingCount === 0) {
    return null;
  }

  // Color coding based on urgency
  const getBadgeColor = (count) => {
    if (count >= 10) return 'bg-red-600 text-white'; // Urgent
    if (count >= 5) return 'bg-orange-500 text-white'; // Warning
    return 'bg-afrikoni-gold text-white'; // Normal
  };

  return (
    <Badge 
      className={`${getBadgeColor(pendingCount)} font-bold shadow-sm ${className}`}
      aria-label={`${pendingCount} pending reviews`}
    >
      {pendingCount}
    </Badge>
  );
}

