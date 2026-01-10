import React from 'react';
import { Button } from '@/components/shared/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

/**
 * KoniAI Action Button - Consistent button style for KoniAI actions
 */
export default function KoniAIActionButton({
  label,
  onClick,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'default',
  className = '',
  icon: Icon = Sparkles
}) {
  const variantClasses = {
    primary: 'bg-afrikoni-gold hover:bg-afrikoni-goldDark text-white border-afrikoni-gold',
    ghost: 'bg-transparent hover:bg-afrikoni-gold/10 text-afrikoni-gold border border-afrikoni-gold/30'
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    default: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        flex items-center gap-2
        transition-all duration-200
        ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>KoniAI is thinking...</span>
        </>
      ) : (
        <>
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}

