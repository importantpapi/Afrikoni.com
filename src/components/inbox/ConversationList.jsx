/**
 * Conversation List Component
 * 
 * WhatsApp-style conversation list with:
 * - Unread badges
 * - Last message preview
 * - Timestamps
 * - Company avatars
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/shared/ui/badge';
import { Building, CheckCircle } from 'lucide-react';

export default function ConversationList({ conversations, onSelectConversation, currentUserId }) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Building className="w-16 h-16 mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          No conversations yet
        </h3>
        <p className="text-sm text-center">
          Start a conversation by contacting a supplier or responding to an RFQ
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-afrikoni-gold/10">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          onClick={() => onSelectConversation(conv.id)}
          className="px-4 py-3 hover:bg-afrikoni-gold/5 active:bg-afrikoni-gold/10 transition-colors cursor-pointer min-h-[72px] flex items-center gap-3"
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br border-2 flex items-center justify-center">
              {conv.otherCompany?.logo_url ? (
                <img
                  src={conv.otherCompany.logo_url}
                  alt={conv.otherCompany.company_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Building className="w-6 h-6" />
              )}
            </div>
            {conv.otherCompany?.verification_status === 'verified' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center">
                <CheckCircle className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-base truncate">
                {conv.otherCompany?.company_name || 'Unknown Company'}
              </h3>
              {conv.lastMessageAt && (
                <span className="text-xs flex-shrink-0 ml-2">
                  {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <p className="text-sm truncate flex-1">
                {conv.lastMessage || 'No messages yet'}
              </p>
              {conv.unreadCount > 0 && (
                <Badge className="min-w-[20px] h-5 flex items-center justify-center text-xs font-semibold">
                  {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                </Badge>
              )}
            </div>

            {/* Verification Badge */}
            {conv.otherCompany?.verification_status === 'verified' && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Supplier
                </Badge>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

