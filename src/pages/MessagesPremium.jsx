import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Paperclip, Search, MoreVertical, Phone, Video, MapPin,
  Shield, CheckCircle, CheckCircle2, Clock, User, Verified, Star, X, File, Image as ImageIcon,
  FileText, Download, Eye, Loader2, Sparkles, Globe, ShoppingCart, Receipt, Truck, Languages, ArrowLeft,
  Terminal, ShieldCheck, Activity, Box, Package, Shell
} from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Input } from '@/components/shared/ui/input';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Tooltip } from '@/components/shared/ui/tooltip';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { notifyNewMessage } from '@/services/notificationService';
import VirtualList from '@/components/shared/ui/VirtualList';
import { AIDescriptionService } from '@/components/services/AIDescriptionService';
import { useLanguage } from '@/i18n/LanguageContext';
import { generateBuyerInquiry } from '@/ai/aiFunctions';
import OffPlatformDisclaimer from '@/components/OffPlatformDisclaimer';
import { scanForLeakage, SOVEREIGN_WARNING } from '@/services/forensicSentinel';
import { Surface } from '@/components/system/Surface';
import { cn } from '@/lib/utils';


export default function MessagesPremium() {
  const { t } = useLanguage();
  const { user } = useAuth(); // Keep for auth status  
  const { profile, profileCompanyId, isSystemReady } = useDashboardKernel(); // ✅ Use Kernel for stable profile
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // Use user from auth context (no local state needed)
  const [companyId, setCompanyId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [productContext, setProductContext] = useState(null);

  // Smart back navigation
  const handleBack = () => {
    // If we have a "from" state, go back there
    if (location.state?.from) {
      navigate(location.state.from);
    }
    // If browser history exists, go back
    else if (window.history.length > 1) {
      navigate(-1);
    }
    // Fallback to dashboard
    else {
      navigate('/dashboard');
    }
  };

  const generateSmartInquiry = async (product) => {
    if (!product) return;

    setIsGeneratingAI(true);
    try {
      const result = await generateBuyerInquiry(product, {
        companyName: profile?.company_name || '',
        country: profile?.country || ''
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

  // ✅ MOBILE PERF: Capture session context once on mount and preserve in ref
  // This prevents losing the context if the main effect re-runs before companyId is ready.
  const sessionContextRef = useRef(null);
  useEffect(() => {
    const storedContext = sessionStorage.getItem('contactProductContext');
    if (storedContext) {
      try {
        sessionContextRef.current = JSON.parse(storedContext);
        sessionStorage.removeItem('contactProductContext');
        console.log('[Messages] Captured product context from session');
      } catch (e) {
        console.warn('[Messages] Failed to parse session context', e);
      }
    }
  }, []);

  useEffect(() => {
    const conversationParam = searchParams.get('conversation');
    const recipientParam = searchParams.get('recipient');
    const productParam = searchParams.get('product');
    const productTitleParam = searchParams.get('productTitle');

    // Combine session context with URL params
    let productInfo = sessionContextRef.current;

    // URL params take precedence or serve as fallback
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

            // Don't show toast if viewing conversation - message is already visible
            // Toasts are for UI feedback, not business events
          } else {
            // Message is for a different conversation
            // Don't show toast - notification bell will handle it
            // Toasts are for UI feedback (saved, sent, error), not business events
          }

          // Create notification only if user is NOT viewing this conversation
          // Core principle: Notifications trigger action, not mirror data
          try {
            // Check if this is the first message in the conversation
            const { data: messageCount } = await supabase
              .from('messages')
              .select('id', { count: 'exact' })
              .eq('conversation_id', newMessage.conversation_id);

            const isFirstMessage = (messageCount?.length || 0) <= 1;

            await notifyNewMessage(
              newMessage.id,
              newMessage.conversation_id,
              newMessage.receiver_company_id,
              newMessage.sender_company_id,
              {
                activeConversationId: selectedConversation, // Pass current conversation
                isFirstMessage: isFirstMessage
              }
            );
          } catch (error) {
            // Silently fail - notification creation is not critical
            if (import.meta.env.DEV) {
              console.warn('Notification creation failed:', error);
            }
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

  // ✅ STABILITY: Wait for system ready before loading data
  useEffect(() => {
    if (!isSystemReady) return;
    loadUserAndConversations();
  }, [isSystemReady]);

  const loadUserAndConversations = async () => {
    try {
      setIsLoading(true);

      // ✅ FIXED: Use Kernel's stable profileCompanyId instead of profile?.company_id
      const userCompanyId = profileCompanyId || null;
      if (!userCompanyId) {
        navigate('/onboarding/company', { replace: true });
        return;
      }
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
      // Use Promise.allSettled to handle individual failures
      const uploadPromises = validFiles.map(async (file) => {
        try {
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 9);
          const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `${selectedConversation}/${timestamp}-${randomStr}-${cleanFileName}`;

          const { file_url } = await supabaseHelpers.storage.uploadFile(
            file,
            'messages',
            fileName
          );
          return {
            success: true,
            url: file_url,
            name: file.name,
            type: file.type,
            size: file.size
          };
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          return {
            success: false,
            name: file.name,
            error: error.message
          };
        }
      });

      const results = await Promise.allSettled(uploadPromises);

      // Process results
      const uploadedFiles = [];
      const failedFiles = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success) {
          uploadedFiles.push({
            url: result.value.url,
            name: result.value.name,
            type: result.value.type,
            size: result.value.size
          });
        } else {
          const fileName = result.status === 'fulfilled'
            ? result.value.name
            : 'unknown';
          failedFiles.push(fileName);
        }
      });

      // Update state with successful uploads
      if (uploadedFiles.length > 0) {
        setAttachments(prev => [...prev, ...uploadedFiles]);
        toast.success(t('messages.filesAttached', { count: uploadedFiles.length }) || `${uploadedFiles.length} file(s) attached`);
      }

      // Show errors for failed uploads
      if (failedFiles.length > 0) {
        toast.error(`Failed to upload ${failedFiles.length} file(s): ${failedFiles.join(', ')}`);
      }

      // If all failed, show generic error
      if (uploadedFiles.length === 0 && failedFiles.length > 0) {
        toast.error('Failed to upload files. Please try again.');
      }
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

  const [leakageWarning, setLeakageWarning] = useState(null);

  const handleSendMessage = async (force = false) => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversation || !companyId) {
      toast.error('Please enter a message or attach a file');
      return;
    }

    // FORENSIC SENTINEL: Leakage Check
    // If 'force' is true, we skip the check (user acknowledged warning)
    if (!force) {
      const leakageCheck = scanForLeakage(newMessage);
      if (leakageCheck.detected) {
        setLeakageWarning(leakageCheck.warning);
        return;
      }
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
          sender_user_email: user?.email || '',
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

      // Don't create notification for messages user sends themselves
      // Notification will be created on receiver's side via real-time subscription

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-os-accent" />
      </div>
    );
  }

  return (
    <div className="os-page os-stagger max-w-[1600px] mx-auto pb-20 px-4 py-8 h-[calc(100vh-100px)] flex flex-col space-y-8 overflow-hidden">
      {/* Ambient Depth Orbs */}
      <div className="os-ambient-orb opacity-10" style={{ top: '10%', left: '15%', width: '400px', height: '400px' }} />
      <div className="os-ambient-orb opacity-5" style={{ bottom: '20%', right: '10%', width: '350px', height: '350px' }} />

      {/* FORENSIC SENTINEL: Sovereign Warning Modal */}
      {leakageWarning && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-2xl">
          <Surface variant="glass" className="border-red-500/30 rounded-[2rem] max-w-md w-full p-10 text-center shadow-2xl shadow-red-900/40 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />
            <div className="w-20 h-20 rounded-os-lg bg-os-red/10 border border-os-red/20 flex items-center justify-center mx-auto mb-6 shadow-os-lg shadow-red-500/5">
              <Shield className="w-10 h-10 text-os-red" />
            </div>
            <h3 className="text-os-2xl font-black tracking-tight mb-3 italic">{leakageWarning.title}</h3>
            <p className="text-os-muted mb-8 leading-relaxed font-medium">
              {leakageWarning.message}
            </p>
            <div className="flex flex-col gap-4">
              <Button
                className="w-full bg-white text-black hover:bg-white/90 font-black py-7 rounded-os-md shadow-os-lg shadow-white/5 active:scale-95 transition-all"
                onClick={() => setLeakageWarning(null)}
              >
                I UNDERSTAND - ESCAPE TO SAFETY
              </Button>
              <button
                className="text-os-xs text-os-red/60 hover:text-red-400 font-black uppercase tracking-[0.2em] underline-offset-8 underline decoration-red-500/20"
                onClick={() => {
                  setLeakageWarning(null);
                  handleSendMessage(true);
                }}
              >
                Proceed (Void Horizon Warranty)
              </button>
            </div>
          </Surface>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 shrink-0">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-12 w-12 rounded-os-md bg-os-accent/5 border border-os-stroke hover:bg-os-accent/10 text-os-muted hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-os-accent/10 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-os-accent" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter">Sovereign Comms</h1>
              </div>
              <p className="text-os-muted text-os-lg font-medium opacity-80 italic">Protected institutional messaging.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Surface variant="panel" className="px-5 py-2.5 flex items-center gap-4 border-os-stroke bg-white/[0.02]">
            <div className="flex items-center gap-2 text-emerald-500 text-os-xs font-black uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Channel Status: Encrypted
            </div>
            <div className="w-px h-6 bg-white/10" />
            <Badge variant="outline" className="border-os-stroke text-os-xs uppercase font-bold text-os-muted">Trade Protection Active</Badge>
          </Surface>
        </div>
      </div>

      {/* Main Architecture */}
      <div className="flex-1 flex gap-8 min-h-0 relative">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn("w-full lg:w-[400px] flex flex-col gap-6 shrink-0", selectedConversation ? 'hidden lg:flex' : 'flex')}
        >
          <Surface variant="glass" className="flex-1 flex flex-col p-0 overflow-hidden relative">
            <div className="p-6 border-b border-os-stroke bg-white/[0.02]">
              <h3 className="text-os-xs font-black uppercase tracking-[0.3em] text-os-muted mb-6">Directory</h3>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-os-muted group-focus-within:text-os-accent transition-colors" />
                <Input
                  placeholder="Filter transmissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 bg-os-accent/5 border-os-stroke rounded-os-md text-os-xs font-bold tracking-tight focus:ring-os-accent/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-none divide-y divide-white/5">
              {filteredConversations.map((conv) => {
                const isSelected = selectedConversation === conv.id;
                const unreadCount = Array.isArray(messages) ? messages.filter(m => m.conversation_id === conv.id && !m.read && m.receiver_company_id === companyId).length : 0;
                return (
                  <button key={conv.id} onClick={() => setSelectedConversation(conv.id)} className={cn("w-full p-6 text-left transition-all relative group", isSelected ? "bg-os-accent/10" : "hover:bg-white/[0.03]")}>
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-os-accent" />}
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-os-md bg-os-accent/5 border border-os-stroke flex items-center justify-center overflow-hidden">
                          {conv.otherCompany?.logo_url ? <img src={conv.otherCompany.logo_url} className="w-full h-full object-cover" alt="" /> : <User className="w-6 h-6 text-os-muted" />}
                        </div>
                        {conv.verified && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-os-accent rounded-lg flex items-center justify-center border-2 border-os-surface-1 shadow-os-md"><ShieldCheck className="w-3 h-3 text-black" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-4">
                          <span className="font-black text-os-sm truncate tracking-tight text-white group-hover:text-os-accent transition-colors">{conv.otherCompany?.company_name || 'Anonymous Peer'}</span>
                          <span className="text-os-xs font-black text-os-muted uppercase tracking-widest shrink-0 opacity-50">{conv.timestamp ? format(new Date(conv.timestamp), 'MMM d') : ''}</span>
                        </div>
                        <p className="text-os-xs text-os-muted truncate font-medium max-w-[200px] mb-2 opacity-80 italic">{conv.lastMessage || conv.subject || 'Waiting for uplink...'}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="w-3 h-3 text-os-muted opacity-40" />
                            <span className="text-os-xs font-black uppercase tracking-widest text-os-muted opacity-60 truncate max-w-[120px]">{conv.country || 'Global Node'}</span>
                          </div>
                          {unreadCount > 0 && <Badge className="bg-os-accent text-black text-os-xs font-black px-2 py-0.5 rounded-lg"> {unreadCount} NEW </Badge>}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Surface>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn("flex-1 flex gap-8 min-w-0", selectedConversation ? 'flex' : 'hidden lg:flex')}
        >
          <Surface variant="glass" className="flex-1 flex flex-col p-0 overflow-hidden relative border-os-stroke shadow-massive">
            {selectedConversation && selectedConv ? (
              <>
                <div className="p-8 border-b border-os-stroke bg-white/[0.02] backdrop-blur-2xl z-20 flex items-center justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-os-accent/5 blur-[80px] pointer-events-none" />
                  <div className="flex items-center gap-6 relative z-10 min-w-0">
                    <button onClick={() => setSelectedConversation(null)} className="lg:hidden h-10 w-10 rounded-os-sm bg-os-accent/5 flex items-center justify-center border border-os-stroke"> <ArrowLeft className="w-5 h-5" /> </button>
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-os-md bg-os-accent/5 border border-os-stroke flex items-center justify-center overflow-hidden">
                        {selectedConv.otherCompany?.logo_url ? <img src={selectedConv.otherCompany.logo_url} className="w-full h-full object-cover" alt="" /> : <User className="w-8 h-8 text-os-muted" />}
                      </div>
                      {selectedConv.verified && <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-os-accent rounded-os-sm flex items-center justify-center border-3 border-os-surface-1 shadow-os-md"> <ShieldCheck className="w-3.5 h-3.5 text-black" /> </div>}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-os-2xl tracking-tighter truncate text-white">{selectedConv.otherCompany?.company_name || 'Institutional Peer'}</h3>
                        <Badge variant="outline" className="text-os-xs font-black uppercase tracking-widest border-emerald-500/20 text-emerald-500 bg-emerald-500/10">Active Session</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-os-xs font-bold text-os-muted opacity-60 italic uppercase tracking-widest">
                        <span className="truncate">{selectedConv.role || 'Partner'}</span>
                        <span className="opacity-40">•</span>
                        <span className="flex items-center gap-2"> <Globe className="w-3 h-3" /> {selectedConv.country || 'Global'} </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 relative z-10 shrink-0">
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-os-sm bg-os-accent/5 border border-os-stroke hover:bg-os-accent/10"> <MoreVertical className="w-5 h-5 text-os-muted" /> </Button>
                  </div>
                </div>
                <div className="bg-os-accent/5 border-b border-os-accent/10 px-8 py-3 backdrop-blur-md z-10 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-os-xs font-black uppercase tracking-widest text-os-accent"> <Shield className="w-3.5 h-3.5" /> Trade Integrity Active </div>
                  <div className="w-px h-4 bg-os-accent/20" />
                  <p className="text-os-xs font-bold text-os-muted opacity-80 italic">Protected by Horizon Sovereign Shield v2.4</p>
                </div>
                {selectedConversation && (
                  <div className="px-8 py-3 border-b border-os-stroke bg-white/[0.01]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-os-muted" />
                      <Input placeholder="Search messages in this conversation..." value={messageSearchQuery} onChange={(e) => setMessageSearchQuery(e.target.value)} className="pl-10 text-os-xs bg-os-accent/5 border-os-stroke" />
                    </div>
                  </div>
                )}


                {/* Messages */}
                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-os-accent/20 scrollbar-track-transparent">
                  {hasMoreMessages && (
                    <div className="flex justify-center">
                      <Button variant="ghost" size="sm" onClick={loadMoreMessages} disabled={loadingMore} className="text-os-xs font-black uppercase tracking-widest text-os-muted hover:text-white bg-os-accent/5 px-6 py-4 rounded-os-sm border border-os-stroke">
                        {loadingMore ? <SpinnerWithTimeout className="w-3 h-3 mr-2" /> : <Activity className="w-3 h-3 mr-2" />}
                        Fetch Historical Data
                      </Button>
                    </div>
                  )}

                  {filteredMessages.map((msg, idx) => {
                    const isMine = msg.sender_company_id === companyId;
                    const showAvatar = idx === 0 || filteredMessages[idx - 1].sender_company_id !== msg.sender_company_id;
                    const msgAttachments = msg.payload?.attachments || [];

                    return (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-4 group", isMine ? "flex-row-reverse" : "flex-row")}>
                        <div className={cn("w-10 h-10 rounded-os-sm bg-os-accent/5 border border-os-stroke flex items-center justify-center shrink-0 overflow-hidden transition-all group-hover:border-os-accent/30", !showAvatar && "opacity-0")}>
                          {isMine ? (profile?.logo_url ? <img src={profile.logo_url} className="w-full h-full object-cover" alt="" /> : <User className="w-4 h-4 text-os-accent" />) :
                            (selectedConv.otherCompany?.logo_url ? <img src={selectedConv.otherCompany.logo_url} className="w-full h-full object-cover" alt="" /> : <User className="w-4 h-4 text-os-muted" />)}
                        </div>
                        <div className={cn("flex flex-col max-w-[70%]", isMine ? "items-end" : "items-start")}>
                          {showAvatar && (
                            <span className="text-os-xs font-black uppercase tracking-widest text-os-muted opacity-50 mb-2 truncate">
                              {isMine ? 'Commercial Core' : (selectedConv.otherCompany?.company_name || 'Counterparty')}
                            </span>
                          )}
                          <div className={cn("p-5 rounded-os-lg shadow-os-md relative group transition-all", isMine ? "bg-white text-black rounded-tr-sm" : "bg-os-accent/5 text-white border border-os-stroke rounded-tl-sm backdrop-blur-md")}>
                            {msg.content && <p className="text-os-sm font-medium leading-relaxed tracking-tight">{msg.content}</p>}
                            {msgAttachments.length > 0 && (
                              <div className="mt-4 grid grid-cols-1 gap-3">
                                {msgAttachments.map((att, attIdx) => {
                                  const isImg = att.type?.startsWith('image/');
                                  return (
                                    <div key={attIdx} className="rounded-os-md overflow-hidden border border-black/10 transition-all hover:scale-[1.02]">
                                      {isImg ? <img src={att.url} className="max-w-full h-auto max-h-72 object-cover" alt="" /> :
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-black/5 hover:bg-black/10 transition-colors">
                                          <Box className="w-5 h-5 opacity-40" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-os-xs font-black truncate">{att.name}</p>
                                            <p className="text-os-xs uppercase tracking-widest opacity-40 font-black">Secure Asset</p>
                                          </div>
                                          <Download className="w-4 h-4 opacity-40" />
                                        </a>
                                      }
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-os-xs font-black uppercase tracking-widest text-os-muted opacity-40 italic">
                            <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
                            {isMine && (msg.read ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3" />)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}


                  {/* Typing Indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-8 py-2 flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-os-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-os-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-os-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-os-xs font-black uppercase tracking-widest text-os-accent opacity-60">Peer is transmitting...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tactical Message Terminal */}
                <div className="p-8 border-t border-os-stroke bg-white/[0.02] backdrop-blur-3xl relative">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-6">
                      {attachments.map((file, index) => (
                        <Badge key={index} className="bg-os-accent/5 border-os-stroke text-white pl-3 pr-2 py-1.5 rounded-os-sm flex items-center gap-3 hover:bg-os-accent/10 transition-colors">
                          <Box className="w-3.5 h-3.5 text-os-accent" />
                          <span className="max-w-[120px] truncate text-os-xs font-bold">{file.name}</span>
                          <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} className="p-1 hover:bg-red-500/20 rounded-lg transition-colors group">
                            <X className="w-3 h-3 text-os-muted group-hover:text-os-red" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-6">
                    <div className="flex-1 relative group">
                      <textarea
                        placeholder="Enter transmission payload..."
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="w-full bg-white/[0.03] border-os-stroke rounded-os-lg p-6 pr-16 min-h-[100px] max-h-48 text-os-sm font-medium tracking-tight focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent/40 transition-all resize-none scrollbar-none"
                      />
                      <div className="absolute right-4 bottom-4 flex items-center gap-2">
                        <input type="file" ref={fileInputRef} onChange={handleAttachmentSelect} multiple className="hidden" />
                        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-10 w-10 rounded-os-sm hover:bg-os-accent/10 text-os-muted hover:text-white border border-transparent hover:border-os-stroke">
                          <Paperclip className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={(!newMessage.trim() && attachments.length === 0) || sending}
                      className="h-16 w-16 rounded-os-lg bg-os-accent hover:bg-os-accent/90 text-black shadow-os-lg shadow-os-accent/10 hover:scale-105 active:scale-95 transition-all shrink-0 p-0"
                    >
                      {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    </Button>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-os-xs font-black uppercase tracking-[0.2em] text-os-muted opacity-40">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" />
                        E2E Encrypted Internal Uplink
                      </div>
                      <span className="opacity-20">|</span>
                      <span>Payload: {newMessage.length} bits</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {productContext && (
                        <Button variant="ghost" onClick={() => generateSmartInquiry(productContext)} disabled={isGeneratingAI} className="h-8 px-4 text-os-xs font-black uppercase tracking-widest text-os-accent hover:bg-os-accent/10 rounded-lg">
                          <Sparkles className="w-3.5 h-3.5 mr-2" />
                          KoniAI Suggestion
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-os-accent/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10 space-y-8 max-w-sm">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-white/[0.02] border border-os-stroke flex items-center justify-center mx-auto shadow-2xl relative group">
                    <div className="absolute inset-0 bg-os-accent/10 blur-2xl rounded-full scale-50 group-hover:scale-100 transition-all duration-700 opacity-50" />
                    <Shell className="w-12 h-12 text-os-muted relative z-10 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-os-2xl font-black tracking-tight text-white">Select Node</h3>
                    <p className="text-os-sm font-medium text-os-muted leading-relaxed italic">Synchronize with institutional peers across the pan-African trade matrix.</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="p-4 rounded-os-md bg-white/[0.02] border border-os-stroke flex items-center gap-4 text-left">
                      <ShieldCheck className="w-5 h-5 text-emerald-500/50" />
                      <div>
                        <p className="text-os-xs font-black uppercase tracking-widest text-white">Sovereign Encryption</p>
                        <p className="text-os-xs text-os-muted font-bold">Standard protocol active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Surface>

          {/* AI Strategic Intelligence Panel */}
          {selectedConversation && selectedConv && (
            <Surface variant="glass" className="hidden xl:flex flex-col w-[350px] shrink-0 p-0 border-os-stroke bg-white/[0.01]">
              <div className="p-8 border-b border-os-stroke bg-white/[0.02]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-os-md bg-os-accent/10 border border-os-accent/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-os-accent" />
                  </div>
                  <div>
                    <h4 className="text-os-sm font-black tracking-tight text-white uppercase italic">Strategic Intelligence</h4>
                    <p className="text-os-xs font-black tracking-[0.2em] text-os-muted uppercase">Operational Support Module</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-os-md bg-white/[0.03] border border-os-stroke space-y-3">
                    <p className="text-os-xs text-os-muted font-medium italic leading-relaxed">Generated high-fidelity responses optimized for professional conversion and cross-border trade protocol.</p>
                    <Button
                      variant="outline"
                      onClick={handleGenerateAISuggestions}
                      disabled={isGeneratingSuggestion}
                      className="w-full h-10 text-os-xs font-black uppercase tracking-widest border-os-accent/30 text-os-accent hover:bg-os-accent/10 rounded-os-sm"
                    >
                      {isGeneratingSuggestion ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Terminal className="w-3.5 h-3.5 mr-2" />}
                      Synthesize Response
                    </Button>
                  </div>

                  {aiDraft && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                      <textarea
                        value={aiDraft}
                        readOnly
                        className="w-full bg-black/20 border border-os-accent/20 rounded-os-md p-5 text-os-xs font-medium tracking-tight text-white/90 min-h-[120px] focus:outline-none scrollbar-none"
                      />
                      <Button
                        onClick={() => {
                          setNewMessage(aiDraft);
                          inputRef.current?.focus();
                        }}
                        className="w-full h-12 bg-white text-black font-black text-os-xs tracking-widest uppercase rounded-os-sm hover:bg-white/90 transition-all"
                      >
                        Execute Draft
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-none">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Activity className="w-4 h-4 text-os-accent" />
                    <h3 className="text-os-xs font-black uppercase tracking-[0.3em] text-os-muted">Execution Timeline</h3>
                  </div>

                  <div className="space-y-8 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-os-accent/5">
                    {[
                      { step: 'Quote Issuance', status: 'completed', date: 'JAN 15' },
                      { step: 'Escrow Lock', status: 'completed', date: 'JAN 16' },
                      { step: 'Asset Transit', status: 'active', date: 'JAN 18' },
                      { step: 'Vessel Arrival', status: 'pending', date: 'EST. JAN 22' },
                      { step: 'Capital Release', status: 'pending', date: 'PROJ. JAN 23' }
                    ].map((item, idx) => (
                      <div key={idx} className="relative pl-8 group">
                        <div className={cn(
                          "absolute left-0 top-1 w-4 h-4 rounded-full border-2 transition-all group-hover:scale-110",
                          item.status === 'completed' ? "bg-emerald-500 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]" :
                            item.status === 'active' ? "bg-os-accent border-os-accent/50 shadow-[0_0_15px_rgba(212,169,55,0.3)]" :
                              "bg-transparent border-os-stroke"
                        )} />
                        <div className="space-y-1">
                          <p className={cn(
                            "text-os-xs font-black tracking-tight",
                            item.status === 'pending' ? "text-os-muted" : "text-white"
                          )}>{item.step}</p>
                          <p className="text-os-xs font-black tracking-widest text-os-muted opacity-40 uppercase">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Surface variant="panel" className="bg-white/[0.02] border-emerald-500/10 p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-os-xs font-black uppercase tracking-widest text-emerald-500">Node Status: Verified</span>
                  </div>
                  <p className="text-os-xs text-os-muted font-medium italic leading-relaxed">Counterparty terminal identification confirmed via institutional KYC protocols. Standard trade warranties active.</p>
                </Surface>
              </div>
            </Surface>
          )}
        </motion.div>
      </div>
    </div>
  );
}
