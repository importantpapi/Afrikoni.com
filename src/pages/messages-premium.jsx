import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Paperclip, Search, MoreVertical, Phone, Video, MapPin,
  Shield, CheckCircle, Clock, User, Verified, Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { notifyNewMessage } from '@/services/notificationService';

export default function MessagesPremium() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadUserAndConversations();
  }, []);

  useEffect(() => {
    const conversationParam = searchParams.get('conversation');
    if (conversationParam && conversations.length > 0) {
      setSelectedConversation(conversationParam);
    } else if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, searchParams]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadUserAndConversations = async () => {
    try {
      setIsLoading(true);
      const userData = await supabaseHelpers.auth.me();
      if (!userData) {
        navigate('/login');
        return;
      }

      setCurrentUser(userData);

      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const userCompanyId = await getOrCreateCompany(supabase, userData);
      setCompanyId(userCompanyId);

      // Load conversations
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          buyer_company:buyer_company_id(*),
          seller_company:seller_company_id(*)
        `)
        .or(`buyer_company_id.eq.${userCompanyId},seller_company_id.eq.${userCompanyId}`)
        .order('last_message_at', { ascending: false });

      if (error && error.code !== 'PGRST116') throw error;

      // Format conversations
      const formattedConversations = (conversationsData || []).map(conv => {
        const otherCompany = userCompanyId === conv.buyer_company_id 
          ? conv.seller_company 
          : conv.buyer_company;

        return {
          id: conv.id,
          otherCompany: otherCompany || {},
          lastMessage: conv.last_message || '',
          timestamp: conv.last_message_at,
          subject: conv.subject || '',
          verified: otherCompany?.verified || false,
          country: otherCompany?.country || '',
          role: otherCompany?.role || ''
        };
      });

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(messagesData || []);

      // Mark messages as read
      if (companyId) {
        const unreadMessages = messagesData?.filter(
          m => !m.read && m.receiver_company_id === companyId
        ) || [];

        for (const msg of unreadMessages) {
          await supabase
            .from('messages')
            .update({ read: true })
            .eq('id', msg.id);
        }

        // Refresh conversations to update unread counts
        loadUserAndConversations();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const [attachment, setAttachment] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { file_url } = await supabaseHelpers.storage.uploadFile(file, 'messages');
      setAttachment(file_url);
      toast.success('File attached');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !attachment) || !selectedConversation || !companyId) return;

    try {
      const selectedConv = conversations.find(c => c.id === selectedConversation);
      if (!selectedConv) return;

      const receiverCompanyId = companyId === selectedConv.otherCompany?.id 
        ? null 
        : selectedConv.otherCompany?.id;

      if (!receiverCompanyId) {
        toast.error('Cannot determine recipient');
        return;
      }

      // Insert message
      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_company_id: companyId,
          receiver_company_id: receiverCompanyId,
          sender_user_email: currentUser.email,
          content: newMessage.trim() || (attachment ? 'Sent an attachment' : ''),
          attachments: attachment ? [attachment] : null,
          read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: newMessage.trim() || (attachment ? 'Sent an attachment' : ''),
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedConversation);

      // Create notification
      await notifyNewMessage(newMsg.id, selectedConversation, receiverCompanyId, companyId);

      setMessages([...messages, newMsg]);
      setNewMessage('');
      setAttachment(null);

      // Refresh conversations
      loadUserAndConversations();

      // Auto-focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherCompany?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-afrikoni-offwhite flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-afrikoni-offwhite">
      {/* Header */}
      <div className="bg-afrikoni-offwhite border-b border-afrikoni-gold/20 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut">Messages</h1>
              <p className="text-sm text-afrikoni-deep">Communicate with your business partners</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info" className="text-xs">
                Protected by Afrikoni Trade Protection
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-1"
          >
            <Card className="h-full flex flex-col border-afrikoni-gold/20 shadow-md">
              {/* Search */}
              <div className="p-4 border-b border-afrikoni-gold/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-afrikoni-deep/70" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-afrikoni-deep/70">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-afrikoni-deep/50" />
                    <p className="text-sm">No conversations found</p>
                    <p className="text-xs mt-2">Start a conversation from a product, RFQ, or order</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    <AnimatePresence>
                      {filteredConversations.map((conv, idx) => {
                        const isSelected = selectedConversation === conv.id;
                        const unreadCount = messages.filter(
                          m => m.conversation_id === conv.id && 
                          !m.read && 
                          m.receiver_company_id === companyId
                        ).length;
                        
                        return (
                          <motion.button
                            key={conv.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                            onClick={() => setSelectedConversation(conv.id)}
                            className={`
                              w-full p-4 text-left transition-all hover:bg-afrikoni-offwhite
                              ${isSelected ? 'bg-afrikoni-offwhite border-l-4 border-afrikoni-gold' : ''}
                            `}
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                                  {conv.otherCompany?.logo_url ? (
                                    <img 
                                      src={conv.otherCompany.logo_url} 
                                      alt={conv.otherCompany.company_name}
                                      className="w-full h-full rounded-full object-cover"
                                    />
                                  ) : (
                                    <User className="w-6 h-6 text-afrikoni-gold" />
                                  )}
                                </div>
                                {conv.verified && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center border-2 border-afrikoni-offwhite">
                                    <Verified className="w-2.5 h-2.5 text-afrikoni-cream" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-afrikoni-chestnut text-sm truncate">
                                      {conv.otherCompany?.company_name || 'Unknown Company'}
                                    </span>
                                    {conv.verified && (
                                      <Badge variant="verified" className="text-xs px-1.5 py-0">✓</Badge>
                                    )}
                                  </div>
                                  {unreadCount > 0 && (
                                    <Badge variant="primary" className="text-xs min-w-[20px] h-5 flex items-center justify-center">
                                      {unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-afrikoni-deep truncate flex-1">
                                    {conv.lastMessage || conv.subject || 'No messages yet'}
                                  </p>
                                  <span className="text-xs text-afrikoni-deep/70 ml-2 flex-shrink-0">
                                    {conv.timestamp ? format(new Date(conv.timestamp), 'MMM d') : ''}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-afrikoni-deep/70 capitalize">{conv.role || ''}</span>
                                  {conv.country && (
                                    <>
                                      <span className="text-xs text-afrikoni-deep/70">•</span>
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-afrikoni-deep/70" />
                                        <span className="text-xs text-afrikoni-deep/70">{conv.country}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="h-full flex flex-col border-afrikoni-gold/20 shadow-md">
              {selectedConversation && selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-afrikoni-gold/20 bg-afrikoni-offwhite">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                            {selectedConv.otherCompany?.logo_url ? (
                              <img 
                                src={selectedConv.otherCompany.logo_url} 
                                alt={selectedConv.otherCompany.company_name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-afrikoni-gold" />
                            )}
                          </div>
                          {selectedConv.verified && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center border-2 border-white">
                              <Verified className="w-2.5 h-2.5 text-afrikoni-cream" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-afrikoni-chestnut">
                              {selectedConv.otherCompany?.company_name || 'Unknown Company'}
                            </h3>
                            {selectedConv.verified && (
                              <Badge variant="verified" className="text-xs">Verified</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-afrikoni-deep">
                            <span className="capitalize">{selectedConv.role || ''}</span>
                            {selectedConv.country && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{selectedConv.country}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tooltip content="Voice Call">
                          <Button variant="ghost" size="sm" className="p-2">
                            <Phone className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Video Call">
                          <Button variant="ghost" size="sm" className="p-2">
                            <Video className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Button variant="ghost" size="sm" className="p-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Protection Banner */}
                  <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-center gap-2 text-xs text-blue-900">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">Protected by Afrikoni Trade Protection</span>
                      <span className="text-blue-700">•</span>
                      <span className="text-blue-700">Do not send money outside the platform</span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-afrikoni-offwhite">
                    <AnimatePresence>
                      {messages.map((msg, idx) => {
                        const isMine = msg.sender_company_id === companyId;
                        const showAvatar = idx === 0 || messages[idx - 1].sender_company_id !== msg.sender_company_id;
                        
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}
                          >
                            {!isMine && showAvatar && (
                              <div className="w-8 h-8 bg-afrikoni-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-afrikoni-gold" />
                              </div>
                            )}
                            {!isMine && !showAvatar && <div className="w-8" />}
                            <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                              {showAvatar && !isMine && (
                                <span className="text-xs text-afrikoni-deep/70 mb-1 px-2">
                                  {selectedConv.otherCompany?.company_name || 'Supplier'}
                                </span>
                              )}
                              <div
                                className={`
                                  px-4 py-2.5 rounded-2xl shadow-sm
                                  ${isMine
                                    ? 'bg-afrikoni-gold text-afrikoni-cream rounded-br-md'
                                    : 'bg-afrikoni-offwhite text-afrikoni-chestnut border border-afrikoni-gold/20 rounded-bl-md'
                                  }
                                `}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                <div className={`flex items-center gap-1 mt-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                  <span className={`text-xs ${isMine ? 'text-afrikoni-cream/80' : 'text-afrikoni-deep/70'}`}>
                                    {format(new Date(msg.created_at), 'h:mm a')}
                                  </span>
                                  {isMine && (
                                    <span className="text-afrikoni-cream/80">
                                      {msg.read ? (
                                        <CheckCircle className="w-3 h-3" />
                                      ) : (
                                        <Clock className="w-3 h-3" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {isMine && <div className="w-8" />}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-afrikoni-gold/20 bg-afrikoni-offwhite">
                    <div className="flex items-end gap-2">
                      <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Tooltip content="Attach File">
                        <label htmlFor="file-upload">
                          <Button variant="ghost" size="sm" className="p-2 flex-shrink-0 cursor-pointer" asChild>
                            <span>
                              <Paperclip className="w-4 h-4" />
                            </span>
                          </Button>
                        </label>
                      </Tooltip>
                      {attachment && (
                        <div className="text-xs text-afrikoni-deep/70 flex items-center gap-2">
                          <span>File attached</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto"
                            onClick={() => setAttachment(null)}
                          >
                            ×
                          </Button>
                        </div>
                      )}
                      <div className="flex-1 relative">
                        <Input
                          ref={inputRef}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          className="pr-12"
                        />
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="flex-shrink-0"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </div>
                    <p className="text-xs text-afrikoni-deep/70 mt-2 text-center">
                      Press Enter to send • Shift+Enter for new line
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-afrikoni-deep/70">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-afrikoni-deep/50" />
                    <p className="text-lg font-semibold mb-2">No conversation selected</p>
                    <p className="text-sm">Select a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
