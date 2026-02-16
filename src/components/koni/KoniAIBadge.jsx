import React from 'react';

/**
 * KoniAI Badge - Small pill badge showing "Powered by KoniAI"
 */
export default function KoniAIBadge({ className = '' }) {
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        border border-os-accent/40 bg-os-accent/5
        text-os-xs font-medium text-afrikoni-chestnut
        hover:border-os-accent hover:bg-os-accent/10
        transition-all duration-200
        ${className}
      `}
    >
      <span className="text-os-accent">✨</span>
      <span>Powered by KoniAI</span>
    </div>
  );
}

