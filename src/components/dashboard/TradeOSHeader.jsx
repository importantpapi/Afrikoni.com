import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Bell, Plus, ChevronDown, Command, Sparkles,
  ShieldCheck, Truck, DollarSign, Activity, Menu
} from 'lucide-react';
import { Badge } from '@/components/shared/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';

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

  return (
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
  );
}
