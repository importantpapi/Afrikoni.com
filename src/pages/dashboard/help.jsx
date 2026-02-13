import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, HelpCircle, BookOpen, Video, Download, ExternalLink,
  MessageCircle, Mail, Phone, ChevronRight, Sparkles, Shield,
  Rocket, Globe, Zap, ArrowUpRight, LifeBuoy, Terminal, Box,
  FileSearch, Headphones
} from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import RequireCapability from '@/guards/RequireCapability';
import { cn } from '@/lib/utils';

export default function DashboardHelp() {
  const [searchQuery, setSearchQuery] = useState('');
  const { capabilities, isSystemReady } = useDashboardKernel();

  if (!isSystemReady) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SpinnerWithTimeout message="Initializing Knowledge Hub..." ready={isSystemReady} />
      </div>
    );
  }

  const quickLinks = [
    { title: 'Horizon Protocol V1.2', icon: BookOpen, desc: 'Advanced trade documentation', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Kernel Optimization', icon: Video, desc: 'Maximize your trade efficiency', color: 'text-afrikoni-gold', bg: 'bg-afrikoni-gold/10' },
    { title: 'Global Compliance', icon: Shield, desc: 'Security & Verification standards', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'API Integration', icon: Globe, desc: 'Connect your ERP to Afrikoni', color: 'text-purple-500', bg: 'bg-purple-500/10' }
  ];

  return (
    <RequireCapability>
      <div className="os-page os-stagger space-y-10 max-w-7xl mx-auto pb-24 px-4 py-8">
        {/* Modern Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-afrikoni-gold/10 rounded-xl border border-afrikoni-gold/20">
                <LifeBuoy className="w-6 h-6 text-afrikoni-gold" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter">Knowledge Hub</h1>
            </div>
            <p className="text-lg text-os-muted max-w-2xl leading-relaxed">
              Explore the Afrikoni Horizon infrastructure or connect with a global trade expert.
            </p>
          </div>

          <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-os-muted" />
            <Input
              placeholder="Query kernel documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 bg-white/[0.03] border-white/10 rounded-2xl shadow-xl focus:ring-afrikoni-gold/20 text-sm font-medium"
            />
          </div>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Main Support Terminal */}
          <Surface variant="glass" className="md:col-span-12 lg:col-span-8 p-10 overflow-hidden group relative">
            <div className="absolute -right-20 -top-20 p-24 bg-afrikoni-gold/5 rounded-full blur-3xl group-hover:bg-afrikoni-gold/10 transition-all duration-1000" />

            <div className="relative z-10 flex flex-col h-full space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-afrikoni-gold/30 transition-all">
                    <Headphones className="w-7 h-7 text-afrikoni-gold" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Direct Infrastructure Assist</h3>
                    <p className="text-sm text-os-muted flex items-center gap-2">
                      <Terminal className="w-3 h-3" />
                      Live assistance from our global logistics desk
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Latency: 12m
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Button variant="outline" className="h-28 rounded-3xl border-white/5 bg-white/[0.02] hover:bg-afrikoni-gold/5 hover:border-afrikoni-gold/20 transition-all group/btn flex flex-col items-center justify-center gap-3" onClick={() => window.location.href = '/dashboard/support-chat'}>
                  <MessageCircle className="w-7 h-7 text-afrikoni-gold group-hover/btn:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Live Terminal</span>
                </Button>
                <Button variant="outline" className="h-28 rounded-3xl border-white/5 bg-white/[0.02] hover:bg-blue-500/5 hover:border-blue-500/20 transition-all group/btn flex flex-col items-center justify-center gap-3" onClick={() => window.location.href = 'mailto:hello@afrikoni.com'}>
                  <Mail className="w-7 h-7 text-blue-400 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Email Audit</span>
                </Button>
                <Button variant="outline" className="h-28 rounded-3xl border-white/5 bg-white/[0.02] hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all group/btn flex flex-col items-center justify-center gap-3" onClick={() => window.location.href = 'tel:+32456779368'}>
                  <Phone className="w-7 h-7 text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Priority Line</span>
                </Button>
              </div>
            </div>
          </Surface>

          {/* Quick Stats Block */}
          <div className="md:col-span-12 lg:col-span-4 space-y-6">
            <Surface variant="panel" className="p-8 group">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-os-muted">Global Operations</h4>
                <Globe className="w-3 h-3 text-os-muted" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black">Brussels, EU</span>
                <Badge variant="outline" className="rounded-xl border-white/10 bg-white/5 text-[10px] font-bold px-3">+32 456 77 93 68</Badge>
              </div>
            </Surface>

            <Surface variant="panel" className="p-8 group hover:border-emerald-500/30 transition-all cursor-pointer">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-sm uppercase tracking-widest mb-0.5 group-hover:text-emerald-500 transition-colors">Trade Shield 2026</h4>
                  <p className="text-[10px] font-bold text-os-muted uppercase tracking-tighter">Security Protocols & Policy</p>
                </div>
                <ChevronRight className="w-5 h-5 text-os-muted group-hover:translate-x-1 transition-transform" />
              </div>
            </Surface>
          </div>

          {/* Quick Document Cards */}
          <div className="md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((doc, i) => (
              <Surface key={i} variant="panel" className="p-6 group cursor-pointer hover:border-afrikoni-gold/20 transition-all relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 p-8 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform">
                  <doc.icon className="w-16 h-16" />
                </div>
                <div className={cn(doc.bg, doc.color, "w-10 h-10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform")}>
                  <doc.icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest mb-1 group-hover:text-afrikoni-gold transition-colors">{doc.title}</h4>
                <p className="text-[11px] text-os-muted font-medium leading-relaxed italic">{doc.desc}</p>
              </Surface>
            ))}
          </div>

          {/* Onboarding Hero */}
          <Surface variant="glass" className="md:col-span-12 p-10 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-afrikoni-gold/[0.05] via-transparent to-transparent" />
            <div className="absolute top-1/2 right-20 -translate-y-1/2 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rotate-12 group-hover:rotate-0 duration-1000">
              <Rocket className="w-64 h-64 text-afrikoni-gold" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h3 className="text-3xl font-black italic tracking-tighter">New to the Afrikoni Horizon?</h3>
                <p className="text-os-muted text-lg max-w-2xl">Initialize your institutional profile with our comprehensive 2026 onboarding module.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button className="bg-white text-black font-black px-12 py-6 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5">Get Started</Button>
                <Button variant="ghost" className="text-afrikoni-gold font-bold hover:bg-afrikoni-gold/10 px-8 rounded-2xl gap-2">
                  Explore Ecosystem Use Cases <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Surface>
        </div>

        {/* FAQ Section */}
        <div className="space-y-8 pt-10">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-4">
              <FileSearch className="w-6 h-6 text-os-muted" />
              Common Intelligence Queries
            </h2>
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-os-muted hover:text-afrikoni-gold">All Queries Database</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Clearing global escrow on the Horizon rail?",
              "Real-time node telemetry requirements?",
              "Attaining Priority Trade Status (Audit Level 2)?",
              "Smart-Matching engine logic for institutional RFQs?",
              "ERP integration via the Afrikoni Bridge protocol?",
              "2026 Continental encryption & policy standards?"
            ].map((q, i) => (
              <Surface key={i} variant="panel" className="p-6 cursor-pointer group hover:bg-white/[0.03] transition-all flex items-center justify-between gap-6">
                <p className="font-bold text-sm leading-relaxed group-hover:text-afrikoni-gold transition-colors">{q}</p>
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-afrikoni-gold group-hover:text-black transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Surface>
            ))}
          </div>
        </div>

        {/* Still Need Help Footer */}
        <Surface variant="glass" className="p-12 text-center border-white/10 bg-afrikoni-gold/[0.02] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-afrikoni-gold/30 to-transparent" />
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="w-20 h-20 rounded-[2.5rem] bg-afrikoni-gold/10 flex items-center justify-center mx-auto mb-4 border border-afrikoni-gold/20 shadow-xl shadow-afrikoni-gold/5">
              <LifeBuoy className="w-10 h-10 text-afrikoni-gold" />
            </div>
            <h3 className="text-3xl font-black tracking-tight">Can't find your answer?</h3>
            <p className="text-os-muted text-lg">
              Our global infrastructure desk is ready to help you optimize your trade flows.
              Connect with us via the Afrikoni Secure Net.
            </p>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="w-full sm:w-auto px-12 py-7 bg-afrikoni-gold text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-afrikoni-gold/10">
                Connect Secure Net
              </Button>
              <Button variant="outline" className="w-full sm:w-auto px-12 py-7 border-white/10 text-os-muted font-black uppercase tracking-widest rounded-2xl hover:bg-white/5">
                HQ Contact Terminal
              </Button>
            </div>
          </div>
        </Surface>
      </div>
    </RequireCapability>
  );
}
