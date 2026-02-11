/**
 * Identity Layer Component
 * 
 * Renders user identity controls, organization selector, theme toggle, and notifications.
 * This layer sits below the system layer and is always visible.
 * 
 * Reserved Height: 48px
 * Z-Index: 999
 */

import React, { useState } from 'react';
import {
    Bell, Command, Menu, Moon, Sun, User, ChevronDown,
    LayoutDashboard, User as UserIcon, MessageSquare, Package,
    FileText, Shield, Settings, LogOut, Sparkles
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import UserAvatar from '@/components/headers/UserAvatar';
import { useAuth } from '@/contexts/AuthProvider';
import { AnimatePresence, motion } from 'framer-motion';

export function IdentityLayer({
    user,
    organization,
    workspaceMode = 'simple',
    onToggleMode,
    onOpenCommandPalette,
    notificationCount = 0,
    onToggleSidebar,
    onToggleCopilot
}) {
    const { theme, toggleTheme } = useTheme();
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const userMenuButtonRef = React.useRef(null);

    const handleUserMenuClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right
        });
        setUserMenuOpen(!userMenuOpen);
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const orgName = organization?.name || 'Organization';

    return (
        <div className="w-full h-full px-4 md:px-6 flex items-center justify-between">
            {/* Left: Mobile Menu + User Identity */}
            <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                {/* Mobile Menu Toggle */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden flex-shrink-0"
                    onClick={onToggleSidebar}
                >
                    <Menu className="w-5 h-5" />
                </Button>

                {/* User Avatar and Name */}
                <motion.div
                    ref={userMenuButtonRef}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 p-1 px-1.5 rounded-lg transition-all overflow-hidden"
                    onClick={handleUserMenuClick}
                >
                    <div className="hidden md:block flex-shrink-0">
                        <UserAvatar
                            user={user}
                            size="sm"
                        />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-sm font-bold text-gray-900 dark:text-[#F5F0E8] leading-tight truncate">
                            {userName}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider truncate">
                            {orgName}
                        </div>
                    </div>
                    <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" />
                </motion.div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3 md:gap-4">
                {/* Workspace Mode Toggle */}
                {onToggleMode && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleMode}
                        className="hidden md:flex items-center gap-2"
                    >
                        <span className="text-xs font-medium">
                            {workspaceMode === 'simple' ? 'Simple' : 'Operator'}
                        </span>
                        <ChevronDown className="w-3 h-3" />
                    </Button>
                )}

                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="relative w-8 h-8 rounded-full"
                >
                    {theme === 'dark' ? (
                        <Sun className="w-4 h-4" />
                    ) : (
                        <Moon className="w-4 h-4" />
                    )}
                </Button>

                {/* Notifications */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/dashboard/notifications')}
                    className="relative w-8 h-8 rounded-full"
                >
                    <Bell className="w-4 h-4" />
                    {notificationCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center pointer-events-none"
                        >
                            {notificationCount > 9 ? '9+' : notificationCount}
                        </Badge>
                    )}
                </Button>

                {/* Command Palette */}
                {onOpenCommandPalette && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onOpenCommandPalette}
                        className="hidden md:flex items-center gap-2 h-8 px-2"
                    >
                        <Command className="w-4 h-4" />
                        <span className="text-[10px] font-mono opacity-50">⌘K</span>
                    </Button>
                )}

                {/* AI Copilot Toggle */}
                {onToggleCopilot && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleCopilot}
                        className="flex h-8 px-2 lg:px-3 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all font-bold text-xs"
                    >
                        <span className="lg:hidden"><Sparkles className="w-4 h-4" /></span>
                        <span className="hidden lg:inline">AI</span>
                    </Button>
                )}
            </div>

            {/* User Menu Dropdown */}
            <AnimatePresence>
                {userMenuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[1001]"
                            onClick={() => setUserMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="fixed w-56 bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2A2A2A] rounded-xl shadow-2xl z-[1002] overflow-hidden"
                            style={{
                                top: `${menuPosition.top}px`,
                                right: `${menuPosition.right}px`,
                            }}
                        >
                            <div className="py-1">
                                <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1E1E1E]">
                                    <div className="font-bold text-gray-900 dark:text-[#F5F0E8] text-sm truncate">
                                        {user?.email || 'user@example.com'}
                                    </div>
                                    <div className="text-[10px] text-gray-500 uppercase mt-0.5 font-bold tracking-tighter">
                                        {orgName}
                                    </div>
                                </div>
                                {[
                                    { to: '/dashboard', icon: LayoutDashboard, label: 'Command Center' },
                                    { to: '/dashboard/settings', icon: UserIcon, label: 'Profile' },
                                    { to: '/dashboard/notifications', icon: MessageSquare, label: 'Trade Signals' },
                                    { to: '/dashboard/orders', icon: Package, label: 'Orders' },
                                    { to: '/dashboard/rfqs', icon: FileText, label: 'RFQs' },
                                    { to: '/dashboard/verification-center', icon: Shield, label: 'Verification' },
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
                                <div className="border-t border-gray-200 dark:border-[#1E1E1E] my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-red-950/30 text-sm text-red-400 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
