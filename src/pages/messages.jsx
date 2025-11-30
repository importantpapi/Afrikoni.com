import React, { useState, useEffect } from 'react';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import { sanitizeString } from '@/utils/security';
import EmptyState from '@/components/ui/EmptyState';

export default function Messages() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const loadData = async () => {
    try {
      const userData = await supabaseHelpers.auth.me();
      setUser(userData);

      // Get or create company
      const { getOrCreateCompany } = await import('@/utils/companyHelper');
      const companyId = await getOrCreateCompany(supabase, userData);

      // Load conversations from conversations table
      let conversationsQuery = supabase
        .from('conversations')
        .select('*, buyer_company:buyer_company_id(*), seller_company:seller_company_id(*)')
        .or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`)
        .order('last_message_at', { ascending: false });

      const { data: conversationsData, error: convError } = await conversationsQuery;

      if (convError && convError.code !== 'PGRST116') {
        // Fallback to messages-based conversations
        const [messagesRes, companiesRes] = await Promise.all([
          supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(500),
          supabase.from('companies').select('*')
        ]);

        if (messagesRes.error) throw messagesRes.error;
        if (companiesRes.error) throw companiesRes.error;

        setCompanies(companiesRes.data || []);

        const convMap = new Map();
        const myMessages = companyId ? messagesRes.data?.filter(
          m => m.sender_company_id === companyId || m.receiver_company_id === companyId
        ) || [] : [];

        myMessages.forEach(msg => {
          const otherCompanyId = msg.sender_company_id === companyId
            ? msg.receiver_company_id
            : msg.sender_company_id;

          if (!convMap.has(msg.conversation_id)) {
            const otherCompany = companiesRes.data?.find(c => c.id === otherCompanyId);
            convMap.set(msg.conversation_id, {
              id: msg.conversation_id,
              otherCompany,
              lastMessage: msg,
              unreadCount: myMessages.filter(
                m => m.conversation_id === msg.conversation_id &&
                m.receiver_company_id === companyId &&
                !m.read
              ).length
            });
          }
        });

        setConversations(Array.from(convMap.values()));
      } else {
        // Use conversations table
        const companiesMap = new Map();
        const allCompanies = [
          ...(conversationsData?.map(c => c.buyer_company).filter(Boolean) || []),
          ...(conversationsData?.map(c => c.seller_company).filter(Boolean) || [])
        ];
        allCompanies.forEach(c => companiesMap.set(c.id, c));
        setCompanies(Array.from(companiesMap.values()));

        const formattedConversations = (conversationsData || []).map(conv => {
          const otherCompany = companyId === conv.buyer_company_id 
            ? conv.seller_company 
            : conv.buyer_company;

          return {
            id: conv.id,
            otherCompany,
            lastMessage: { content: conv.last_message, created_at: conv.last_message_at },
            unreadCount: 0 // Will be calculated from messages
          };
        });

        setConversations(formattedConversations);
      }
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      const unreadMessages = data?.filter(
        m => !m.read && m.receiver_company_id === user.company_id
      ) || [];

      for (const msg of unreadMessages) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('id', msg.id);
      }

      loadData(); // Refresh to update unread counts
    } catch (error) {
      // Error logged (removed for production)
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!selectedConversation) {
      toast.error('Please select a conversation');
      return;
    }

    try {
      const otherCompany = conversations.find(c => c.id === selectedConversation)?.otherCompany;
      if (!otherCompany) return;

      // Security: Sanitize message content and verify company ownership
      if (!user.company_id) {
        toast.error('Please complete onboarding to send messages');
        return;
      }
      
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation,
        sender_company_id: user.company_id, // Always from authenticated user
        receiver_company_id: otherCompany.id, // Validated by RLS
        sender_user_email: user.email,
        content: sanitizeString(newMessage), // Sanitize to prevent XSS
        read: false
      });

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        user_email: otherCompany.owner_email,
        company_id: otherCompany.id,
        title: 'New Message',
        message: `You received a new message from ${user.email}`,
        type: 'message',
        link: createPageUrl('Messages'),
        read: false
      });

      setNewMessage('');
      loadMessages(selectedConversation);
      loadData();
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to send message');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">Messages</h1>
          <p className="text-afrikoni-deep">Communicate with your business partners</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 h-[600px]">
          <div className="md:col-span-1">
            <Card className="border-afrikoni-gold/20 h-full flex flex-col">
              <CardContent className="p-0 flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-0">
                    <EmptyState 
                      type="messages"
                      title="No conversations yet"
                      description="Start a conversation with suppliers or buyers to begin trading."
                      cta="Browse Suppliers"
                      ctaLink="/suppliers"
                    />
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full p-4 text-left hover:bg-afrikoni-offwhite transition ${
                          selectedConversation === conv.id ? 'bg-amber-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-semibold text-afrikoni-chestnut">
                            {conv.otherCompany?.company_name || 'Unknown'}
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="bg-afrikoni-gold text-afrikoni-creamtext-xs rounded-full px-2 py-1">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-afrikoni-deep line-clamp-1">
                          {conv.lastMessage?.content}
                        </div>
                        <div className="text-xs text-afrikoni-deep/70 mt-1">
                          {new Date(conv.lastMessage?.created_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="border-afrikoni-gold/20 h-full flex flex-col">
              {selectedConversation ? (
                <>
                  <CardContent className="p-4 border-b border-afrikoni-gold/20">
                    <div className="font-semibold text-afrikoni-chestnut">
                      {selectedConv?.otherCompany?.company_name || 'Conversation'}
                    </div>
                  </CardContent>
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => {
                      const isMine = msg.sender_company_id === user.company_id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              isMine
                                ? 'bg-afrikoni-gold text-afrikoni-cream'
                                : 'bg-afrikoni-cream text-afrikoni-chestnut'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${isMine ? 'text-afrikoni-cream/80' : 'text-afrikoni-deep/70'}`}>
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                  <CardContent className="p-4 border-t border-afrikoni-gold/20">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                      />
                      <Button onClick={handleSendMessage} className="bg-afrikoni-gold hover:bg-amber-700">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center text-afrikoni-deep/70">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-afrikoni-deep/50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

