/**
 * Admin Support Tickets Management
 * View and respond to all support tickets from users
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Hash, Clock, CheckCircle, XCircle, Search, Filter,
  Mail, User, Building2, Calendar, AlertCircle, Copy, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { isAdmin } from '@/utils/permissions';
import { format } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/skeletons';
import { SpinnerWithTimeout } from '@/components/ui/SpinnerWithTimeout';
import AccessDenied from '@/components/AccessDenied';

export default function AdminSupportTickets() {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  const [isSending, setIsSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      console.log('[AdminSupportTickets] Waiting for auth to be ready...');
      return;
    }

    // GUARD: No user → set no access
    if (!user) {
      setHasAccess(false);
      setIsLoading(false);
      return;
    }

    // Check admin access
    const admin = isAdmin(user);
    setHasAccess(admin);
    setIsLoading(false);
    
    if (admin) {
      loadTickets();
    }
  }, [authReady, authLoading, user, profile, role]);

  useEffect(() => {
    if (statusFilter || searchQuery) {
      if (hasAccess && authReady) {
        loadTickets();
      }
    }
  }, [statusFilter, searchQuery, hasAccess, authReady]);

  useEffect(() => {
    const ticketParam = searchParams.get('ticket');
    if (ticketParam && tickets.length > 0) {
      const ticket = tickets.find(t => t.ticket_number === ticketParam);
      if (ticket) {
        setSelectedTicket(ticket);
        loadMessages(ticket.ticket_number);
      }
    }
  }, [searchParams, tickets]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.ticket_number);
      const cleanup = setupRealtimeSubscription(selectedTicket.ticket_number);
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          companies (
            id,
            company_name,
            email,
            country
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filtered = data || [];

      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        filtered = filtered.filter(t =>
          t.ticket_number?.toLowerCase().includes(queryLower) ||
          t.user_email?.toLowerCase().includes(queryLower) ||
          t.subject?.toLowerCase().includes(queryLower) ||
          t.companies?.company_name?.toLowerCase().includes(queryLower)
        );
      }

      setTickets(filtered);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (ticketNumber) => {
    if (!ticketNumber) return;

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_number', ticketNumber)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading admin support messages:', error);
        toast.error('Failed to load messages. Please refresh.');
        setMessages([]);
        return;
      }
      
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages. Please try again.');
      setMessages([]);
    }
  };

  const setupRealtimeSubscription = (ticketNumber) => {
    if (!ticketNumber) return null;

    let channel = null;

    try {
      channel = supabase
        .channel(`admin-support-${ticketNumber}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_messages',
            filter: `ticket_number=eq.${ticketNumber}`
          },
          (payload) => {
            try {
              if (!payload || !payload.new) {
                console.warn('Invalid payload received:', payload);
                return;
              }

              const newMessage = payload.new;
              
              // Check for duplicates
              setMessages(prev => {
                const prevArray = Array.isArray(prev) ? prev : [];
                const exists = prevArray.some(m => m && m.id === newMessage.id);
                if (exists) return prevArray;
                return [...prevArray, newMessage];
              });
            } catch (error) {
              console.error('Error processing realtime admin message:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Admin realtime subscription active for ticket:', ticketNumber);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error('❌ Admin realtime subscription error:', status);
          }
        });
    } catch (error) {
      console.error('Error setting up admin realtime subscription:', error);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removing admin realtime channel:', error);
        }
      }
    };
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      // Use auth from context (no duplicate call)

      // Create admin reply message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_number: selectedTicket.ticket_number,
          company_id: selectedTicket.company_id,
          sender_type: 'admin',
          sender_email: 'hello@afrikoni.com',
          sender_name: user?.full_name || 'Afrikoni Support',
          message: replyMessage.trim(),
          read: false
        });

      if (messageError) throw messageError;

      // Update ticket status and activity
      const newStatus = selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status;
      await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_replied_by: user.id
        })
        .eq('ticket_number', selectedTicket.ticket_number);

      // Send email notification to user
      try {
        const { createNotification } = await import('@/services/notificationService');
        await createNotification({
          company_id: selectedTicket.company_id,
          user_email: selectedTicket.user_email,
          title: `Support Response - ${selectedTicket.ticket_number}`,
          message: `You have a new response from our support team on ticket ${selectedTicket.ticket_number}`,
          type: 'support',
          link: `/dashboard/support-chat`,
          sendEmail: true
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      setReplyMessage('');
      toast.success('Reply sent successfully');
      await loadTickets();
      await loadMessages(selectedTicket.ticket_number);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (ticketNumber, newStatus) => {
    try {
      // Use auth from context (no duplicate call)
      
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          last_replied_by: user.id
        })
        .eq('ticket_number', ticketNumber);

      if (error) throw error;

      toast.success(`Ticket status updated to ${newStatus}`);
      await loadTickets();
      if (selectedTicket?.ticket_number === ticketNumber) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout currentRole="admin">
        <CardSkeleton count={3} />
      </DashboardLayout>
    );
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const ticket = selectedTicket;

  return (
    <DashboardLayout currentRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-afrikoni-chestnut mb-2">
                Support Tickets
              </h1>
              <p className="text-afrikoni-deep/70">
                Manage and respond to customer support tickets
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">Total</p>
                  <p className="text-2xl font-bold text-afrikoni-chestnut">{tickets.length}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-afrikoni-gold/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">Open</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tickets.filter(t => t.status === 'open').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-green-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {tickets.filter(t => t.status === 'in_progress').length}
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-afrikoni-deep/70 mb-1">Resolved</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {tickets.filter(t => t.status === 'resolved').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-gray-600/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-afrikoni-deep/50" />
                  <Input
                    placeholder="Search by ticket number, email, subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Tickets List */}
          <Card>
            <CardHeader>
              <CardTitle>All Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No support tickets"
                  description={searchQuery || statusFilter !== 'all' 
                    ? "Try adjusting your filters" 
                    : "Support tickets will appear here when users contact support"}
                />
              ) : (
                <div className="space-y-3">
                  {tickets.map((t) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedTicket?.ticket_number === t.ticket_number
                          ? 'border-afrikoni-gold bg-afrikoni-gold/5'
                          : 'border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-md'
                      }`}
                      onClick={() => {
                        setSelectedTicket(t);
                        loadMessages(t.ticket_number);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Hash className="w-4 h-4 text-afrikoni-gold" />
                            <span className="font-mono font-semibold text-afrikoni-chestnut">
                              {t.ticket_number}
                            </span>
                            {getStatusBadge(t.status)}
                          </div>
                          <p className="text-sm font-semibold text-afrikoni-deep mb-1">
                            {t.subject || 'Support Request'}
                          </p>
                          <p className="text-xs text-afrikoni-deep/70">
                            {t.companies?.company_name || t.user_email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-afrikoni-deep/60">
                        <span>{format(new Date(t.created_at), 'MMM d, yyyy')}</span>
                        {t.last_activity_at && (
                          <span>Last activity: {format(new Date(t.last_activity_at), 'MMM d')}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Interface */}
          {selectedTicket ? (
            <Card>
              <CardHeader className="border-b border-afrikoni-gold/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-afrikoni-gold" />
                      Ticket: {ticket.ticket_number}
                    </CardTitle>
                    <p className="text-sm text-afrikoni-deep/70 mt-1">
                      {ticket.companies?.company_name || ticket.user_email}
                    </p>
                  </div>
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => handleUpdateStatus(ticket.ticket_number, value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages Area */}
                <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-afrikoni-offwhite/30">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-12 h-12 text-afrikoni-gold/50 mb-4" />
                      <p className="text-afrikoni-deep/70">No messages yet</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] rounded-lg p-3 ${
                            message.sender_type === 'admin'
                              ? 'bg-afrikoni-gold text-afrikoni-charcoal'
                              : 'bg-white border border-afrikoni-gold/20'
                          }`}>
                            <div className="flex items-start gap-2 mb-1">
                              {message.sender_type === 'admin' && (
                                <Badge className="bg-afrikoni-gold/20 text-afrikoni-charcoal text-xs">Support Team</Badge>
                              )}
                              {message.sender_type === 'user' && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs">Customer</Badge>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                            <div className="text-xs opacity-70 mt-2">
                              {format(new Date(message.created_at), 'MMM d, h:mm a')}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </div>

                {/* Reply Input */}
                <div className="p-4 border-t border-afrikoni-gold/10 bg-white">
                  <div className="flex gap-2 mb-2">
                    <Textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="flex-1 resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-afrikoni-deep/60">
                      Reply will be sent to {ticket.user_email}
                    </p>
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || isSending}
                      className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal"
                    >
                      {isSending ? (
                        <Clock className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-afrikoni-gold/30 mx-auto mb-4" />
                  <p className="text-afrikoni-deep/70">Select a ticket to view and respond</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

