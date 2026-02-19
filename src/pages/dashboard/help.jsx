import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, HelpCircle, BookOpen, Video, Download, ExternalLink,
  MessageCircle, Mail, Phone, ChevronRight, Sparkles, Shield,
  Rocket, Globe, Zap, ArrowUpRight, LifeBuoy,
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
        <SpinnerWithTimeout message="Loading..." ready={isSystemReady} />
      </div>
    );
  }

  const quickLinks = [
    { title: 'Trade Documentation', icon: BookOpen, desc: 'How trades work on Afrikoni', color: 'text-os-blue', bg: 'bg-os-blue/10' },
    { title: 'Trade Efficiency', icon: Video, desc: 'Tips to maximize your results', color: 'text-os-accent', bg: 'bg-os-accent/10' },
    { title: 'Global Compliance', icon: Shield, desc: 'Security & verification standards', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'API Integration', icon: Globe, desc: 'Connect your ERP to Afrikoni', color: 'text-purple-500', bg: 'bg-purple-500/10' }
  ];

  return (
    <RequireCapability>
      <div className="os-page os-stagger space-y-10 max-w-7xl mx-auto pb-24 px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-os-stroke pb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-os-accent/10 rounded-os-sm border border-os-accent/20">
                <LifeBuoy className="w-6 h-6 text-os-accent" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter">Help Center</h1>
            </div>
            <p className="text-os-lg text-os-muted max-w-2xl leading-relaxed">
              Find answers or get in touch with our support team.
            </p>
          </div>

          <div className="relative w-full md:w-[450px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-os-muted" />
            <Input
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 bg-white border-gray-200 rounded-os-md shadow-os-lg focus:ring-os-accent/20 text-os-sm font-medium"
            />
          </div>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Main Support Card */}
          <Surface variant="panel" className="md:col-span-12 lg:col-span-8 p-10 overflow-hidden group relative">
            <div className="absolute -right-20 -top-20 p-24 bg-os-accent/5 rounded-full blur-3xl group-hover:bg-os-accent/10 transition-all duration-1000" />

            <div className="relative z-10 flex flex-col h-full space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-os-md bg-os-accent/5 border border-os-stroke flex items-center justify-center group-hover:border-os-accent/30 transition-all">
                    <Headphones className="w-7 h-7 text-os-accent" />
                  </div>
                  <div>
                    <h3 className="text-os-2xl font-black tracking-tight">Get Help</h3>
                    <p className="text-os-sm text-os-muted">
                      Live assistance from our global trade team
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 text-os-xs font-medium bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Avg. response: 12 min
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Button variant="outline" className="h-28 rounded-os-lg border-os-stroke bg-white hover:bg-os-accent/5 hover:border-os-accent/20 transition-all group/btn flex flex-col items-center justify-center gap-3" onClick={() => window.location.href = '/dashboard/support-chat'}>
                  <MessageCircle className="w-7 h-7 text-os-accent group-hover/btn:scale-110 transition-transform" />
                  <span className="text-os-xs font-medium">Live Chat</span>
                </Button>
                <Button variant="outline" className="h-28 rounded-os-lg border-os-stroke bg-white hover:bg-blue-500/5 hover:border-os-blue/20 transition-all group/btn flex flex-col items-center justify-center gap-3" onClick={() => window.location.href = 'mailto:hello@afrikoni.com'}>
                  <Mail className="w-7 h-7 text-blue-400 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-os-xs font-medium">Email Support</span>
                </Button>
                <Button variant="outline" className="h-28 rounded-os-lg border-os-stroke bg-white hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all group/btn flex flex-col items-center justify-center gap-3" onClick={() => window.location.href = 'tel:+32456779368'}>
                  <Phone className="w-7 h-7 text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-os-xs font-medium">Priority Line</span>
                </Button>
              </div>
            </div>
          </Surface>

          {/* Quick Stats Block */}
          <div className="md:col-span-12 lg:col-span-4 space-y-6">
            <Surface variant="panel" className="p-8 group">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-os-xs font-medium text-os-muted">Global Operations</h4>
                <Globe className="w-3 h-3 text-os-muted" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-os-xl font-black">Brussels, EU</span>
                <Badge variant="outline" className="rounded-os-sm border-os-stroke bg-os-accent/5 text-os-xs font-bold px-3">+32 456 77 93 68</Badge>
              </div>
            </Surface>

            <Surface variant="panel" className="p-8 group hover:border-emerald-500/30 transition-all cursor-pointer">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-os-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-os-sm mb-0.5 group-hover:text-emerald-500 transition-colors">Trade Shield 2026</h4>
                  <p className="text-os-xs text-os-muted">Security Protocols & Policy</p>
                </div>
                <ChevronRight className="w-5 h-5 text-os-muted group-hover:translate-x-1 transition-transform" />
              </div>
            </Surface>
          </div>

          {/* Quick Document Cards */}
          <div className="md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((doc, i) => (
              <Surface key={i} variant="panel" className="p-6 group cursor-pointer hover:border-os-accent/20 transition-all relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 p-8 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform">
                  <doc.icon className="w-16 h-16" />
                </div>
                <div className={cn(doc.bg, doc.color, "w-10 h-10 rounded-os-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform")}>
                  <doc.icon className="w-5 h-5" />
                </div>
                <h4 className="text-os-sm font-bold mb-1 group-hover:text-os-accent transition-colors">{doc.title}</h4>
                <p className="text-os-xs text-os-muted font-medium leading-relaxed">{doc.desc}</p>
              </Surface>
            ))}
          </div>

          {/* Onboarding Hero */}
          <Surface variant="panel" className="md:col-span-12 p-10 overflow-hidden relative group border-os-accent/20 bg-os-accent/[0.02]">
            <div className="absolute inset-0 bg-gradient-to-r from-os-accent/[0.05] via-transparent to-transparent" />
            <div className="absolute top-1/2 right-20 -translate-y-1/2 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rotate-12 group-hover:rotate-0 duration-1000">
              <Rocket className="w-64 h-64 text-os-accent" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h3 className="text-3xl font-black tracking-tighter">New to Afrikoni?</h3>
                <p className="text-os-muted text-os-lg max-w-2xl">Get started with our onboarding guide and make your first trade.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button className="bg-os-accent text-black font-bold px-12 py-6 rounded-os-md hover:scale-105 active:scale-95 transition-all shadow-os-lg shadow-os-accent/10">Get Started</Button>
                <Button variant="ghost" className="text-os-accent font-medium hover:bg-os-accent/10 px-8 rounded-os-md gap-2">
                  Explore use cases <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Surface>
        </div>

        {/* FAQ Section */}
        <div className="space-y-8 pt-10">
          <div className="flex items-center justify-between border-b border-os-stroke pb-6">
            <h2 className="text-os-2xl font-black tracking-tight flex items-center gap-4">
              <FileSearch className="w-6 h-6 text-os-muted" />
              Frequently Asked Questions
            </h2>
            <Button variant="ghost" className="text-os-xs font-medium text-os-muted hover:text-os-accent">View all FAQs</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "How does escrow work on Afrikoni?",
              "What documents do I need for verification?",
              "How do I get Trade Shield status?",
              "How long does an RFQ take to be matched?",
              "Can I connect my ERP to Afrikoni?",
              "What are the AfCFTA compliance requirements?"
            ].map((q, i) => (
              <Surface key={i} variant="panel" className="p-6 cursor-pointer group hover:bg-gray-50 transition-all flex items-center justify-between gap-6">
                <p className="font-medium text-os-sm leading-relaxed group-hover:text-os-accent transition-colors">{q}</p>
                <div className="w-8 h-8 rounded-os-sm bg-os-accent/5 flex items-center justify-center shrink-0 group-hover:bg-os-accent group-hover:text-black transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Surface>
            ))}
          </div>
        </div>

        {/* Still Need Help Footer */}
        <Surface variant="panel" className="p-12 text-center border-os-accent/20 bg-os-accent/[0.02] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-os-accent/30 to-transparent" />
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="w-20 h-20 rounded-[2.5rem] bg-os-accent/10 flex items-center justify-center mx-auto mb-4 border border-os-accent/20 shadow-os-lg shadow-os-accent/5">
              <LifeBuoy className="w-10 h-10 text-os-accent" />
            </div>
            <h3 className="text-3xl font-black tracking-tight">Can't find your answer?</h3>
            <p className="text-os-muted text-os-lg">
              Our support team is ready to help. Reach us via chat, email, or phone.
            </p>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="w-full sm:w-auto px-12 py-7 bg-os-accent text-black font-bold rounded-os-md hover:scale-105 active:scale-95 transition-all shadow-os-lg shadow-os-accent/10" onClick={() => window.location.href = '/dashboard/support-chat'}>
                Start Live Chat
              </Button>
              <Button variant="outline" className="w-full sm:w-auto px-12 py-7 border-gray-200 text-os-muted font-medium rounded-os-md hover:bg-os-accent/5" onClick={() => window.location.href = 'mailto:hello@afrikoni.com'}>
                Contact Us
              </Button>
            </div>
          </div>
        </Surface>
      </div>
    </RequireCapability>
  );
}
