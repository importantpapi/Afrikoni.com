import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Truck, FileText, MessageSquare,
  BarChart3, Wallet, Shield, Settings, HelpCircle, Bell, Search, ChevronDown,
  User, Users, LogOut, Calendar, Globe, Menu, X, Building2, Plus, ChevronRight,
  AlertTriangle, Lock, FileCheck, AlertCircle, Star, DollarSign, TrendingUp, Sparkles,
  Receipt, RotateCcw, Star as StarIcon, Warehouse, TrendingDown, Users as UsersIcon,
  FileSearch, Target, MessageCircle, GitBranch
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { Logo } from '@/components/shared/ui/Logo';
import { useAuth } from '@/contexts/AuthProvider';
import { isAdmin } from '@/utils/permissions';
import { useTranslation } from 'react-i18next';
import MobileBottomNav from '@/components/dashboard/MobileBottomNav';
import { DashboardContextProvider } from '@/contexts/DashboardContext';
import { openWhatsAppCommunity } from '@/utils/whatsappCommunity';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
// Removed: useLiveStats (social proof footer removed in Phase 2)
import { getUserInitial, extractUserName } from '@/utils/userHelpers';
// REMOVED: Realtime is now owned by DashboardRealtimeManager in WorkspaceDashboard
// import { useRealTimeDashboardData } from '@/hooks/useRealTimeData';
// PHASE 5B: Removed role-based nav imports - sidebar built dynamically from capabilities
// useAuth is already imported above (line 18)
// import { buyerNav } from '@/config/navigation/buyerNav'; // Removed
// import { sellerNav } from '@/config/navigation/sellerNav'; // Removed
// import { hybridNav } from '@/config/navigation/hybridNav'; // Removed
// import { logisticsNav } from '@/config/navigation/logisticsNav'; // Removed
// PHASE 5B: Removed role helper imports - capabilities are the only authority
// ✅ FINAL HARDENING: Removed all commented role helper imports
import { useCapability } from '@/context/CapabilityContext';
import { RefreshCw } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { SpinnerWithTimeout } from '@/components/shared/ui/SpinnerWithTimeout';
import UserAvatar from '@/components/headers/UserAvatar';
// Layout configuration and utilities
import { zIndex } from '@/config/zIndex';
import { layoutConfig } from '@/config/layout';
import { getHeaderComponent } from '@/config/headerMapping';
import CommandPalette from '@/components/dashboard/CommandPalette';
import { useTheme } from '@/contexts/ThemeContext';
import TradeOSSidebar from '@/components/dashboard/TradeOSSidebar';
import TradeOSHeader from '@/components/dashboard/TradeOSHeader';
import KernelStatusBar from '@/components/dashboard/KernelStatusBar';
import AITradeCopilot from '@/components/dashboard/AITradeCopilot';

// Collapsible menu section component for items with children
function CollapsibleMenuSection({ item, location, setSidebarOpen }) {
  const [isOpen, setIsOpen] = useState(!item.collapsedByDefault);
  const Icon = item.icon;
  
  // Check if any child is active
  const hasActiveChild = item.children?.some(child => 
    location.pathname === child.path || 
    (child.path && location.pathname.startsWith(child.path))
  );

  return (
    <div className="space-y-1">
      <button
        onClick={() => !item.locked && setIsOpen(!isOpen)}
        disabled={item.locked}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-afrikoni text-sm font-semibold transition-all group
          ${item.locked 
            ? 'text-afrikoni-sand/40 cursor-not-allowed'
            : hasActiveChild 
            ? 'bg-afrikoni-gold/20 text-afrikoni-gold' 
            : 'text-afrikoni-sand hover:bg-afrikoni-gold/12 hover:text-afrikoni-gold'
          }
        `}
        title={item.locked ? (item.lockReason || 'Locked') : undefined}
      >
        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
        <span className="flex-1 text-left">{item.label}</span>
        {item.locked ? (
          <Lock className="w-4 h-4" />
        ) : (
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && item.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-afrikoni-gold/20 pl-3">
              {item.children.map((child, childIdx) => {
                const ChildIcon = child.icon;
                const isChildActive = location.pathname === child.path || 
                                     (child.path && location.pathname.startsWith(child.path));
                const isLocked = child.locked || child.disabled;
                
                if (isLocked) {
                  return (
                    <div
                      key={`${child.path}-${childIdx}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-afrikoni-sand/40 cursor-not-allowed"
                      title={child.lockReason || 'Locked'}
                    >
                      {ChildIcon && <ChildIcon className="w-3 h-3" />}
                      <span>{child.label}</span>
                      <Lock className="w-3 h-3 ml-auto" />
                    </div>
                  );
                }
                
                return (
                  <Link
                    key={`${child.path}-${childIdx}`}
                    to={child.path}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
                      ${isChildActive
                        ? 'bg-afrikoni-gold/20 text-afrikoni-gold'
                        : 'text-afrikoni-sand/70 hover:text-afrikoni-gold hover:bg-afrikoni-gold/10'
                      }
                    `}
                  >
                    {ChildIcon && <ChildIcon className="w-3 h-3" />}
                    {child.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * PHASE 5B: DashboardLayout - Capability-based layout guard
 * 
 * RULES:
 * - Checks capability.ready ONCE before first mount
 * - Once mounted, NEVER unmounts children (even if capability changes)
 * - Does NOT check auth/role state (handled by RequireCapability route guard)
 * - Does NOT conditionally unmount after first mount
 */
export default function DashboardLayout({ 
  children, 
  currentRole, // PHASE 5B: Legacy prop - IGNORED (capabilities are the only authority)
  capabilities = null // PHASE 5B: Capability-based access (required)
}) {
  const { t } = useTranslation();
  // PHASE 5B: Removed useRole and refreshRole - capabilities are the only authority
  // PHASE 5B: Use capabilities from context instead of DashboardRoleContext
  // ✅ CRITICAL FIX: Safe access with try/catch and defaults
  let capabilitiesFromContext;
  try {
    capabilitiesFromContext = useCapability();
  } catch (error) {
    console.warn('[DashboardLayout] Error accessing capabilities, using defaults:', error);
    capabilitiesFromContext = {
      can_buy: true,
      can_sell: false,
      can_logistics: false,
      sell_status: 'disabled',
      logistics_status: 'disabled',
      company_id: null,
      loading: false,
      ready: true,
      error: null,
      refreshCapabilities: async () => {},
    };
  }
  
  // ✅ CRITICAL FIX: Safe access with optional chaining
  const safeCapabilities = capabilitiesFromContext || {
    can_buy: true,
    can_sell: false,
    can_logistics: false,
    sell_status: 'disabled',
    logistics_status: 'disabled',
    company_id: null,
    loading: false,
    ready: true,
    error: null,
  };
  
  // ✅ CRITICAL FIX: Extract refreshCapabilities and loading state for Global Sync button
  const refreshCapabilities = capabilitiesFromContext?.refreshCapabilities || null;
  const capabilitiesLoading = capabilitiesFromContext?.loading || false;
  
  // PHASE 5B: Track if layout has been mounted once (to prevent unmounting)
  const hasMountedRef = useRef(false);

  // ✅ SKELETON FIX: Removed pre-mount loading check
  // WorkspaceDashboard (parent) already verifies isSystemReady via useDashboardKernel
  // Having another loading screen here causes cascading loading states ("skeleton problem")
  // Trust that the parent component has already verified capabilities
  if (!hasMountedRef.current) {
    // PHASE 5B: Mark as mounted immediately (no loading guard here)
    hasMountedRef.current = true;
  }
  
  // ✅ CRITICAL FIX: Safe access with optional chaining
  // PHASE 5B: Get capabilities data (use prop or context)
  // ✅ STABILIZATION: Capability override for development - Full Visibility mode
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const capabilitiesData = capabilities || (safeCapabilities?.ready ? {
    can_buy: safeCapabilities?.can_buy ?? true,
    can_sell: safeCapabilities?.can_sell ?? false,
    can_logistics: safeCapabilities?.can_logistics ?? false,
    sell_status: safeCapabilities?.sell_status ?? 'disabled',
    logistics_status: safeCapabilities?.logistics_status ?? 'disabled',
  } : (isDevelopment ? {
    // ✅ STABILIZATION: Development fallback - Full Visibility mode
    can_buy: true,
    can_sell: true,
    can_logistics: true,
    sell_status: 'approved',
    logistics_status: 'approved',
  } : {
    can_buy: true,
    can_sell: false,
    can_logistics: false,
    sell_status: 'disabled',
    logistics_status: 'disabled',
  }));
  const { user: contextUser, profile: contextProfile, loading: userLoading, refreshProfile } = useUser();
  // ✅ CRITICAL FIX: Declare profileCompanyId IMMEDIATELY after contextProfile
  // This must be declared BEFORE it's used in useNotificationCounts (line 255)
  const profileCompanyId = contextProfile?.company_id || null;
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [companyId, setCompanyId] = useState(null);
  // PHASE 5B: Derive capability flags from capabilities (NO role variables)
  const isBuyer = capabilitiesData?.can_buy === true;
  const isSeller = capabilitiesData?.can_sell === true && capabilitiesData?.sell_status === 'approved';
  const isLogistics = capabilitiesData?.can_logistics === true && capabilitiesData?.logistics_status === 'approved';
  // ✅ FULL-STACK SYNC: Standardize isHybrid as (can_buy && can_sell)
  const isHybridCapability = capabilitiesData?.can_buy === true && capabilitiesData?.can_sell === true;
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [activeView, setActiveView] = useState('all'); // For hybrid: 'all', 'buyer', 'seller'
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const userMenuButtonRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  // PHASE 5B: Dev switcher completely removed - capabilities are company-level
  
  // Merge user data with profile for display (for backward compatibility)
  const mergedUser = contextUser && contextProfile ? {
    ...contextUser,
    ...contextProfile,
    full_name: extractUserName(contextUser, contextProfile) || contextUser?.full_name || contextProfile?.full_name || null,
    name: extractUserName(contextUser, contextProfile) || contextUser?.name || contextProfile?.name || null,
  } : contextUser;
  
  // Get notification counts for sidebar badges
  const notificationCounts = useNotificationCounts(contextUser?.id, profileCompanyId);
  
  // Removed: liveStats (social proof footer removed in Phase 2)
  
  // ==========================================================================
  // REALTIME - REMOVED (Owned by DashboardRealtimeManager in WorkspaceDashboard)
  // ==========================================================================
  //
  // ARCHITECTURAL NOTE:
  // Realtime subscriptions are NOW owned by DashboardRealtimeManager
  // which is rendered in WorkspaceDashboard.jsx (above the Outlet).
  //
  // DO NOT ADD REALTIME HERE - It creates duplicate channels and
  // "binding mismatch" errors when combined with DashboardRealtimeManager.
  //
  // Single owner: src/components/dashboard/DashboardRealtimeManager.jsx
  // ==========================================================================

  // PHASE 5B: Update local state when context data changes (no role dependency)
  useEffect(() => {
    if (profileCompanyId) {
      setCompanyId(profileCompanyId);
    }
    // PHASE 5B: No role dependency - capabilities are the only authority
  }, [profileCompanyId]);

  // Update admin and founder status when user/profile changes
  // ✅ FIXED: Extract primitives to prevent object identity issues
  const contextUserId = contextUser?.id || null;
  const contextUserEmail = contextUser?.email?.toLowerCase() || null;
  const contextProfileId = contextProfile?.id || null;
  
  // ✅ SCHEMA ALIGNMENT: Removed verbose console logging - Kernel sync verified
  // Kernel is working correctly, no need for verbose logging in production
  
  useEffect(() => {
    if (contextUserId && contextProfileId) {
      // ✅ FIXED: Pass both user and profile to isAdmin for proper check
      try {
        const admin = isAdmin(contextUser, contextProfile);
        setIsUserAdmin(admin || false);
      } catch (adminError) {
        console.warn('Error checking admin status:', adminError);
        setIsUserAdmin(false);
      }
      
      // Check if user is founder/CEO (youba.thiam@icloud.com)
      const isFounderUser = contextUserEmail === 'youba.thiam@icloud.com';
      setIsFounder(isFounderUser);
      // PHASE 5B: Dev switcher removed - capabilities are company-level
      
      // ✅ Founder is always admin (isAdmin already checks this, but ensure it's set)
      if (isFounderUser) {
        setIsUserAdmin(true);
      }
    } else {
      setIsUserAdmin(false);
      setIsFounder(false);
    }
  }, [contextUserId, contextUserEmail, contextProfileId, contextUser, contextProfile]); // ✅ Include user/profile for isAdmin check

  // Calculate menu position when it opens
  useEffect(() => {
    if (userMenuOpen && userMenuButtonRef.current) {
      const buttonRect = userMenuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: buttonRect.bottom + 8,
        right: window.innerWidth - buttonRect.right
      });
    }
  }, [userMenuOpen]);

  // Removed loadUser - now using UserContext

  const handleLogout = async () => {
    try {
      // Log logout to audit log before signing out (non-blocking)
      try {
        const { logLogoutEvent } = await import('@/utils/auditLogger');
        await logLogoutEvent({ user: contextUser, profile: contextProfile });
      } catch (auditError) {
        // Don't break logout if audit logging fails
        console.warn('Failed to log logout:', auditError);
      }
      
      // ✅ FULL-STACK SYNC: Use AuthService for atomic logout with state wipe
      const { logout: authServiceLogout } = await import('@/services/AuthService');
      await authServiceLogout();
      // AuthService handles: signOut({ scope: 'global' }), localStorage.clear(), window.location.href reset
      // No need to navigate or clear state - AuthService does hard redirect
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, force redirect via AuthService
      try {
        const { logout: authServiceLogout } = await import('@/services/AuthService');
        await authServiceLogout();
      } catch (fallbackError) {
        // Last resort: direct redirect
        window.location.href = '/login';
      }
    }
  };

  // PHASE 5B: Removed sidebarItems object - capabilities are the only authority
  // Sidebar is built dynamically from capabilities, not from static role-based nav arrays

  // PHASE 5B: Build sidebar from capabilities (capability-based access - ONLY source of truth)
  // ✅ KERNEL-TO-UI ALIGNMENT: Integrated admin check into sidebar building
  // ✅ STABILIZATION: Global error boundary around sidebar building
  const buildSidebarFromCapabilities = (caps, isAdmin = false) => {
    try {
      if (!caps) return null;
    
    const menuItems = [];
    
    // ✅ KERNEL-TO-UI ALIGNMENT: Admin-first sidebar structure
    // If admin, show admin-specific modules FIRST before capability-based sections
    if (isAdmin) {
      // Admin Panel (always first for admins)
      menuItems.push(
        { icon: AlertTriangle, label: 'Admin Panel', path: '/dashboard/admin', priority: 'primary', isAdminSection: true }
      );
      
      // Governance & Security (Admin Section)
      menuItems.push({
        icon: Shield,
        label: 'Governance & Security',
        path: null,
        priority: 'primary',
        isSection: true,
        isAdminSection: true,
        children: [
          { icon: AlertCircle, label: 'Risk Management', path: '/dashboard/risk' },
          { icon: Shield, label: 'Compliance', path: '/dashboard/compliance' },
          { icon: FileCheck, label: 'KYC Review', path: '/dashboard/kyc' },
          { icon: AlertTriangle, label: 'Anti-Corruption', path: '/dashboard/anticorruption' },
          { icon: AlertCircle, label: 'Crisis Management', path: '/dashboard/crisis' },
          { icon: FileText, label: 'Audit Logs', path: '/dashboard/audit' },
        ]
      });
    }
    
    // Always show: Overview, Trade Pipeline, Messages
    menuItems.push(
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard', priority: 'primary' },
      { icon: GitBranch, label: 'Trade Pipeline', path: '/dashboard/trade-pipeline', priority: 'primary' },
      { icon: MessageSquare, label: 'Messages', path: '/dashboard/notifications', priority: 'primary' }
    );
    
    // ✅ FULL-STACK SYNC: Hybrid Navigation - Show both Buyer and Seller workspace tabs
    const isHybrid = caps.can_buy === true && caps.can_sell === true;
    if (isHybrid) {
      menuItems.push({
        icon: ShoppingCart,
        label: 'Buyer Workspace',
        path: '/dashboard',
        priority: 'primary',
        isHybridTab: true,
        viewMode: 'buyer'
      });
      menuItems.push({
        icon: Package,
        label: 'Seller Workspace',
        path: '/dashboard',
        priority: 'primary',
        isHybridTab: true,
        viewMode: 'seller'
      });
    }
    
    // If can_buy → show Buy section
    if (caps.can_buy) {
      menuItems.push(
        { icon: FileText, label: 'RFQs', path: '/dashboard/rfqs', priority: 'primary' },
        { icon: ShoppingCart, label: 'Orders', path: '/dashboard/orders', priority: 'primary' },
        { icon: Wallet, label: 'Payments', path: '/dashboard/payments', priority: 'primary' }
      );
      
      // Buy section manage items
      menuItems.push({
        icon: Building2,
        label: 'Manage',
        path: null,
        priority: 'secondary',
        isSection: true,
        children: [
          { icon: Package, label: 'Saved Products', path: '/dashboard/saved' },
          { icon: Building2, label: 'Company Info', path: '/dashboard/company-info' },
          { icon: UsersIcon, label: 'Team Members', path: '/dashboard/team-members' },
          { icon: Receipt, label: 'Invoices', path: '/dashboard/invoices' },
          { icon: RotateCcw, label: 'Returns', path: '/dashboard/returns' },
        ]
      });
      
      // Analytics & Intelligence
      menuItems.push(
        { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics', priority: 'secondary' },
        { icon: TrendingUp, label: 'Performance', path: '/dashboard/performance', priority: 'secondary' }
      );
    }
    
    // If can_sell → show Sell section (locked if status != 'approved')
    if (caps.can_sell) {
      const isApproved = caps.sell_status === 'approved';
      const sellItems = [
        { icon: Package, label: 'Products', path: '/dashboard/products' },
        { icon: Plus, label: 'Quick Add Product', path: '/dashboard/products/quick-add' },
        { icon: ShoppingCart, label: 'Sales', path: '/dashboard/sales' },
        { icon: FileText, label: 'RFQs Received', path: '/dashboard/supplier-rfqs' },
      ];
      
      // Add lock indicator if pending
      if (!isApproved) {
        sellItems.forEach(item => {
          item.disabled = true;
          item.locked = true;
          item.lockReason = caps.sell_status === 'pending' ? 'Pending approval' : 'Disabled';
        });
      }
      
      menuItems.push({
        icon: Package,
        label: 'Sell',
        path: null,
        priority: 'secondary',
        isSection: true,
        locked: !isApproved,
        lockReason: !isApproved ? (caps.sell_status === 'pending' ? 'Pending approval' : 'Disabled') : null,
        children: sellItems
      });
      
      // Seller Analytics (only if approved)
      if (isApproved) {
        menuItems.push(
          { icon: BarChart3, label: 'Supplier Analytics', path: '/dashboard/supplier-analytics', priority: 'secondary' }
        );
      }
    }
    
    // If can_logistics → show Logistics section (locked if status != 'approved')
    if (caps.can_logistics) {
      const isApproved = caps.logistics_status === 'approved';
      const logisticsItems = [
        { icon: Truck, label: 'Shipments', path: '/dashboard/shipments' },
        { icon: Warehouse, label: 'Fulfillment', path: '/dashboard/fulfillment' },
      ];
      
      // Add lock indicator if pending
      if (!isApproved) {
        logisticsItems.forEach(item => {
          item.disabled = true;
          item.locked = true;
          item.lockReason = caps.logistics_status === 'pending' ? 'Pending approval' : 'Disabled';
        });
      }
      
      menuItems.push({
        icon: Truck,
        label: 'Logistics',
        path: null,
        priority: 'secondary',
        isSection: true,
        locked: !isApproved,
        lockReason: !isApproved ? (caps.logistics_status === 'pending' ? 'Pending approval' : 'Disabled') : null,
        children: logisticsItems
      });
      
      // Logistics Dashboard & Quote (only if approved)
      if (isApproved) {
        menuItems.push(
          { icon: Truck, label: 'Logistics Dashboard', path: '/dashboard/logistics-dashboard', priority: 'secondary' },
          { icon: FileText, label: 'Logistics Quote', path: '/dashboard/logistics-quote', priority: 'secondary' }
        );
      }
    }
    
    // Community
    menuItems.push(
      { icon: StarIcon, label: 'Reviews', path: '/dashboard/reviews', priority: 'secondary' },
      { icon: AlertCircle, label: 'Disputes', path: '/dashboard/disputes', priority: 'secondary' }
    );

    // Always show: Settings, Help at bottom
    menuItems.push(
      { icon: Settings, label: 'Settings', path: '/dashboard/settings', priority: 'support' },
      { icon: HelpCircle, label: 'Help & Support', path: '/dashboard/help', priority: 'support' }
    );
    
    return menuItems;
    } catch (error) {
      // ✅ STABILIZATION: Global error boundary - prevent entire Dashboard crash
      console.error('[DashboardLayout] Error building sidebar from capabilities:', error);
      console.error('[DashboardLayout] Error details:', {
        message: error?.message,
        stack: error?.stack,
        capabilities: caps,
      });
      // Return minimal safe sidebar instead of crashing
      return [
        { icon: LayoutDashboard, label: 'Overview', path: '/dashboard', priority: 'primary' },
        { icon: MessageSquare, label: 'Messages', path: '/dashboard/notifications', priority: 'primary' },
        { icon: Settings, label: 'Settings', path: '/dashboard/settings', priority: 'support' }
      ];
    }
  };

  // PHASE 5B: Always use capabilities - no role-based fallback
  // ✅ KERNEL-TO-UI ALIGNMENT: Pass isAdmin to sidebar builder
  // ✅ STABILIZATION: Capability override for development + error boundary
  let menuItems;
  try {
    if (capabilitiesData) {
      // ✅ KERNEL-TO-UI ALIGNMENT: Pass admin status to sidebar builder
      // Capability-based sidebar (only source of truth) with integrated admin check
      menuItems = buildSidebarFromCapabilities(capabilitiesData, isUserAdmin);
      if (!menuItems || !Array.isArray(menuItems)) {
        // PHASE 5B: If capabilities build fails, show minimal safe sidebar
        console.error('[DashboardLayout] Capabilities build returned invalid data, showing minimal sidebar');
        menuItems = [
          { icon: LayoutDashboard, label: 'Overview', path: '/dashboard', priority: 'primary' },
          { icon: MessageSquare, label: 'Messages', path: '/dashboard/notifications', priority: 'primary' },
          { icon: Settings, label: 'Settings', path: '/dashboard/settings', priority: 'support' }
        ];
      }
    } else {
      // ✅ STABILIZATION: If capabilities not ready, use Full Visibility mode in development
      if (isDevelopment) {
        console.warn('[DashboardLayout] Capabilities not ready in DEV mode - using Full Visibility fallback');
        menuItems = buildSidebarFromCapabilities({
          can_buy: true,
          can_sell: true,
          can_logistics: true,
          sell_status: 'approved',
          logistics_status: 'approved',
        });
      } else {
        // PHASE 5B: If capabilities not ready, show minimal safe sidebar (shouldn't happen - RequireCapability should block)
        console.warn('[DashboardLayout] Capabilities not ready, showing minimal sidebar');
        menuItems = [
          { icon: LayoutDashboard, label: 'Overview', path: '/dashboard', priority: 'primary' },
          { icon: MessageSquare, label: 'Messages', path: '/dashboard/notifications', priority: 'primary' },
          { icon: Settings, label: 'Settings', path: '/dashboard/settings', priority: 'support' }
        ];
      }
    }
  } catch (error) {
    // ✅ STABILIZATION: Global error boundary - prevent entire Dashboard crash
    console.error('[DashboardLayout] Critical error building sidebar:', error);
    menuItems = [
      { icon: LayoutDashboard, label: 'Overview', path: '/dashboard', priority: 'primary' },
      { icon: MessageSquare, label: 'Messages', path: '/dashboard/notifications', priority: 'primary' },
      { icon: Settings, label: 'Settings', path: '/dashboard/settings', priority: 'support' }
    ];
  }
  
  // ✅ Ensure menuItems is always an array
  if (!Array.isArray(menuItems)) {
    menuItems = [];
  }
  
  // Filter out admin-only items for non-admins
  menuItems = menuItems.filter(item => {
    if (item.adminOnly && !isUserAdmin) {
      return false;
    }
    return true;
  });
  
  // ✅ KERNEL-TO-UI ALIGNMENT: Admin panel now integrated into buildSidebarFromCapabilities
  // Removed duplicate admin panel addition - it's now part of the sidebar build logic
  // PHASE 5B: isHybrid derived from capabilities, not role string
  const isHybrid = isHybridCapability;

  // PHASE 5B: All role-switching code removed - capabilities are the only authority
  // Capabilities are managed at company level in Settings, not per-user session

  // Command Palette keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ====================================================================
  // TRADE OS SHELL - 2026 Premium Layout
  // ====================================================================
  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-[#0E0E0E] relative">

      {/* Trade OS Sidebar */}
      <TradeOSSidebar
        capabilities={capabilitiesData}
        isAdmin={isUserAdmin}
        notificationCounts={notificationCounts}
        onClose={() => setSidebarOpen(false)}
        sidebarOpen={sidebarOpen}
      />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden"
            style={{ zIndex: zIndex.overlay }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ====================================================================
          TRADE OS MAIN CONTENT AREA
          ==================================================================== */}
      <div
        className="flex flex-col flex-1 w-full min-h-screen relative overflow-visible md:ml-[240px]"
        style={{ zIndex: zIndex.content }}
      >
        {/* Trade OS Header */}
        <TradeOSHeader
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          notificationCount={notificationCounts.messages || 0}
          userAvatar={
            <UserAvatar
              user={mergedUser}
              profile={contextProfile}
              userMenuOpen={userMenuOpen}
              setUserMenuOpen={setUserMenuOpen}
              userMenuButtonRef={userMenuButtonRef}
              getUserInitial={getUserInitial}
            />
          }
        />

        {/* Kernel Status Bar */}
        <div className="hidden md:flex items-center px-4 md:px-5 py-1.5 bg-gray-50 dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-[#1E1E1E] overflow-x-auto">
          <KernelStatusBar />
        </div>

        {/* User Menu Dropdown - Trade OS styled */}
        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-transparent"
              style={{ zIndex: zIndex.modalBackdrop }}
              onClick={() => setUserMenuOpen(false)}
              onTouchStart={() => setUserMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed w-56 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2A2A2A] rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/50"
              style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
                zIndex: zIndex.dropdown,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1E1E1E]">
                  <div className="font-semibold text-gray-900 dark:text-[#F5F0E8] text-sm truncate">
                    {mergedUser?.email || contextProfile?.email || 'user@example.com'}
                  </div>
                  <div className="text-[11px] text-gray-500 capitalize mt-0.5">
                    {isHybridCapability ? 'Hybrid Trader' : isSeller ? 'Seller' : isLogistics ? 'Logistics' : 'Buyer'}
                  </div>
                </div>
                {[
                  { to: '/dashboard', icon: LayoutDashboard, label: 'Command Center' },
                  { to: contextProfile?.company_id ? `/business/${contextProfile.company_id}` : '/dashboard/settings', icon: User, label: 'Profile' },
                  { to: '/dashboard/notifications', icon: MessageSquare, label: 'Trade Signals' },
                  { to: '/dashboard/orders', icon: Package, label: 'Orders' },
                  { to: '/dashboard/rfqs', icon: FileText, label: 'RFQs' },
                  { to: '/verification-center', icon: Shield, label: 'Verification' },
                  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
                ].map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-[#F5F0E8] transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4 text-gray-500" />
                    {item.label}
                  </Link>
                ))}
                {isUserAdmin && (
                  <>
                    <div className="border-t border-gray-200 dark:border-[#1E1E1E] my-1"></div>
                    <Link
                      to="/dashboard/admin"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-[#D4A937]/10 text-sm text-[#D4A937] font-medium transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  </>
                )}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTheme(); }}
                  className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#1A1A1A] text-sm text-gray-500 dark:text-gray-400 hover:text-[#D4A937] transition-colors"
                  type="button"
                >
                  <Globe className="w-4 h-4" />
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <div className="border-t border-[#1E1E1E] my-1"></div>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLogout(); setUserMenuOpen(false); }}
                  className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-red-950/30 text-sm text-red-400 transition-colors"
                  type="button"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}

        {/* Page Content - Trade OS Dark Canvas */}
        <main
          className="relative flex-1 w-full bg-gray-50 dark:bg-[#0E0E0E] overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 pb-24 md:pb-6"
          style={{
            zIndex: zIndex.content,
            minHeight: 'var(--content-min-height-mobile)',
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        isBuyer={isBuyer}
        isSeller={isSeller}
        isLogistics={isLogistics}
        isHybrid={isHybridCapability}
      />

      {/* AI Trade Copilot - Persistent floating assistant */}
      <AITradeCopilot />

      {/* 2026 Trade OS: Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
