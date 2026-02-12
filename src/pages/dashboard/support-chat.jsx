import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, Hash, Copy, ExternalLink, Shield, Info, ArrowLeft, MoreHorizontal, Settings, Users } from 'lucide-react';
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
        <SpinnerWithTimeout message="Syncing with Command Net..." ready={isSystemReady} />
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
            if (payload.new.sender_type === 'admin') toast.info('Incoming transmission from support.');
          }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [ticketNumber]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const generateTicketNumber = () => `HORIZON-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const loadUserAndTicket = async () => {
    try {
      setIsLoading(true);
      const newTicketNumber = generateTicketNumber();
      const userEmail = user?.email || '';

      const { data: newTicket, error } = await supabase.from('support_tickets').insert({
        ticket_number: newTicketNumber,
        company_id: profileCompanyId,
        user_email: userEmail,
        subject: 'Horizon Infrastructure Support',
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
    } catch (e) { toast.error('Transmission failed.'); } finally { setIsSending(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (error) return <ErrorState message={error} onRetry={loadUserAndTicket} />;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] max-w-[1600px] mx-auto">

      {/* LEFT: CHANNEL METADATA SIDEBAR */}
      <aside className="w-full lg:w-80 flex flex-col gap-4">
        <Surface variant="glass" glow className="p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-os-stroke">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Secure Channel</h3>
              <p className="text-[10px] text-os-muted">Protocol: Horizon-v1.x</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-os-muted block mb-1">Session ID</label>
              <div className="flex items-center justify-between bg-os-surface-1 p-2 rounded-lg border border-os-stroke">
                <code className="text-[11px] font-mono text-primary">{ticketNumber || 'PENDING...'}</code>
                <Copy className="w-3 h-3 text-os-muted cursor-pointer hover:text-primary transition-colors" onClick={() => {
                  navigator.clipboard.writeText(ticketNumber);
                  toast.success('Copied to clipboard');
                }} />
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-y border-os-stroke/50">
              <span className="text-xs text-os-text-secondary">Status</span>
              <Badge className="bg-green-500/10 text-green-500 border-none text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter italic">Live Transmission</Badge>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-os-text-secondary">Sovereign Identity</span>
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-background flex items-center justify-center text-[10px] font-bold">ME</div>
                <div className="w-6 h-6 rounded-full bg-os-surface-2 border border-background flex items-center justify-center text-[10px] font-bold text-os-muted">AD</div>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <Button variant="outline" className="w-full justify-start text-xs border-os-stroke hover:bg-os-surface-2 gap-2 h-10">
              <Info className="w-4 h-4" /> System Readiness
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs border-os-stroke hover:bg-os-surface-2 gap-2 h-10">
              <Settings className="w-4 h-4" /> Channel Config
            </Button>
          </div>
        </Surface>

        <Surface variant="soft" className="p-4 flex items-center gap-3">
          <Clock className="w-4 h-4 text-primary" />
          <div className="text-[11px] leading-tight">
            <b className="block">Latency Monitor</b>
            <span className="text-os-muted italic">E-TTL: ~120s via Global Mesh</span>
          </div>
        </Surface>
      </aside>

      {/* MAIN: COMMUNICATIONS TERMINAL */}
      <main className="flex-1 flex flex-col min-h-0">
        <Surface variant="glass" glow className="flex-1 flex flex-col overflow-hidden relative">

          {/* Terminal Header */}
          <div className="px-6 py-4 border-b border-os-stroke flex items-center justify-between bg-os-surface-1/50 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="font-bold flex items-center gap-2">
                Infrastructure Support <span className="text-os-muted font-normal text-xs font-mono">/ {user?.email}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg outline-none hover:bg-os-surface-2"><MoreHorizontal className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg outline-none hover:bg-os-surface-2 text-destructive" onClick={() => navigate(-1)}><X className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-premium">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                <MessageSquare className="w-16 h-16 mb-4 stroke-1" />
                <p className="text-lg font-light italic">Waiting for initial system ping...</p>
                <p className="text-sm">Initiate transmission below.</p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message, i) => (
                  <motion.div
                    key={message.id || i}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex flex-col max-w-[80%] ${message.sender_type === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${message.sender_type === 'user'
                          ? 'bg-primary text-primary-foreground shadow-gold rounded-tr-none font-medium'
                          : 'bg-os-surface-2 border border-os-stroke rounded-tl-none font-light'
                        }`}>
                        {message.message}
                      </div>
                      <span className="text-[10px] text-os-muted mt-2 font-mono uppercase tracking-tighter">
                        {format(new Date(message.created_at), 'HH:mm:ss')} • {message.sender_type === 'user' ? 'TX' : 'RX'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Terminal Input */}
          <div className="p-6 bg-os-surface-1/50 border-t border-os-stroke backdrop-blur-md">
            <div className="relative group">
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Type command or message... (Shift + Enter for break)"
                className="w-full bg-os-surface-2 border border-os-stroke rounded-2xl p-4 pr-16 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-os-muted/50 resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className="absolute bottom-4 right-4 h-10 w-10 p-0 rounded-xl bg-primary text-primary-foreground hover:scale-105 transition-transform"
              >
                {isSending ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-os-muted font-mono">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 2 ACTIVE NODES</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> QUANTUM-SECURE</span>
              </div>
              <span>CTRL + ENTER TO SEND</span>
            </div>
          </div>
        </Surface>
      </main>
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
