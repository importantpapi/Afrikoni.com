import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Clock, CheckCircle, AlertCircle, Hash,
  Copy, ExternalLink, Shield, Info, ArrowLeft, MoreHorizontal,
  Settings, Users, X, Activity, ShieldCheck
} from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { supabase } from '@/api/supabaseClient';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import ErrorState from '@/components/shared/ui/ErrorState';
import { format } from 'date-fns';
import RequireCapability from '@/guards/RequireCapability';
import { cn } from '@/lib/utils';

function SupportChatInner() {
  const { profileCompanyId, userId, user, canLoadData, capabilities, isSystemReady } = useDashboardKernel();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ticketNumber, setTicketNumber] = useState(null);
  const [ticketStatus, setTicketStatus] = useState('open');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SpinnerWithTimeout message="Loading..." ready={isSystemReady} />
      </div>
    );
  }

  useEffect(() => {
    if (!canLoadData || !profileCompanyId) return;
    loadUserAndTicket();
  }, [canLoadData, profileCompanyId, userId]);

  useEffect(() => {
    if (ticketNumber) {
      loadMessages();
      const channel = supabase.channel(`support-${ticketNumber}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_number=eq.${ticketNumber}` },
          (payload) => {
            setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
            if (payload.new.sender_type === 'admin') toast.info('New message from support.');
          }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [ticketNumber]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const generateTicketNumber = () => `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const loadUserAndTicket = async () => {
    try {
      setIsLoading(true);
      const newTicketNumber = generateTicketNumber();
      const userEmail = user?.email || '';

      const { data: newTicket, error } = await supabase.from('support_tickets').insert({
        ticket_number: newTicketNumber,
        company_id: profileCompanyId,
        user_email: userEmail,
        subject: 'Afrikoni Support',
        status: 'open',
        priority: 'high'
      }).select().single();

      if (!error) {
        setTicketNumber(newTicketNumber);
        setTicketStatus('open');
      }
    } catch (e) { setError(e.message); } finally { setIsLoading(false); }
  };

  const loadMessages = async () => {
    const { data } = await supabase.from('support_messages').select('*').eq('ticket_number', ticketNumber).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticketNumber) return;
    setIsSending(true);
    try {
      await supabase.from('support_messages').insert({
        ticket_number: ticketNumber,
        company_id: profileCompanyId,
        sender_type: 'user',
        sender_email: user?.email,
        message: newMessage.trim(),
        read: false
      });
      setNewMessage('');
      await loadMessages();
    } catch (e) { toast.error('Failed to send message.'); } finally { setIsSending(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><SpinnerWithTimeout message="Loading..." ready={false} /></div>;
  if (error) return <ErrorState message={error} onRetry={loadUserAndTicket} />;

  return (
    <div className="os-page os-stagger max-w-7xl mx-auto pb-20 px-4 py-8 h-full flex flex-col space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-os-accent/10 rounded-os-sm border border-os-accent/30">
              <MessageSquare className="w-6 h-6 text-os-accent" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Support</h1>
          </div>
          <p className="text-os-muted text-os-lg max-w-xl">Get help from the Afrikoni support team.</p>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-os-muted hover:text-white font-medium text-os-xs uppercase tracking-widest gap-2 bg-white/5 px-6 rounded-os-sm border border-white/5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-280px)] min-h-[600px]">
        {/* LEFT: SIDEBAR */}
        <aside className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <Surface variant="panel" className="p-6 space-y-8 h-full flex flex-col">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 rounded-[1rem] bg-os-accent/10 border border-os-accent/20 flex items-center justify-center text-os-accent group shadow-os-md shadow-os-accent/5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-os-sm font-bold text-gray-900">Support Chat</h3>
                <p className="text-os-xs text-os-muted">Secure & encrypted</p>
              </div>
            </div>

            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-os-xs font-medium text-os-muted block">Ticket Reference</label>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-os-md border border-gray-200 group hover:border-os-accent/30 transition-all">
                  <code className="text-os-xs font-mono text-os-accent font-medium">{ticketNumber ? ticketNumber.slice(0, 16) + '...' : 'Creating...'}</code>
                  <Copy className="w-3.5 h-3.5 text-os-muted cursor-pointer hover:text-gray-900 transition-colors" onClick={() => {
                    navigator.clipboard.writeText(ticketNumber);
                    toast.success('Ticket ID copied');
                  }} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-y border-gray-100">
                  <span className="text-os-xs font-medium text-os-muted">Status</span>
                  <div className="flex items-center gap-2 text-emerald-600 text-os-xs font-medium bg-emerald-50 px-3 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Open
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-os-xs font-medium text-os-muted">Participants</span>
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-os-sm bg-os-accent/20 border-2 border-white flex items-center justify-center text-os-xs font-bold text-os-accent">ME</div>
                    <div className="w-7 h-7 rounded-os-sm bg-gray-100 border-2 border-white flex items-center justify-center text-os-xs font-bold text-gray-500">AD</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-6">
              <Surface variant="ivory" className="p-4 flex items-center gap-4">
                <Activity className="w-5 h-5 text-emerald-500" />
                <div className="space-y-0.5">
                  <div className="text-os-xs font-medium text-gray-900">Connected</div>
                  <div className="text-os-xs text-os-muted">Avg. response: ~2 hrs</div>
                </div>
              </Surface>
              <Button variant="outline" className="w-full text-os-xs font-medium border-gray-200 hover:bg-gray-50 rounded-os-md h-12 gap-2">
                <Settings className="w-3.5 h-3.5" /> Settings
              </Button>
            </div>
          </Surface>
        </aside>

        {/* MAIN: CHAT */}
        <main className="flex-1 flex flex-col min-w-0">
          <Surface variant="panel" className="flex-1 flex flex-col overflow-hidden relative">
            {/* Chat Header */}
            <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-20">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="font-bold text-os-lg tracking-tight">Support Chat</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-os-xs text-emerald-600">Secure connection</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-os-sm border border-gray-200 hover:bg-gray-50"><MoreHorizontal className="w-4 h-4 text-os-muted" /></Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10 scrollbar-none relative z-10">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-os-lg font-medium text-gray-500">No messages yet</p>
                  <p className="text-os-xs text-os-muted mt-2">Send a message to get started</p>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((message, i) => (
                    <motion.div
                      key={message.id || i}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex flex-col max-w-[70%] ${message.sender_type === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                        <div className={cn(
                          "p-5 rounded-os-lg text-os-sm leading-relaxed shadow-os-lg",
                          message.sender_type === 'user'
                            ? "bg-os-accent text-black rounded-tr-none font-medium shadow-os-accent/10"
                            : "bg-gray-50 border border-gray-200 rounded-tl-none font-medium"
                        )}>
                          {message.message}
                        </div>
                        <div className="flex items-center gap-3 px-1">
                          {message.sender_type === 'admin' && <div className="text-os-xs font-medium text-os-accent">Support</div>}
                          <span className="text-os-xs text-os-muted opacity-60">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-8 bg-white border-t border-gray-100 z-20">
              <div className="relative group">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Type your message..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-os-lg p-6 pr-20 text-os-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-os-accent/20 focus:border-os-accent transition-all placeholder:text-gray-400 font-medium resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="absolute bottom-6 right-6 h-12 w-12 p-0 rounded-os-md bg-os-accent text-black hover:scale-105 active:scale-95 transition-all shadow-os-md shadow-os-accent/20"
                >
                  {isSending ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
              <div className="mt-3 text-os-xs text-os-muted opacity-60">
                Press Enter to send · Shift+Enter for new line
              </div>
            </div>
          </Surface>
        </main>
      </div>
    </div>
  );
}

export default function SupportChat() {
  return (
    <RequireCapability>
      <SupportChatInner />
    </RequireCapability>
  );
}
