import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Reusable Timeline Item Component
 * Handles missing nodes, timestamps, and unknown statuses gracefully
 */
export const TimelineItem = React.memo(function TimelineItem({
  title,
  description,
  timestamp,
  icon: Icon,
  status = 'pending', // 'completed', 'pending', 'current'
  isLast = false,
  className = ''
}) {
  // Safety checks
  if (!title) return null;

  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';
  const isPending = status === 'pending';

  // Format timestamp safely
  let formattedDate = null;
  if (timestamp) {
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        formattedDate = format(date, 'MMM d, yyyy h:mm a');
      }
    } catch (error) {
      // Invalid date, skip formatting
    }
  }

  return (
    <div className={cn('flex gap-4', className)}>
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isCompleted
              ? 'bg-os-accent text-white'
              : isCurrent
              ? 'bg-os-accent/20 text-os-accent border-2 border-os-accent'
              : 'bg-afrikoni-cream border-2 border-os-accent/30'
          )}
        >
          {isCompleted ? (
            <CheckCircle className="w-6 h-6" aria-hidden="true" />
          ) : Icon ? (
            <Icon className={cn('w-5 h-5', isPending && 'text-afrikoni-deep/50')} aria-hidden="true" />
          ) : (
            <Clock className={cn('w-5 h-5', isPending && 'text-afrikoni-deep/50')} aria-hidden="true" />
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              'w-0.5',
              isCompleted ? 'bg-os-accent' : 'bg-os-accent/20'
            )}
            style={{ minHeight: '40px' }}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="flex-1 pb-4">
        <h4
          className={cn(
            'font-medium',
            isCurrent
              ? 'text-os-accent'
              : isCompleted
              ? 'text-afrikoni-chestnut'
              : 'text-afrikoni-deep/70'
          )}
        >
          {title}
        </h4>
        {description && (
          <p className="text-os-sm text-afrikoni-deep/70 mt-1">{description}</p>
        )}
        {formattedDate && (
          <p className="text-os-xs text-afrikoni-deep/50 mt-1">{formattedDate}</p>
        )}
      </div>
    </div>
  );
});

TimelineItem.displayName = 'TimelineItem';

