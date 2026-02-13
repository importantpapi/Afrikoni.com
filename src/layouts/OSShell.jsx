/**
 * OS Shell - Top-Level Layout Container
 * 
 * This component establishes the Operating System shell architecture for Afrikoni Trade OS.
 * It defines explicit layout zones with reserved dimensions and z-index hierarchy.
 * 
 * Layout Zones:
 * - System Layer (56px, z-index: 1000) - Trade Readiness Bar
 * - Identity Layer (48px, z-index: 999) - User/Org/Theme controls
 * - Workspace Nav (240px, z-index: 100) - Sidebar navigation
 * - Content Surface (calculated, z-index: 1) - Page content
 * - AI Copilot (320px, z-index: 50) - Optional right sidebar
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { IdentityLayer } from '@/components/os-shell/IdentityLayer';
import { ContentSurface } from '@/components/os-shell/ContentSurface';
import TradeOSSidebar from '@/components/dashboard/TradeOSSidebar';
import { AICopilotSidebar } from '@/components/ai/AICopilotSidebar';
import { zIndex } from '@/config/zIndex';
import { usePWAInstaller } from '@/hooks/usePWAInstaller';
import { Smartphone, Download, Globe, LogOut, LayoutDashboard, User as UserIcon, MessageSquare, Package, FileText, Shield, Settings } from 'lucide-react';
import MobileBottomNav from '@/components/dashboard/MobileBottomNav';
import CommandPalette from '@/components/dashboard/CommandPalette';
import { useAuth } from '@/contexts/AuthProvider';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import PullToRefresh from '@/components/dashboard/PullToRefresh';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { BellRing } from 'lucide-react';
import { useOSSettings } from '@/hooks/useOSSettings';

// OS Shell Z-Index Hierarchy
export const OS_Z_INDEX = {
    modal: 1300,
    systemLayer: 1200,
    identityLayer: 1150,
    workspaceNav: 1100, // ABOVE overlay
    overlay: 1000,      // BELOW workspaceNav
    copilot: 800,
    content: 1
};

// OS Shell Dimensions
export const OS_DIMENSIONS = {
    systemLayer: { height: 0 },
    identityLayer: { height: 48 },
    workspaceNav: {
        desktop: 240,
        collapsed: 72
    },
    copilot: { width: 320 },
    get reservedTop() {
        return this.systemLayer.height + this.identityLayer.height;
    }
};

export default function OSShell({
    children,
    systemState,
    capabilities,
    user,
    profile,
    organization,
    workspaceMode = 'simple',
    onToggleMode,
    onOpenCommandPalette,
    notificationCount = 0,
    notificationCounts = {},
    isAdmin = false
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [copilotOpen, setCopilotOpen] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const { isInstallable, isInstalled, installApp } = usePWAInstaller();
    const { isSubscribed, subscribe, permission, loading: pushLoading } = usePushNotifications();
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [showPushPrompt, setShowPushPrompt] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { signOut } = useAuth();
    const { reducedMotion } = useOSSettings();
    const navigate = useNavigate();

    // Ported: Register Service Worker for PWA
    useEffect(() => {
        if ('serviceWorker' in navigator && import.meta.env.PROD) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('[PWA] ServiceWorker registered:', registration.scope);
                    })
                    .catch(error => {
                        console.error('[PWA] ServiceWorker registration failed:', error);
                    });
            });
        }
    }, []);

    // Ported: Show install prompt on mobile if installable
    useEffect(() => {
        if (isInstallable && !isInstalled) {
            const timer = setTimeout(() => setShowInstallPrompt(true), 10000); // Wait 10s
            return () => clearTimeout(timer);
        }
    }, [isInstallable, isInstalled]);

    // Push Prompt: Show if authenticated and not subscribed
    useEffect(() => {
        if (user && !isSubscribed && permission !== 'denied' && !pushLoading) {
            const timer = setTimeout(() => setShowPushPrompt(true), 15000); // Wait 15s (after PWA)
            return () => clearTimeout(timer);
        }
    }, [user, isSubscribed, permission, pushLoading]);

    // Derived capability flags for Mobile Navigation
    const isBuyer = capabilities?.can_buy === true;
    const isSeller = capabilities?.can_sell === true && capabilities?.sell_status === 'approved';
    const isLogistics = capabilities?.can_logistics === true && capabilities?.logistics_status === 'approved';
    const isHybridCapability = isBuyer && isSeller;

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
            <div className="relative w-full h-screen overflow-hidden">
                {/* System Layer - Always visible at top */}
                <div
                    className="fixed top-0 left-0 right-0 overflow-hidden"
                    style={{
                        height: `${OS_DIMENSIONS.systemLayer.height}px`,
                        zIndex: OS_Z_INDEX.systemLayer
                    }}
                >
                </div>

                {/* Identity Layer - Below system layer, respects sidebar boundaries */}
                <div
                    className="fixed right-0 border-b border-afrikoni-gold/10"
                    style={{
                        left: `${OS_DIMENSIONS.workspaceNav.collapsed}px`, // Start after sidebar
                        top: `${OS_DIMENSIONS.systemLayer.height}px`,
                        height: `${OS_DIMENSIONS.identityLayer.height}px`,
                        zIndex: OS_Z_INDEX.identityLayer
                    }}
                >
                    {/* Glass Background - Horizon 2026 Heavy Blur (32px) */}
                    <div className="absolute inset-0 bg-[hsl(var(--background))]/60 backdrop-blur-[32px] backdrop-saturate-150" />

                    <div className="relative z-10 w-full h-full transition-all duration-300">
                        <IdentityLayer
                            user={user}
                            profile={profile}
                            organization={organization}
                            workspaceMode={workspaceMode}
                            onToggleMode={onToggleMode}
                            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                            notificationCount={notificationCount}
                            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                            onToggleCopilot={() => setCopilotOpen(!copilotOpen)}
                        />
                    </div>
                </div>

                {/* Workspace Navigation Sidebar */}
                <div
                    className="fixed left-0 bottom-0"
                    style={{
                        // Architectural Fix: Sidebar starts below System Layer (at 56px), not below Identity Layer
                        // This places the Sidebar parallel to the Identity Layer
                        top: `${OS_DIMENSIONS.systemLayer.height}px`,
                        width: `${OS_DIMENSIONS.workspaceNav.collapsed}px`,
                        zIndex: OS_Z_INDEX.workspaceNav
                    }}
                >
                    <TradeOSSidebar
                        capabilities={capabilities}
                        isAdmin={isAdmin}
                        notificationCounts={notificationCounts}
                        onClose={() => setSidebarOpen(false)}
                        sidebarOpen={sidebarOpen}
                        workspaceMode={workspaceMode}
                    />
                </div>

                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden"
                            style={{ zIndex: OS_Z_INDEX.overlay }}
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Content Surface - Main application area */}
                <ContentSurface
                    copilotOpen={copilotOpen}
                    reservedTop={OS_DIMENSIONS.reservedTop}
                >
                    {/* Pull to Refresh Wrapper */}
                    <PullToRefresh
                        onRefresh={async () => {
                            console.log('[Kernel] OSShell manual refresh triggered');
                            // In the future, this should trigger a system-wide refresh
                            await new Promise(resolve => setTimeout(resolve, 800));
                        }}
                    >
                        {/* Global System Notifications (PWA Install, Push Alerts) */}
                        <AnimatePresence mode="popLayout">
                            {showInstallPrompt && (
                                <motion.div
                                    key="pwa-install"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="mb-6 mx-4 md:mx-6 mt-4 p-5 os-panel-glass flex items-center justify-between gap-4 relative overflow-hidden"
                                >
                                    {/* Ambient orb glow */}
                                    <div className="os-ambient-orb" style={{ top: '-40%', left: '60%' }} />

                                    <div className="flex items-center gap-3 z-10">
                                        <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center backdrop-blur-md">
                                            <Smartphone className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground">Install Afrikoni OS</h4>
                                            <p className="text-[11px] text-muted-foreground font-medium">Dedicated workspace · Offline support · Native feel</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 z-10">
                                        <button
                                            onClick={() => setShowInstallPrompt(false)}
                                            className="px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                                        >
                                            Later
                                        </button>
                                        <button
                                            onClick={() => { installApp(); setShowInstallPrompt(false); }}
                                            className="btn-gold px-4 py-2 rounded-xl text-xs text-primary-foreground flex items-center gap-1.5"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Install
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {showPushPrompt && (
                                <motion.div
                                    key="push-prompt"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="mb-4 mx-4 md:mx-6 mt-4 p-5 os-panel-glass flex items-center justify-between gap-4 overflow-hidden relative"
                                >
                                    {/* Ambient orb glow */}
                                    <div className="os-ambient-orb" style={{ top: '-30%', right: '70%', background: 'radial-gradient(circle, hsl(var(--info) / 0.3), transparent 70%)' }} />

                                    <div className="flex items-center gap-3 z-10">
                                        <div className="w-11 h-11 rounded-2xl bg-info/10 border border-info/20 flex items-center justify-center backdrop-blur-md">
                                            <BellRing className="w-5 h-5 text-info animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground">Real-time Trade Signals</h4>
                                            <p className="text-[11px] text-muted-foreground font-medium">Never miss orders · Live updates · Instant alerts</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 z-10">
                                        <button
                                            onClick={() => setShowPushPrompt(false)}
                                            className="px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                                        >
                                            Skip
                                        </button>
                                        <button
                                            onClick={async () => {
                                                await subscribe();
                                                setShowPushPrompt(false);
                                            }}
                                            className="px-4 py-2 bg-info hover:bg-info/90 text-info-foreground rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5"
                                        >
                                            <Shield className="w-3.5 h-3.5" />
                                            Enable
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-4 md:p-6 pb-24 md:pb-6">
                            {children}
                        </div>
                    </PullToRefresh>
                </ContentSurface>

                {/* Mobile Bottom Navigation */}
                <MobileBottomNav
                    isBuyer={isBuyer}
                    isSeller={isSeller}
                    isLogistics={isLogistics}
                    isHybrid={isHybridCapability}
                />

                {/* Global Signal Stream Footer */}

                {/* Global Command Palette */}
                <CommandPalette
                    open={commandPaletteOpen}
                    onClose={() => setCommandPaletteOpen(false)}
                />

                {/* AI Copilot Sidebar - Optional right sidebar */}
                <AnimatePresence>
                    {copilotOpen && (
                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed right-0 bottom-0 w-full md:w-[320px] shadow-2xl"
                            style={{
                                top: `${OS_DIMENSIONS.reservedTop}px`,
                                zIndex: OS_Z_INDEX.copilot
                            }}
                        >
                            <AICopilotSidebar
                                isOpen={true}
                                onClose={() => setCopilotOpen(false)}
                                recommendations={systemState?.intelligence?.recommendations || []}
                                systemState={systemState}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MotionConfig>
    );
}
