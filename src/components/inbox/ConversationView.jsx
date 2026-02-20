/**
 * Conversation View Component
 * 
 * WhatsApp-style chat interface with:
 * - Chat bubbles (sent/received)
 * - Supplier header card
 * - Quick reply buttons
 * - Sticky message composer
 * - Real-time updates
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { format } from 'date-fns';
import { ArrowLeft, Send, Paperclip, CheckCircle, Building, MapPin, Clock, Star } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Card, CardContent } from '@/components/shared/ui/card';
import ChatBubble from './ChatBubble';
import SupplierHeaderCard from './SupplierHeaderCard';
import QuickReplies from './QuickReplies';
import SystemMessage from './SystemMessage';
import DealActions from './DealActions';
import { getKernelNextAction } from '@/services/tradeKernel';
import AntiBypassWarning from './AntiBypassWarning';
import { toast } from 'sonner';
import { notifyNewMessage } from '@/services/notificationService';

export default function ConversationView({ conversationId, conversation, currentUser, companyId, onBack }) {
  const [nextAction, setNextAction] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    // Fetch next-best-action from the kernel
    if (conversationId) {
      getKernelNextAction(conversationId).then((result) => {
        if (result && result.success && result.nextAction) {
          setNextAction(result.nextAction);
        } else {
          setNextAction(null);
        }
      });
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (text) => {
    if (!text?.trim()) return;

    setIsSending(true);
    try {
      // Get receiver company ID from conversation
      const receiverCompanyId = conversation.buyer_company_id === companyId
        ? conversation.seller_company_id
        : conversation.buyer_company_id;

      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_company_id: companyId,
          receiver_company_id: receiverCompanyId,
          content: text.trim(),
          message_type: 'text',
          read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation last message
      const isBuyer = conversation?.buyer_company_id === companyId;
      await supabase
        .from('conversations')
        .update({
          last_message: text.trim(),
          last_message_at: new Date().toISOString(),
          seller_unread_count: isBuyer ? 
            (conversation?.seller_unread_count || 0) + 1 : 0,
          buyer_unread_count: isBuyer ? 0 :
            (conversation?.buyer_unread_count || 0) + 1,
        })
        .eq('id', conversationId);

      // Create notification using smart notification logic
      // Check if this is the first message in the conversation
      const { data: messageCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', conversationId);
      
      const isFirstMessage = (messageCount?.length || 0) <= 1;
      
      // Use notifyNewMessage with smart logic
      // Since user is viewing this conversation, receiver should get notified
      await notifyNewMessage(
        newMsg.id,
        conversationId,
        receiverCompanyId,
        companyId,
        {
          activeConversationId: conversationId, // User is viewing this conversation
          isFirstMessage: isFirstMessage
        }
      );

      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickReply = (template) => {
    handleSendMessage(template);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const otherCompany = conversation?.otherCompany;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {otherCompany && (
            <SupplierHeaderCard company={otherCompany} />
          )}
        </div>
      </div>

      {/* Anti-Bypass Warning (first time only) */}
      <div className="px-4 pt-4">
        <AntiBypassWarning />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-center mb-4">
              No messages yet. Start the conversation!
            </p>
            {otherCompany && (
              <QuickReplies
                onSelect={handleQuickReply}
                company={otherCompany}
                conversation={conversation}
              />
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => {
              // System messages get special styling
              if (message.is_system || message.message_type === 'system') {
                return <SystemMessage key={message.id} message={message} />;
              }
              return (
                <ChatBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_company_id === companyId}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>


      {/* Next-Best-Action: Only show the single, contextually relevant action */}
      {nextAction && (
        <div className="px-4 py-3 border-t">
          <Button
            variant="accent"
            className="w-full h-12 text-os-base font-black uppercase tracking-widest rounded-os-sm"
            onClick={async () => {
              // For demo: try to transition to the next state if provided
              if (nextAction.nextState) {
                // Optionally, call a prop or context handler to trigger the transition
                // For now, just reload messages after a short delay
                setTimeout(() => loadMessages(), 1000);
              }
            }}
          >
            {nextAction.label || 'Proceed'}
          </Button>
        </div>
      )}

      {/* Quick Replies (if no messages and no next-best-action) */}
      {messages.length === 0 && otherCompany && !nextAction && (
        <div className="px-4 py-2 border-t">
          <QuickReplies
            onSelect={handleQuickReply}
            company={otherCompany}
            conversation={conversation}
          />
        </div>
      )}

      {/* Message Composer (Sticky) */}
      <div className="sticky bottom-0 border-t px-4 py-3 pb-safe">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(newMessage);
                }
              }}
              placeholder="Type a message..."
              className="min-h-[44px] text-os-base resize-none"
              disabled={isSending}
            />
          </div>
          <Button
            onClick={() => handleSendMessage(newMessage)}
            disabled={!newMessage.trim() || isSending}
            className="min-h-[44px] min-w-[44px] hover:bg-os-accentDark"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

