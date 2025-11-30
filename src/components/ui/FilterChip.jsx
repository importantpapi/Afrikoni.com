import React from 'react';
import { Badge } from './badge';
import { X } from 'lucide-react';

export default function FilterChip({ label, onRemove, active = true }) {
  if (!onRemove) {
    return (
      <Badge
        variant={active ? 'default' : 'outline'}
        className="flex items-center gap-1 px-3 py-1"
      >
        {label}
      </Badge>
    );
  }

  return (
    <button
      onClick={onRemove}
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full cursor-pointer hover:bg-afrikoni-gold/20 focus:outline-none focus:ring-2 focus:ring-afrikoni-gold focus:ring-offset-2 transition-colors"
      aria-label={`Remove filter: ${label}`}
    >
      <Badge
        variant={active ? 'default' : 'outline'}
        className="flex items-center gap-1"
      >
        {label}
        <X className="w-3 h-3" aria-hidden="true" />
      </Badge>
    </button>
  );
}

