import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Afrikoni Logo Component
 * Based on the actual Afrikoni logo design with gold embossed style
 * 
 * @param {string} type - 'full' | 'icon' | 'text' - Display full logo with text, icon only, or text only
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl' - Size variant
 * @param {boolean} link - Whether to wrap in Link to homepage
 * @param {boolean} showTagline - Whether to show "TRADE. TRUST. THRIVE." tagline
 * @param {string} direction - 'vertical' | 'horizontal' - Layout direction (default: 'vertical')
 * @param {string} className - Additional CSS classes
 */
export function Logo({
  type = 'full',
  size = 'md',
  link = true,
  showTagline = false,
  direction = 'vertical',
  className = ''
}) {
  const sizeClasses = {
    sm: {
      icon: 'w-8 h-8',
      text: 'text-os-lg',
      tagline: 'text-os-xs',
      gap: 'gap-2'
    },
    md: {
      icon: 'w-10 h-10',
      text: 'text-os-xl',
      tagline: 'text-os-sm',
      gap: 'gap-2'
    },
    lg: {
      icon: 'w-12 h-12',
      text: 'text-os-2xl',
      tagline: 'text-os-base',
      gap: 'gap-3'
    },
    xl: {
      icon: 'w-16 h-16',
      text: 'text-3xl',
      tagline: 'text-os-lg',
      gap: 'gap-4'
    }
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  // Logo SVG - Official Afrikoni Geometric Mark (2026 Edition)
  const LogoIcon = () => (
    <svg
      viewBox="0 0 100 100"
      className={sizes.icon}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. TOP ROOF (Nested Chevrons) */}
      <path
        d="M15 40 L50 15 L85 40 M28 40 L50 25 L72 40"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. CIRCULAR BASE */}
      <path
        d="M20 50 A30 30 0 1 0 80 50"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* 3. CENTER MOTIF (Interlocking Arches) */}
      <path
        d="M38 65 C38 50, 48 50, 50 60 C52 50, 62 50, 62 65"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M42 70 C42 60, 48 60, 50 68 C52 60, 58 60, 58 70"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* 4. BOTTOM DIAMOND */}
      <path
        d="M50 82 L53 85 L50 88 L47 85 Z"
        fill="currentColor"
      />

      {/* 5. TRIBAL PERIMETER (Zigzags) */}
      <path
        d="M25 65 L28 62 L31 65 L34 62 L37 65 M63 65 L66 62 L69 65 L72 62 L75 65"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 75 L32 72 L36 75 L40 72 L44 75 M56 75 L60 72 L64 75 L68 72 L72 75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M35 85 L40 82 L45 85 M55 85 L60 82 L65 85"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const logoContent = (
    <div className={cn(
      'flex',
      direction === 'horizontal' ? 'flex-row items-center' : 'flex-col items-center',
      sizes.gap,
      className
    )}>
      {/* Logo Icon */}
      {(type === 'full' || type === 'icon') && (
        <div className={cn(
          'flex items-center justify-center',
          'bg-gradient-to-br from-os-accent via-os-accentDark to-os-accent-900',
          'rounded-full',
          'shadow-os-md shadow-os-accent-900/50',
          'border-2 border-os-accentLight/60',
          'p-2',
          'flex-shrink-0',
          'ring-2 ring-os-accent/20'
        )}>
          <div className="text-os-accent drop-shadow-os-md">
            <LogoIcon />
          </div>
        </div>
      )}

      {/* Logo Text - Only show if type is 'full' or 'text' */}
      {(type === 'full' || type === 'text') && (
        <div className={cn(
          'flex',
          direction === 'horizontal' ? 'flex-col items-start' : 'flex-col items-center'
        )}>
          <span className={cn(
            sizes.text,
            'font-bold bg-gradient-to-r from-os-accent via-os-accentDark to-os-accent',
            'bg-clip-text text-transparent',
            'tracking-tight',
            'font-serif',
            'whitespace-nowrap'
          )}>
            AFRIKONI
          </span>
          {showTagline && (
            <span className={cn(
              sizes.tagline,
              'text-os-accentDark',
              'font-medium',
              'tracking-wide',
              direction === 'horizontal' ? 'mt-0' : 'mt-0.5'
            )}>
              TRADE. TRUST. THRIVE.
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (link) {
    return (
      <Link to="/" className="inline-block">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

export default Logo;
