import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, Package, ShoppingCart, FileText, MessageSquare,
  Truck, Wallet, Shield, Settings, HelpCircle, BarChart3, Plus, Star,
  AlertCircle, Building, Users, Bell, ArrowRight, Command, Sparkles,
  Receipt, FileSearch, Target, Globe
} from 'lucide-react';

const ACTIONS = [
  { id: 'new-rfq', label: 'Create New RFQ', keywords: 'rfq request quote new create buy source', icon: Plus, path: '/dashboard/rfqs/new', group: 'Quick Actions' },
  { id: 'new-product', label: 'Add New Product', keywords: 'product add new create sell listing', icon: Plus, path: '/dashboard/products/new', group: 'Quick Actions' },
  { id: 'new-shipment', label: 'Create Shipment', keywords: 'shipment logistics ship create new freight', icon: Plus, path: '/dashboard/shipments/new', group: 'Quick Actions' },
  { id: 'nav-dashboard', label: 'Dashboard Home', keywords: 'home dashboard overview main', icon: LayoutDashboard, path: '/dashboard', group: 'Navigation' },
  { id: 'nav-pipeline', label: 'Trade Pipeline', keywords: 'pipeline trade flow inquiry quote escrow shipment delivery tracking', icon: BarChart3, path: '/dashboard/trade-pipeline', group: 'Navigation' },
  { id: 'nav-products', label: 'Products', keywords: 'products catalog inventory items listings', icon: Package, path: '/dashboard/products', group: 'Navigation' },
  { id: 'nav-orders', label: 'Orders', keywords: 'orders purchases buying', icon: ShoppingCart, path: '/dashboard/orders', group: 'Navigation' },
  { id: 'nav-sales', label: 'Sales', keywords: 'sales revenue selling', icon: ShoppingCart, path: '/dashboard/sales', group: 'Navigation' },
  { id: 'nav-rfqs', label: 'RFQs (My Requests)', keywords: 'rfqs requests quotes sourcing', icon: FileText, path: '/dashboard/rfqs', group: 'Navigation' },
  { id: 'nav-supplier-rfqs', label: 'RFQs Received', keywords: 'supplier rfqs received respond quote', icon: FileSearch, path: '/dashboard/supplier-rfqs', group: 'Navigation' },
  { id: 'nav-messages', label: 'Messages', keywords: 'messages notifications inbox chat', icon: MessageSquare, path: '/dashboard/messages', group: 'Navigation' },
  { id: 'nav-payments', label: 'Payments', keywords: 'payments wallet money transactions', icon: Wallet, path: '/dashboard/wallet', group: 'Navigation' },
  { id: 'nav-invoices', label: 'Invoices', keywords: 'invoices billing receipts', icon: Receipt, path: '/dashboard/invoices', group: 'Navigation' },
  { id: 'nav-shipments', label: 'Shipments', keywords: 'shipments tracking delivery freight', icon: Truck, path: '/dashboard/shipments', group: 'Navigation' },
  { id: 'nav-fulfillment', label: 'Fulfillment', keywords: 'fulfillment warehouse packing', icon: Truck, path: '/dashboard/fulfillment', group: 'Navigation' },
  { id: 'nav-analytics', label: 'Analytics', keywords: 'analytics reports data insights charts', icon: BarChart3, path: '/dashboard/analytics', group: 'Intelligence' },
  { id: 'nav-performance', label: 'Performance Metrics', keywords: 'performance metrics kpi stats', icon: Target, path: '/dashboard/performance', group: 'Intelligence' },
  { id: 'nav-koniai', label: 'KoniAI Assistant', keywords: 'ai assistant koni intelligence copilot', icon: Sparkles, path: '/dashboard/koniai', group: 'Intelligence' },
  { id: 'nav-reviews', label: 'Reviews & Trust', keywords: 'reviews trust ratings feedback', icon: Star, path: '/dashboard/reviews', group: 'Trust & Compliance' },
  { id: 'nav-disputes', label: 'Disputes', keywords: 'disputes resolution conflict', icon: AlertCircle, path: '/dashboard/disputes', group: 'Trust & Compliance' },
  { id: 'nav-kyc', label: 'KYC Verification', keywords: 'kyc verification identity documents', icon: Shield, path: '/dashboard/kyc', group: 'Trust & Compliance' },
  { id: 'nav-compliance', label: 'Compliance', keywords: 'compliance regulations rules', icon: Shield, path: '/dashboard/compliance', group: 'Trust & Compliance' },
  { id: 'nav-settings', label: 'Settings', keywords: 'settings preferences account profile', icon: Settings, path: '/dashboard/settings', group: 'Settings' },
  { id: 'nav-company', label: 'Company Info', keywords: 'company business profile organization', icon: Building, path: '/dashboard/company-info', group: 'Settings' },
  { id: 'nav-team', label: 'Team Members', keywords: 'team members staff users invite', icon: Users, path: '/dashboard/team-members', group: 'Settings' },
  { id: 'nav-help', label: 'Help & Support', keywords: 'help support faq guide', icon: HelpCircle, path: '/dashboard/help', group: 'Settings' },
];

function fuzzyMatch(text, query) {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  return lower.includes(q);
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = useMemo(() => {
    const list = ACTIONS || [];
    if (!query.trim()) return list;
    return list.filter(a =>
      fuzzyMatch(a.label, query) || fuzzyMatch(a.keywords, query)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const groups = {};
    (filtered || []).forEach(action => {
      if (!groups[action.group]) groups[action.group] = [];
      groups[action.group].push(action);
    });
    return groups;
  }, [filtered]);

  const flatList = useMemo(() => {
    const result = [];
    Object.values(grouped || {}).forEach(items => result.push(...(items || [])));
    return result;
  }, [grouped]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const executeAction = useCallback((action) => {
    onClose();
    if (action.path) {
      navigate(action.path);
    }
  }, [navigate, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatList[selectedIndex]) {
      e.preventDefault();
      executeAction(flatList[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [flatList, selectedIndex, executeAction, onClose]);

  if (!open) return null;

  let globalIndex = 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 dark:bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Palette */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl dark:bg-[#0F0F0F] rounded-os-sm shadow-2xl shadow-black/20 dark:shadow-black/60 border dark:border-[#2A2A2A] overflow-hidden backdrop-blur-xl"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-[#1E1E1E]">
            <Search className="w-5 h-5 dark:text-os-text-secondary flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search actions, pages, or type a command..."
              className="flex-1 text-os-base outline-none bg-transparent dark:text-[#F5F0E8] placeholder:text-gray-400 dark:placeholder:text-os-text-secondary"
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-os-xs font-medium dark:text-os-text-secondary dark:bg-[#1A1A1A] rounded border dark:border-[#2A2A2A]">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
            {flatList.length === 0 ? (
              <div className="px-4 py-8 text-center dark:text-os-text-secondary text-os-sm">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <div key={group}>
                  <div className="px-4 py-1.5 text-os-xs font-bold dark:text-os-text-secondary uppercase tracking-[0.1em]">
                    {group}
                  </div>
                  {(items || []).map((action) => {
                    const idx = globalIndex++;
                    const isSelected = idx === selectedIndex;
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        data-index={idx}
                        onClick={() => executeAction(action)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSelected
                          ? 'bg-os-accent/10 text-os-text-primary dark:text-[#F5F0E8]'
                          : 'text-os-text-secondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] hover:text-gray-700 dark:hover:text-gray-200'
                          }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-os-accent' : 'text-gray-400 dark:text-os-text-secondary'
                          }`} />
                        <span className="flex-1 text-os-sm font-medium">{action.label}</span>
                        {isSelected && (
                          <ArrowRight className="w-4 h-4" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t dark:border-[#1E1E1E] flex items-center gap-4 text-os-xs dark:text-os-text-secondary">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 dark:bg-[#1A1A1A] rounded border dark:border-[#2A2A2A] text-os-xs">&uarr;&darr;</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 dark:bg-[#1A1A1A] rounded border dark:border-[#2A2A2A] text-os-xs">Enter</kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 dark:bg-[#1A1A1A] rounded border dark:border-[#2A2A2A] text-os-xs">Esc</kbd>
              Close
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
