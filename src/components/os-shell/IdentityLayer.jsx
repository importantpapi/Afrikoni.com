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
import { Bell, Command, Menu, Moon, Sun, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '@/components/headers/UserAvatar';

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
    const navigate = useNavigate();
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const orgName = organization?.name || 'Organization';

    return (
        <div className="w-full h-full bg-white dark:bg-[#0A0A0A] border-b border-gray-200 dark:border-[#1E1E1E] px-4 md:px-6 flex items-center justify-between">
            {/* Left: Mobile Menu + User Identity */}
            <div className="flex items-center gap-3">
                {/* Mobile Menu Toggle */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={onToggleSidebar}
                >
                    <Menu className="w-5 h-5" />
                </Button>

                {/* User Avatar and Name */}
                <div className="flex items-center gap-3">
                    <UserAvatar
                        user={user}
                        size="sm"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="cursor-pointer"
                    />
                    <div className="hidden md:block">
                        <div className="text-sm font-semibold text-gray-900 dark:text-[#F5F0E8]">
                            {userName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {orgName}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
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
                    size="sm"
                    onClick={toggleTheme}
                    className="relative"
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
                    size="sm"
                    onClick={() => navigate('/dashboard/notifications')}
                    className="relative"
                >
                    <Bell className="w-4 h-4" />
                    {notificationCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
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
                        className="hidden md:flex items-center gap-2"
                    >
                        <Command className="w-4 h-4" />
                        <span className="text-xs">⌘K</span>
                    </Button>
                )}

                {/* AI Copilot Toggle (Desktop only) */}
                {onToggleCopilot && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleCopilot}
                        className="hidden lg:flex"
                    >
                        <span className="text-xs font-medium">AI</span>
                    </Button>
                )}
            </div>
        </div>
    );
}
