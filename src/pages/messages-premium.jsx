import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Paperclip, Search, MoreVertical, Phone, Video, MapPin,
  Shield, CheckCircle, CheckCircle2, Clock, User, Verified, Star, X, File, Image as ImageIcon,
  FileText, Download, Eye, Loader2, Sparkles, Globe, ShoppingCart, Receipt, Truck, Languages
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
import VirtualList from '@/components/ui/VirtualList';
import { AIDescriptionService } from '@/components/services/AIDescriptionService';
import { useLanguage } from '@/i18n/LanguageContext';
import { generateBuyerInquiry } from '@/ai/aiFunctions';
import OffPlatformDisclaimer from '@/components/OffPlatformDisclaimer';

export default function MessagesPremium() {
  const { t } = useLanguage();
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
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [productContext, setProductContext] = useState(null);

  const generateSmartInquiry = async (product) => {
    if (!product) return;
    
    setIsGeneratingAI(true);
    try {
      const result = await generateBuyerInquiry(product, {
        companyName: currentUser?.company_name || '',
        country: currentUser?.country || ''
      });
      
      if (result.success && result.message) {
        setNewMessage(result.message);
        toast.success('✨ Smart message draft generated! Review and edit as needed.');
      }
    } catch (error) {
      // Silently fail - AI is optional
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const createConversationWithRecipient = async (recipientCompanyId, productInfo = null) => {
    if (!companyId || !recipientCompanyId) return;
    
    try {
      // Get recipient company
      const { data: recipientCompany } = await supabase
        .from('companies')
        .select('*')
        .eq('id', recipientCompanyId)
        .single();

      if (!recipientCompany) {
        toast.error(t('messages.recipientNotFound'));
        return;
      }

      // Create subject based on product if available
      const subject = productInfo?.productTitle 
        ? `Inquiry about ${productInfo.productTitle}`
        : t('messages.newConversation');

      // Create conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          buyer_company_id: companyId,
          seller_company_id: recipientCompanyId,
          subject: subject,
          last_message: '',
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (convError) throw convError;

      setSelectedConversation(newConv.id);
      
      // If product context exists, generate smart message
      if (productInfo && productInfo.productId) {
        try {
          // Load product details
          const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', productInfo.productId)
            .single();
            
          if (product) {
            setProductContext(product);
            // Generate smart inquiry message
            generateSmartInquiry(product);
          }
        } catch (err) {
          // Silently fail - product loading is optional
        }
      }
      
      // Reload conversations
      loadUserAndConversations();
    } catch (error) {
      toast.error(t('messages.createError'));
    }
  };

  useEffect(() => {
    loadUserAndConversations();
  }, []);

  useEffect(() => {
    const conversationParam = searchParams.get('conversation');
    const recipientParam = searchParams.get('recipient');
    const productParam = searchParams.get('product');
    const productTitleParam = searchParams.get('productTitle');
    
    // Check for product context from sessionStorage (set by marketplace)
    const storedContext = sessionStorage.getItem('contactProductContext');
    let productInfo = null;
    if (storedContext) {
      try {
        productInfo = JSON.parse(storedContext);
        sessionStorage.removeItem('contactProductContext'); // Clear after use
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
    
    // Also check URL params
    if (productParam && productTitleParam) {
      productInfo = {
        productId: productParam,
        productTitle: decodeURIComponent(productTitleParam)
      };
    }
    
    if (conversationParam && Array.isArray(conversations) && conversations.length > 0) {
      setSelectedConversation(conversationParam);
    } else if (recipientParam && companyId) {
      // Find or create conversation with recipient
      const existingConv = Array.isArray(conversations) ? conversations.find(c => 
        c.otherCompany?.id === recipientParam
      ) : null;
      if (existingConv) {
        setSelectedConversation(existingConv.id);
        // Still generate smart message if product context exists
        if (productInfo && productInfo.productId) {
          supabase
            .from('products')
            .select('*')
            .eq('id', productInfo.productId)
            .single()
            .then(({ data: product }) => {
              if (product) {
                setProductContext(product);
                generateSmartInquiry(product);
              }
            });
        }
      } else {
        // Create new conversation with product context
        createConversationWithRecipient(recipientParam, productInfo);
      }
    } else if (Array.isArray(conversations) && conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, searchParams, companyId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation, 0, false);
      setHasMoreMessages(false); // Reset pagination state
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time subscription for new messages - creates notifications and shows toast
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_company_id=eq.${companyId}`
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // Get sender company info for toast
          let senderCompanyName = 'Someone';
          try {
            const { data: senderCompany } = await supabase
              .from('companies')
              .select('company_name')
              .eq('id', newMessage.sender_company_id)
              .maybeSingle();
            if (senderCompany) {
              senderCompanyName = senderCompany.company_name;
            }
          } catch (err) {
            // Ignore error
          }
          
          // If this message is for the currently selected conversation, add it to the UI
          if (newMessage.conversation_id === selectedConversation) {
            setMessages(prev => {
              const prevArray = Array.isArray(prev) ? prev : [];
              return [...prevArray, newMessage];
            });
            
            // Mark as read if viewing the conversation
            if (companyId === newMessage.receiver_company_id) {
              await supabase
                .from('messages')
                .update({ read: true })
                .eq('id', newMessage.id);
            }
            
            // Show toast notification (even if viewing conversation)
            toast.info(`New message from ${senderCompanyName}`, {
              description: newMessage.content?.substring(0, 50) + (newMessage.content?.length > 50 ? '...' : ''),
              action: {
                label: 'View',
                onClick: () => {
                  // Already viewing, just scroll to bottom
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
              }
            });
          } else {
            // Message is for a different conversation - show prominent toast
            toast.success(`New message from ${senderCompanyName}`, {
              description: newMessage.content?.substring(0, 50) + (newMessage.content?.length > 50 ? '...' : ''),
              duration: 5000,
              action: {
                label: 'Open',
                onClick: () => {
                  setSelectedConversation(newMessage.conversation_id);
                  navigate(`/messages?conversation=${newMessage.conversation_id}`);
                }
              }
            });
          }

          // Always create notification for new messages
          try {
            await notifyNewMessage(
              newMessage.id,
              newMessage.conversation_id,
              newMessage.receiver_company_id,
              newMessage.sender_company_id
            );
          } catch (error) {
            // Silently fail - notification might already exist or there's a duplicate
          }

          // Refresh conversations to update unread counts
          loadUserAndConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, selectedConversation, navigate]);

  const loadUserAndConversations = async () => {
    try {
      setIsLoading(true);
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
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

      setConversations(Array.isArray(formattedConversations) ? formattedConversations : []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error(error?.message || t('messages.loading') || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesPageSize = 50;

  const loadMessages = async (conversationId, page = 0, append = false) => {
    if (!conversationId) {
      console.warn('loadMessages called without conversationId');
      return;
    }
    
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(page * messagesPageSize, (page + 1) * messagesPageSize - 1);

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }

      const messages = messagesData || [];
      
      // Check if there are more messages
      setHasMoreMessages(messages.length === messagesPageSize);

      // Reverse to show oldest first (ascending order)
      const sortedMessages = [...messages].reverse();

      if (append) {
        setMessages(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          const sortedArray = Array.isArray(sortedMessages) ? sortedMessages : [];
          return [...sortedArray, ...prevArray];
        });
      } else {
        setMessages(Array.isArray(sortedMessages) ? sortedMessages : []);
      }

      // Mark messages as read
      if (companyId) {
        const unreadMessages = messages.filter(
          m => !m.read && m.receiver_company_id === companyId
        ) || [];

        if (unreadMessages.length > 0) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessages.map(m => m.id));
          
          if (updateError) {
            console.error('Error marking messages as read:', updateError);
          }
        }

        // Refresh conversations to update unread counts
        loadUserAndConversations();
      }
    } catch (error) {
      console.error('Error in loadMessages:', error);
      toast.error(error?.message || t('messages.loading') || 'Failed to load messages');
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMoreMessages || !selectedConversation) return;
    
    setLoadingMore(true);
    try {
      const currentPage = Math.floor(messages.length / messagesPageSize);
      await loadMessages(selectedConversation, currentPage, true);
    } finally {
      setLoadingMore(false);
    }
  };

  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState('en');
  const [deliveryTimeline, setDeliveryTimeline] = useState(null);
  const [aiDraft, setAiDraft] = useState('');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);

  // Currently selected conversation details, used by multiple hooks and render logic
  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const handleGenerateAISuggestions = useCallback(async () => {
    if (!selectedConversation || !selectedConv) {
      toast.error(t('messages.selectConversation'));
      return;
    }
    setIsGeneratingSuggestion(true);
    try {
      const lastMessage = messages[messages.length - 1];
      const context = {
        type: searchParams.get('rfq') ? 'rfq' : undefined,
        lastMessage: lastMessage?.content || '',
      };
      const suggestions = await AIDescriptionService.generateMessageSuggestions({
        role: 'buyer', // In future: infer from current user role / company
        context,
      });
      if (suggestions && suggestions.length > 0) {
        setAiDraft(suggestions[0]);
      }
      toast.success(t('messages.aiSuggestSuccess') || 'Afrikoni AI prepared a suggested message. You can edit it before sending.');
    } catch (error) {
      toast.error(t('messages.aiSuggestError') || 'Afrikoni AI could not generate a suggestion. Please try again.');
    } finally {
      setIsGeneratingSuggestion(false);
    }
  }, [messages, searchParams, selectedConversation, selectedConv, t]);

  // Typing indicator: send typing status
  const handleTyping = useCallback(() => {
    if (!selectedConversation || !companyId) return;
    
    setIsTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator via real-time (using a separate channel or payload)
    // For now, we'll use a simple debounce approach
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  }, [selectedConversation, companyId]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Validate files
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a supported file type`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    setUploadingFile(true);
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const { file_url } = await supabaseHelpers.storage.uploadFile(
          file,
          'messages',
          `${selectedConversation}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        );
        return {
          url: file_url,
          name: file.name,
          type: file.type,
          size: file.size
        };
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);
      toast.success(t('messages.filesAttached', { count: uploadedFiles.length }) || `${uploadedFiles.length} file(s) attached`);
    } catch (error) {
      toast.error(t('messages.uploadError') || 'Failed to upload file(s)');
      console.error('File upload error:', error);
    } finally {
      setUploadingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return ImageIcon;
    if (fileType === 'application/pdf') return FileText;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversation || !companyId) {
      toast.error('Please enter a message or attach a file');
      return;
    }

    if (isSending) {
      return; // Prevent double-sending
    }

    setIsSending(true);
    try {
      const selectedConv = conversations.find(c => c.id === selectedConversation);
      if (!selectedConv) {
        toast.error('Conversation not found');
        return;
      }

      const receiverCompanyId = companyId === selectedConv.otherCompany?.id 
        ? null 
        : selectedConv.otherCompany?.id;

      if (!receiverCompanyId) {
        toast.error(t('messages.recipientNotFound'));
        return;
      }

      // Prepare payload with attachments
      const payload = attachments.length > 0 ? {
        attachments: attachments.map(att => ({
          url: att.url,
          name: att.name,
          type: att.type,
          size: att.size
        }))
      } : null;

      // Insert message
      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_company_id: companyId,
          receiver_company_id: receiverCompanyId,
          sender_user_email: currentUser.email,
          content: newMessage.trim() || (attachments.length > 0 ? `Sent ${attachments.length} file(s)` : ''),
          payload: payload,
          read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: newMessage.trim() || (attachments.length > 0 ? `Sent ${attachments.length} file(s)` : ''),
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedConversation);

      // Create notification
      await notifyNewMessage(newMsg.id, selectedConversation, receiverCompanyId, companyId);

      setMessages(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return [...prevArray, newMsg];
      });
      setNewMessage('');
      setAttachments([]);
      setIsTyping(false);

      // Show success toast
      toast.success(t('messages.sent') || 'Message sent successfully');

      // Refresh conversations
      loadUserAndConversations();

      // Auto-focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error?.message || t('messages.sendError') || 'Failed to send message. Please try again.';
      toast.error(errorMessage);
      
      // Log to Sentry in production
      if (import.meta.env.PROD) {
        import('@/utils/sentry').then(({ captureException }) => {
          captureException(error, { 
            context: { 
              conversationId: selectedConversation,
              companyId,
              hasAttachments: attachments.length > 0
            }
          });
        }).catch(() => {
          // Silently fail if Sentry is not available
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  // Filter messages by search query
  const filteredMessages = messageSearchQuery
    ? (Array.isArray(messages) ? messages.filter(msg =>
        msg.content?.toLowerCase().includes(messageSearchQuery.toLowerCase())
      ) : [])
    : (Array.isArray(messages) ? messages : []);

  const filteredConversations = Array.isArray(conversations) ? conversations.filter(conv =>
    conv.otherCompany?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

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

      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-6">
        <div className="grid lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)] md:h-[calc(100vh-180px)] lg:h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`${selectedConversation ? 'hidden lg:block' : 'lg:col-span-1'} lg:col-span-1`}
          >
            <Card className="h-full flex flex-col border-afrikoni-gold/20 shadow-md">
              {/* Search */}
              <div className="p-3 md:p-4 border-b border-afrikoni-gold/20">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-afrikoni-deep/70" />
                  <Input
                    placeholder={t('messages.searchConversations')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm md:text-base min-h-[44px] sm:min-h-0"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-afrikoni-deep/70">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-afrikoni-deep/50" />
                    <p className="text-sm">{t('messages.noConversations')}</p>
                    <p className="text-xs mt-2">Start a conversation from a product, RFQ, or order</p>
                  </div>
                ) : (
                  <VirtualList
                    items={filteredConversations}
                    itemHeight={96}
                    containerHeight={400}
                    className="h-full divide-y divide-afrikoni-gold/10"
                    getItemKey={(conv) => conv.id}
                    renderItem={(conv) => {
                      const isSelected = selectedConversation === conv.id;
                      const unreadCount = Array.isArray(messages) ? messages.filter(
                        m => m.conversation_id === conv.id && 
                        !m.read && 
                        m.receiver_company_id === companyId
                      ).length : 0;

                      return (
                        <button
                          onClick={() => setSelectedConversation(conv.id)}
                          className={`
                            w-full p-3 sm:p-4 text-left transition-all hover:bg-afrikoni-offwhite min-h-[60px] sm:min-h-0
                            ${isSelected ? 'bg-afrikoni-offwhite border-l-4 border-afrikoni-gold' : ''}
                          `}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                                {conv.otherCompany?.logo_url ? (
                                  <img 
                                    src={conv.otherCompany.logo_url} 
                                    alt={conv.otherCompany.company_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-afrikoni-gold" />
                                )}
                              </div>
                              {conv.verified && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-afrikoni-gold rounded-full flex items-center justify-center border-2 border-afrikoni-offwhite">
                                  <Verified className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-afrikoni-chestnut" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1 gap-2">
                                <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                  <span className="font-semibold text-afrikoni-chestnut text-xs sm:text-sm truncate">
                                    {conv.otherCompany?.company_name || 'Unknown Company'}
                                  </span>
                                  {conv.verified && (
                                    <Badge variant="verified" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 flex-shrink-0">✓</Badge>
                                  )}
                                </div>
                                {unreadCount > 0 && (
                                  <Badge className="bg-afrikoni-gold text-afrikoni-charcoal text-[10px] sm:text-xs min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center flex-shrink-0">
                                    {unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs sm:text-sm text-afrikoni-deep truncate flex-1">
                                  {conv.lastMessage || conv.subject || 'No messages yet'}
                                </p>
                                <span className="text-[10px] sm:text-xs text-afrikoni-deep/70 flex-shrink-0">
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
                        </button>
                      );
                    }}
                  />
                )}
              </div>
            </Card>
          </motion.div>

          {/* Chat Interface + AI helper */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`${selectedConversation ? 'lg:col-span-2' : 'hidden lg:block lg:col-span-2'} lg:col-span-2 flex flex-col xl:flex-row gap-3`}
          >
            <Card className="h-full flex flex-col border-afrikoni-gold/20 shadow-md flex-1">
              {selectedConversation && selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 md:p-4 border-b border-afrikoni-gold/20 bg-afrikoni-offwhite">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => setSelectedConversation(null)}
                          className="lg:hidden mr-2 p-1 hover:bg-afrikoni-gold/10 rounded"
                        >
                          ←
                        </button>
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
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-afrikoni-gold rounded-full flex items-center justify-center border-2 border-afrikoni-offwhite">
                              <Verified className="w-2.5 h-2.5 text-afrikoni-chestnut" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-afrikoni-chestnut truncate text-sm md:text-base">
                              {selectedConv.otherCompany?.company_name || 'Unknown Company'}
                            </h3>
                            {selectedConv.verified && (
                              <Badge variant="verified" className="text-xs flex-shrink-0">Verified</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-afrikoni-deep">
                            <span className="capitalize truncate">{selectedConv.role || ''}</span>
                            {selectedConv.country && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <MapPin className="w-3 h-3" />
                                  <span className="hidden sm:inline">{selectedConv.country}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                        <Tooltip content="Voice Call">
                          <Button variant="ghost" size="sm" className="p-1.5 md:p-2 hidden sm:flex">
                            <Phone className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Video Call">
                          <Button variant="ghost" size="sm" className="p-1.5 md:p-2 hidden sm:flex">
                            <Video className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Button variant="ghost" size="sm" className="p-1.5 md:p-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Protection Banner */}
                  <div className="px-4 py-2 bg-afrikoni-gold/10 border-b border-afrikoni-gold/20">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-afrikoni-chestnut">
                      <Shield className="w-4 h-4 text-afrikoni-gold flex-shrink-0" />
                      <span className="font-semibold">Protected by Afrikoni Trade Protection</span>
                      <span className="hidden sm:inline text-afrikoni-deep/70">•</span>
                      <span className="text-afrikoni-deep/70">{t('messages.safetyWarning') || 'Do not send money outside the platform'}</span>
                    </div>
                  </div>

                  {/* Off-Platform Disclaimer */}
                  <div className="px-4 py-3 border-b border-afrikoni-gold/20">
                    <OffPlatformDisclaimer variant="compact" />
                  </div>

                  {/* Message Search */}
                  {selectedConversation && (
                    <div className="px-4 py-2 border-b border-afrikoni-gold/20 bg-afrikoni-offwhite">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-afrikoni-deep/70" />
                        <Input
                          placeholder="Search messages in this conversation..."
                          value={messageSearchQuery}
                          onChange={(e) => setMessageSearchQuery(e.target.value)}
                          className="pl-10 text-sm"
                        />
                        {messageSearchQuery && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                            onClick={() => setMessageSearchQuery('')}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-afrikoni-offwhite">
                    {/* Load More Button - Show at top */}
                    {hasMoreMessages && (
                      <div className="flex justify-center py-2 sticky top-0 bg-afrikoni-offwhite z-10 -mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadMoreMessages}
                          disabled={loadingMore}
                          className="text-afrikoni-gold border-afrikoni-gold/30 hover:bg-afrikoni-gold/10"
                        >
                          {loadingMore ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            'Load Older Messages'
                          )}
                        </Button>
                      </div>
                    )}
                    
                    <AnimatePresence>
                      {Array.isArray(filteredMessages) && filteredMessages.map((msg, idx) => {
                        const isMine = msg.sender_company_id === companyId;
                        const prevMsg = idx > 0 ? filteredMessages[idx - 1] : null;
                        const showAvatar = !prevMsg || prevMsg.sender_company_id !== msg.sender_company_id;
                        const msgAttachments = msg.payload?.attachments || [];
                        
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
                                {selectedConv.otherCompany?.logo_url ? (
                                  <img 
                                    src={selectedConv.otherCompany.logo_url} 
                                    alt={selectedConv.otherCompany.company_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-afrikoni-gold" />
                                )}
                              </div>
                            )}
                            {!isMine && !showAvatar && <div className="w-8" />}
                            <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
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
                                    : 'bg-white text-afrikoni-chestnut border border-afrikoni-gold/20 rounded-bl-md'
                                  }
                                `}
                              >
                                {msg.content && (
                                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                )}
                                
                                {/* Attachments */}
                                {msgAttachments.length > 0 && (
                                  <div className={`mt-2 space-y-2 ${msg.content ? 'mt-3' : ''}`}>
                                    {msgAttachments.map((attachment, attIdx) => {
                                      const FileIcon = getFileIcon(attachment.type);
                                      const isImage = attachment.type?.startsWith('image/');
                                      
                                      return (
                                        <div
                                          key={attIdx}
                                          className={`
                                            rounded-lg overflow-hidden border
                                            ${isMine
                                              ? 'border-afrikoni-cream/30 bg-afrikoni-cream/10'
                                              : 'border-afrikoni-gold/30 bg-afrikoni-offwhite'
                                            }
                                          `}
                                        >
                                          {isImage ? (
                                            <a
                                              href={attachment.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block"
                                            >
                                              <img
                                                src={attachment.url}
                                                alt={attachment.name}
                                                className="max-w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                              />
                                            </a>
                                          ) : (
                                            <a
                                              href={attachment.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-3 p-3 hover:bg-afrikoni-gold/5 transition-colors"
                                            >
                                              <div className={`p-2 rounded-lg ${isMine ? 'bg-afrikoni-cream/20' : 'bg-afrikoni-gold/20'}`}>
                                                <FileIcon className={`w-5 h-5 ${isMine ? 'text-afrikoni-cream' : 'text-afrikoni-gold'}`} />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${isMine ? 'text-afrikoni-cream' : 'text-afrikoni-chestnut'}`}>
                                                  {attachment.name}
                                                </p>
                                                <p className={`text-xs ${isMine ? 'text-afrikoni-cream/70' : 'text-afrikoni-deep/70'}`}>
                                                  {formatFileSize(attachment.size || 0)}
                                                </p>
                                              </div>
                                              <Download className={`w-4 h-4 ${isMine ? 'text-afrikoni-cream/70' : 'text-afrikoni-gold/70'}`} />
                                            </a>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                
                                <div className={`flex items-center gap-1 mt-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                  <span className={`text-xs ${isMine ? 'text-afrikoni-cream/80' : 'text-afrikoni-deep/70'}`}>
                                    {(() => {
                                      const msgDate = new Date(msg.created_at);
                                      const today = new Date();
                                      const isToday = msgDate.toDateString() === today.toDateString();
                                      
                                      if (isToday) {
                                        return format(msgDate, 'h:mm a');
                                      } else {
                                        const isThisYear = msgDate.getFullYear() === today.getFullYear();
                                        return isThisYear 
                                          ? format(msgDate, 'MMM d, h:mm a')
                                          : format(msgDate, 'MMM d, yyyy h:mm a');
                                      }
                                    })()}
                                  </span>
                                  {isMine && (
                                    <Tooltip content={msg.read ? 'Read' : 'Sent'}>
                                      <span className="text-afrikoni-cream/80 cursor-help">
                                        {msg.read ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" title="Read" />
                                        ) : (
                                          <CheckCircle className="w-3.5 h-3.5 text-afrikoni-deep/50" title="Sent" />
                                        )}
                                      </span>
                                    </Tooltip>
                                  )}
                                  {!isMine && !msg.read && (
                                    <span className="w-2 h-2 bg-afrikoni-gold rounded-full" title="Unread" />
                                  )}
                                </div>
                              </div>
                            </div>
                            {isMine && <div className="w-8" />}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    
                    {/* Typing Indicator */}
                    {isTyping && selectedConv && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-start gap-2"
                      >
                        <div className="w-8 h-8 bg-afrikoni-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                          {selectedConv.otherCompany?.logo_url ? (
                            <img 
                              src={selectedConv.otherCompany.logo_url} 
                              alt={selectedConv.otherCompany.company_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-afrikoni-gold" />
                          )}
                        </div>
                        <div className="bg-white border border-afrikoni-gold/20 rounded-2xl rounded-bl-md px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-afrikoni-deep/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-afrikoni-deep/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-afrikoni-deep/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Attachments Preview */}
                  {attachments.length > 0 && (
                    <div className="px-4 py-2 border-t border-afrikoni-gold/20 bg-afrikoni-offwhite">
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((attachment, idx) => {
                          const FileIcon = getFileIcon(attachment.type);
                          const isImage = attachment.type?.startsWith('image/');
                          
                          return (
                            <div
                              key={idx}
                              className="relative group border border-afrikoni-gold/30 rounded-lg overflow-hidden bg-white"
                            >
                              {isImage ? (
                                <div className="relative">
                                  <img
                                    src={attachment.url}
                                    alt={attachment.name}
                                    className="w-20 h-20 object-cover"
                                  />
                                  <button
                                    onClick={() => removeAttachment(idx)}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 p-2 pr-8">
                                  <FileIcon className="w-4 h-4 text-afrikoni-gold" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-afrikoni-chestnut truncate max-w-[100px]">
                                      {attachment.name}
                                    </p>
                                    <p className="text-xs text-afrikoni-deep/70">
                                      {formatFileSize(attachment.size)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeAttachment(idx)}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Deal-Closing CTAs */}
                  {selectedConversation && messages.length > 0 && (
                    <div className="px-4 py-3 border-t border-afrikoni-gold/20 bg-gradient-to-r from-afrikoni-gold/5 to-afrikoni-purple/5">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-chestnut text-xs"
                          onClick={() => navigate('/dashboard/orders/new')}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          Proceed with Protected Order
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-afrikoni-gold/30 text-afrikoni-chestnut hover:bg-afrikoni-gold/10 text-xs"
                          onClick={() => navigate('/dashboard/rfqs/new')}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Request RFQ Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-afrikoni-gold/30 text-afrikoni-chestnut hover:bg-afrikoni-gold/10 text-xs"
                          onClick={() => navigate('/dashboard/invoices/new')}
                        >
                          <Receipt className="w-3 h-3 mr-1" />
                          Send Invoice through Escrow
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="p-2 md:p-3 lg:p-4 border-t border-afrikoni-gold/20 bg-afrikoni-offwhite">
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTranslation(!showTranslation)}
                        className="text-xs text-afrikoni-deep/70 hover:text-afrikoni-gold"
                      >
                        <Languages className="w-3 h-3 mr-1" />
                        {showTranslation ? 'Hide Translation' : 'Translate'}
                      </Button>
                      {showTranslation && (
                        <Select value={translationLanguage} onValueChange={setTranslationLanguage} className="w-32">
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="ar">العربية</SelectItem>
                            <SelectItem value="pt">Português</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="file-upload"
                        onChange={handleFileUpload}
                        className="hidden"
                        multiple
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                      />
                      <Tooltip content={t('messages.attachFile')}>
                        <label htmlFor="file-upload">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 md:p-2.5 flex-shrink-0 cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
                            disabled={uploadingFile}
                            asChild
                          >
                            <span>
                              {uploadingFile ? (
                                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                              ) : (
                                <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                              )}
                            </span>
                          </Button>
                        </label>
                      </Tooltip>
                      {productContext && (
                        <Tooltip content="Generate smart message with KoniAI">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateSmartInquiry(productContext)}
                            disabled={isGeneratingAI}
                            className="p-2 md:p-2.5 flex-shrink-0 touch-manipulation min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
                          >
                            {isGeneratingAI ? (
                              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-afrikoni-gold" />
                            ) : (
                              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-afrikoni-gold" />
                            )}
                          </Button>
                        </Tooltip>
                      )}
                      <div className="flex-1 relative min-w-0">
                        <Input
                          ref={inputRef}
                          value={newMessage}
                          onChange={handleInputChange}
                          onKeyPress={handleKeyPress}
                          placeholder={productContext ? `Ask about ${productContext.title}...` : t('messages.typeMessagePlaceholder')}
                          className="pr-10 md:pr-12 text-sm md:text-base min-h-[44px] md:min-h-0"
                        />
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSendMessage}
                        disabled={(!newMessage.trim() && attachments.length === 0) || uploadingFile || isSending}
                        className="flex-shrink-0 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 touch-manipulation"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-4 h-4 md:mr-2 animate-spin" />
                            <span className="hidden md:inline">Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 md:mr-2" />
                            <span className="hidden md:inline">{t('messages.send')}</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-afrikoni-deep/70 mt-2 text-center hidden sm:block">
                      Press Enter to send • Shift+Enter for new line • Max file size: 10MB
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

            {/* AI Assistant Panel (desktop-only) */}
            {selectedConversation && selectedConv && (
              <Card className="hidden xl:flex flex-col h-full w-80 border-afrikoni-gold/30 bg-white/95 shadow-md">
                <div className="p-3 border-b border-afrikoni-gold/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-afrikoni-gold/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-afrikoni-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-afrikoni-chestnut">Afrikoni AI</p>
                      <p className="text-[11px] text-afrikoni-deep/70">Helps you write clear, professional messages.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAiSuggestionsOpen(!aiSuggestionsOpen)}
                    className="text-xs text-afrikoni-deep/60 hover:text-afrikoni-gold"
                  >
                    {aiSuggestionsOpen ? 'Hide' : 'Show'}
                  </button>
                </div>
                {aiSuggestionsOpen && (
                  <CardContent className="flex-1 flex flex-col p-3 space-y-2">
                    <p className="text-[11px] text-afrikoni-deep/80">
                      Type your own idea or let Afrikoni AI suggest a message you can edit before sending.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isGeneratingSuggestion}
                      className="w-full flex items-center justify-center gap-1 text-xs border-afrikoni-gold/60 text-afrikoni-gold hover:bg-afrikoni-gold/10"
                      onClick={handleGenerateAISuggestions}
                    >
                      {isGeneratingSuggestion ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Thinking…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Suggest message
                        </>
                      )}
                    </Button>
                    <textarea
                      value={aiDraft}
                      onChange={(e) => setAiDraft(e.target.value)}
                      placeholder="Afrikoni AI suggestion will appear here. Adjust the tone, add quantities or translate before using."
                      className="flex-1 text-xs border border-afrikoni-gold/30 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-afrikoni-gold bg-afrikoni-offwhite/40"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!aiDraft.trim()}
                      className="w-full bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal text-xs"
                      onClick={() => {
                        setNewMessage(aiDraft);
                        inputRef.current?.focus();
                      }}
                    >
                      Use this in chat
                    </Button>
                  </CardContent>
                )}

                {/* Delivery Timeline Section */}
                <div className="p-3 border-t border-afrikoni-gold/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-4 h-4 text-afrikoni-gold" />
                    <p className="text-sm font-semibold text-afrikoni-chestnut">Delivery Timeline</p>
                  </div>
                  <div className="space-y-3">
                    {deliveryTimeline ? (
                      <div className="space-y-2">
                        {[
                          { step: 'Quote', status: 'completed', date: '2024-01-15' },
                          { step: 'Paid in Escrow', status: 'completed', date: '2024-01-16' },
                          { step: 'In Transit', status: 'active', date: '2024-01-18' },
                          { step: 'Delivered', status: 'pending', date: '2024-01-22' },
                          { step: 'Released', status: 'pending', date: '2024-01-23' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${
                              item.status === 'completed' ? 'bg-green-500' :
                              item.status === 'active' ? 'bg-afrikoni-gold' :
                              'bg-gray-300'
                            }`} />
                            <div className="flex-1">
                              <p className={`text-xs font-medium ${
                                item.status === 'completed' ? 'text-green-700' :
                                item.status === 'active' ? 'text-afrikoni-gold' :
                                'text-gray-500'
                              }`}>
                                {item.step}
                              </p>
                              <p className="text-[10px] text-afrikoni-deep/60">{item.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-afrikoni-deep/70">
                        No active orders. Timeline will appear when an order is placed.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
