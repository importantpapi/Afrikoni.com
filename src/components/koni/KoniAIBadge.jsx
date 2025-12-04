import React from 'react';

/**
 * KoniAI Badge - Small pill badge showing "Powered by KoniAI"
 */
export default function KoniAIBadge({ className = '' }) {
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        border border-afrikoni-gold/40 bg-afrikoni-gold/5
        text-xs font-medium text-afrikoni-chestnut
        hover:border-afrikoni-gold hover:bg-afrikoni-gold/10
        transition-all duration-200
        ${className}
      `}
    >
      <span className="text-afrikoni-gold">✨</span>
      <span>Powered by KoniAI</span>
    </div>
  );
}

