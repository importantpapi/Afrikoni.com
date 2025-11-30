import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Truck, FileText, MessageSquare,
  BarChart3, Wallet, Shield, Settings, HelpCircle, Bell, Search, ChevronDown,
  User, LogOut, Calendar, Globe, Menu, X, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabaseHelpers } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/Logo';
import NotificationBell from '@/components/notificationbell';

export default function DashboardLayout({ children, currentRole = 'buyer' }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await supabaseHelpers.auth.me();
      setUser(userData);
    } catch (error) {
      // Error logged (removed for production)
    }
  };

  const handleLogout = async () => {
    try {
      await supabaseHelpers.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      // Error logged (removed for production)
      toast.error('Failed to logout');
    }
  };

  const sidebarItems = {
    buyer: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: ShoppingCart, label: 'Orders', path: '/dashboard/orders' },
      { icon: FileText, label: 'RFQs', path: '/dashboard/rfqs' },
      { icon: Package, label: 'Saved Products', path: '/dashboard/saved' },
      { icon: MessageSquare, label: 'Messages', path: '/messages' },
      { icon: Building2, label: 'Company Info', path: '/dashboard/company-info' },
      { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
      { icon: Wallet, label: 'Payments', path: '/dashboard/payments' },
      { icon: Shield, label: 'Protection', path: '/dashboard/protection' }
    ],
    seller: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: ShoppingCart, label: 'Sales', path: '/dashboard/sales' },
      { icon: Package, label: 'Products & Listings', path: '/dashboard/products' },
      { icon: FileText, label: 'RFQs', path: '/dashboard/rfqs' },
      { icon: MessageSquare, label: 'Messages', path: '/messages' },
      { icon: Building2, label: 'Company Info', path: '/dashboard/company-info' },
      { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
      { icon: Wallet, label: 'Payments', path: '/dashboard/payments' },
      { icon: Shield, label: 'Verification', path: '/dashboard/verification' }
    ],
    hybrid: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: ShoppingCart, label: 'Orders & Sales', path: '/dashboard/orders' },
      { icon: Package, label: 'Products', path: '/dashboard/products' },
      { icon: FileText, label: 'RFQs', path: '/dashboard/rfqs' },
      { icon: MessageSquare, label: 'Messages', path: '/messages' },
      { icon: Building2, label: 'Company Info', path: '/dashboard/company-info' },
      { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
      { icon: Wallet, label: 'Payments', path: '/dashboard/payments' },
      { icon: Shield, label: 'Protection', path: '/dashboard/protection' }
    ],
    logistics: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Truck, label: 'Shipments', path: '/dashboard/shipments' },
      { icon: FileText, label: 'RFQs', path: '/dashboard/rfqs' },
      { icon: MessageSquare, label: 'Messages', path: '/messages' },
      { icon: Building2, label: 'Company Info', path: '/dashboard/company-info' },
      { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
      { icon: Wallet, label: 'Payments', path: '/dashboard/payments' },
      { icon: Settings, label: 'Settings', path: '/dashboard/settings' }
    ]
  };

  const menuItems = sidebarItems[currentRole] || sidebarItems.buyer;

  return (
    <div className="flex min-h-screen bg-afrikoni-offwhite">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : '-100%',
          width: sidebarOpen ? '16rem' : '0'
        }}
        className="fixed left-0 top-0 bottom-0 z-50 bg-afrikoni-chestnut border-r border-afrikoni-gold/30 shadow-afrikoni-lg md:static md:shadow-none md:z-auto transition-all overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-afrikoni-gold/30">
            <Logo type="full" size="sm" link={true} showTagline={false} className="text-afrikoni-gold" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-lg hover:bg-afrikoni-gold/20 text-afrikoni-cream"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <motion.div
                  key={idx}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-afrikoni-gold/15 text-afrikoni-gold border-l-[3px] border-afrikoni-gold' 
                        : 'text-afrikoni-cream hover:bg-afrikoni-gold/10 hover:text-afrikoni-gold'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Bottom Links */}
          <div className="p-4 border-t border-afrikoni-gold/30 space-y-1">
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-afrikoni-cream hover:bg-afrikoni-gold/10 hover:text-afrikoni-gold transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
            <Link
              to="/dashboard/help"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-afrikoni-cream hover:bg-afrikoni-gold/10 hover:text-afrikoni-gold transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span>Help Center</span>
            </Link>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 md:ml-64 min-h-screen">
        {/* Top Bar - Header at the very top */}
        <header className="sticky top-0 z-30 bg-afrikoni-offwhite border-b border-afrikoni-gold/30 shadow-afrikoni">
          <div className="flex items-center justify-between px-4 py-0.5">
            {/* Left: Menu + Search */}
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-afrikoni-cream"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="hidden md:flex items-center gap-2 flex-1 max-w-md relative">
                <Search className="w-4 h-4 text-afrikoni-gold absolute left-3 z-10" />
                <Input
                  placeholder="Search orders, products, suppliers..."
                  className="pl-10 pr-4 h-9 w-full border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 shadow-afrikoni transition-all text-sm"
                />
              </div>
            </div>

            {/* Right: Role Switcher + Date Range + Icons + User */}
            <div className="flex items-center gap-3">
              {/* Role Display (read-only for now) */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-afrikoni-cream rounded-lg">
                <Badge variant={currentRole === 'buyer' ? 'primary' : 'outline'} className="text-xs px-2 py-0.5">
                  Buyer
                </Badge>
                <Badge variant={currentRole === 'seller' ? 'primary' : 'outline'} className="text-xs px-2 py-0.5">
                  Seller
                </Badge>
                <Badge variant={currentRole === 'hybrid' ? 'primary' : 'outline'} className="text-xs px-2 py-0.5">
                  Hybrid
                </Badge>
                <Badge variant={currentRole === 'logistics' || currentRole === 'logistics_partner' ? 'primary' : 'outline'} className="text-xs px-2 py-0.5">
                  Logistics
                </Badge>
              </div>

              {/* Date Range */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-afrikoni-cream rounded-lg">
                <Calendar className="w-4 h-4 text-afrikoni-gold" />
                <select className="bg-transparent text-sm font-medium text-afrikoni-deep border-0 focus:outline-none">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* Messages */}
              <Link
                to="/messages"
                className="p-2 rounded-lg hover:bg-afrikoni-cream relative transition-all hover:scale-105"
              >
                <MessageSquare className="w-5 h-5 text-afrikoni-gold" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-afrikoni-gold rounded-full border-2 border-afrikoni-offwhite"></span>
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-afrikoni-cream"
                >
                  <div className="w-7 h-7 bg-afrikoni-gold rounded-full flex items-center justify-center text-afrikoni-chestnut font-bold text-xs">
                    U
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-afrikoni-gold hidden md:block" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-afrikoni-offwhite border border-afrikoni-gold/30 rounded-lg shadow-afrikoni-lg z-50"
                    >
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-afrikoni-gold/30">
                          <div className="font-semibold text-afrikoni-chestnut text-sm">{user?.email || 'user@example.com'}</div>
                          <div className="text-xs text-afrikoni-deep capitalize">{currentRole}</div>
                        </div>
                        <Link to="/dashboard/settings" className="flex items-center gap-3 px-4 py-2 hover:bg-afrikoni-cream text-sm text-afrikoni-deep">
                          <User className="w-4 h-4" />
                          Profile & Settings
                        </Link>
                        <Link to="/dashboard/verification" className="flex items-center gap-3 px-4 py-2 hover:bg-afrikoni-cream text-sm text-afrikoni-deep">
                          <Shield className="w-4 h-4" />
                          Account & Verification
                        </Link>
                        <div className="border-t border-afrikoni-gold/30 my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - Immediately below header */}
        <main className="flex-1 px-4 md:px-6 pb-4">
          {children}
        </main>
      </div>
    </div>
  );
}

