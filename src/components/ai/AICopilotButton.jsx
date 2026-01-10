import React from 'react';
import { Button } from '@/components/shared/ui/button';
import { Sparkles } from 'lucide-react';

export default function AICopilotButton({
  label = 'Ask AI',
  icon: Icon = Sparkles,
  loading = false,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={isDisabled}
      className={`inline-flex items-center gap-2 ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-afrikoni-gold border-t-transparent rounded-full animate-spin" />
      ) : (
        <Icon className="w-4 h-4 text-afrikoni-gold" />
      )}
      <span className="text-xs md:text-sm">{label}</span>
    </Button>
  );
}


