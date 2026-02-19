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
    FileText, Shield, Settings, LogOut, Sparkles, ZapOff, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import UserAvatar from '@/components/headers/UserAvatar';
import { useAuth } from '@/contexts/AuthProvider';
import { useLanguage } from '@/i18n/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import { cn as utilsCn } from '@/lib/utils';

// Bulletproof helper to prevent ReferenceError: cn is not defined
const cn = (...args) => {
    try {
        return utilsCn(...args);
    } catch (e) {
        return args.filter(Boolean).join(' ');
    }
};

export function IdentityLayer({
    user,
    profile,
    organization,
    workspaceMode = 'simple',
    onToggleMode,
    onOpenCommandPalette,
    notificationCount = 0,
    onToggleSidebar,
    onToggleCopilot,
    onToggleHealth,
    isLiteMode = false,
    onToggleLiteMode
}) {
    const { theme, toggleTheme } = useTheme();
    const { signOut } = useAuth();
    const navigate = useNavigate();
    const { language = 'en' } = useLanguage();
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
        navigate(`/${language}/login`);
    };

    const userName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const orgName = organization?.name || 'Organization';

    // Added: Smarter initial derivation
    const getInitial = () => {
        if (userName === 'User') return 'U';
        return userName.charAt(0).toUpperCase();
    };

    return (
        <div className="w-full h-full flex items-center justify-between">
            {/* Left: User Identity - Horizon 2026 Minimal */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={onToggleSidebar}
                >
                    <Menu className="w-5 h-5" />
                </Button>

                <div
                    ref={userMenuButtonRef}
                    onClick={handleUserMenuClick}
                    className="flex items-center gap-3 cursor-pointer p-1.5 px-2 hover:bg-os-stroke rounded-os-sm transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-os-accent/10 border border-os-accent/20 flex items-center justify-center text-os-accent text-os-xs font-semibold">
                        {getInitial()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-os-sm font-semibold tracking-tight">{userName}</span>
                        <span className="text-os-xs text-os-text-secondary font-medium">{orgName}</span>
                    </div>
                </div>
            </div>

            {/* Right: Orchestration Controls */}
            <div className="flex items-center gap-2">
                {/* WhatsApp Support - Trust Signal */}
                <a
                    href="https://wa.me/233550000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden lg:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-full bg-white text-[#25D366] hover:bg-green-50 transition-all border border-[#25D366]/20 shadow-sm"
                >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="text-os-xs font-bold">Support 24/7</span>
                </a>

                {/* System Health Trigger - Layer 2 */}
                <div
                    onClick={onToggleHealth}
                    className="health-capsule mr-4 cursor-pointer hover:bg-os-success/5 transition-colors"
                >
                    <div className="health-dot" />
                    <span className="text-os-text-primary text-os-xs font-semibold">Trade is Active</span>
                </div>

                {/* Search / Command */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenCommandPalette}
                    className="w-10 h-10 rounded-full"
                >
                    <Command className="w-4 h-4 text-os-text-secondary" />
                </Button>

                <div className="w-[1px] h-4 bg-os-stroke mx-1" />

                {/* Mode Selector */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleMode}
                    className="hidden md:flex items-center gap-2 px-3 text-os-text-secondary hover:text-os-text-primary"
                >
                    <span className="text-os-xs font-medium">
                        {workspaceMode === 'simple' ? 'Simple' : 'Operator'}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                </Button>

                {/* Notifications */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/${language}/dashboard/notifications`)}
                    className="relative w-10 h-10 rounded-full"
                >
                    <Bell className="w-4 h-4 text-os-text-secondary" />
                    {notificationCount > 0 && (
                        <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-os-error rounded-full border-2 border-os-surface-solid" />
                    )}
                </Button>

                {/* AI Copilot - HIDDEN FOR V1 LAUNCH */}
                {/* 
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleCopilot}
                    className="flex h-9 px-4 rounded-full bg-os-accent/10 text-os-accent hover:bg-os-accent/20 transition-all font-semibold text-os-xs gap-2 ml-2"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Assistant</span>
                </Button> 
                */}

                {/* Lite Mode Toggle - Phase 2 Market Expansion */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleLiteMode}
                    className={cn(
                        "w-10 h-10 rounded-full transition-all",
                        isLiteMode ? "bg-os-accent text-black" : "text-os-text-secondary hover:text-os-text-primary"
                    )}
                    title={isLiteMode ? "Disable Lite Mode" : "Enable Lite Mode (Low Data)"}
                >
                    <ZapOff className="w-4 h-4" />
                </Button>
            </div>

            {/* User Menu Dropdown */}
            <AnimatePresence>
                {userMenuOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-[1001]"
                            style={{ zIndex: 1001 }}
                            onClick={() => setUserMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="fixed w-56 bg-white rounded-xl shadow-lg ring-1 ring-black/5 z-[1002] overflow-hidden"
                            style={{
                                top: `${menuPosition.top}px`,
                                right: `${menuPosition.right}px`,
                            }}
                        >
                            <div className="py-1">
                                <div className="px-4 py-3 border-b border-os-stroke">
                                    <div className="font-bold text-os-text-primary text-os-sm truncate">
                                        {user?.email || 'Institutional Identity'}
                                    </div>
                                    <div className="text-os-xs text-os-text-secondary uppercase mt-0.5 font-bold tracking-tighter">
                                        {orgName}
                                    </div>
                                </div>
                                {[
                                    { to: `/${language}/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
                                    { to: `/${language}/dashboard/settings`, icon: UserIcon, label: 'Profile' },
                                    { to: `/${language}/dashboard/notifications`, icon: MessageSquare, label: 'Trade Signals' },
                                    { to: `/${language}/dashboard/orders`, icon: Package, label: 'Orders' },
                                    { to: `/${language}/dashboard/rfqs`, icon: FileText, label: 'RFQs' },
                                    { to: `/${language}/dashboard/kyc`, icon: Shield, label: 'Identity Verification' },
                                    { to: `/${language}/dashboard/settings`, icon: Settings, label: 'Settings' },
                                ].map(item => (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className="flex items-center gap-3 px-4 py-2 hover:bg-os-accent/10 text-os-sm text-os-text-secondary hover:text-os-text-primary transition-colors"
                                        onClick={() => setUserMenuOpen(false)}
                                    >
                                        <item.icon className="w-4 h-4 text-os-text-secondary" />
                                        {item.label}
                                    </Link>
                                ))}
                                <div className="border-t border-os-stroke my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-red-950/30 text-os-sm text-red-400 transition-colors"
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
