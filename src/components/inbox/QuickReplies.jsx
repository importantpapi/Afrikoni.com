/**
 * Quick Reply Buttons
 * 
 * WhatsApp-style quick action buttons
 * - Request docs
 * - Ask price
 * - Ask MOQ
 * - Start deal
 */

import React from 'react';
import { Button } from '@/components/shared/ui/button';
import { FileText, DollarSign, Package, Hand } from 'lucide-react';

const QUICK_REPLIES = [
  {
    label: 'Request Docs',
    icon: FileText,
    template: 'Hi! Could you please share product specifications and certifications?'
  },
  {
    label: 'Ask Price',
    icon: DollarSign,
    template: 'What is your best price for this quantity?'
  },
  {
    label: 'Ask MOQ',
    icon: Package,
    template: 'What is your minimum order quantity?'
  },
  {
    label: 'Start Deal',
    icon: Hand,
    template: 'I\'m interested in proceeding. Can we discuss terms?'
  }
];

export default function QuickReplies({ onSelect, company, conversation }) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_REPLIES.map((reply, idx) => {
        const Icon = reply.icon;
        return (
          <Button
            key={idx}
            variant="outline"
            onClick={() => onSelect(reply.template)}
            className="min-h-[44px] px-3 text-sm border-afrikoni-gold/40 hover:bg-afrikoni-gold/10"
          >
            <Icon className="w-4 h-4 mr-1.5" />
            {reply.label}
          </Button>
        );
      })}
    </div>
  );
}

