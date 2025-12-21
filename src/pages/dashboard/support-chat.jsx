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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getOrCreateCompany } from '@/utils/companyHelper';
import { format } from 'date-fns';
import RequireDashboardRole from '@/guards/RequireDashboardRole';

function SupportChatInner() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ticketNumber, setTicketNumber] = useState(null);
  const [ticketStatus, setTicketStatus] = useState('open');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [showTicketInfo, setShowTicketInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserAndTicket();
  }, []);

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
    try {
      setIsLoading(true);
      const { user: userData, profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      if (!userData) {
        navigate('/login');
        return;
      }

      setUser(profile || userData);
      const cid = await getOrCreateCompany(supabase, profile || userData);
      setCompanyId(cid);

      // Always create a new unique ticket for each user session
      // This ensures each person gets their own ticket, not shared tickets
      if (cid) {
        // Create new ticket - each user gets their own unique ticket
        const newTicketNumber = generateTicketNumber();
          const { data: newTicket, error } = await supabase
            .from('support_tickets')
            .insert({
              ticket_number: newTicketNumber,
              company_id: cid,
              user_email: userData.email,
              subject: 'Support Request',
              status: 'open',
              priority: 'normal'
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating ticket:', error);
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
                .eq('role', 'admin')
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
                    message: `A new support ticket has been created by ${userData.email || 'User'}. Company: ${cid ? 'ID ' + cid : 'Unknown'}`,
                    type: 'support',
                    link: `/dashboard/admin/support-tickets?ticket=${newTicketNumber}`,
                    sendEmail: true
                  }).catch(err => console.error('Failed to notify admin:', admin.email, err))
                ));
              } else {
                // Fallback: Create notification with email only
                const { createNotification } = await import('@/services/notificationService');
                await createNotification({
                  user_id: null,
                  company_id: null,
                  user_email: 'hello@afrikoni.com',
                  title: `New Support Ticket Created - ${newTicketNumber}`,
                  message: `A new support ticket has been created by ${userData.email || 'User'}. Company: ${cid ? 'ID ' + cid : 'Unknown'}`,
                  type: 'support',
                  link: `/dashboard/admin/support-tickets?ticket=${newTicketNumber}`,
                  sendEmail: true
                });
              }
            } catch (notifError) {
              console.error('Failed to send admin notification for new ticket:', notifError);
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
            user_email: userData.email,
            subject: 'Support Request',
            status: 'open',
            priority: 'normal'
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating ticket:', error);
          toast.error('Failed to create support ticket');
        } else {
          setTicketNumber(newTicketNumber);
          setTicketStatus('open');
          toast.success(`Your support ticket: ${newTicketNumber}`);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
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
      console.error('Error loading messages:', error);
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
          console.log('✅ Realtime subscription active for ticket:', ticketNumber);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription error');
        }
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticketNumber || !companyId) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      // Create support message
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
          .eq('role', 'admin')
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
              message: `New message from ${user.email || 'User'}: ${newMessage.trim().substring(0, 100)}...`,
              type: 'support',
              link: `/dashboard/admin/support-tickets?ticket=${ticketNumber}`,
              sendEmail: true
            }).catch(err => console.error('Failed to notify admin:', admin.email, err))
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
            link: `/dashboard/admin/support-tickets?ticket=${ticketNumber}`,
            sendEmail: true
          });
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't fail the message send if notification fails
      }

      setNewMessage('');
      
      // Reload messages to ensure UI is updated
      await loadMessages();
      
      toast.success('Message sent! Our team will respond soon.');
    } catch (error) {
      console.error('Error sending message:', error);
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-afrikoni-chestnut mb-2">
              Live Support Chat
            </h1>
            <p className="text-afrikoni-deep/70">
              Chat directly with our support team. All messages are sent to hello@afrikoni.com
            </p>
          </div>
        </div>

        {/* Ticket Info Card */}
        {ticketNumber && (
          <Card className="border-afrikoni-gold/20 bg-gradient-to-r from-afrikoni-gold/5 to-afrikoni-gold/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-afrikoni-gold/20 rounded-lg">
                    <Hash className="w-5 h-5 text-afrikoni-gold" />
                  </div>
                  <div>
                    <div className="text-sm text-afrikoni-deep/70 mb-1">Support Ticket Number</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-afrikoni-chestnut font-mono">
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
                    <div className="text-xs text-afrikoni-deep/60 mt-1">
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
        <Card className="border-afrikoni-gold/20">
          <CardHeader className="border-b border-afrikoni-gold/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-afrikoni-gold" />
                Support Chat
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-afrikoni-deep/70">
                <Clock className="w-4 h-4" />
                <span>Average response time: 1-2 hours</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages Area */}
            <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-afrikoni-offwhite/30">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="w-12 h-12 text-afrikoni-gold/50 mb-4" />
                  <p className="text-afrikoni-deep/70 mb-2">No messages yet</p>
                  <p className="text-sm text-afrikoni-deep/60">
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
                      <div className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender_type === 'user'
                          ? 'bg-afrikoni-gold text-afrikoni-charcoal'
                          : 'bg-white border border-afrikoni-gold/20'
                      }`}>
                        <div className="flex items-start gap-2 mb-1">
                          {message.sender_type === 'admin' && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">Support Team</Badge>
                          )}
                          {message.sender_type === 'user' && (
                            <Badge className="bg-afrikoni-gold/20 text-afrikoni-charcoal text-xs">You</Badge>
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
            <div className="p-4 border-t border-afrikoni-gold/10 bg-white">
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
                  className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal"
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
              <p className="text-xs text-afrikoni-deep/60 mt-2">
                All messages are sent to our support team at hello@afrikoni.com. You'll receive email notifications when we respond.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-afrikoni-gold flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-1">Response Time</h3>
                  <p className="text-sm text-afrikoni-deep/70">
                    Our support team typically responds within 1-2 hours during business hours (Mon-Fri, 8AM-6PM WAT).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-afrikoni-gold/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-afrikoni-chestnut mb-1">Ticket Tracking</h3>
                  <p className="text-sm text-afrikoni-deep/70">
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
                <label className="text-sm font-semibold text-afrikoni-deep/70 mb-1 block">Ticket Number</label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-afrikoni-chestnut">{ticketNumber}</span>
                  <Button variant="ghost" size="sm" onClick={copyTicketNumber}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-afrikoni-deep/70 mb-1 block">Status</label>
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
                <label className="text-sm font-semibold text-afrikoni-deep/70 mb-1 block">Your Email</label>
                <p className="text-afrikoni-deep">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-afrikoni-deep/70 mb-1 block">Support Email</label>
                <p className="text-afrikoni-deep">hello@afrikoni.com</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default function SupportChat() {
  return (
    <RequireDashboardRole allow={['buyer', 'seller', 'hybrid', 'logistics']}>
      <SupportChatInner />
    </RequireDashboardRole>
  );
}

