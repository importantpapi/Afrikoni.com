import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Clock, CheckCircle, AlertCircle, Hash,
  Copy, ExternalLink, Shield, Info, ArrowLeft, MoreHorizontal,
  Settings, Users, X, Activity, Terminal, ShieldCheck, Zap
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

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><SpinnerWithTimeout message="Establishing Link..." ready={false} /></div>;
  if (error) return <ErrorState message={error} onRetry={loadUserAndTicket} />;

  return (
    <div className="os-page os-stagger max-w-7xl mx-auto pb-20 px-4 py-8 h-full flex flex-col space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-afrikoni-gold/10 rounded-xl border border-afrikoni-gold/30">
              <Terminal className="w-6 h-6 text-afrikoni-gold" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Support Terminal</h1>
          </div>
          <p className="text-os-muted text-lg max-w-xl italic opacity-80">Direct encrypted transmission to Afrikoni infrastructure leads.</p>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-os-muted hover:text-white font-black text-[10px] uppercase tracking-widest gap-2 bg-white/5 px-6 rounded-xl border border-white/5">
            <ArrowLeft className="w-4 h-4" /> Disconnect
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-280px)] min-h-[600px]">
        {/* LEFT: CHANNEL METADATA SIDEBAR */}
        <aside className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <Surface variant="glass" className="p-6 space-y-8 h-full flex flex-col">
            <div className="flex items-center gap-4 pb-6 border-b border-white/5">
              <div className="w-12 h-12 rounded-[1rem] bg-afrikoni-gold/10 border border-afrikoni-gold/20 flex items-center justify-center text-afrikoni-gold group shadow-lg shadow-afrikoni-gold/5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Secure Channel</h3>
                <p className="text-[10px] text-os-muted font-mono uppercase opacity-50">Horizon-X Protocol</p>
              </div>
            </div>

            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-os-muted block opacity-40">Session Identifier</label>
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10 group hover:border-afrikoni-gold/30 transition-all">
                  <code className="text-[11px] font-mono text-afrikoni-gold font-black">{ticketNumber ? ticketNumber.slice(0, 16) + '...' : 'PENDING...'}</code>
                  <Copy className="w-3.5 h-3.5 text-os-muted cursor-pointer hover:text-white transition-colors" onClick={() => {
                    navigator.clipboard.writeText(ticketNumber);
                    toast.success('Session ID copied to secure clipboard');
                  }} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-y border-white/5">
                  <span className="text-[10px] uppercase font-black tracking-widest text-os-muted">Status</span>
                  <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-tighter bg-emerald-500/10 px-3 py-1 rounded-full shadow-lg shadow-emerald-500/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Link
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-os-muted">Authorized Nodes</span>
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-afrikoni-gold/20 border-2 border-os-surface-1 flex items-center justify-center text-[10px] font-black text-afrikoni-gold">ME</div>
                    <div className="w-7 h-7 rounded-xl bg-white/10 border-2 border-os-surface-1 flex items-center justify-center text-[10px] font-black text-os-muted">AD</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-white/5 pt-6">
              <Surface variant="panel" className="p-4 bg-emerald-500/[0.02] border-emerald-500/10 flex items-center gap-4">
                <Activity className="w-5 h-5 text-emerald-500" />
                <div className="space-y-0.5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white">Network Health</div>
                  <div className="text-[9px] font-medium text-emerald-500/70 italic">Optimized Pathing</div>
                </div>
              </Surface>
              <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest border-white/10 hover:bg-white/5 rounded-2xl h-12 gap-2">
                <Settings className="w-3.5 h-3.5" /> Channel Config
              </Button>
            </div>
          </Surface>
        </aside>

        {/* MAIN: COMMUNICATIONS TERMINAL */}
        <main className="flex-1 flex flex-col min-w-0">
          <Surface variant="glass" className="flex-1 flex flex-col overflow-hidden relative border-white/10">
            {/* Terminal Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-afrikoni-gold/5 blur-[100px] pointer-events-none" />

            {/* Terminal Header */}
            <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl z-20">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="font-black text-lg tracking-tight uppercase">Support Tunnel <span className="text-os-muted font-normal text-xs font-mono ml-4 opacity-40">/ AES-256 ENCRYPTED</span></h2>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">Encryption Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10"><MoreHorizontal className="w-4 h-4 text-os-muted" /></Button>
              </div>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10 scrollbar-none relative z-10">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 animate-pulse">
                  <MessageSquare className="w-20 h-20 mb-6 text-afrikoni-gold stroke-[0.5]" />
                  <p className="text-xl font-black italic tracking-tighter">Awaiting Initial Uplink...</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-os-muted mt-2">Initialize transmission below</p>
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
                          "p-5 rounded-3xl text-sm leading-relaxed shadow-xl",
                          message.sender_type === 'user'
                            ? "bg-afrikoni-gold text-black rounded-tr-none font-black shadow-afrikoni-gold/10"
                            : "bg-white/5 border border-white/10 rounded-tl-none font-medium backdrop-blur-md"
                        )}>
                          {message.message}
                        </div>
                        <div className="flex items-center gap-3 px-1">
                          {message.sender_type === 'admin' && <div className="text-[9px] font-black uppercase text-afrikoni-gold tracking-widest">Support Node</div>}
                          <span className="text-[10px] text-os-muted font-bold uppercase tracking-tighter opacity-40">
                            {format(new Date(message.created_at), 'HH:mm:ss')} • {message.sender_type === 'user' ? 'SENT' : 'RECV'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Terminal Input */}
            <div className="p-8 bg-white/[0.02] border-t border-white/5 backdrop-blur-2xl z-20">
              <div className="relative group">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Transmit command or request details..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-3xl p-6 pr-20 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-afrikoni-gold/30 focus:border-afrikoni-gold/30 transition-all placeholder:text-os-muted/40 font-medium resize-none shadow-inner"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="absolute bottom-6 right-6 h-12 w-12 p-0 rounded-2xl bg-afrikoni-gold text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-afrikoni-gold/20"
                >
                  {isSending ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
              <div className="mt-5 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-os-muted opacity-40">
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-2"><Users className="w-3 h-3" /> System Linked</span>
                  <span className="flex items-center gap-2"><Zap className="w-3 h-3" /> Instant Sync</span>
                </div>
                <span>ENTER TO TRANSMIT</span>
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
