import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AIMessage({ role = 'assistant', text, className = '' }) {
  if (!text) return null;

  const isAssistant = role === 'assistant' || role === 'ai';

  return (
    <div
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} my-1 text-os-sm ${className}`}
    >
      <div
        className={`max-w-md rounded-os-md px-3 py-2 shadow-sm border ${
          isAssistant
            ? 'bg-afrikoni-offwhite border-os-accent/40 text-afrikoni-deep'
            : 'bg-os-accent text-afrikoni-chestnut border-os-accentDark'
        }`}
      >
        {isAssistant && (
          <div className="flex items-center gap-1 mb-1 text-os-xs uppercase tracking-wide">
            <Sparkles className="w-3 h-3 text-os-accent" />
            <span className="font-semibold text-afrikoni-deep/70">AI suggestion</span>
          </div>
        )}
        <p className="whitespace-pre-line text-os-xs md:text-os-sm leading-snug">{text}</p>
      </div>
    </div>
  );
}


