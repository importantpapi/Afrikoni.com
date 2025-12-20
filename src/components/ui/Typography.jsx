/**
 * AFRIKONI TYPOGRAPHY COMPONENT
 * Institutional, Trust-driven, Enterprise-grade typography system
 * 
 * STRICT TYPOGRAPHIC ROLES - NO DEVIATIONS
 */

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * H1 - Hero / Page title
 * Desktop: 60px, Mobile: 40px
 * font-weight: 700, line-height: 1.1, letter-spacing: -0.02em
 */
export function H1({ children, className, ...props }) {
  return (
    <h1 
      className={cn(
        'text-h1-mobile md:text-h1 font-bold leading-[1.1] tracking-[-0.02em] text-afrikoni-text-dark',
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

/**
 * H2 - Section titles
 * Desktop: 40px, Mobile: 28px
 * font-weight: 600, line-height: 1.2
 */
export function H2({ children, className, ...props }) {
  return (
    <h2 
      className={cn(
        'text-h2-mobile md:text-h2 font-semibold leading-[1.2] text-afrikoni-text-dark',
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

/**
 * H3 - Subsections / Card titles
 * 22px
 * font-weight: 600, line-height: 1.3
 */
export function H3({ children, className, ...props }) {
  return (
    <h3 
      className={cn(
        'text-h3 font-semibold leading-[1.3] text-afrikoni-text-dark',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * Body - Primary text
 * 18px
 * font-weight: 400, line-height: 1.6
 */
export function Body({ children, className, ...props }) {
  return (
    <p 
      className={cn(
        'text-body font-normal leading-[1.6] text-afrikoni-text-dark',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Meta / Labels / Badges
 * 14px
 * font-weight: 500, letter-spacing: 0.02em
 */
export function Meta({ children, className, ...props }) {
  return (
    <span 
      className={cn(
        'text-meta font-medium leading-[1.5] tracking-[0.02em] text-afrikoni-text-dark/70',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

