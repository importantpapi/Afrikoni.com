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

  return (
    <div className="flex min-h-screen w-full bg-afrikoni-ivory relative">
      {/* Premium African Geometric Background Pattern - v2.5 */}
      <div 
        className="fixed inset-0 opacity-[0.05] pointer-events-none"
        style={{
          zIndex: zIndex.background,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A937' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 md:hidden"
            style={{ zIndex: zIndex.overlay }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Premium Sidebar - Charcoal Black */}
      <motion.aside
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : '-100%',
        }}
        className="fixed left-0 top-0 h-screen bg-afrikoni-charcoal border-r border-afrikoni-gold/20 shadow-premium-lg md:shadow-none transition-all shrink-0"
        style={{
          zIndex: zIndex.sidebar,
          width: sidebarOpen ? 'var(--sidebar-current-width)' : '0',
        }}
      >
        <div className="flex flex-col min-h-screen relative">
          {/* Logo Section */}
          <div className="flex items-center justify-between p-5 border-b border-afrikoni-gold/20">
            <Logo type="full" size="sm" link={true} showTagline={false} className="text-afrikoni-gold" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-afrikoni-gold/20 text-afrikoni-gold transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
            {menuItems.map((item, idx) => {
              // ✅ Handle items with children (collapsible sections like "Manage" and "Insights")
              if (item.children && item.children.length > 0) {
                return (
                  <CollapsibleMenuSection
                    key={`${item.label}-${idx}-capabilities`}
                    item={item}
                    location={location}
                    setSidebarOpen={setSidebarOpen}
                  />
                );
              }

              // ✅ Skip items without path AND without children (invalid items)
              // Items with path null but children are handled above
              if (!item.path) {
                return null;
              }

              if (!item.icon) {
                console.warn('Menu item missing icon:', item);
                return null;
              }

              const Icon = item.icon;
              const isLocked = item.locked || item.disabled;
              const isActive = !isLocked && (
                location.pathname === item.path || 
                               (item.path === '/dashboard' && location.pathname.startsWith('/dashboard') && !location.pathname.includes('/orders') && !location.pathname.includes('/rfqs') && !location.pathname.includes('/products') && !location.pathname.startsWith('/dashboard/admin')) ||
                               (item.path === '/dashboard/admin' && location.pathname.startsWith('/dashboard/admin')) ||
                (item.path === '/dashboard/risk' && location.pathname.startsWith('/dashboard/risk'))
              );
              
              // Check if this is a section header (Risk & Compliance) or admin section
              const isSection = item.isSection;
              const isAdminSection = item.isAdminSection;
              
              // Render locked item (disabled)
              if (isLocked) {
                return (
                  <div
                    key={`${item.path}-${idx}`}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-afrikoni text-sm font-semibold transition-all group relative cursor-not-allowed
                      text-afrikoni-sand/40
                      ${isSection || isAdminSection ? 'border-t border-afrikoni-gold/20 mt-2 pt-4' : ''}
                    `}
                    title={item.lockReason || 'Locked'}
                  >
                    {Icon && <Icon className="w-5 h-5 flex-shrink-0 text-afrikoni-sand/40" />}
                    <span className="flex-1">{item.label || 'Menu Item'}</span>
                    <Lock className="w-4 h-4 text-afrikoni-sand/40" />
                  </div>
                );
              }
              
              return (
                <motion.div
                  key={`${item.path}-${idx}`}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={item.path}
                    onClick={(e) => {
                      try {
                        // Close sidebar on mobile after navigation
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      } catch (error) {
                        console.error('Error navigating to:', item.path, error);
                        toast.error('Navigation error. Please try again.');
                      }
                    }}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-afrikoni text-sm font-semibold transition-all group relative
                      ${isActive 
                        ? 'bg-afrikoni-gold text-white shadow-afrikoni-gold' 
                        : 'text-afrikoni-sand hover:bg-afrikoni-gold/12 hover:text-afrikoni-gold'
                      }
                      ${isSection || isAdminSection ? 'border-t border-afrikoni-gold/20 mt-2 pt-4' : ''}
                      ${isAdminSection ? 'bg-red-50/50 border-red-200' : ''}
                    `}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeSidebarItem"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    {Icon && <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-afrikoni-gold'}`} />}
                    <span className="flex-1">{item.label || 'Menu Item'}</span>
                    {/* Notification Badges */}
                    {item.path === '/dashboard/notifications' && notificationCounts.messages > 0 && (
                      <Badge className="bg-afrikoni-gold text-afrikoni-chestnut text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                        {notificationCounts.messages > 9 ? '9+' : notificationCounts.messages}
                      </Badge>
                    )}
                    {item.path === '/dashboard/rfqs' && notificationCounts.rfqs > 0 && (
                      <Badge className="bg-afrikoni-gold text-afrikoni-chestnut text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                        {notificationCounts.rfqs > 9 ? '9+' : notificationCounts.rfqs}
                      </Badge>
                    )}
                    {item.path === '/dashboard/admin/review' && notificationCounts.approvals > 0 && (
                      <Badge className="bg-afrikoni-gold text-afrikoni-chestnut text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                        {notificationCounts.approvals > 9 ? '9+' : notificationCounts.approvals}
                      </Badge>
                    )}
                    {isActive && <ChevronRight className="w-4 h-4 text-white" />}
                  </Link>
                  
                  {/* Admin sub-menu items are handled by CollapsibleMenuSection */}
                </motion.div>
              );
            })}
          </nav>

          {/* Bottom Section - Help Only (Settings is in main menu) */}
          <div className="p-3 border-t border-afrikoni-gold/20 space-y-1">
            <Link
              to="/dashboard/help"
              className="flex items-center gap-3 px-4 py-3 rounded-afrikoni text-sm font-medium text-afrikoni-sand hover:bg-afrikoni-gold/10 hover:text-afrikoni-gold transition-all"
            >
              <HelpCircle className="w-5 h-5" />
              <span>Help Center</span>
            </Link>
          </div>

          {/* Afrikoni Watermark Logo at Bottom - v2.5 */}
          <div className="absolute bottom-4 left-4 opacity-[0.08] pointer-events-none">
            <Logo type="icon" size="lg" link={false} className="text-afrikoni-gold" />
          </div>
          
          {/* Thin gold divider lines between groups */}
          <div className="absolute top-[280px] left-3 right-3 h-px bg-afrikoni-gold/20" />
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div 
        className="flex flex-col flex-1 w-full min-h-screen relative overflow-visible md:ml-[var(--sidebar-width)]"
        style={{
          zIndex: zIndex.content,
        }}
      >
        {/* Premium Top Bar - Enterprise Pattern (headers render their own <header> tag) */}
        <div 
          className="sticky top-0 bg-afrikoni-ivory shadow-sm"
          style={{ zIndex: zIndex.header }}
        >
          {/* Header Content - Direct child, no wrapper */}
          <div className="relative h-full w-full flex items-center gap-2 px-4">
            {/* ✅ ARCHITECTURAL FIX: Global Sync Button (Founder's Control) */}
            {refreshCapabilities && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshCapabilities(true)}
                className={`${capabilitiesLoading ? 'animate-spin' : ''}`}
                title="Force refresh all data"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            
            {(() => {
              {/* Shared user avatar for all headers */}
              const userAvatarComponent = (
                <UserAvatar
                  user={mergedUser}
                  profile={contextProfile}
                  userMenuOpen={userMenuOpen}
                  setUserMenuOpen={setUserMenuOpen}
                  userMenuButtonRef={userMenuButtonRef}
                  getUserInitial={getUserInitial}
                />
              );

              // Determine header component using centralized mapping
              const headerConfig = getHeaderComponent({
                isAdminPath: location.pathname.startsWith('/dashboard/admin'),
                isUserAdmin,
                isSeller,
                isLogistics,
                isHybridCapability,
              });

              const HeaderComponent = headerConfig.component;
              
              // Build props based on header requirements
              const headerProps = {
                t,
                setSidebarOpen,
                setSearchOpen,
                navigate,
                userAvatar: userAvatarComponent,
              };

              // Add alertCount for admin header
              if (headerConfig.requiresAlertCount) {
                headerProps.alertCount = 0;
              }

              // Add hybrid-specific props for hybrid header
              if (headerConfig.requiresHybridProps) {
                headerProps.activeView = activeView;
                headerProps.setActiveView = setActiveView;
                headerProps.openWhatsAppCommunity = openWhatsAppCommunity;
              }

              // Render the selected header component
              return <HeaderComponent {...headerProps} />;
            })()}
          </div>
        </div>

        {/* User Menu Dropdown - Fixed position for visibility */}
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
              transition={{ duration: 0.2 }}
              className="fixed w-56 bg-white border-2 border-afrikoni-gold/30 rounded-afrikoni shadow-2xl"
              style={{ 
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
                zIndex: zIndex.dropdown,
              }}
              onClick={(e) => e.stopPropagation()}
            >
                        <div className="py-1">
                          <div className="px-4 py-3 border-b border-afrikoni-gold/20">
                            <div className="font-semibold text-afrikoni-text-dark text-sm">
                              {mergedUser?.email || contextProfile?.email || mergedUser?.user_email || 'user@example.com'}
                            </div>
                            {/* PHASE 5B: Capability-based role display */}
                            <div className="text-xs text-afrikoni-text-dark/70 capitalize">
                              {isHybridCapability ? 'Hybrid' : isSeller ? 'Seller' : isLogistics ? 'Logistics' : 'Buyer'}
                            </div>
                          </div>
                          <Link 
                            to="/dashboard" 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                          </Link>
                          <Link 
                            to={contextProfile?.company_id ? `/business/${contextProfile.company_id}` : '/dashboard/settings'} 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            View Profile
                          </Link>
                          <Link 
                            to="/dashboard/notifications"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <MessageSquare className="w-4 h-4" />
                            Messages
                          </Link>
                          <Link 
                            to="/dashboard/orders" 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Package className="w-4 h-4" />
                            Orders
                          </Link>
                          <Link 
                            to="/dashboard/rfqs" 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <FileText className="w-4 h-4" />
                            RFQs
                          </Link>
                          <Link 
                            to="/verification-center" 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Shield className="w-4 h-4" />
                            Verification
                          </Link>
                          <Link 
                            to="/dashboard/settings" 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            Settings
                          </Link>
                          {isUserAdmin && (
                            <>
                              <div className="border-t border-afrikoni-gold/20 my-1"></div>
                              <Link 
                                to="/dashboard/risk" 
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-gold/10 text-sm text-afrikoni-gold font-semibold transition-colors"
                                onClick={(e) => {
                                  try {
                                    setUserMenuOpen(false);
                                  } catch (error) {
                                    console.error('Error navigating:', error);
                                  }
                                }}
                              >
                                <AlertTriangle className="w-4 h-4" />
                                Admin Panel
                              </Link>
                              <Link 
                                to="/dashboard/admin/users" 
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                                onClick={(e) => {
                                  try {
                                    setUserMenuOpen(false);
                                  } catch (error) {
                                    console.error('Error navigating:', error);
                                  }
                                }}
                              >
                                <Users className="w-4 h-4" />
                                User Management
                              </Link>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleTheme();
                            }}
                            className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-afrikoni-gold/10 text-sm text-afrikoni-gold transition-colors"
                            type="button"
                          >
                            {theme === 'dark' ? (
                              <><Globe className="w-4 h-4" /> Light Mode</>
                            ) : (
                              <><Globe className="w-4 h-4" /> Dark Mode</>
                            )}
                          </button>
                          <div className="border-t border-afrikoni-gold/20 my-1"></div>
                          <button
                            onClick={(e) => {
                              try {
                                e.preventDefault();
                                e.stopPropagation();
                                handleLogout();
                                setUserMenuOpen(false);
                              } catch (error) {
                                console.error('Error logging out:', error);
                                toast.error('Error logging out. Please try again.');
                              }
                            }}
                            className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm text-afrikoni-red transition-colors"
                            type="button"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
            </motion.div>
          </>
        )}

        {/* Page Content - Mobile optimized padding */}
        <main 
          className="relative flex-1 w-full bg-afrikoni-ivory overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 pb-24 md:pb-6"
          style={{
            zIndex: zIndex.content,
            minHeight: 'var(--content-min-height-mobile)',
          }}
        >
          {children}
        </main>
      </div>

      {/* PHASE 5B: Mobile Bottom Navigation - pass capability flags instead of role */}
      <MobileBottomNav 
        isBuyer={isBuyer}
        isSeller={isSeller}
        isLogistics={isLogistics}
        isHybrid={isHybridCapability}
      />

      {/* PHASE 5B: Dev role switcher UI completely removed - capabilities are company-level */}

      {/* 2026 Trade OS: Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
