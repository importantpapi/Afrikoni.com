/**
 * WhatsApp-Style Mobile Inbox
 * 
 * Mobile-first inbox UI that feels like WhatsApp
 * - Conversation list with unread badges
 * - Chat-style conversation view
 * - Supplier cards with verification badges
 * - Quick reply buttons
 * - Sticky message composer
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import ConversationList from '@/components/inbox/ConversationList';
import ConversationView from '@/components/inbox/ConversationView';
import BrandClarityBanner from '@/components/shared/ui/BrandClarityBanner';
import { ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/shared/ui/input';

export default function InboxMobile() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [searchQuery, setSearchQuery] = useState('');

  // Use company_id from profile
  const companyId = profile?.company_id || null;

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[InboxMobile] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → redirect
    if (!user) {
      navigate('/login?redirect=/inbox-mobile');
      return;
    }

    // Now safe to load conversations
    if (companyId) {
      loadConversations();
      subscribeToConversations();
    }
  }, [authReady, authLoading, user, companyId, navigate]);

  // Handle RFQ and conversation parameters
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    const rfqId = searchParams.get('rfq');
    
    if (conversationId && conversations.length > 0) {
      // Direct conversation ID takes priority
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setSelectedConversation(conversationId);
      }
    } else if (rfqId && conversations.length > 0) {
      // Find conversation related to this RFQ
      const rfqConv = conversations.find(c => c.related_rfq_id === rfqId);
      if (rfqConv) {
        setSelectedConversation(rfqConv.id);
      }
    }
  }, [searchParams, conversations]);

  // User loaded from AuthProvider context (no need for separate loadUser)

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      
      // Load conversations where user is buyer or seller
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          buyer_company:companies!conversations_buyer_company_id_fkey(*),
          seller_company:companies!conversations_seller_company_id_fkey(*)
        `)
        .or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Transform conversations for display
      const transformed = (data || []).map(conv => {
        const otherCompany = conv.buyer_company_id === companyId 
          ? conv.seller_company 
          : conv.buyer_company;
        
        return {
          id: conv.id,
          otherCompany,
          lastMessage: conv.last_message || '',
          lastMessageAt: conv.last_message_at,
          unreadCount: conv.buyer_company_id === companyId 
            ? (conv.buyer_unread_count || 0)
            : (conv.seller_unread_count || 0),
          subject: conv.subject,
          related_rfq_id: conv.related_rfq_id,
          related_product_id: conv.related_product_id,
          is_system: conv.is_system || conv.seller_company_id === null,
          seller_company_id: conv.seller_company_id,
          buyer_company_id: conv.buyer_company_id,
        };
      });

      setConversations(transformed);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `buyer_company_id=eq.${companyId},seller_company_id=eq.${companyId}`
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.otherCompany?.company_name?.toLowerCase().includes(query) ||
      conv.subject?.toLowerCase().includes(query) ||
      conv.lastMessage?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-afrikoni-offwhite flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
      </div>
    );
  }

  // Show conversation view if one is selected
  if (selectedConversation) {
    const conversation = conversations.find(c => c.id === selectedConversation);
    return (
      <ConversationView
        conversationId={selectedConversation}
        conversation={conversation}
        currentUser={user}
        companyId={companyId}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  // Show conversation list
  return (
    <div className="min-h-screen bg-white md:bg-afrikoni-offwhite">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-afrikoni-gold/20 px-4 py-3">
        <h1 className="text-xl font-bold text-afrikoni-chestnut mb-3">
          Messages
        </h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-afrikoni-deep/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10 min-h-[44px] text-base"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ConversationList
        conversations={filteredConversations}
        onSelectConversation={setSelectedConversation}
        currentUserId={user?.id}
      />

      {/* Brand Clarity Banner (bottom of list) */}
      <div className="px-4 py-4 pb-safe">
        <BrandClarityBanner variant="compact" />
      </div>
    </div>
  );
}

