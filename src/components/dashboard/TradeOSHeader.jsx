import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Plus, Command, Sparkles,
  ShieldCheck, Truck, DollarSign, Activity, Menu, Zap,
  Globe, LayoutDashboard, Database, Sun, Moon
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useKernelState } from '@/hooks/useKernelState';

export default function TradeOSHeader({
  onOpenCommandPalette,
  onToggleSidebar,
  onToggleCopilot,
  notificationCount = 0,
  workspaceMode = 'simple',
  onToggleMode = () => { },
  userAvatar,
}) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Connect to Kernel State
  const { data: kernelData, loading: kernelLoading } = useKernelState();

  const activeTrades = kernelData?.activeTrades ?? 0;
  const capitalInMotion = kernelData?.capitalInMotion ?? 0;
  const complianceReady = kernelData?.complianceReadiness ?? 98;
  const activeCorridors = kernelData?.activeCorridors ?? 0;

  return (
    <div className="flex flex-col w-full z-40 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-md border-b border-os-accent/10 sticky top-14 shadow-sm transition-colors duration-300">
      {/* Main Header Bar */}
      <header className="h-14 flex items-center px-4 gap-4 relative">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#D4A937] hover:bg-afrikoni-cream/30 dark:hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Command Bar Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 h-9 px-3 rounded-os-sm bg-afrikoni-cream/20 dark:bg-white/5 border border-os-accent/20 dark:border-white/10 hover:border-[#D4A937]/40 transition-all text-os-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex-1 max-w-md"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search or run command...</span>
          <span className="sm:hidden">Search...</span>
          <div className="ml-auto flex items-center gap-1">
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-os-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-white/10 rounded border border-os-accent/20 dark:border-white/10">
              <Command className="w-2.5 h-2.5 mr-0.5" />K
            </kbd>
          </div>
        </button>

        {/* Right side actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#D4A937] hover:bg-afrikoni-cream/30 dark:hover:bg-white/5 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {/* Mode Toggle */}
          <button
            onClick={onToggleMode}
            className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-full border border-os-accent/20 text-os-xs font-bold tracking-wider uppercase hover:border-[#D4A937]/40 hover:text-[#D4A937] transition-colors bg-afrikoni-cream/20"
          >
            <span className={`${workspaceMode === 'simple' ? 'text-[#D4A937]' : 'text-gray-600'}`}>
              Simple
            </span>
            <span className="h-3 w-px bg-os-accent/20" />
            <span className={`${workspaceMode === 'operator' ? 'text-[#D4A937]' : 'text-gray-600'}`}>
              Operator
            </span>
          </button>

          {/* Quick Add */}
          <button
            onClick={() => navigate('/dashboard/products/new')}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#D4A937] hover:bg-[#C09830] text-black text-os-xs font-bold transition-all shadow-[0_0_15px_rgba(212,169,55,0.2)]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3px]" />
            <span>NEW</span>
          </button>

          {/* AI Copilot */}
          <button
            onClick={onToggleCopilot}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#D4A937] hover:bg-afrikoni-cream/30 dark:hover:bg-white/5 transition-colors relative group"
          >
            <Sparkles className="w-4 h-4" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#D4A937] animate-pulse" />
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-[#D4A937] hover:bg-afrikoni-cream/30 dark:hover:bg-white/5 transition-colors relative">
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {/* User Avatar */}
          <div className="ml-1 pl-3 border-l border-os-accent/20">
            {userAvatar}
          </div>
        </div>
      </header>

      {/* ═══ LIVE KERNEL RIBBON ═══ */}
      <div className="h-9 bg-afrikoni-cream/10 border-t border-os-accent/10 flex items-center px-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>

        {/* Kernel Status Badge */}
        <div className="flex items-center gap-2 flex-shrink-0 mr-6 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-os-xs font-black uppercase tracking-[0.2em] text-gray-600">KERNEL ACTIVE</span>
        </div>

        {/* Scrolling Intelligence Ribbon */}
        {kernelLoading ? (
          <div className="flex items-center gap-4 animate-pulse">
            <div className="h-3 w-20 bg-afrikoni-cream/30 rounded" />
            <div className="h-3 w-20 bg-afrikoni-cream/30 rounded" />
            <div className="h-3 w-20 bg-afrikoni-cream/30 rounded" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden relative z-10 mask-linear-fade">
            <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
              {/* Active Trades */}
              <div className="flex items-center gap-2 group cursor-pointer hover:bg-afrikoni-cream/20 px-2 py-0.5 rounded transition-colors">
                <Activity className="w-3 h-3 text-[#D4A937]" />
                <span className="text-os-xs uppercase tracking-wide text-gray-600 group-hover:text-gray-800">Active Trades</span>
                <span className="text-os-xs font-mono text-afrikoni-deep ml-1">{activeTrades}</span>
              </div>

              {/* Capital */}
              <div className="flex items-center gap-2 group cursor-pointer hover:bg-[#111] px-2 py-0.5 rounded transition-colors">
                <Database className="w-3 h-3 text-emerald-500" />
                <span className="text-os-xs uppercase tracking-wide text-gray-600 group-hover:text-gray-800">Capital Flow</span>
                <span className="text-os-xs font-mono text-afrikoni-deep ml-1">${(capitalInMotion / 1000).toFixed(0)}K</span>
              </div>

              {/* Compliance */}
              <div className="flex items-center gap-2 group cursor-pointer hover:bg-[#111] px-2 py-0.5 rounded transition-colors">
                <ShieldCheck className="w-3 h-3 text-os-blue" />
                <span className="text-os-xs uppercase tracking-wide text-gray-600 group-hover:text-gray-800">AfCFTA</span>
                <span className="text-os-xs font-mono text-afrikoni-deep ml-1">{complianceReady}%</span>
              </div>

              {/* Network */}
              <div className="flex items-center gap-2 group cursor-pointer hover:bg-[#111] px-2 py-0.5 rounded transition-colors">
                <Globe className="w-3 h-3 text-purple-500" />
                <span className="text-os-xs uppercase tracking-wide text-gray-600 group-hover:text-gray-800">Corridors</span>
                <span className="text-os-xs font-mono text-afrikoni-deep ml-1">{activeCorridors} Active</span>
              </div>
            </div>
          </div>
        )}

        {/* System Clock */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0 ml-4 z-10 pl-4 border-l border-os-accent/20">
          <span className="text-os-xs font-mono text-gray-600">UTC {new Date().toISOString().slice(11, 16)}</span>
        </div>
      </div>
    </div>
  );
}
