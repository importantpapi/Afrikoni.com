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
import NotificationBell from '@/components/notificationbell';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import { useLanguage } from '@/i18n/LanguageContext';
import { isAdmin } from '@/utils/permissions';
import MobileBottomNav from '@/components/dashboard/MobileBottomNav';
import { DashboardContextProvider } from '@/contexts/DashboardContext';
import { openWhatsAppCommunity } from '@/utils/whatsappCommunity';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';

export default function DashboardLayout({ children, currentRole = 'buyer' }) {
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [userRole, setUserRole] = useState(currentRole);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [activeView, setActiveView] = useState('all'); // For hybrid: 'all', 'buyer', 'seller'
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const userMenuButtonRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get notification counts for sidebar badges
  const notificationCounts = useNotificationCounts(user?.id, companyId);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    setUserRole(currentRole);
  }, [currentRole]);

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
      const { user: userData, profile: profileData, role, companyId: cid } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
      setProfile(profileData);
      setCompanyId(cid);
      if (role) setUserRole(role);
      const admin = isAdmin(userData);
      setIsUserAdmin(admin);
      // Admin access verified silently
    } catch (error) {
      console.error('Error loading user:', error);
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
    buyer: [
      { icon: LayoutDashboard, label: t('dashboard.title'), path: '/dashboard/buyer' },
      { icon: Sparkles, label: 'KoniAI', path: '/dashboard/koniai' },
      { icon: ShoppingCart, label: t('dashboard.orders'), path: '/dashboard/orders' },
      { icon: FileText, label: t('dashboard.rfqs'), path: '/dashboard/rfqs' },
      { icon: Package, label: t('dashboard.saved') || 'Saved Products', path: '/dashboard/saved' },
      { icon: MessageSquare, label: t('dashboard.messages'), path: '/messages' },
      { icon: Wallet, label: 'Payments & Escrow', path: '/dashboard/payments' },
      { icon: Receipt, label: 'Invoices', path: '/dashboard/invoices' },
      { icon: RotateCcw, label: 'Returns', path: '/dashboard/returns' },
      { icon: StarIcon, label: 'Reviews', path: '/dashboard/reviews' },
      { icon: Building2, label: t('dashboard.companyInfo') || 'Company Info', path: '/dashboard/company-info' },
      { icon: BarChart3, label: t('dashboard.analytics'), path: '/dashboard/analytics' },
      { icon: Shield, label: t('dashboard.protection') || 'Protection', path: '/dashboard/protection' },
      { icon: MessageSquare, label: 'Support Chat', path: '/dashboard/support-chat' },
      { icon: AlertTriangle, label: 'Disputes', path: '/dashboard/disputes' }
    ],
    seller: [
      { icon: LayoutDashboard, label: t('dashboard.title'), path: '/dashboard/seller' },
      { icon: Sparkles, label: 'KoniAI', path: '/dashboard/koniai' },
      { icon: ShoppingCart, label: t('dashboard.sales') || 'Sales', path: '/dashboard/sales' },
      { icon: Package, label: t('dashboard.products'), path: '/dashboard/products' },
      { icon: FileText, label: t('dashboard.rfqs'), path: '/dashboard/rfqs' },
      { icon: MessageSquare, label: t('dashboard.messages'), path: '/messages' },
      { icon: Truck, label: 'Fulfillment', path: '/dashboard/fulfillment' },
      { icon: Wallet, label: 'Payments & Escrow', path: '/dashboard/payments' },
      { icon: Receipt, label: 'Invoices', path: '/dashboard/invoices' },
      { icon: RotateCcw, label: 'Returns', path: '/dashboard/returns' },
      { icon: StarIcon, label: 'Reviews & Performance', path: '/dashboard/reviews' },
      { icon: TrendingUp, label: 'Performance Metrics', path: '/dashboard/performance' },
      { icon: Building2, label: t('dashboard.companyInfo') || 'Company Info', path: '/dashboard/company-info' },
      { icon: BarChart3, label: t('dashboard.analytics'), path: '/dashboard/analytics' },
      { icon: Sparkles, label: 'Subscriptions', path: '/dashboard/subscriptions' },
      { icon: UsersIcon, label: 'Team Members', path: '/dashboard/team-members' },
      { icon: Shield, label: t('verification.title'), path: '/verification-center' },
      { icon: Shield, label: 'Get Verified', path: '/dashboard/verification-marketplace' },
      { icon: MessageSquare, label: 'Support Chat', path: '/dashboard/support-chat' },
      { icon: AlertTriangle, label: 'Disputes', path: '/dashboard/disputes' },
      { icon: AlertTriangle, label: 'Risk & Compliance', path: '/dashboard/risk', isSection: true, adminOnly: true }
    ],
    hybrid: [
      { icon: LayoutDashboard, label: t('dashboard.title'), path: '/dashboard/hybrid' },
      { icon: Sparkles, label: 'KoniAI', path: '/dashboard/koniai' },
      { icon: ShoppingCart, label: t('dashboard.orders') + ' & Sales', path: '/dashboard/orders' },
      { icon: Package, label: t('dashboard.products'), path: '/dashboard/products' },
      { icon: FileText, label: t('dashboard.rfqs'), path: '/dashboard/rfqs' },
      { icon: MessageSquare, label: t('dashboard.messages'), path: '/messages' },
      { icon: Building2, label: t('dashboard.companyInfo') || 'Company Info', path: '/dashboard/company-info' },
      { icon: BarChart3, label: t('dashboard.analytics'), path: '/dashboard/analytics' },
      { icon: TrendingUp, label: 'Supplier Analytics', path: '/dashboard/supplier-analytics' },
      { icon: Sparkles, label: 'Subscriptions', path: '/dashboard/subscriptions' },
      { icon: UsersIcon, label: 'Team Members', path: '/dashboard/team-members' },
      { icon: Wallet, label: t('dashboard.payments'), path: '/dashboard/payments' },
      { icon: Shield, label: t('dashboard.protection') || 'Protection', path: '/dashboard/protection' },
      { icon: MessageSquare, label: 'Support Chat', path: '/dashboard/support-chat' },
      { icon: AlertTriangle, label: 'Disputes', path: '/dashboard/disputes' },
      { icon: AlertTriangle, label: 'Risk & Compliance', path: '/dashboard/risk', isSection: true, adminOnly: true }
    ],
    logistics: [
      { icon: LayoutDashboard, label: t('dashboard.title'), path: '/dashboard/logistics' },
      { icon: Sparkles, label: 'KoniAI', path: '/dashboard/koniai' },
      { icon: Truck, label: 'Logistics Dashboard', path: '/dashboard/logistics' },
      { icon: Truck, label: t('dashboard.shipments') || 'Shipments', path: '/dashboard/shipments' },
      { icon: Warehouse, label: 'Fulfillment', path: '/dashboard/fulfillment' },
      { icon: FileText, label: t('dashboard.rfqs'), path: '/dashboard/rfqs' },
      { icon: MessageSquare, label: t('dashboard.messages'), path: '/messages' },
      { icon: Building2, label: t('dashboard.companyInfo') || 'Company Info', path: '/dashboard/company-info' },
      { icon: BarChart3, label: t('dashboard.analytics'), path: '/dashboard/analytics' },
      { icon: Wallet, label: t('dashboard.payments'), path: '/dashboard/payments' },
      { icon: Settings, label: t('dashboard.settings'), path: '/dashboard/settings' },
      { icon: AlertTriangle, label: 'Risk & Compliance', path: '/dashboard/risk', isSection: true, adminOnly: true }
    ],
    admin: [
      { icon: LayoutDashboard, label: t('dashboard.title'), path: '/dashboard/admin' },
      { icon: BarChart3, label: 'Analytics', path: '/dashboard/admin/analytics' },
      { icon: DollarSign, label: 'Revenue & Finance', path: '/dashboard/admin/revenue' },
      { icon: TrendingUp, label: 'Growth Metrics', path: '/dashboard/admin/growth-metrics' },
      { icon: UsersIcon, label: 'Onboarding Tracker', path: '/dashboard/admin/onboarding-tracker' },
      { icon: Package, label: 'Marketplace', path: '/dashboard/admin/marketplace' },
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

  return (
    <div className="flex min-h-screen bg-afrikoni-ivory relative">
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
        className="fixed left-0 top-0 bottom-0 z-50 bg-afrikoni-charcoal border-r border-afrikoni-gold/20 shadow-premium-lg md:static md:shadow-none md:z-auto transition-all overflow-hidden"
      >
        <div className="flex flex-col h-full relative">
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
              <span>{t('dashboard.settings')}</span>
            </Link>
            <Link
              to="/dashboard/help"
              className="flex items-center gap-3 px-4 py-3 rounded-afrikoni text-sm font-medium text-afrikoni-sand hover:bg-afrikoni-gold/10 hover:text-afrikoni-gold transition-all"
            >
              <HelpCircle className="w-5 h-5" />
              <span>{t('dashboard.help') || 'Help Center'}</span>
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
      <div className="flex flex-col flex-1 md:ml-64 min-h-screen relative z-10 overflow-visible">
        {/* Premium Top Bar */}
        <header className="sticky top-0 z-30 bg-afrikoni-ivory border-b border-afrikoni-gold/20 shadow-premium backdrop-blur-sm overflow-visible">
          <div className="flex items-center justify-between px-4 md:px-6 py-4 relative overflow-visible">
            {/* Community CTA - Mobile */}
            <div className="md:hidden">
              <button
                onClick={() => openWhatsAppCommunity('dashboard_header_mobile')}
                className="flex items-center gap-2 px-3 py-1.5 bg-afrikoni-gold text-afrikoni-chestnut rounded-full text-xs font-semibold hover:bg-afrikoni-goldLight transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Community
              </button>
            </div>
            {/* Left: Menu + Search */}
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-afrikoni hover:bg-afrikoni-sand/20 transition-colors"
              >
                <Menu className="w-5 h-5 text-afrikoni-text-dark" />
              </button>
              
              {/* Search Bar with Gold Glow */}
              <div className="hidden md:flex items-center gap-2 flex-1 max-w-md relative">
                <Search className="w-4 h-4 text-afrikoni-gold absolute left-3 z-10" />
                <Input
                  placeholder={t('common.search') || 'Search orders, products, suppliers...'}
                  className="pl-10 pr-4 h-10 w-full border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 shadow-afrikoni transition-all text-sm bg-white rounded-afrikoni"
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                />
              </div>
            </div>

            {/* Right: Community CTA (Desktop) + Role Switcher + Quick Create + Notifications + User */}
            <div className="flex items-center gap-3">
              {/* Community CTA - Desktop */}
              <button
                onClick={() => openWhatsAppCommunity('dashboard_header_desktop')}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-afrikoni-gold text-afrikoni-chestnut rounded-full text-sm font-semibold hover:bg-afrikoni-goldLight transition-colors shadow-afrikoni"
              >
                <MessageCircle className="w-4 h-4" />
                Join Community 🚀
              </button>
              {/* Premium Segmented Role Switcher - v2.5 */}
              {isHybrid && (
                <div className="hidden lg:flex items-center gap-0.5 bg-afrikoni-sand/40 p-1 rounded-full border border-afrikoni-gold/20 shadow-premium relative">
                  {['all', 'buyer', 'seller'].map((view, idx) => (
                    <button
                      key={view}
                      onClick={() => setActiveView(view)}
                      className={`
                        relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 capitalize z-10 min-w-[60px]
                        ${activeView === view
                          ? 'text-afrikoni-charcoal'
                          : 'text-afrikoni-text-dark/70 hover:text-afrikoni-text-dark'
                        }
                      `}
                    >
                      {view === 'all' ? 'All' : view}
                    </button>
                  ))}
                  {/* Sliding highlight */}
                  <motion.div
                    layoutId="activeRoleView"
                    className="absolute top-1 bottom-1 rounded-full bg-afrikoni-gold shadow-afrikoni z-0"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    animate={{
                      x: activeView === 'all' ? 0 : activeView === 'buyer' ? 'calc(33.333% + 0.125rem)' : 'calc(66.666% + 0.25rem)',
                      width: 'calc(33.333% - 0.25rem)',
                    }}
                  />
                </div>
              )}

              {/* Quick Create Button */}
              <Button
                onClick={() => {
                  if (userRole === 'buyer' || (userRole === 'hybrid' && activeView === 'buyer')) {
                    navigate('/dashboard/rfqs/new');
                  } else {
                    navigate('/dashboard/products/new');
                  }
                }}
                className="hidden lg:flex items-center gap-2 bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal font-semibold shadow-afrikoni rounded-afrikoni px-4 py-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">
                  {userRole === 'buyer' || (userRole === 'hybrid' && activeView === 'buyer') ? 'Create RFQ' : 'Add Product'}
                </span>
              </Button>

              {/* Date Range Selector */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-white border border-afrikoni-gold/20 rounded-afrikoni hover:border-afrikoni-gold/40 transition-colors">
                <Calendar className="w-4 h-4 text-afrikoni-gold" />
                <select className="bg-transparent text-sm font-medium text-afrikoni-text-dark border-0 focus:outline-none cursor-pointer">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>This year</option>
                </select>
              </div>

              {/* Admin Mode Badge */}
              {isUserAdmin && (
                <Link
                  to="/dashboard/risk"
                  className="hidden md:flex items-center gap-2 px-3 py-2 bg-afrikoni-gold/20 hover:bg-afrikoni-gold/30 border border-afrikoni-gold/30 rounded-afrikoni transition-all group"
                  title="You have elevated privileges"
                >
                  <Shield className="w-4 h-4 text-afrikoni-gold" />
                  <span className="text-xs font-semibold text-afrikoni-gold">Admin Mode</span>
                </Link>
              )}

              {/* Notifications */}
              <NotificationBell />

              {/* Messages */}
              <Link
                to="/messages"
                className="p-2 rounded-afrikoni hover:bg-afrikoni-sand/20 relative transition-all hover:scale-105"
              >
                <MessageSquare className="w-5 h-5 text-afrikoni-text-dark" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-afrikoni-gold rounded-full border-2 border-afrikoni-ivory"></span>
              </Link>

              {/* User Menu */}
              <div className="relative">
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
                      const email = user?.email || profile?.email || user?.user_email;
                      return email?.charAt(0)?.toUpperCase() || 'U';
                    })()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-afrikoni-text-dark transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
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
                            {t('dashboard.title') || 'Dashboard'}
                          </Link>
                          <Link 
                            to={profile?.company_id ? `/business/${profile.company_id}` : '/dashboard/settings'} 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            {t('common.view') || 'View'} Profile
                          </Link>
                          <Link 
                            to="/messages" 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <MessageSquare className="w-4 h-4" />
                            {t('messages.title') || 'Messages'}
                          </Link>
                          <Link 
                            to="/dashboard/orders" 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Package className="w-4 h-4" />
                            {t('dashboard.orders') || 'Orders'}
                          </Link>
                          <Link 
                            to="/dashboard/rfqs" 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <FileText className="w-4 h-4" />
                            {t('nav.rfq') || 'RFQ'}
                          </Link>
                          <Link 
                            to="/verification-center" 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Shield className="w-4 h-4" />
                            {t('verification.title') || 'Verification'}
                          </Link>
                          <Link 
                            to="/dashboard/settings" 
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-afrikoni-sand/20 text-sm text-afrikoni-text-dark transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            {t('dashboard.settings') || 'Settings'}
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
                            {t('auth.logout') || 'Logout'}
                          </button>
                        </div>
            </motion.div>
          </>
        )}

        {/* Page Content */}
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 pb-20 md:pb-6 bg-afrikoni-ivory overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav userRole={userRole} />

      {/* Social Proof Footer Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 z-30 bg-afrikoni-chestnut/95 backdrop-blur-sm border-t border-afrikoni-gold/30 px-4 py-2 hidden md:block"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 text-xs text-afrikoni-sand">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-afrikoni-gold" />
            <span className="font-semibold text-afrikoni-gold">23</span>
            <span>suppliers active today</span>
          </div>
          <span className="text-afrikoni-gold/50">·</span>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-afrikoni-gold" />
            <span className="font-semibold text-afrikoni-gold">8</span>
            <span>RFQs submitted this week</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
