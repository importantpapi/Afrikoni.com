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
      <div className="border rounded-os-sm px-4 py-3 max-w-[85%]">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-os-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
            {message.created_at && (
              <div className="text-os-xs mt-2">
                {new Date(message.created_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

