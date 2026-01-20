/**
 * Support Chat Sidebar Component
 * Fixed position sidebar for quick support access
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { getOrCreateCompany } from '@/utils/companyHelper';

export default function SupportChatSidebar() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ticketNumber, setTicketNumber] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading || !user) {
      return;
    }

    // Now safe to load ticket
    loadTicket();
  }, [authReady, authLoading, user?.id, profile?.company_id]); // ✅ Primitives only - prevents reload on token refresh

  useEffect(() => {
    if (ticketNumber && isOpen) {
      loadMessages();
      const cleanup = setupRealtimeSubscription();
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [ticketNumber, isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      markMessagesAsRead();
    }
  }, [messages, isOpen, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateTicketNumber = () => {
    const prefix = 'AFK';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const loadTicket = async () => {
    try {
      // Use auth from context (no duplicate call)
      const cid = profile?.company_id || null;
      if (!cid) {
        // Create company if doesn't exist
        const createdCid = await getOrCreateCompany(supabase, user);
        setCompanyId(createdCid);
      } else {
        setCompanyId(cid);
      }

      const finalCid = cid || profile?.company_id || null;

      if (finalCid) {
        // Find existing open ticket or create new one
        const { data: existingTicket } = await supabase
          .from('support_tickets')
          .select('ticket_number, status')
          .eq('company_id', finalCid)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingTicket) {
          setTicketNumber(existingTicket.ticket_number);
        } else {
          const newTicketNumber = generateTicketNumber();
          const { data: newTicket } = await supabase
            .from('support_tickets')
            .insert({
              ticket_number: newTicketNumber,
              company_id: finalCid,
              user_email: user?.email || '',
              subject: 'Support Request',
              status: 'open',
              priority: 'normal'
            })
            .select()
            .single();

          if (newTicket) {
            setTicketNumber(newTicketNumber);
          }
        }
      }
    } catch (error) {
      console.error('Error loading support chat:', error);
    }
  };

  const loadMessages = async () => {
    if (!ticketNumber) return;

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_number', ticketNumber)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Count unread messages
      const unread = (data || []).filter(m => !m.read && m.sender_type === 'admin').length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!ticketNumber) return;

    const channel = supabase
      .channel(`support-sidebar-${ticketNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_number=eq.${ticketNumber}`
        },
        (payload) => {
          setMessages(prev => {
            const exists = prev.some(m => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new];
          });
          
          if (payload.new.sender_type === 'admin') {
            setUnreadCount(prev => prev + 1);
            if (!isOpen) {
              toast.info('New message from support team');
            }
          }
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    if (!ticketNumber) return;

    try {
      await supabase
        .from('support_messages')
        .update({ read: true })
        .eq('ticket_number', ticketNumber)
        .eq('sender_type', 'admin')
        .eq('read', false);
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticketNumber || !companyId) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_number: ticketNumber,
          company_id: companyId,
          sender_type: 'user',
          sender_email: user.email,
          message: newMessage.trim(),
          read: false
        });

      if (messageError) throw messageError;

      await supabase
        .from('support_tickets')
        .update({
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('ticket_number', ticketNumber);

      // ✅ KERNEL COMPLIANCE: Use is_admin boolean instead of role string
      // Notify admin
      try {
        const { data: adminUsers } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('is_admin', true)
          .limit(10);

        if (adminUsers && adminUsers.length > 0) {
          const { createNotification } = await import('@/services/notificationService');
          await Promise.all(adminUsers.map(admin => 
            createNotification({
              user_id: admin.id,
              company_id: null,
              user_email: admin.email || 'hello@afrikoni.com',
              title: `New Support Message - ${ticketNumber}`,
              message: `New message from ${user.email || 'User'}: ${newMessage.trim().substring(0, 100)}...`,
              type: 'support',
              link: `/dashboard/admin/support-tickets?ticket=${ticketNumber}`,
              sendEmail: true
            }).catch(err => console.error('Failed to notify admin:', err))
          ));
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      setNewMessage('');
      await loadMessages();
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-chestnut rounded-full shadow-lg flex items-center justify-center transition-all"
        aria-label="Open Support Chat"
      >
        <MessageSquare className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </motion.button>

      {/* Sidebar Chat */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed right-0 top-0 h-full bg-white border-l border-afrikoni-gold/20 shadow-2xl z-50 flex flex-col ${
                isMinimized ? 'w-80' : 'w-96'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-afrikoni-gold/20 bg-afrikoni-cream/30">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-afrikoni-gold" />
                  <h3 className="font-semibold text-afrikoni-chestnut">Support Chat</h3>
                  {ticketNumber && (
                    <Badge className="text-xs bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30">
                      {ticketNumber}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1.5 hover:bg-afrikoni-gold/10 rounded transition-colors"
                    aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/dashboard/support-chat');
                    }}
                    className="p-1.5 hover:bg-afrikoni-gold/10 rounded transition-colors"
                    aria-label="Open Full Chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              {!isMinimized && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-afrikoni-offwhite/50">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-afrikoni-deep/70">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-afrikoni-gold/30" />
                      <p className="text-sm">Start a conversation with our support team</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.sender_type === 'user'
                              ? 'bg-afrikoni-gold text-afrikoni-chestnut'
                              : 'bg-white border border-afrikoni-gold/20 text-afrikoni-deep'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Input */}
              {!isMinimized && (
                <div className="p-4 border-t border-afrikoni-gold/20 bg-white">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      rows={2}
                      className="resize-none"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-chestnut"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-afrikoni-deep/60 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              )}
            </motion.div>

            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-40"
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

