import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Truck, FileText, MessageSquare,
  BarChart3, Wallet, Shield, Settings, HelpCircle, Bell, Search, ChevronDown,
  User, Users, LogOut, Calendar, Globe, Menu, X, Building2, Plus, ChevronRight,
  AlertTriangle, Lock, FileCheck, AlertCircle, Star, DollarSign, TrendingUp, Sparkles,
  Receipt, RotateCcw, Star as StarIcon, Warehouse, TrendingDown, Users as UsersIcon,
  FileSearch, Target, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/Logo';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { isAdmin } from '@/utils/permissions';
import MobileBottomNav from '@/components/dashboard/MobileBottomNav';
import { DashboardContextProvider } from '@/contexts/DashboardContext';
import { openWhatsAppCommunity } from '@/utils/whatsappCommunity';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { useLiveStats } from '@/hooks/useLiveStats';
import { getUserInitial, extractUserName } from '@/utils/userHelpers';
import { buyerNav } from '@/config/navigation/buyerNav';
import { sellerNav } from '@/config/navigation/sellerNav';
import { logisticsNav } from '@/config/navigation/logisticsNav';
import { useRole, getDashboardHomePath } from '@/context/RoleContext';
import { useDashboardRole } from '@/context/DashboardRoleContext';
import BuyerHeader from '@/components/headers/BuyerHeader';
import SellerHeader from '@/components/headers/SellerHeader';
import LogisticsHeader from '@/components/headers/LogisticsHeader';

export default function DashboardLayout({ children, currentRole = 'buyer' }) {
  // Simple fallback for translation - always return empty string to use fallbacks
  const t = () => '';
  
  const { refreshRole } = useRole();
  const { role: dashboardRole } = useDashboardRole();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [userRole, setUserRole] = useState(dashboardRole || currentRole);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [activeView, setActiveView] = useState('all'); // For hybrid: 'all', 'buyer', 'seller'
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const userMenuButtonRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [devSelectedRole, setDevSelectedRole] = useState(currentRole);
  
  // Get notification counts for sidebar badges
  const notificationCounts = useNotificationCounts(user?.id, companyId);
  
  // Get live marketplace statistics
  const liveStats = useLiveStats();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    // URL-derived dashboardRole is the primary source of truth.
    if (dashboardRole && dashboardRole !== userRole) {
      setUserRole(dashboardRole);
    }
  }, [dashboardRole]);

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

  const loadUser = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { extractUserName } = await import('@/utils/userHelpers');
      const { user: userData, profile: profileData, role, companyId: cid } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      
      // Extract name using centralized utility - with null safety
      let userName = null;
      try {
        userName = extractUserName(userData || null, profileData || null);
      } catch (nameError) {
        console.warn('Error extracting user name:', nameError);
      }
      
      // Merge user data with extracted name - with comprehensive null checks
      const mergedUser = {
        ...(userData || {}),
        ...(profileData || {}),
        full_name: userName || userData?.full_name || profileData?.full_name || null,
        name: userName || userData?.name || profileData?.name || null,
      };
      
      setUser(mergedUser);
      setProfile(profileData || null);
      setCompanyId(cid || null);
      if (role) setUserRole(role);
      
      // Safe admin check
      try {
        const admin = isAdmin(userData);
        setIsUserAdmin(admin || false);
      } catch (adminError) {
        console.warn('Error checking admin status:', adminError);
        setIsUserAdmin(false);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // Set safe defaults on error
      setUser(null);
      setProfile(null);
      setCompanyId(null);
      setIsUserAdmin(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Log logout to audit log before signing out
      try {
        const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
        const { logLogoutEvent } = await import('@/utils/auditLogger');
        const { user, profile } = await getCurrentUserAndRole(supabase, supabaseHelpers);
        await logLogoutEvent({ user, profile });
      } catch (auditError) {
        // Don't break logout if audit logging fails
        console.warn('Failed to log logout:', auditError);
      }
      
      await supabaseHelpers.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const sidebarItems = {
    buyer: buyerNav,
    seller: sellerNav,
    // Hybrid users share the buyer navigation shell
    hybrid: buyerNav,
    logistics: logisticsNav,
    admin: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/admin' },
      { icon: BarChart3, label: 'Analytics', path: '/dashboard/admin/analytics' },
      { icon: DollarSign, label: 'Revenue & Finance', path: '/dashboard/admin/revenue' },
      { icon: TrendingUp, label: 'Growth Metrics', path: '/dashboard/admin/growth-metrics' },
      { icon: UsersIcon, label: 'Onboarding Tracker', path: '/dashboard/admin/onboarding-tracker' },
      { icon: Package, label: 'Marketplace', path: '/dashboard/admin/marketplace' },
      { icon: UsersIcon, label: 'Supplier Management', path: '/dashboard/admin/supplier-management' },
      { icon: FileCheck, label: 'Approvals Center', path: '/dashboard/admin/review' },
      { icon: Shield, label: 'Verification Review', path: '/dashboard/admin/verification-review' },
      { icon: Star, label: 'Review Moderation', path: '/dashboard/admin/reviews' },
      { icon: Target, label: 'Marketing Leads', path: '/dashboard/admin/leads' },
      { icon: FileSearch, label: 'KYB Verification', path: '/dashboard/admin/kyb' },
      { icon: UsersIcon, label: 'Disputes & Escrow', path: '/dashboard/admin/disputes' },
      { icon: MessageSquare, label: 'Support Tickets', path: '/dashboard/admin/support-tickets' },
      { icon: Truck, label: 'Logistics Dashboard', path: '/dashboard/logistics' },
      { icon: AlertTriangle, label: 'Risk & Compliance', path: '/dashboard/risk', isSection: true }
    ]
  };

  // Filter out admin-only items for non-admins
  const menuItems = (sidebarItems[userRole] || sidebarItems.buyer).filter(item => {
    if (item.adminOnly && !isUserAdmin) {
      return false;
    }
    return true;
  });
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

      if (import.meta.env.DEV) {
        const { error } = await supabase
          .from('profiles')
          .update({
            role: targetRole,
            user_role: targetRole,
            onboarding_completed: true,
          })
          .eq('id', authUser.id);

        if (error) {
          console.error('Dev role switch profile update error:', error);
          // Still allow local switch so you can test layouts even if profile write fails
          toast.warning('Profile role not updated in DB (check RLS), using local switch only');
        }
      }

      await refreshRole();
      setUserRole(targetRole);

      const targetPath = getDashboardHomePath(targetRole);
      navigate(targetPath, { replace: true });
      toast.success(`Switched role to ${targetRole} (dev only)`);
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
              if (!item.path) {
                console.warn('Menu item missing path:', item);
                return null;
              }

              if (!item.icon) {
                console.warn('Menu item missing icon:', item);
                return null;
              }

              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                               (item.path === '/dashboard' && location.pathname.startsWith('/dashboard') && !location.pathname.includes('/orders') && !location.pathname.includes('/rfqs') && !location.pathname.includes('/products')) ||
                               (item.path === '/dashboard/risk' && location.pathname.startsWith('/dashboard/risk'));
              
              // Check if this is a section header (Risk & Compliance)
              const isSection = item.isSection;
              
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
                      ${isSection ? 'border-t border-afrikoni-gold/20 mt-2 pt-4' : ''}
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
                  {isSection && isUserAdmin && (location.pathname.startsWith('/dashboard/risk') || location.pathname.startsWith('/dashboard/compliance') || location.pathname.startsWith('/dashboard/kyc') || location.pathname.startsWith('/dashboard/anticorruption') || location.pathname.startsWith('/dashboard/crisis') || location.pathname.startsWith('/dashboard/audit')) && (
                    <div className="ml-4 mt-1 space-y-1">
                      <Link
                        to="/dashboard/compliance"
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          location.pathname === '/dashboard/compliance'
                            ? 'bg-afrikoni-gold/20 text-afrikoni-gold'
                            : 'text-afrikoni-sand/70 hover:text-afrikoni-gold hover:bg-afrikoni-gold/10'
                        }`}
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

          {/* Bottom Section - Settings & Help */}
          <div className="p-3 border-t border-afrikoni-gold/20 space-y-1">
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-afrikoni text-sm font-medium text-afrikoni-sand hover:bg-afrikoni-gold/10 hover:text-afrikoni-gold transition-all"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
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
        {/* Premium Top Bar */}
        <header className="sticky top-0 z-30 bg-afrikoni-ivory border-b border-afrikoni-gold/20 shadow-premium backdrop-blur-sm overflow-visible">
          <div className="relative overflow-visible">
            {(() => {
              switch (dashboardRole) {
                case 'seller':
                  return (
                    <SellerHeader
                      t={t}
                      openWhatsAppCommunity={openWhatsAppCommunity}
                      setSidebarOpen={setSidebarOpen}
                      setSearchOpen={setSearchOpen}
                      navigate={navigate}
                    />
                  );
                case 'logistics':
                  return (
                    <LogisticsHeader
                      t={t}
                      setSidebarOpen={setSidebarOpen}
                      setSearchOpen={setSearchOpen}
                    />
                  );
                case 'buyer':
                case 'hybrid':
                default:
                  return (
                    <BuyerHeader
                      t={t}
                      openWhatsAppCommunity={openWhatsAppCommunity}
                      setSidebarOpen={setSidebarOpen}
                      setSearchOpen={setSearchOpen}
                      navigate={navigate}
                    />
                  );
              }
            })()}

            {/* User Menu Trigger (shared across roles) */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <button
                  ref={userMenuButtonRef}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setUserMenuOpen(prev => !prev);
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-afrikoni hover:bg-afrikoni-sand/20 transition-all cursor-pointer relative"
                  type="button"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  <div className="w-8 h-8 bg-afrikoni-gold rounded-full flex items-center justify-center text-afrikoni-charcoal font-bold text-sm shadow-afrikoni">
                    {(() => {
                      try {
                        return getUserInitial(user || null, profile || null);
                      } catch (error) {
                        console.warn('Error getting user initial:', error);
                        return 'U';
                      }
                    })()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-afrikoni-text-dark transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
        </header>

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
                              {user?.email || profile?.email || user?.user_email || 'user@example.com'}
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
                            to={profile?.company_id ? `/business/${profile.company_id}` : '/dashboard/settings'} 
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

        {/* Page Content */}
        <main className="flex-1 w-full px-4 md:px-6 lg:px-8 pb-20 md:pb-6 bg-afrikoni-ivory overflow-x-hidden min-h-[calc(100vh-80px)]">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole={userRole} />

      {/* Dev-only Admin Role Switcher Panel */}
      {import.meta.env.DEV && isUserAdmin && (
        <div className="fixed bottom-20 right-4 z-40">
          <div className="bg-white border border-afrikoni-gold/40 rounded-afrikoni shadow-premium-lg px-3 py-2 text-xs w-64">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-afrikoni-text-dark">Dev Role Switcher</span>
              <Badge className="bg-afrikoni-gold/10 text-afrikoni-gold border-afrikoni-gold/40 text-[10px]">
                Admin · Local only
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <select
                value={devSelectedRole}
                onChange={(e) => setDevSelectedRole(e.target.value)}
                className="flex-1 border border-afrikoni-gold/30 rounded-afrikoni px-2 py-1 text-xs bg-afrikoni-offwhite focus:outline-none focus:ring-1 focus:ring-afrikoni-gold"
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="hybrid">Hybrid</option>
                <option value="logistics">Logistics</option>
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
