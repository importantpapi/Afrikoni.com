/**
 * System Message Component
 * 
 * Special styling for system messages (RFQ status, expectations, etc.)
 */

import React from 'react';
import { Info, CheckCircle, Clock, Users, Lightbulb } from 'lucide-react';

export default function SystemMessage({ message }) {
  return (
    <div className="flex justify-center my-4">
      <div className="bg-afrikoni-gold/10 border border-afrikoni-gold/30 rounded-xl px-4 py-3 max-w-[85%]">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-afrikoni-chestnut whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
            {message.created_at && (
              <div className="text-xs text-afrikoni-deep/50 mt-2">
                {new Date(message.created_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

