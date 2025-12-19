/**
 * Chat Bubble Component
 * 
 * WhatsApp-style message bubble
 * - Sent messages (right, gold)
 * - Received messages (left, white)
 * - Timestamps
 * - Read receipts (optional)
 */

import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';

export default function ChatBubble({ message, isOwn }) {
  const time = message.created_at 
    ? format(new Date(message.created_at), 'HH:mm')
    : '';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 ${
          isOwn
            ? 'bg-afrikoni-gold text-afrikoni-chestnut rounded-br-sm'
            : 'bg-white border border-afrikoni-gold/20 text-afrikoni-chestnut rounded-bl-sm'
        }`}
      >
        <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs opacity-70">
            {time}
          </span>
          {isOwn && (
            <CheckCircle2 className="w-3 h-3 opacity-70" />
          )}
        </div>
      </div>
    </div>
  );
}

