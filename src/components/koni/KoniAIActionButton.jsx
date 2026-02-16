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
    primary: 'bg-os-accent hover:bg-os-accentDark text-white border-os-accent',
    ghost: 'bg-transparent hover:bg-os-accent/10 text-os-accent border border-os-accent/30'
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-os-xs',
    default: 'h-10 px-4 text-os-sm',
    lg: 'h-12 px-6 text-os-base'
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

