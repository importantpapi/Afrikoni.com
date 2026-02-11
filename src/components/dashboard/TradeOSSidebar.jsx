import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, GitBranch, MessageSquare, FileText, ShoppingCart,
  Package, Truck, Wallet, Shield, Settings, HelpCircle, ChevronDown,
  ChevronRight, BarChart3, Building2, Users, Receipt, Star,
  AlertCircle, Lock, Plus, Sparkles, Globe, X, Database, Landmark, Bell, LogOut
} from 'lucide-react';

export default function TradeOSSidebar({
  capabilities,
  isAdmin = false,
  notificationCounts = {},
  onClose,
  sidebarOpen = true,
  workspaceMode = 'simple',
}) {
  const location = useLocation();
  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const isBuyer = capabilities?.can_buy === true;
  const isSeller = capabilities?.can_sell === true;
  const isLogistics = capabilities?.can_logistics === true;

  // OS-style Nav Item
  const OSNavItem = ({ icon: Icon, label, path, badge, active, onClick }) => (
    <Link
      to={path}
      onClick={onClick}
      className={`
        relative group flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
        ${active
          ? 'bg-[#D4A937] text-black shadow-[0_0_15px_rgba(212,169,55,0.4)] scale-105'
          : 'text-gray-600 hover:text-[#D4A937] hover:bg-afrikoni-cream/30'
        }
      `}
    >
      <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />

      {/* Tooltip Label (Hover) */}
      <div className="absolute left-14 px-3 py-1.5 bg-white border border-afrikoni-gold/20 rounded-lg text-[11px] font-medium text-afrikoni-deep opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 flex items-center gap-2 shadow-xl">
        {label}
        {badge > 0 && (
          <span className="flex items-center justify-center min-w-[16px] h-4 bg-[#D4A937] text-black text-[9px] font-bold rounded-full px-1">
            {badge}
          </span>
        )}
      </div>

      {/* Active Dot */}
      {active && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#D4A937] rounded-r-full" />
      )}
    </Link>
  );

  return (
    <aside className={`
      fixed left-0 top-0 h-screen w-[72px] bg-white border-r border-afrikoni-gold/10
      flex flex-col items-center py-5 z-[60] transition-transform duration-200 shadow-sm
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
    `}>
      {/* OS Logo */}
      <Link to="/dashboard" className="mb-8 relative group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A937] to-[#8B4513] flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
          <span className="text-black font-black text-sm">A</span>
        </div>
      </Link>

      {/* Navigation Dock */}
      <nav className="flex-1 flex flex-col gap-3 w-full px-2 items-center overflow-y-auto scrollbar-hide py-2">

        {/* 0. Command Center (The Brain) */}
        <OSNavItem icon={LayoutDashboard} label="Command Center" path="/dashboard" active={isActive('/dashboard') && !location.pathname.includes('/dashboard/')} />

        {/* Advanced: Treasury */}
        {workspaceMode === 'operator' && (
          <OSNavItem icon={Landmark} label="Sovereign Treasury" path="/dashboard/revenue" active={isActive('/dashboard/revenue')} />
        )}

        <OSNavItem icon={MessageSquare} label="Messages" path="/dashboard/messages" active={isActive('/dashboard/messages')} />
        <OSNavItem icon={Bell} label="Signals" path="/dashboard/notifications" badge={notificationCounts.messages} active={isActive('/dashboard/notifications')} />

        <div className="w-8 h-px bg-afrikoni-gold/20 my-1" />

        {/* 1. INTAKE STAGE (Discovery & Definition) */}
        {/* Buyer: Create Demand / Seller: Define Supply */}
        {(isBuyer || isSeller) && (
          <>
            {/* Marketplace Access for Buyers */}
            {isBuyer && (
              <OSNavItem
                icon={Package}
                label="Marketplace"
                path="/marketplace"
                active={isActive('/marketplace')}
              />
            )}

            <OSNavItem
              icon={FileText}
              label={isSeller ? "Quotes" : "RFQs (Intake)"}
              path={isSeller ? "/dashboard/supplier-rfqs" : "/dashboard/rfqs"}
              badge={notificationCounts.rfqs}
              active={isActive('/dashboard/rfqs') || isActive('/dashboard/supplier-rfqs')}
            />
          </>
        )}
        {isSeller && (
          <OSNavItem icon={Package} label="Inventory" path="/dashboard/products" active={isActive('/dashboard/products')} />
        )}

        <div className="w-8 h-px bg-[#222] my-1" />

        {/* 2. EXECUTION STAGE (Commitment & Production) */}
        {/* The TradeWorkspace - centralized list of active trades */}
        <OSNavItem
          icon={ShoppingCart}
          label="Active Trades"
          path="/dashboard/orders"
          active={isActive('/dashboard/orders') || isActive('/dashboard/trade/')}
        />

        <OSNavItem
          icon={Globe}
          label="Corridors"
          path="/dashboard/corridors"
          active={isActive('/dashboard/corridors')}
        />

        {workspaceMode === 'operator' && (
          <>
            <div className="w-8 h-px bg-[#222] my-1" />

            {/* 3. THE UNBROKEN FLOW (Power-Ups) */}
            <OSNavItem
              icon={Shield}
              label="Trust Center"
              path="/dashboard/trust-center"
              badge="NEW"
              active={isActive('/dashboard/trust-center')}
            />

            <OSNavItem
              icon={Lock}
              label="Trace Center"
              path="/dashboard/trace-center"
              badge="LIVE"
              active={isActive('/dashboard/trace-center')}
            />

            <OSNavItem
              icon={Building2} // Changed from Shield to avoid duplicate icon
              label="Verification Lab"
              path="/dashboard/verification-center"
              badge="BETA"
              active={isActive('/dashboard/verification-center')}
            />

            {isSeller && (
              <OSNavItem icon={BarChart3} label="Sales Analytics" path="/dashboard/sales" active={isActive('/dashboard/sales')} />
            )}
          </>
        )}

        <div className="w-8 h-px bg-[#222] my-1" />

        {/* 3. FULFILLMENT & FINANCE (Logistics & Settlement) */}
        {(isLogistics || isBuyer || isSeller) && (
          <OSNavItem icon={Truck} label="Logistics" path="/dashboard/shipments" active={isActive('/dashboard/shipments')} />
        )}

        <OSNavItem icon={Wallet} label="Finance" path="/dashboard/payments" active={isActive('/dashboard/payments')} />

        {workspaceMode === 'operator' && (
          <OSNavItem icon={FileText} label="Documents" path="/dashboard/documents" active={isActive('/dashboard/documents')} />
        )}
      </nav>

      {/* System Apps */}
      <div className="flex flex-col gap-4 w-full px-2 items-center mt-auto pb-4">
        <div className="w-6 h-px bg-afrikoni-gold/20" />
        <OSNavItem icon={Settings} label="Settings" path="/dashboard/settings" active={isActive('/dashboard/settings')} />
        <OSNavItem icon={HelpCircle} label="Help" path="/dashboard/help" active={isActive('/dashboard/help')} />
        <OSNavItem icon={LogOut} label="Exit to Website" path="/" />

        <button onClick={onClose} className="md:hidden mt-2 p-2 text-gray-600 hover:text-[#D4A937]">
          <X className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
