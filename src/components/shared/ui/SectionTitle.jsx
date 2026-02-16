/**
 * Premium Section Title Component - Afrikoni OS v2.5
 * Reusable section title with gold underline
 */
import React from 'react';

export default function SectionTitle({ children, className = '' }) {
  return (
    <h2 className={`text-os-lg md:text-os-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-os-accent pb-3 mb-6 ${className}`}>
      {children}
    </h2>
  );
}

