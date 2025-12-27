import React, { useState, useEffect, useRef } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/contexts/AuthProvider';
import { isAdmin } from '@/utils/permissions';
import { useTranslation } from 'react-i18next';
import MobileBottomNav from '@/components/dashboard/MobileBottomNav';
import { DashboardContextProvider } from '@/contexts/DashboardContext';
import { openWhatsAppCommunity } from '@/utils/whatsappCommunity';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { useLiveStats } from '@/hooks/useLiveStats';
import { getUserInitial, extractUserName } from '@/utils/userHelpers';
import { buyerNav } from '@/config/navigation/buyerNav';
import { sellerNav } from '@/config/navigation/sellerNav';
import { hybridNav } from '@/config/navigation/hybridNav';
import { logisticsNav } from '@/config/navigation/logisticsNav';
import { useRole, getDashboardHomePath } from '@/context/RoleContext';
import { getDashboardPathForRole, getUserRole } from '@/utils/roleHelpers';
import { useDashboardRole } from '@/context/DashboardRoleContext';
import { useUser } from '@/contexts/UserContext';
import BuyerHeader from '@/components/headers/BuyerHeader';
import SellerHeader from '@/components/headers/SellerHeader';
import LogisticsHeader from '@/components/headers/LogisticsHeader';
import AdminHeader from '@/components/headers/AdminHeader';
import HybridHeader from '@/components/headers/HybridHeader';
import UserAvatar from '@/components/headers/UserAvatar';

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
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-afrikoni text-sm font-semibold transition-all group
          ${hasActiveChild 
            ? 'bg-afrikoni-gold/20 text-afrikoni-gold' 
            : 'text-afrikoni-sand hover:bg-afrikoni-gold/12 hover:text-afrikoni-gold'
          }
        `}
      >
        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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

export default function DashboardLayout({ children, currentRole = 'buyer' }) {
  const { t } = useTranslation();
  const { refreshRole } = useRole();
  const { role: dashboardRole } = useDashboardRole();
  const { user: contextUser, profile: contextProfile, loading: userLoading, refreshProfile } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [userRole, setUserRole] = useState(dashboardRole || currentRole);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [activeView, setActiveView] = useState('all'); // For hybrid: 'all', 'buyer', 'seller'
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const userMenuButtonRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  // ✅ Initialize devSelectedRole with normalized role
  const initialRole = dashboardRole || currentRole;
  const normalizedInitialRole = initialRole === 'logistics_partner' ? 'logistics' : initialRole;
  const [devSelectedRole, setDevSelectedRole] = useState(normalizedInitialRole || 'buyer');
  const [shouldShowDevSwitcher, setShouldShowDevSwitcher] = useState(false);
  
  // Derive companyId and role from profile
  const profileCompanyId = contextProfile?.company_id || null;
  const profileRole = contextProfile ? getUserRole(contextProfile) : null;
  
  // Merge user data with profile for display (for backward compatibility)
  const mergedUser = contextUser && contextProfile ? {
    ...contextUser,
    ...contextProfile,
    full_name: extractUserName(contextUser, contextProfile) || contextUser?.full_name || contextProfile?.full_name || null,
    name: extractUserName(contextUser, contextProfile) || contextUser?.name || contextProfile?.name || null,
  } : contextUser;
  
  // Get notification counts for sidebar badges
  const notificationCounts = useNotificationCounts(contextUser?.id, profileCompanyId);
  
  // Get live marketplace statistics
  const liveStats = useLiveStats();

  // Update local state when context data changes
  useEffect(() => {
    if (profileCompanyId) {
      setCompanyId(profileCompanyId);
    }
    if (profileRole) {
      setUserRole(profileRole);
      const normalizedRole = profileRole === 'logistics_partner' ? 'logistics' : profileRole;
      setDevSelectedRole(normalizedRole);
    }
  }, [profileCompanyId, profileRole]);

  useEffect(() => {
    // URL-derived dashboardRole is the primary source of truth.
    if (dashboardRole && dashboardRole !== userRole) {
      setUserRole(dashboardRole);
      // ✅ Update dev switcher to match current role (normalize logistics_partner)
      const normalizedRole = dashboardRole === 'logistics_partner' ? 'logistics' : dashboardRole;
      setDevSelectedRole(normalizedRole);
    }
  }, [dashboardRole, userRole]);

  // Update admin and founder status when user/profile changes
  useEffect(() => {
    if (contextUser && contextProfile) {
      // Safe admin check
      try {
        const admin = isAdmin(contextUser);
        setIsUserAdmin(admin || false);
      } catch (adminError) {
        console.warn('Error checking admin status:', adminError);
        setIsUserAdmin(false);
      }
      
      // Check if user is founder/CEO (youba.thiam@icloud.com)
      const userEmail = contextUser?.email?.toLowerCase();
      const isFounderUser = userEmail === 'youba.thiam@icloud.com';
      setIsFounder(isFounderUser);
      setShouldShowDevSwitcher(isFounderUser);
      
      // Founder is always admin
      if (isFounderUser) {
        setIsUserAdmin(true);
      }
    } else {
      setIsUserAdmin(false);
      setIsFounder(false);
      setShouldShowDevSwitcher(false);
    }
  }, [contextUser, contextProfile]);

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
      
      // Sign out using direct supabase client for reliability
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any local state
      setCompanyId(null);
      setUserRole(null);
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Redirect to home page
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, try to redirect anyway
      navigate('/', { replace: true });
      toast.error('Logged out, but there was an issue clearing the session');
    }
  };

  const sidebarItems = {
    buyer: buyerNav,
    seller: sellerNav,
    // Hybrid users get both buyer and seller features
    hybrid: hybridNav,
    logistics: logisticsNav,
    admin: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/admin' },
      { icon: BarChart3, label: 'Analytics', path: '/dashboard/admin/analytics' },
      { icon: Shield, label: 'Trust Engine', path: '/dashboard/admin/trust-engine' },
      { icon: DollarSign, label: 'Revenue & Finance', path: '/dashboard/admin/revenue' },
      { icon: TrendingUp, label: 'Growth Metrics', path: '/dashboard/admin/growth-metrics' },
      { icon: UsersIcon, label: 'Onboarding Tracker', path: '/dashboard/admin/onboarding-tracker' },
      { icon: Package, label: 'Marketplace', path: '/dashboard/admin/marketplace' },
      { icon: UsersIcon, label: 'Supplier Management', path: '/dashboard/admin/supplier-management' },
      { icon: FileCheck, label: 'Approvals Center', path: '/dashboard/admin/review' },
      { icon: Shield, label: 'Verification Review', path: '/dashboard/admin/verification-review' },
      { icon: Star, label: 'Reviews Moderation', path: '/dashboard/admin/reviews-moderation' },
      { icon: Target, label: 'Marketing Leads', path: '/dashboard/admin/leads' },
      { icon: FileSearch, label: 'KYB Verification', path: '/dashboard/admin/kyb' },
      { icon: UsersIcon, label: 'Disputes & Escrow', path: '/dashboard/admin/disputes' },
      { icon: MessageSquare, label: 'Support Tickets', path: '/dashboard/admin/support-tickets' },
      { icon: GitBranch, label: 'System Architecture', path: '/dashboard/admin/architecture' },
      { icon: Truck, label: 'Logistics Dashboard', path: '/dashboard/logistics' },
      { icon: AlertTriangle, label: 'Risk & Compliance', path: '/dashboard/risk', isSection: true, adminOnly: true }
    ]
  };

  // ✅ Get menu items for current role - this updates when userRole changes
  let menuItems = sidebarItems[userRole] || sidebarItems.buyer;
  
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
  
  // Add Admin Panel link to sidebar if user is founder/CEO (youba.thiam@icloud.com)
  // This allows founder to access admin panel from any role dashboard
  if (isFounder && userRole !== 'admin') {
    menuItems = [
      ...menuItems,
      { icon: AlertTriangle, label: 'Admin Panel', path: '/dashboard/admin', isAdminSection: true }
    ];
  }
  const isHybrid = userRole === 'hybrid';

  // Role switcher options
  const roleOptions = [
    { value: 'buyer', label: 'Buyer', icon: ShoppingCart },
    { value: 'seller', label: 'Seller', icon: Package },
    { value: 'hybrid', label: 'Hybrid', icon: LayoutDashboard },
    { value: 'logistics', label: 'Logistics', icon: Truck }
  ];

  const handleRoleSwitch = (newRole) => {
    const dashboardPath = `/dashboard/${newRole}`;
    navigate(dashboardPath, { replace: true });
    setUserRole(newRole);
  };

  const handleDevRoleApply = async () => {
    try {
      const targetRole = devSelectedRole || 'buyer';
      
      // Use authenticated user ID to avoid relying on merged local user state
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.error('Dev role switch auth error:', authError);
        toast.error('Could not load current user');
        return;
      }

      // Founder can switch roles in production too (not just dev mode)
      const userEmail = authUser?.email?.toLowerCase();
      const isFounderUser = userEmail === 'youba.thiam@icloud.com';
      
      // ✅ Normalize role (logistics_partner -> logistics)
      const normalizedTargetRole = targetRole === 'logistics_partner' ? 'logistics' : targetRole;
      
      // Allow profile update for founder in production, or in dev mode
      if (isFounderUser || import.meta.env.DEV) {
        const { error } = await supabase
          .from('profiles')
          .update({
            role: normalizedTargetRole,
            user_role: normalizedTargetRole,
            onboarding_completed: true,
          })
          .eq('id', authUser.id);

        if (error) {
          console.error('Dev role switch profile update error:', error);
          // Still allow local switch so you can test layouts even if profile write fails
          toast.warning('Profile role not updated in DB (check RLS), using local switch only');
        } else {
          // ✅ Wait a moment for database update to propagate before navigating
          // This prevents race condition where Dashboard component checks role before update completes
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Refresh profile in context to get updated role
          await refreshProfile();
        }
      }

      // ✅ Update local state immediately so menu updates right away
      setUserRole(normalizedTargetRole);
      setDevSelectedRole(normalizedTargetRole);
      
      // Get the correct dashboard path for the role
      const targetPath = normalizedTargetRole === 'admin' 
        ? '/dashboard/admin' 
        : getDashboardPathForRole(normalizedTargetRole);
      
      // Navigate to the correct dashboard
      navigate(targetPath, { replace: true });
      
      // Refresh role context to sync with URL
      await refreshRole();
      
      toast.success(`Switched role to ${normalizedTargetRole}${isFounderUser ? '' : ' (dev only)'}`);
    } catch (err) {
      console.error('Dev role switch error:', err);
      toast.error('Error switching role');
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-afrikoni-ivory relative">
      {/* Premium African Geometric Background Pattern - v2.5 */}
      <div 
        className="fixed inset-0 opacity-[0.05] pointer-events-none z-0"
        style={{
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
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Premium Sidebar - Charcoal Black */}
      <motion.aside
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : '-100%',
          width: sidebarOpen ? '16rem' : '0'
        }}
        className="fixed left-0 top-0 h-screen z-50 bg-afrikoni-charcoal border-r border-afrikoni-gold/20 shadow-premium-lg md:w-[260px] md:shadow-none md:z-auto transition-all overflow-hidden shrink-0"
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
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {menuItems.map((item, idx) => {
              // ✅ Handle items with children (collapsible sections like "Manage" and "Insights")
              if (item.children && item.children.length > 0) {
                return (
                  <CollapsibleMenuSection
                    key={`${item.label}-${idx}-${userRole}`}
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
              const isActive = location.pathname === item.path || 
                               (item.path === '/dashboard' && location.pathname.startsWith('/dashboard') && !location.pathname.includes('/orders') && !location.pathname.includes('/rfqs') && !location.pathname.includes('/products') && !location.pathname.startsWith('/dashboard/admin')) ||
                               (item.path === '/dashboard/admin' && location.pathname.startsWith('/dashboard/admin')) ||
                               (item.path === '/dashboard/risk' && location.pathname.startsWith('/dashboard/risk'));
              
              // Check if this is a section header (Risk & Compliance) or admin section
              const isSection = item.isSection;
              const isAdminSection = item.isAdminSection;
              
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
                    {item.path === '/messages' && notificationCounts.messages > 0 && (
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
                  
                  {/* Sub-menu items for Risk & Compliance - Admin Only */}
                  {isSection && isUserAdmin && item.path === '/dashboard/risk' && (location.pathname.startsWith('/dashboard/risk') || location.pathname.startsWith('/dashboard/compliance') || location.pathname.startsWith('/dashboard/kyc') || location.pathname.startsWith('/dashboard/anticorruption') || location.pathname.startsWith('/dashboard/crisis') || location.pathname.startsWith('/dashboard/audit')) && (
                    <div className="ml-4 mt-1 space-y-1">
                      <Link
                        to="/dashboard/compliance"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          location.pathname === '/dashboard/compliance'
                            ? 'bg-afrikoni-gold/20 text-afrikoni-gold'
                            : 'text-afrikoni-sand/70 hover:text-afrikoni-gold hover:bg-afrikoni-gold/10'
                        }`}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        <FileCheck className="w-3 h-3" />
                        Compliance Center
                      </Link>
                      <Link
                        to="/dashboard/kyc"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          location.pathname === '/dashboard/kyc'
                            ? 'bg-afrikoni-gold/20 text-afrikoni-gold'
                            : 'text-afrikoni-sand/70 hover:text-afrikoni-gold hover:bg-afrikoni-gold/10'
                        }`}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        <Shield className="w-3 h-3" />
                        KYC/AML Tracker
                      </Link>
                      <Link
                        to="/dashboard/anticorruption"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          location.pathname === '/dashboard/anticorruption'
                            ? 'bg-afrikoni-gold/20 text-afrikoni-gold'
                            : 'text-afrikoni-sand/70 hover:text-afrikoni-gold hover:bg-afrikoni-gold/10'
                        }`}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        <Lock className="w-3 h-3" />
                        Anti-Corruption
                      </Link>
                      <Link
                        to="/dashboard/crisis"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          location.pathname === '/dashboard/crisis'
                            ? 'bg-afrikoni-gold/20 text-afrikoni-gold'
                            : 'text-afrikoni-sand/70 hover:text-afrikoni-gold hover:bg-afrikoni-gold/10'
                        }`}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        <AlertCircle className="w-3 h-3" />
                        Crisis Management
                      </Link>
                      <Link
                        to="/dashboard/audit"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          location.pathname === '/dashboard/audit'
                            ? 'bg-afrikoni-gold/20 text-afrikoni-gold'
                            : 'text-afrikoni-sand/70 hover:text-afrikoni-gold hover:bg-afrikoni-gold/10'
                        }`}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            setSidebarOpen(false);
                          }
                        }}
                      >
                        <FileText className="w-3 h-3" />
                        Audit Logs
                      </Link>
                    </div>
                  )}
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
      <div className="flex flex-col flex-1 w-full md:ml-[260px] min-h-screen relative z-10 overflow-visible">
        {/* Premium Top Bar - Enterprise Pattern (headers render their own <header> tag) */}
        <div className="sticky top-0 z-50 bg-afrikoni-ivory shadow-sm">
          {/* Header Content - Direct child, no wrapper */}
          <div className="relative h-full w-full">
            {(() => {
              // Role-based headers: Only show what helps complete the task
              // Admin header ONLY for admin dashboard paths
              const isAdminPath = location.pathname.startsWith('/dashboard/admin');
              
              if (isAdminPath && isUserAdmin) {
                return (
                  <AdminHeader
                    t={t}
                    setSidebarOpen={setSidebarOpen}
                    setSearchOpen={setSearchOpen}
                    navigate={navigate}
                    alertCount={0}
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
                );
              }

              // Shared user avatar for all headers
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

              // Role-based headers for buyers/sellers/logistics
              switch (dashboardRole) {
                case 'seller':
                  return (
                    <SellerHeader
                      t={t}
                      setSidebarOpen={setSidebarOpen}
                      setSearchOpen={setSearchOpen}
                      navigate={navigate}
                      userAvatar={userAvatarComponent}
                    />
                  );
                case 'logistics':
                  return (
                    <LogisticsHeader
                      t={t}
                      setSidebarOpen={setSidebarOpen}
                      setSearchOpen={setSearchOpen}
                      userAvatar={userAvatarComponent}
                    />
                  );
                case 'hybrid':
                  return (
                    <HybridHeader
                      t={t}
                      openWhatsAppCommunity={openWhatsAppCommunity}
                      setSidebarOpen={setSidebarOpen}
                      setSearchOpen={setSearchOpen}
                      navigate={navigate}
                      activeView={activeView}
                      setActiveView={setActiveView}
                      userAvatar={userAvatarComponent}
                    />
                  );
                case 'buyer':
                default:
                  return (
                    <BuyerHeader
                      t={t}
                      setSidebarOpen={setSidebarOpen}
                      setSearchOpen={setSearchOpen}
                      navigate={navigate}
                      userAvatar={userAvatarComponent}
                    />
                  );
              }
            })()}
          </div>
        </div>

        {/* User Menu Dropdown - Fixed position for visibility */}
        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-[9998] bg-transparent"
              onClick={() => setUserMenuOpen(false)}
              onTouchStart={() => setUserMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed w-56 bg-white border-2 border-afrikoni-gold/30 rounded-afrikoni shadow-2xl z-[9999]"
              style={{ 
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`
              }}
              onClick={(e) => e.stopPropagation()}
            >
                        <div className="py-1">
                          <div className="px-4 py-3 border-b border-afrikoni-gold/20">
                            <div className="font-semibold text-afrikoni-text-dark text-sm">
                              {mergedUser?.email || contextProfile?.email || mergedUser?.user_email || 'user@example.com'}
                            </div>
                            <div className="text-xs text-afrikoni-text-dark/70 capitalize">
                              {userRole || 'user'}
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
                            to="/messages" 
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
        <main className="relative z-10 flex-1 w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 pb-24 md:pb-6 bg-afrikoni-ivory overflow-x-hidden overflow-y-auto min-h-[calc(100vh-80px)]">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole={userRole} />

      {/* Dev-only Admin Role Switcher Panel - Original Position (Bottom Right) */}
      {shouldShowDevSwitcher && (
        <div className="fixed bottom-20 right-4 z-40">
          <div className="bg-white border border-afrikoni-gold/40 rounded-afrikoni shadow-premium-lg px-3 py-2 text-xs w-64">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-afrikoni-text-dark">Dev Role Switcher</span>
              <Badge className="bg-afrikoni-gold/10 text-afrikoni-gold border-afrikoni-gold/40 text-[10px]">
                Dev Only
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <select
                value={devSelectedRole || 'buyer'}
                onChange={(e) => setDevSelectedRole(e.target.value)}
                className="flex-1 border border-afrikoni-gold/30 rounded-afrikoni px-2 py-1 text-xs bg-afrikoni-offwhite focus:outline-none focus:ring-1 focus:ring-afrikoni-gold"
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="hybrid">Hybrid</option>
                <option value="logistics">Logistics</option>
                {isUserAdmin && <option value="admin">Admin</option>}
              </select>
              <Button
                size="sm"
                className="bg-afrikoni-gold hover:bg-afrikoni-goldDark text-afrikoni-charcoal px-2 py-1 text-[11px]"
                onClick={handleDevRoleApply}
              >
                Apply
              </Button>
            </div>
            <p className="text-[10px] text-afrikoni-text-dark/60">
              Changes your profile role and reloads the matching dashboard. Use only on test accounts.
            </p>
          </div>
        </div>
      )}


      {/* Social Proof Footer Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 z-30 bg-afrikoni-chestnut/95 backdrop-blur-sm border-t border-afrikoni-gold/30 px-4 py-2 hidden md:block"
      >
        <div className="w-full px-4 md:px-6 lg:px-8 flex items-center gap-6 text-xs text-afrikoni-sand">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-afrikoni-gold" />
            {liveStats.isLoading ? (
              <span className="font-semibold text-afrikoni-gold animate-pulse">...</span>
            ) : (
              <>
                <span className="font-semibold text-afrikoni-gold">{liveStats.suppliersActiveToday}</span>
                <span>suppliers active today</span>
              </>
            )}
          </div>
          <span className="text-afrikoni-gold/50">·</span>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-afrikoni-gold" />
            {liveStats.isLoading ? (
              <span className="font-semibold text-afrikoni-gold animate-pulse">...</span>
            ) : (
              <>
                <span className="font-semibold text-afrikoni-gold">{liveStats.rfqsSubmittedThisWeek}</span>
                <span>RFQs submitted this week</span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
