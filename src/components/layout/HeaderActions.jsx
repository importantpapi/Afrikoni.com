import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/shared/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ShoppingCart, ChevronDown, LogOut, User, LayoutDashboard, MessageSquare, Package, FileText, Settings } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';

export default function HeaderActions({ user, onLogout }) {
  // ✅ FINAL SYNC: Derive role from Kernel instead of user.user_role
  const { isAdmin, capabilities, isHybrid } = useDashboardKernel();
  const derivedRoleLabel = isAdmin ? 'Admin' : isHybrid ? 'Hybrid' : capabilities?.can_sell ? 'Seller' : capabilities?.can_buy ? 'Buyer' : 'User';
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('USD');

  const [langOpen, setLangOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-4">
      <div className="relative" onMouseEnter={() => setLangOpen(true)} onMouseLeave={() => setLangOpen(false)}>
        <button className="flex items-center gap-1 text-afrikoni-deep hover:text-os-accent transition text-os-sm">
          <Globe className="w-4 h-4" />
          {language}
          <ChevronDown className="w-3 h-3" />
        </button>
        {langOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-os-card border border-os-stroke rounded-lg shadow-os-lg z-50">
            <div className="py-1">
              <button onClick={() => { setLanguage('English'); setLangOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-os-accent/10 text-os-text-primary rounded">
                English
              </button>
              <button onClick={() => { setLanguage('French'); setLangOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-os-accent/10 text-os-text-primary rounded">
                French
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative" onMouseEnter={() => setCurrOpen(true)} onMouseLeave={() => setCurrOpen(false)}>
        <button className="flex items-center gap-1 text-afrikoni-deep hover:text-os-accent transition text-os-sm">
          <span>$</span>
          {currency}
          <ChevronDown className="w-3 h-3" />
        </button>
        {currOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-os-card border border-os-stroke rounded-lg shadow-os-lg z-50">
            <div className="py-1">
              <button onClick={() => { setCurrency('USD'); setCurrOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-os-accent/10 text-os-text-primary rounded">
                $ USD
              </button>
              <button onClick={() => { setCurrency('NGN'); setCurrOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-os-accent/10 text-os-text-primary rounded">
                $ NGN
              </button>
              <button onClick={() => { setCurrency('EUR'); setCurrOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-os-accent/10 text-os-text-primary rounded">
                € EUR
              </button>
            </div>
          </div>
        )}
      </div>

      {user ? (
        <>
          {/* Messages Button - Visible when logged in */}
          <Link to="/messages">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className="relative group">
                <MessageSquare className="w-5 h-5 text-afrikoni-deep hover:text-os-accent transition-colors" />
                <div className="absolute top-full right-0 mt-2 w-48 bg-afrikoni-chestnut text-afrikoni-cream text-os-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  View Messages
                </div>
              </div>
            </motion.div>
          </Link>
          <Link to="/orders">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className="relative group">
                <ShoppingCart className="w-5 h-5 text-afrikoni-deep hover:text-os-accent transition-colors" />
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-os-accent text-afrikoni-creamtext-os-xs rounded-full flex items-center justify-center">0</span>
                <div className="absolute top-full right-0 mt-2 w-48 bg-afrikoni-chestnut text-afrikoni-cream text-os-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Your RFQ cart is empty
                </div>
              </div>
            </motion.div>
          </Link>
          <div className="relative" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
            <motion.button
              className="flex items-center gap-2 text-afrikoni-deep hover:text-os-accent transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-8 h-8 bg-os-accent rounded-full flex items-center justify-center text-afrikoni-chestnut font-bold text-os-sm">
                {(() => {
                  try {
                    return getUserInitial(user || null, null);
                  } catch (error) {
                    console.warn('Error getting user initial:', error);
                    return user?.email?.charAt(0)?.toUpperCase() || 'U';
                  }
                })()}
              </div>
              <motion.div
                animate={{ rotate: userMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.button>
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-os-card border border-os-stroke rounded-lg shadow-2xl z-50"
                >
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-os-stroke bg-os-surface-0">
                      <div className="font-semibold text-os-text-primary text-os-sm">{user.email}</div>
                      <div className="text-os-xs text-os-text-secondary/70">{derivedRoleLabel}</div>
                    </div>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-os-accent/10 text-os-sm text-os-text-primary transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link to={createPageUrl('Profile')} className="flex items-center gap-3 px-4 py-2.5 hover:bg-os-accent/10 text-os-sm text-os-text-primary transition-colors">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link to="/messages" className="flex items-center gap-3 px-4 py-2.5 hover:bg-os-accent/10 text-os-sm text-os-text-primary transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      Messages
                    </Link>
                    <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 hover:bg-os-accent/10 text-os-sm text-os-text-primary transition-colors">
                      <Package className="w-4 h-4" />
                      Orders
                    </Link>
                    <Link to={createPageUrl('RFQManagement')} className="flex items-center gap-3 px-4 py-2.5 hover:bg-os-accent/10 text-os-sm text-os-text-primary transition-colors">
                      <FileText className="w-4 h-4" />
                      RFQs
                    </Link>
                    <Link to={createPageUrl('Settings')} className="flex items-center gap-3 px-4 py-2.5 hover:bg-os-accent/10 text-os-sm text-os-text-primary transition-colors">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <div className="border-t border-os-stroke my-1"></div>
                    <button onClick={onLogout} className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-red-50 text-os-sm text-red-600 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <>
          {/* Messages CTA for logged out users */}
          <Link to="/login?next=/messages">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Sign in to message</span>
              <span className="sm:hidden">Messages</span>
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm">Login</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Sign Up</Button>
          </Link>
        </>
      )}
    </div>
  );
}

