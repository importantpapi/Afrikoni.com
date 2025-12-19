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
import { ArrowLeft, Send, Paperclip, CheckCircle, Building2, MapPin, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ChatBubble from './ChatBubble';
import SupplierHeaderCard from './SupplierHeaderCard';
import QuickReplies from './QuickReplies';
import { toast } from 'sonner';

export default function ConversationView({ conversationId, conversation, currentUser, companyId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
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
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_company_id: companyId,
          content: text.trim(),
          message_type: 'text'
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
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-afrikoni-gold/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5 text-afrikoni-gold" />
          </button>
          
          {otherCompany && (
            <SupplierHeaderCard company={otherCompany} />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-afrikoni-gold" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-afrikoni-deep/60 text-center mb-4">
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
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                isOwn={message.sender_company_id === companyId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Replies (if no messages) */}
      {messages.length === 0 && otherCompany && (
        <div className="px-4 py-2 border-t border-afrikoni-gold/10">
          <QuickReplies
            onSelect={handleQuickReply}
            company={otherCompany}
            conversation={conversation}
          />
        </div>
      )}

      {/* Message Composer (Sticky) */}
      <div className="sticky bottom-0 bg-white border-t border-afrikoni-gold/20 px-4 py-3 pb-safe">
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
              className="min-h-[44px] text-base resize-none"
              disabled={isSending}
            />
          </div>
          <Button
            onClick={() => handleSendMessage(newMessage)}
            disabled={!newMessage.trim() || isSending}
            className="min-h-[44px] min-w-[44px] bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

