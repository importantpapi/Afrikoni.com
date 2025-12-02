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
      text: 'text-lg',
      tagline: 'text-xs',
      gap: 'gap-2'
    },
    md: {
      icon: 'w-10 h-10',
      text: 'text-xl',
      tagline: 'text-sm',
      gap: 'gap-2'
    },
    lg: {
      icon: 'w-12 h-12',
      text: 'text-2xl',
      tagline: 'text-base',
      gap: 'gap-3'
    },
    xl: {
      icon: 'w-16 h-16',
      text: 'text-3xl',
      tagline: 'text-lg',
      gap: 'gap-4'
    }
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  // Logo SVG - Stylized emblem with chevrons, intertwined W's, and geometric patterns
  const LogoIcon = () => (
    <svg
      viewBox="0 0 100 120"
      className={sizes.icon}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Chevron (Roof/Arrow) */}
      <path
        d="M50 10 L20 40 L80 40 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-afrikoni-gold"
      />
      {/* Inner Chevron */}
      <path
        d="M50 20 L30 40 L70 40 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-afrikoni-gold"
      />
      {/* Circular/Oval Structure */}
      <ellipse
        cx="50"
        cy="70"
        rx="30"
        ry="25"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-afrikoni-gold"
      />
      {/* Intertwined W's Pattern (simplified knot pattern) */}
      <path
        d="M35 60 Q40 70, 50 65 Q60 70, 65 60 Q60 75, 50 70 Q40 75, 35 60"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-afrikoni-gold"
      />
      <path
        d="M35 80 Q40 70, 50 75 Q60 70, 65 80 Q60 65, 50 70 Q40 65, 35 80"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-afrikoni-gold"
      />
      {/* Geometric Pattern Band (triangles and lines) */}
      <g className="text-afrikoni-gold">
        {/* Triangles */}
        <path d="M40 90 L42 95 L38 95 Z" fill="currentColor" />
        <path d="M45 90 L47 95 L43 95 Z" fill="currentColor" />
        <path d="M50 90 L52 95 L48 95 Z" fill="currentColor" />
        <path d="M55 90 L57 95 L53 95 Z" fill="currentColor" />
        <path d="M60 90 L62 95 L58 95 Z" fill="currentColor" />
        {/* Vertical Lines */}
        <line x1="42" y1="90" x2="42" y2="95" stroke="currentColor" strokeWidth="1.5" />
        <line x1="47" y1="90" x2="47" y2="95" stroke="currentColor" strokeWidth="1.5" />
        <line x1="52" y1="90" x2="52" y2="95" stroke="currentColor" strokeWidth="1.5" />
        <line x1="57" y1="90" x2="57" y2="95" stroke="currentColor" strokeWidth="1.5" />
      </g>
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
          'bg-gradient-to-br from-afrikoni-gold via-afrikoni-goldDark to-afrikoni-gold-900',
          'rounded-full',
          'shadow-lg shadow-afrikoni-gold-900/30',
          'border-2 border-afrikoni-goldLight/40',
          'p-2',
          'flex-shrink-0'
        )}>
          <div className="text-afrikoni-gold/20">
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
            'font-bold bg-gradient-to-r from-afrikoni-gold via-afrikoni-goldDark to-afrikoni-gold',
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
              'text-afrikoni-goldDark',
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
