import React from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Sparkles } from 'lucide-react';

export default function AISuggestionCard({
  title,
  description,
  badges = [],
  onClick,
  className = ''
}) {
  if (!title && !description) return null;

  return (
    <Card
      className={`border-os-accent/30 hover:border-os-accent hover:shadow-os-gold transition cursor-pointer ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-os-accent" />
          <h3 className="font-semibold text-os-sm text-afrikoni-chestnut line-clamp-2">{title}</h3>
        </div>
        {description && (
          <p className="text-os-xs text-afrikoni-deep/80 line-clamp-3">{description}</p>
        )}
        {Array.isArray(badges) && badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {badges.map((b, idx) => (
              <Badge
                key={idx}
                variant={b.variant || 'outline'}
                className="text-os-xs py-0.5 px-1.5"
              >
                {b.label}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


