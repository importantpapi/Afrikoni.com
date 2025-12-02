import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AIMessage({ role = 'assistant', text, className = '' }) {
  if (!text) return null;

  const isAssistant = role === 'assistant' || role === 'ai';

  return (
    <div
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} my-1 text-sm ${className}`}
    >
      <div
        className={`max-w-md rounded-2xl px-3 py-2 shadow-sm border ${
          isAssistant
            ? 'bg-afrikoni-offwhite border-afrikoni-gold/40 text-afrikoni-deep'
            : 'bg-afrikoni-gold text-afrikoni-chestnut border-afrikoni-goldDark'
        }`}
      >
        {isAssistant && (
          <div className="flex items-center gap-1 mb-1 text-[11px] uppercase tracking-wide">
            <Sparkles className="w-3 h-3 text-afrikoni-gold" />
            <span className="font-semibold text-afrikoni-deep/70">AI suggestion</span>
          </div>
        )}
        <p className="whitespace-pre-line text-xs md:text-sm leading-snug">{text}</p>
      </div>
    </div>
  );
}


