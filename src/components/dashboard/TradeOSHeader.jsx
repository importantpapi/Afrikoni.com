import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bell, Plus, Menu
} from 'lucide-react';
import { useKernelState } from '@/hooks/useKernelState';

export default function TradeOSHeader({
  onOpenCommandPalette,
  onToggleSidebar,
  notificationCount = 0,
  workspaceMode = 'simple',
  onToggleMode = () => { },
  userAvatar,
}) {
  const navigate = useNavigate();

  // Connect to live system state
  const { data: systemState, loading: systemLoading } = useKernelState();

  const activeTrades = systemState?.activeTrades ?? 0;
  const capitalInMotion = systemState?.capitalInMotion ?? 0;
  const activeCorridors = systemState?.activeCorridors ?? 0;

  return (
    <div className="flex flex-col w-full z-40 bg-white/95 dark:bg-[#1C1917]/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5 sticky top-0 transition-colors duration-300">
      <header className="h-16 flex items-center px-6 gap-6 relative">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-3 h-10 px-4 rounded-full bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-sm text-gray-400 hover:text-gray-600 flex-1 max-w-md group"
        >
          <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-500" />
          <span className="hidden sm:inline font-medium">Search workspace</span>
          <div className="ml-auto flex items-center gap-1">
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-gray-400 bg-white rounded border border-gray-200">
              ⌘ K
            </kbd>
          </div>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-4 ml-auto">

          {/* Mode toggle */}
          <button
            onClick={onToggleMode}
            className="hidden sm:flex items-center p-1 rounded-full bg-gray-100 dark:bg-white/5"
          >
            <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${workspaceMode === 'simple' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              Overview
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${workspaceMode === 'operator' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              Advanced
            </span>
          </button>

          <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-2" />

          {/* Primary action */}
          <button
            onClick={() => navigate('/dashboard/products/new')}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-os-accent text-black hover:bg-os-accent/90 transition-colors"
            title="Create new trade"
          >
            <Plus className="w-4 h-4 ml-0.5 mt-0.5" />
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors relative">
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-red-500 border-2 border-white" />
            )}
          </button>

          <div className="pl-2">
            {userAvatar}
          </div>
        </div>
      </header>

      {!systemLoading && (
        <div className="h-8 bg-gray-50/50 border-t border-gray-100 flex items-center px-6">
          <div className="flex items-center gap-8 text-[10px] uppercase tracking-wider text-gray-500 font-medium">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              All systems running
            </span>
            <span>Active {activeTrades}</span>
            <span>Escrow ${(capitalInMotion / 1000).toFixed(0)}k</span>
            <span>Routes {activeCorridors}</span>
          </div>
        </div>
      )}
    </div>
  );
}
