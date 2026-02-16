import React from 'react';
import { cn } from '@/lib/utils';

export function Avatar({ 
  name, 
  size = 'md', 
  className,
  bgColor,
  textColor = 'text-afrikoni-cream'
}) {
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-os-xs',
    md: 'w-10 h-10 text-os-sm',
    lg: 'w-12 h-12 text-os-base',
    xl: 'w-16 h-16 text-os-lg'
  };

  const defaultBgColors = [
    'bg-os-accent',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-red-500'
  ];

  // Generate consistent color based on name
  const getColorForName = (name) => {
    if (bgColor) return bgColor;
    if (!name) return defaultBgColors[0];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return defaultBgColors[hash % defaultBgColors.length];
  };

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold flex-shrink-0',
        sizeClasses[size],
        getColorForName(name),
        textColor,
        className
      )}
    >
      {getInitials(name)}
  </div>
  );
}

