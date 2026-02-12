import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, HelpCircle, BookOpen, Video, Download, ExternalLink, MessageCircle, Mail, Phone, ChevronRight, Sparkles, Shield, Rocket, Globe } from 'lucide-react';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import RequireCapability from '@/guards/RequireCapability';

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
    { title: 'Horizon Protocol V1.2', icon: BookOpen, desc: 'Advanced trade documentation', color: 'text-blue-500' },
    { title: 'Kernel Optimization', icon: Video, desc: 'Maximize your trade efficiency', color: 'text-gold-500' },
    { title: 'Global Compliance', icon: Shield, desc: 'Security & Verification standards', color: 'text-green-500' },
    { title: 'API Integration', icon: Globe, desc: 'Connect your ERP to Afrikoni', color: 'text-purple-500' }
  ];

  return (
    <RequireCapability>
      <div className="max-w-[1400px] mx-auto space-y-8 pb-12">
        {/* Modern Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
          >
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary px-3 py-1 flex items-center gap-1.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                Horizon Knowledge Hub
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">How can we help?</h1>
            <p className="text-os-text-secondary text-lg max-w-2xl">
              Explore the Afrikoni Horizon documentation or connect with an infrastructure expert.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full md:w-[400px]"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-os-muted" />
            <Input
              placeholder="Search kernel documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 bg-os-surface-1 border-os-stroke rounded-2xl shadow-premium focus:ring-primary/20"
            />
          </motion.div>
        </header>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-5 auto-rows-[160px]">

          {/* Main Support Terminal */}
          <Surface variant="glass" glow hover className="md:col-span-6 lg:col-span-8 row-span-2 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Horizon Support Terminal</h3>
                    <p className="text-sm text-os-text-secondary">Live infrastructure assistance 24/7</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-500 text-xs font-semibold bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  AVERAGE RESPONSE: 8M
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-auto">
                <Button className="h-20 rounded-2xl border border-os-stroke bg-os-surface-1 hover:bg-primary/5 transition-all group/btn" onClick={() => window.location.href = '/dashboard/support-chat'}>
                  <div className="flex flex-col items-center gap-1">
                    <MessageCircle className="w-5 h-5 text-primary group-hover/btn:scale-110 transition-transform" />
                    <span className="text-sm">Live Chat</span>
                  </div>
                </Button>
                <Button className="h-20 rounded-2xl border border-os-stroke bg-os-surface-1 hover:bg-primary/5 transition-all group/btn" onClick={() => window.location.href = 'mailto:hello@afrikoni.com'}>
                  <div className="flex flex-col items-center gap-1">
                    <Mail className="w-5 h-5 text-blue-500 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-sm">Email</span>
                  </div>
                </Button>
                <Button className="h-20 rounded-2xl border border-os-stroke bg-os-surface-1 hover:bg-primary/5 transition-all group/btn" onClick={() => window.location.href = 'tel:+32456779368'}>
                  <div className="flex flex-col items-center gap-1">
                    <Phone className="w-5 h-5 text-green-500 group-hover/btn:scale-110 transition-transform" />
                    <span className="text-sm">Global Line</span>
                  </div>
                </Button>
              </div>
            </div>
          </Surface>

          {/* Contact Details Side-Block */}
          <Surface variant="glass" glow hover className="md:col-span-3 lg:col-span-4 row-span-1 p-6 flex flex-col justify-center">
            <h4 className="text-xs font-bold uppercase tracking-widest text-os-muted mb-2">Global HQ</h4>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Brussels, EU</span>
              <Badge variant="outline" className="rounded-full border-os-stroke bg-os-surface-1">+32 456 77 93 68</Badge>
            </div>
          </Surface>

          {/* Trust & Policy Block */}
          <Surface variant="glass" glow hover className="md:col-span-3 lg:col-span-4 row-span-1 p-6 group transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold">Trade Shield</h4>
                <p className="text-xs text-os-text-secondary">Protection standards 2026</p>
              </div>
              <ChevronRight className="w-4 h-4 text-os-muted group-hover:translate-x-1 transition-transform" />
            </div>
          </Surface>

          {/* Quick Document Bento Cards */}
          {quickLinks.map((doc, i) => (
            <Surface key={i} variant="glass" hover className="md:col-span-3 row-span-1 p-5 group cursor-pointer border-transparent hover:border-primary/20 transition-all">
              <div className={`${doc.color} w-8 h-8 rounded-lg bg-current/10 flex items-center justify-center mb-3`}>
                <doc.icon className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">{doc.title}</h4>
              <p className="text-[11px] text-os-text-secondary leading-tight">{doc.desc}</p>
            </Surface>
          ))}

          {/* Large "Get Started" Graphic Card */}
          <Surface variant="glass" glow hover className="md:col-span-6 lg:col-span-12 row-span-1 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent" />
            <div className="absolute top-1/2 right-20 -translate-y-1/2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Rocket className="w-32 h-32 text-primary rotate-12" />
            </div>
            <div className="relative p-8 h-full flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-2">New to the Afrikoni Horizon Protocol?</h3>
              <p className="text-os-text-secondary">Start with our comprehensive onboarding module designed for Enterprise scale.</p>
              <div className="mt-4 flex items-center gap-4">
                <Button variant="primary" className="rounded-full px-8 shadow-gold">Get Started</Button>
                <Button variant="ghost" className="text-primary hover:bg-primary/10 rounded-full">Explore Use Cases</Button>
              </div>
            </div>
          </Surface>
        </div>

        {/* FAQ Section Modernized */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            <Button variant="ghost" className="text-sm text-os-muted hover:text-primary">View All FAQs</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              "How does Afrikoni Horizon handle global escrow?",
              "What are the node requirements for real-time tracking?",
              "How to verify my business for Priority Trade Status?",
              "Understanding the Horizon RFQ Smart Matching engine?",
              "Integration steps for existing logistics partners?",
              "Horizon 2026 Security & Encryption standards?"
            ].map((q, i) => (
              <Surface key={i} variant="soft" hover className="p-6 cursor-pointer group">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium text-sm pt-0.5">{q}</p>
                  <div className="w-6 h-6 rounded-full bg-os-surface-2 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        </section>

        {/* Still Need Help Footer */}
        <Surface variant="glass" glow className="p-8 text-center border-t-2 border-primary/20">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/5">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Can't find your answer?</h3>
            <p className="text-os-text-secondary">
              Our global infrastructure team is ready to help you optimize your trade flows.
              Connect with us on the Afrikoni Command Net.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="primary" className="w-full sm:w-auto px-10 rounded-full h-12">Connect via Command Net</Button>
              <Button variant="outline" className="w-full sm:w-auto px-10 rounded-full h-12 hover:bg-os-surface-2" onClick={() => window.location.href = '/contact'}>Contact Support Headquarters</Button>
            </div>
          </div>
        </Surface>
      </div>
    </RequireCapability>
  );
}

