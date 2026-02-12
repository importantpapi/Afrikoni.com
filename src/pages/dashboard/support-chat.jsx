/**
 * Live Support Chat
 * Creates support tickets and sends messages directly to admin team
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, X, Clock, CheckCircle, AlertCircle, Hash, Copy, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Textarea } from '@/components/shared/ui/textarea';
import { Badge } from '@/components/shared/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/shared/ui/dialog';
import { toast } from 'sonner';
// NOTE: DashboardLayout is provided by WorkspaceDashboard - don't import here
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import { format } from 'date-fns';
import RequireCapability from '@/guards/RequireCapability';

function SupportChatInner() {
  // ✅ KERNEL MIGRATION: Use unified Dashboard Kernel
  const { profileCompanyId, userId, user, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ticketNumber, setTicketNumber] = useState(null);
  const [ticketStatus, setTicketStatus] = useState('open');
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showTicketInfo, setShowTicketInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // ✅ KERNEL MIGRATION: Use isSystemReady for loading state
  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerWithTimeout message="Loading support chat..." ready={isSystemReady} />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Check if user is authenticated
  if (!userId) {
    navigate('/login');
    return null;
  }

  useEffect(() => {
    // ✅ KERNEL MIGRATION: Use canLoadData guard
    if (!canLoadData || !profileCompanyId) {
      return;
    }

    // Now safe to load data
    loadUserAndTicket();
  }, [canLoadData, profileCompanyId, userId, navigate]);

  useEffect(() => {
    if (ticketNumber) {
      loadMessages();
      const cleanup = setupRealtimeSubscription();
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [ticketNumber]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateTicketNumber = () => {
    const prefix = 'AFK';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const loadUserAndTicket = async () => {
    if (!canLoadData || !profileCompanyId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // ✅ KERNEL MIGRATION: Use profileCompanyId from kernel
      const cid = profileCompanyId;

      // Always create a new unique ticket for each user session
      // This ensures each person gets their own ticket, not shared tickets
      if (cid) {
        // ✅ KERNEL COMPLIANCE: Use user from kernel instead of direct auth API call
        const userEmail = user?.email || '';

        // Create new ticket - each user gets their own unique ticket
        const newTicketNumber = generateTicketNumber();
        const { data: newTicket, error } = await supabase
          .from('support_tickets')
          .insert({
            ticket_number: newTicketNumber,
            company_id: cid,
            user_email: userEmail,
            subject: 'Support Request',
            status: 'open',
            priority: 'normal'
          })
          .select()
          .single();

        if (error) {
          toast.error('Failed to create support ticket');
        } else {
          setTicketNumber(newTicketNumber);
          setTicketStatus('open');
          toast.success(`Your support ticket: ${newTicketNumber}`);

          // Send notification to admin when new ticket is created - Fix: Find admin users
          try {
            // Find admin users to notify
            const { data: adminUsers } = await supabase
              .from('profiles')
              .select('id, email')
              .eq('is_admin', true)
              .limit(10);

            if (adminUsers && adminUsers.length > 0) {
              const { createNotification } = await import('@/services/notificationService');
              // Create notification for each admin
              await Promise.all(adminUsers.map(admin =>
                createNotification({
                  user_id: admin.id,
                  company_id: null,
                  user_email: admin.email || 'hello@afrikoni.com',
                  title: `New Support Ticket Created - ${newTicketNumber}`,
                  message: `A new support ticket has been created. Company: ${cid ? 'ID ' + cid : 'Unknown'}`,
                  type: 'support',
                  link: `/dashboard/support-chat?ticket=${newTicketNumber}`,
                  sendEmail: true
                }).catch(err => { /* silent error */ })
              ));
            } else {
              // Fallback: Create notification with email only
              const { createNotification } = await import('@/services/notificationService');
              await createNotification({
                user_id: null,
                company_id: null,
                user_email: 'hello@afrikoni.com',
                title: `New Support Ticket Created - ${newTicketNumber}`,
                message: `A new support ticket has been created by ${userEmail || 'User'}. Company: ${cid ? 'ID ' + cid : 'Unknown'}`,
                type: 'support',
                link: `/dashboard/support-chat?ticket=${newTicketNumber}`,
                sendEmail: true
              });
            }
          } catch (notifError) {
            /* silent error */
          }
        }
      } else {
        // No company ID - still create ticket with user email
        const newTicketNumber = generateTicketNumber();
        const { data: newTicket, error } = await supabase
          .from('support_tickets')
          .insert({
            ticket_number: newTicketNumber,
            company_id: null,
            user_email: userEmail || '',
            subject: 'Support Request',
            status: 'open',
            priority: 'normal'
          })
          .select()
          .single();

        if (error) {
          toast.error('Failed to create support ticket');
        } else {
          setTicketNumber(newTicketNumber);
          setTicketStatus('open');
          toast.success(`Your support ticket: ${newTicketNumber}`);
        }
      }
    } catch (error) {
      setError(error?.message || 'Failed to load support chat');
      toast.error('Failed to load support chat');
    } finally {
      setIsLoading(false);
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
    } catch (error) {
      /* silent error */
    }
  };

  const setupRealtimeSubscription = () => {
    if (!ticketNumber) return;

    const channel = supabase
      .channel(`support-${ticketNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_number=eq.${ticketNumber}`
        },
        (payload) => {
          // Check if message already exists to avoid duplicates
          setMessages(prev => {
            const exists = prev.some(m => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new];
          });
          scrollToBottom();

          // Show notification if message is from admin
          if (payload.new.sender_type === 'admin') {
            toast.info('New response from support team');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          /* silent success */
        } else if (status === 'CHANNEL_ERROR') {
          /* silent error */
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticketNumber || !profileCompanyId) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      // ✅ KERNEL COMPLIANCE: Use user from kernel instead of direct auth API call
      const userEmail = user?.email || '';

      // Create support message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_number: ticketNumber,
          company_id: profileCompanyId,
          sender_type: 'user',
          sender_email: userEmail,
          message: newMessage.trim(),
          read: false
        });

      if (messageError) throw messageError;

      // Update ticket last activity
      await supabase
        .from('support_tickets')
        .update({
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('ticket_number', ticketNumber);

      // Send notification to admin - Fix: Create notification for admin users
      try {
        // Find admin users to notify
        const { data: adminUsers } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('is_admin', true)
          .limit(10);

        if (adminUsers && adminUsers.length > 0) {
          const { createNotification } = await import('@/services/notificationService');
          // Create notification for each admin
          await Promise.all(adminUsers.map(admin =>
            createNotification({
              user_id: admin.id,
              company_id: null,
              user_email: admin.email || 'hello@afrikoni.com',
              title: `New Support Message - ${ticketNumber}`,
              message: `New message from user: ${newMessage.trim().substring(0, 100)}...`,
              type: 'support',
              link: `/dashboard/support-chat?ticket=${ticketNumber}`,
              sendEmail: true
            }).catch(err => { /* silent error */ })
          ));
        } else {
          // Fallback: Create notification with email only
          const { createNotification } = await import('@/services/notificationService');
          await createNotification({
            user_id: null,
            company_id: null,
            user_email: 'hello@afrikoni.com',
            title: `New Support Message - ${ticketNumber}`,
            message: `New message from ${user.email || 'User'}: ${newMessage.trim().substring(0, 100)}...`,
            type: 'support',
            link: `/dashboard/support-chat?ticket=${ticketNumber}`,
            sendEmail: true
          });
        }
      } catch (notifError) {
        // Don't fail the message send if notification fails
      }

      setNewMessage('');

      // Reload messages to ensure UI is updated
      await loadMessages();

      toast.success('Message sent! Our team will respond soon.');
    } catch (error) {
      toast.error(`Failed to send message: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSending(false);
    }
  };

  const copyTicketNumber = () => {
    if (ticketNumber) {
      navigator.clipboard.writeText(ticketNumber);
      toast.success('Ticket number copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" />
      </div>
    );
  }

  // ✅ KERNEL MIGRATION: Use ErrorState component for errors
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          loadUserAndTicket();
        }}
      />
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Live Support Chat
            </h1>
            <p className="">
              Chat directly with our support team. All messages are sent to hello@afrikoni.com
            </p>
          </div>
        </div>

        {/* Ticket Info Card */}
        {ticketNumber && (
          <Card className="bg-gradient-to-r">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg">
                    <Hash className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm mb-1">Support Ticket Number</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono">
                        {ticketNumber}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyTicketNumber}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-xs mt-1">
                      Save this number for reference. You'll receive email updates at {user?.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    ticketStatus === 'open' ? 'bg-green-100 text-green-700' :
                      ticketStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        ticketStatus === 'resolved' ? 'bg-gray-100 text-gray-700' :
                          'bg-amber-100 text-amber-700'
                  }>
                    {ticketStatus === 'open' ? 'Open' :
                      ticketStatus === 'in_progress' ? 'In Progress' :
                        ticketStatus === 'resolved' ? 'Resolved' :
                          'Pending'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTicketInfo(true)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat Interface */}
        <Card className="">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Support Chat
              </CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>Average response time: 1-2 hours</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages Area */}
            <div className="h-[500px] overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-12 h-12 mb-4" />
                  <p className="mb-2">No messages yet</p>
                  <p className="text-sm">
                    Start the conversation by sending a message below
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-lg p-3 ${message.sender_type === 'user'
                          ? 'bg-afrikoni-gold text-afrikoni-charcoal'
                          : 'bg-white border border-afrikoni-gold/20'
                        }`}>
                        <div className="flex items-start gap-2 mb-1">
                          {message.sender_type === 'admin' && (
                            <Badge className="text-xs">Support Team</Badge>
                          )}
                          {message.sender_type === 'user' && (
                            <Badge className="text-xs">You</Badge>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                        <div className="text-xs opacity-70 mt-2">
                          {format(new Date(message.created_at), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={3}
                  className="flex-1 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="hover:bg-afrikoni-goldDark"
                >
                  {isSending ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs mt-2">
                All messages are sent to our support team at hello@afrikoni.com. You'll receive email notifications when we respond.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Response Time</h3>
                  <p className="text-sm">
                    Our support team typically responds within 1-2 hours during business hours (Mon-Fri, 8AM-6PM WAT).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Ticket Tracking</h3>
                  <p className="text-sm">
                    Save your ticket number ({ticketNumber}) to track your request. You'll receive email updates on this ticket.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Details Modal */}
        <Dialog open={showTicketInfo} onOpenChange={setShowTicketInfo}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ticket Information</DialogTitle>
              <DialogClose onClose={() => setShowTicketInfo(false)} />
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Ticket Number</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold">{ticketNumber}</span>
                  <Button variant="ghost" size="sm" onClick={copyTicketNumber}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Status</label>
                <Badge className={
                  ticketStatus === 'open' ? 'bg-green-100 text-green-700' :
                    ticketStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                }>
                  {ticketStatus === 'open' ? 'Open' :
                    ticketStatus === 'in_progress' ? 'In Progress' :
                      'Resolved'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Your Email</label>
                <p className="">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Support Email</label>
                <p className="">hello@afrikoni.com</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default function SupportChat() {
  return (
    <>
      {/* PHASE 5B: Support chat is universal (any capability) */}
      <RequireCapability>
        <SupportChatInner />
      </RequireCapability>
    </>
  );
}
