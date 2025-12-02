import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function AISummaryBox({
  title = 'AI Summary',
  icon: Icon = Sparkles,
  children,
  className = ''
}) {
  if (!children) return null;

  return (
    <Card className={`border-afrikoni-gold/30 bg-afrikoni-offwhite/80 ${className}`}>
      <CardHeader className="py-3 pb-1">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-afrikoni-chestnut">
          <Icon className="w-4 h-4 text-afrikoni-gold" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1 pb-3 text-xs md:text-sm text-afrikoni-deep/80 whitespace-pre-line">
        {children}
      </CardContent>
    </Card>
  );
}


