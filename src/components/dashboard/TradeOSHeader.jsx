import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Bell, Plus, ChevronDown, Command, Sparkles,
  ShieldCheck, Truck, DollarSign, Activity, Menu, Zap,
  TrendingUp, Globe
} from 'lucide-react';
import { Badge } from '@/components/shared/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';

// Live intelligence ticker messages
const TICKER_MESSAGES = [
  { text: 'Cocoa futures up 3.2% — West Africa corridor active', type: 'signal' },
  { text: 'New AfCFTA tariff reduction: Kenya-Nigeria route', type: 'policy' },
  { text: '12 new verified suppliers joined this week', type: 'network' },
  { text: 'Escrow release: $19.2K processed successfully', type: 'finance' },
  { text: 'Shea butter demand surge — 8 open RFQs matching your products', type: 'opportunity' },
];

export default function TradeOSHeader({
  onOpenCommandPalette,
  onToggleSidebar,
  notificationCount = 0,
  trustScore = 78,
  escrowBalance = 64000,
  complianceStatus = 'ready',
  userAvatar,
}) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [tickerIndex, setTickerIndex] = useState(0);

  // Rotate ticker messages
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % TICKER_MESSAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentTicker = TICKER_MESSAGES[tickerIndex];

  return (
    <div>
      {/* Main Header Bar */}
      <header className="h-14 bg-white dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-[#1E1E1E] flex items-center px-3 md:px-5 gap-3 relative">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#D4A937] hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Command Bar Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2A2A2A] hover:border-[#D4A937]/30 transition-all text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-1 max-w-md"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search or run command...</span>
          <span className="sm:hidden">Search...</span>
          <div className="ml-auto flex items-center gap-1">
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-[#1A1A1A] rounded border border-gray-200 dark:border-[#2A2A2A]">
              <Command className="w-2.5 h-2.5 mr-0.5" />K
            </kbd>
          </div>
        </button>

        {/* Kernel Status Indicators - Desktop only */}
        <div className="hidden lg:flex items-center gap-1">
          {/* Trust Score */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#1E1E1E]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">{trustScore}</span>
          </div>

          {/* Escrow Balance */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#1E1E1E]">
            <DollarSign className="w-3.5 h-3.5 text-[#D4A937]" />
            <span className="text-[11px] font-mono font-semibold text-[#D4A937]">
              ${(escrowBalance / 1000).toFixed(0)}K
            </span>
          </div>

          {/* Compliance */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-[#141414] border ${
            complianceStatus === 'ready' ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-amber-200 dark:border-amber-900/50'
          }`}>
            <Activity className={`w-3.5 h-3.5 ${
              complianceStatus === 'ready' ? 'text-emerald-500' : 'text-amber-500'
            }`} />
            <span className={`text-[11px] font-mono font-semibold ${
              complianceStatus === 'ready' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {complianceStatus === 'ready' ? 'AfCFTA' : 'REVIEW'}
            </span>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Add */}
          <button
            onClick={() => navigate('/dashboard/products/quick-add')}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#D4A937] hover:bg-[#C09830] text-white dark:text-[#0A0A0A] text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          {/* AI Copilot */}
          <button className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#D4A937] hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors relative">
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-[#D4A937] hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors relative">
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#D4A937] rounded-full" />
            )}
          </button>

          {/* User Avatar */}
          <div className="ml-1">
            {userAvatar}
          </div>
        </div>
      </header>

      {/* ═══ LIVE INTELLIGENCE TICKER BAR ═══ */}
      <div className="h-7 bg-gray-50 dark:bg-[#0D0D0D] border-b border-gray-100 dark:border-[#1A1A1A] flex items-center px-3 md:px-5 overflow-hidden">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-shrink-0">
            <Zap className="w-3 h-3 text-[#D4A937]" />
            <span className="text-[10px] font-bold text-[#D4A937] uppercase tracking-wider hidden sm:inline">INTEL</span>
          </div>
          <div className="h-3 w-px bg-gray-200 dark:bg-[#2A2A2A] flex-shrink-0" />
          <motion.div
            key={tickerIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 min-w-0"
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
              currentTicker.type === 'signal' ? 'text-emerald-600 dark:text-emerald-400' :
              currentTicker.type === 'opportunity' ? 'text-[#D4A937]' :
              currentTicker.type === 'finance' ? 'text-blue-600 dark:text-blue-400' :
              'text-gray-500 dark:text-gray-500'
            }`}>
              {currentTicker.type === 'signal' && '↑'}
              {currentTicker.type === 'opportunity' && '★'}
              {currentTicker.type === 'finance' && '$'}
              {currentTicker.type === 'policy' && '⚖'}
              {currentTicker.type === 'network' && '◉'}
            </span>
            <span className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
              {currentTicker.text}
            </span>
          </motion.div>
        </div>
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0 ml-2">
          <Globe className="w-3 h-3 text-gray-400 dark:text-gray-600" />
          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600">
            {TICKER_MESSAGES.length} signals
          </span>
        </div>
      </div>
    </div>
  );
}
