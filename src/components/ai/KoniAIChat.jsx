/**
 * KoniAIChat - Global AI Trade Assistant Component
 *
 * A floating chat widget that provides AI-powered assistance throughout the Afrikoni platform.
 * Features:
 * - Persistent chat bubble in bottom-right corner
 * - Quick actions for common tasks
 * - Conversation history within session
 * - Context-aware responses based on current page
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  FileText,
  BarChart2,
  Search,
  Truck,
  TrendingUp,
  Loader2,
  ChevronDown,
  Minimize2,
  Bot,
  User,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { useLocation } from 'react-router-dom';
import KoniAIService, { QuickActions, SuggestedPrompts } from '@/services/KoniAIService';

// Icon mapping for quick actions
const IconMap = {
  FileText,
  BarChart2,
  Search,
  Truck,
  TrendingUp,
  MessageCircle
};

export default function KoniAIChat() {
  const { user, profile } = useAuth();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeName = profile?.full_name?.split(' ')[0] || 'there';
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hello ${welcomeName}! I'm KoniAI+, your intelligent trade assistant. I can help you create RFQs, analyze quotes, find suppliers, and navigate African trade. What can I help you with today?`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length, profile?.full_name]);

  // Send message to KoniAI
  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      // Prepare chat history for context
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const response = await KoniAIService.chat({
        message: messageText,
        history,
        context: {
          currentPage: location.pathname
        }
      });

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        actions: response.actions,
        suggestions: response.suggestions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('[KoniAIChat] Error:', error);

      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        isError: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Handle quick action click
  const handleQuickAction = (action) => {
    sendMessage(action.prompt);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  // Handle action button click from AI response
  const handleActionClick = (action) => {
    if (action.type === 'navigate' && action.data?.path) {
      window.location.href = action.data.path;
    } else if (action.type === 'create_rfq') {
      window.location.href = '/rfq-start';
    } else if (action.type === 'view_quotes') {
      window.location.href = '/dashboard/quotes';
    } else if (action.type === 'contact_support') {
      window.location.href = '/contact';
    }
  };

  // Render chat message
  const renderMessage = (message) => {
    const isUser = message.role === 'user';

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      >
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-afrikoni-gold' : 'bg-gradient-to-br from-amber-500 to-orange-600'
        }`}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
          <div className={`inline-block px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-afrikoni-gold text-white rounded-br-md'
              : message.isError
                ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md'
                : 'bg-stone-100 text-afrikoni-chestnut rounded-bl-md'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>

          {/* Action Buttons */}
          {message.actions && message.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleActionClick(action)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-afrikoni-gold bg-amber-50 hover:bg-amber-100 rounded-full transition-colors"
                >
                  {action.label}
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.suggestions.slice(0, 3).map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-xs text-afrikoni-deep bg-white border border-stone-200 hover:border-afrikoni-gold hover:text-afrikoni-gold rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p className={`text-[10px] text-stone-400 mt-1 ${isUser ? 'text-right' : ''}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-afrikoni-gold to-amber-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center group"
            aria-label="Open KoniAI+ Chat"
          >
            <Sparkles className="w-6 h-6 text-white" />
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-afrikoni-gold animate-ping opacity-25" />
            {/* Tooltip */}
            <span className="absolute right-full mr-3 px-3 py-1.5 bg-afrikoni-chestnut text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Ask KoniAI+
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? 'auto' : 'min(600px, 80vh)'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-stone-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-afrikoni-gold to-amber-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">KoniAI+</h3>
                  <p className="text-xs text-white/80">Your Trade Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
                >
                  {isMinimized ? (
                    <ChevronDown className="w-5 h-5 text-white rotate-180" />
                  ) : (
                    <Minimize2 className="w-5 h-5 text-white" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Chat Content (hidden when minimized) */}
            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
                  {messages.map(renderMessage)}

                  {/* Loading indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-stone-100 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-afrikoni-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-afrikoni-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-afrikoni-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions (shown only on initial state) */}
                {showQuickActions && messages.length <= 1 && (
                  <div className="px-4 py-3 border-t border-stone-200 bg-white">
                    <p className="text-xs text-stone-500 mb-2">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {QuickActions.slice(0, 4).map((action) => {
                        const Icon = IconMap[action.icon] || MessageCircle;
                        return (
                          <button
                            key={action.id}
                            onClick={() => handleQuickAction(action)}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-afrikoni-deep bg-stone-50 hover:bg-afrikoni-gold/10 hover:text-afrikoni-gold rounded-lg transition-colors text-left"
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-stone-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask about trade, RFQs, suppliers..."
                      className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-afrikoni-gold focus:ring-1 focus:ring-afrikoni-gold/20 placeholder:text-stone-400"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || isLoading}
                      className="px-4 py-2.5 bg-afrikoni-gold text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2 text-center">
                    Powered by KoniAI+ | Afrikoni Trade Intelligence
                  </p>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
