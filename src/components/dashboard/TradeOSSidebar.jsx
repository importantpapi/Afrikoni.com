import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, GitBranch, MessageSquare, FileText, ShoppingCart,
  Package, Truck, Wallet, Shield, Settings, HelpCircle, ChevronDown,
  ChevronRight, BarChart3, Building2, Users, Receipt, Star,
  AlertCircle, Lock, Plus, Sparkles, Globe, X
} from 'lucide-react';
import { Badge } from '@/components/shared/ui/badge';
import { Logo } from '@/components/shared/ui/Logo';

function NavSection({ title, children }) {
  return (
    <div className="mb-1">
      {title && (
        <div className="px-4 pt-4 pb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600">
            {title}
          </span>
        </div>
      )}
      <div className="space-y-0.5 px-2">
        {children}
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, path, badge, locked, lockReason, active, onClick }) {
  if (locked) {
    return (
      <div
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-400 dark:text-gray-600 cursor-not-allowed text-[13px]"
        title={lockReason || 'Locked'}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 truncate">{label}</span>
        <Lock className="w-3 h-3" />
      </div>
    );
  }

  return (
    <Link
      to={path}
      onClick={onClick}
      className={`
        flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all relative group
        ${active
          ? 'bg-[#D4A937]/10 text-[#D4A937]'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
        }
      `}
    >
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#D4A937] rounded-r-full"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#D4A937]' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'}`} />
      <span className="flex-1 truncate">{label}</span>
      {badge > 0 && (
        <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-[#D4A937] text-white dark:text-[#0A0A0A] rounded-full">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      {active && <ChevronRight className="w-3 h-3 text-[#D4A937]" />}
    </Link>
  );
}

function CollapsibleNav({ icon: Icon, label, children, defaultOpen = false, locked, lockReason }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (locked) {
    return (
      <div className="px-2">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-400 dark:text-gray-600 cursor-not-allowed text-[13px]">
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate">{label}</span>
          <Lock className="w-3 h-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-all"
      >
        <Icon className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 dark:border-[#1E1E1E] pl-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TradeOSSidebar({
  capabilities,
  isAdmin = false,
  notificationCounts = {},
  onClose,
  sidebarOpen = true,
}) {
  const location = useLocation();
  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const closeMobile = () => {
    if (window.innerWidth < 768 && onClose) onClose();
  };

  const isBuyer = capabilities?.can_buy === true;
  const isSeller = capabilities?.can_sell === true && capabilities?.sell_status === 'approved';
  const isSellerPending = capabilities?.can_sell === true && capabilities?.sell_status !== 'approved';
  const isLogistics = capabilities?.can_logistics === true && capabilities?.logistics_status === 'approved';

  return (
    <aside className={`
      fixed left-0 top-0 h-screen w-[240px] bg-white dark:bg-[#0A0A0A] border-r border-gray-200 dark:border-[#1E1E1E]
      flex flex-col z-50 transition-transform duration-200
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
    `}>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-[#1E1E1E]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#D4A937] flex items-center justify-center">
            <span className="text-white dark:text-[#0A0A0A] text-xs font-black">A</span>
          </div>
          <div>
            <span className="text-sm font-bold text-gray-900 dark:text-[#F5F0E8] tracking-tight">AFRIKONI</span>
            <span className="text-[9px] font-medium text-gray-400 dark:text-gray-600 block -mt-0.5 tracking-wider">TRADE OS</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-hide">
        {/* Trade Operations */}
        <NavSection title="Trade Operations">
          <NavItem icon={LayoutDashboard} label="Command Center" path="/dashboard" active={isActive('/dashboard') && !location.pathname.includes('/dashboard/')} onClick={closeMobile} />
          <NavItem icon={GitBranch} label="Trade Pipeline" path="/dashboard/trade-pipeline" active={isActive('/dashboard/trade-pipeline')} onClick={closeMobile} />
          <NavItem icon={MessageSquare} label="Trade Signals" path="/dashboard/notifications" badge={notificationCounts.messages} active={isActive('/dashboard/notifications')} onClick={closeMobile} />
        </NavSection>

        {/* Buying */}
        {isBuyer && (
          <NavSection title="Buying">
            <NavItem icon={FileText} label="RFQs" path="/dashboard/rfqs" badge={notificationCounts.rfqs} active={isActive('/dashboard/rfqs')} onClick={closeMobile} />
            <NavItem icon={ShoppingCart} label="Orders" path="/dashboard/orders" active={isActive('/dashboard/orders')} onClick={closeMobile} />
            <NavItem icon={Wallet} label="Payments" path="/dashboard/payments" active={isActive('/dashboard/payments')} onClick={closeMobile} />
          </NavSection>
        )}

        {/* Selling */}
        {(isSeller || isSellerPending) && (
          <NavSection title="Selling">
            <NavItem icon={Package} label="Products" path="/dashboard/products" active={isActive('/dashboard/products')} locked={isSellerPending} lockReason="Pending approval" onClick={closeMobile} />
            <NavItem icon={FileText} label="RFQs Received" path="/dashboard/supplier-rfqs" active={isActive('/dashboard/supplier-rfqs')} locked={isSellerPending} lockReason="Pending approval" onClick={closeMobile} />
            <NavItem icon={ShoppingCart} label="Sales" path="/dashboard/sales" active={isActive('/dashboard/sales')} locked={isSellerPending} lockReason="Pending approval" onClick={closeMobile} />
          </NavSection>
        )}

        {/* Logistics */}
        {isLogistics && (
          <NavSection title="Logistics">
            <NavItem icon={Truck} label="Shipments" path="/dashboard/shipments" active={isActive('/dashboard/shipments')} onClick={closeMobile} />
          </NavSection>
        )}

        {/* Intelligence */}
        <NavSection title="Intelligence">
          <NavItem icon={BarChart3} label="Analytics" path="/dashboard/analytics" active={isActive('/dashboard/analytics')} onClick={closeMobile} />
          <NavItem icon={Shield} label="Compliance" path="/dashboard/compliance" active={isActive('/dashboard/compliance')} onClick={closeMobile} />
          <NavItem icon={Star} label="Trust & Reviews" path="/dashboard/reviews" active={isActive('/dashboard/reviews')} onClick={closeMobile} />
        </NavSection>

        {/* Admin */}
        {isAdmin && (
          <NavSection title="Admin">
            <NavItem icon={AlertCircle} label="Admin Panel" path="/dashboard/admin" active={isActive('/dashboard/admin')} onClick={closeMobile} />
            <NavItem icon={Shield} label="Risk & KYC" path="/dashboard/risk" active={isActive('/dashboard/risk')} onClick={closeMobile} />
          </NavSection>
        )}

        {/* Manage */}
        <CollapsibleNav icon={Building2} label="Manage">
          <NavItem icon={Building2} label="Company" path="/dashboard/company-info" active={isActive('/dashboard/company-info')} onClick={closeMobile} />
          <NavItem icon={Users} label="Team" path="/dashboard/team-members" active={isActive('/dashboard/team-members')} onClick={closeMobile} />
          <NavItem icon={Receipt} label="Invoices" path="/dashboard/invoices" active={isActive('/dashboard/invoices')} onClick={closeMobile} />
        </CollapsibleNav>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 dark:border-[#1E1E1E] p-2 space-y-0.5">
        <NavItem icon={Settings} label="Settings" path="/dashboard/settings" active={isActive('/dashboard/settings')} onClick={closeMobile} />
        <NavItem icon={HelpCircle} label="Help" path="/dashboard/help" active={isActive('/dashboard/help')} onClick={closeMobile} />
      </div>

      {/* System Status Footer */}
      <div className="px-4 py-2.5 border-t border-gray-200 dark:border-[#1E1E1E] bg-gray-50 dark:bg-[#0D0D0D]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600">
            Trade OS v2.0
          </span>
          <span className="text-[10px] text-gray-300 dark:text-gray-700 ml-auto">
            {isBuyer && isSeller ? 'HYBRID' : isSeller ? 'SELLER' : isBuyer ? 'BUYER' : isLogistics ? 'LOGISTICS' : 'USER'}
          </span>
        </div>
      </div>
    </aside>
  );
}
