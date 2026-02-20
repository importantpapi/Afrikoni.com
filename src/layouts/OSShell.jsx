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
import { SystemHealthDrawer } from '@/components/os-shell/SystemHealthDrawer';
import TradeOSSidebar from '@/components/dashboard/TradeOSSidebar';
import { AICopilotSidebar } from '@/components/ai/AICopilotSidebar';
import { zIndex } from '@/config/zIndex';

import { Globe, LogOut, LayoutDashboard, User as UserIcon, MessageSquare, Package, FileText, Shield, Settings } from 'lucide-react';
import MobileBottomNav from '@/components/dashboard/MobileBottomNav';
import CommandPalette from '@/components/dashboard/CommandPalette';
import { useAuth } from '@/contexts/AuthProvider';
import { useTheme } from '@/contexts/ThemeContext';
import { useOSSettings } from '@/hooks/useOSSettings';
import PullToRefresh from '@/components/dashboard/PullToRefresh';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { BellRing } from 'lucide-react';
import { cn as utilsCn } from '@/lib/utils';

// Bulletproof helper to prevent ReferenceError: cn is not defined
const cn = (...args) => {
    try {
        return utilsCn(...args);
    } catch (e) {
        return args.filter(Boolean).join(' ');
    }
};

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
        collapsed: 88 // Refactored to 88px as per P0 requirement
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
    const [systemHealthOpen, setSystemHealthOpen] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const { isSubscribed, subscribe, permission, loading: pushLoading } = usePushNotifications();
    const [showPushPrompt, setShowPushPrompt] = useState(false);
    const [isLiteMode, setIsLiteMode] = useState(false);


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
            {/* 🏛️ GRID ROOT: The foundational shell architecture */}
            <div className={cn(
                "grid grid-cols-1 md:grid-cols-[88px_1fr] grid-rows-[56px_1fr] w-full h-screen bg-os-bg transition-all duration-300 isolate pt-safe pb-safe",
                sidebarOpen && "md:grid-cols-[240px_1fr]",
                isLiteMode && "lite-mode-active"
            )}>

                {/* 1. Workspace Navigation (Sidebar) - Spans both rows */}
                <div
                    className={cn(
                        "hidden md:block row-span-2 h-full border-r border-os-stroke bg-os-surface-solid relative transition-all duration-300 overflow-hidden",
                        "z-[1100] will-change-transform"
                    )}
                    style={{ isolation: 'isolate' }}
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

                {/* 2. Identity Layer (Header) - Col 2, Row 1 */}
                <header
                    className="col-span-1 md:col-start-2 row-start-1 h-14 border-b border-os-stroke bg-os-surface-solid z-[1050] px-4 flex items-center pt-safe"
                    style={{ isolation: 'isolate' }}
                >
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
                        onToggleHealth={() => setSystemHealthOpen(!systemHealthOpen)}
                        isLiteMode={isLiteMode}
                        onToggleLiteMode={() => setIsLiteMode(!isLiteMode)}
                    />
                </header>

                {/* 3. Content Surface - Col 2, Row 2 */}
                <main
                    className="col-span-1 md:col-start-2 row-start-2 relative z-[1] overflow-y-auto overflow-x-hidden"
                    style={{ isolation: 'isolate' }}
                >
                    <ContentSurface
                        copilotOpen={copilotOpen}
                        reservedTop={0}
                        sidebarWidth={0}
                    >
                        <PullToRefresh
                            onRefresh={async () => {
                                console.log('[System] OSShell manual refresh triggered');
                                await new Promise(resolve => setTimeout(resolve, 800));
                            }}
                        >
                            <AnimatePresence mode="popLayout">


                                {showPushPrompt && (
                                    <motion.div
                                        key="push-prompt"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="mb-4 mx-4 md:mx-6 mt-4 p-5 os-panel-glass flex items-center justify-between gap-4 overflow-hidden relative"
                                    >
                                        <div className="os-ambient-orb" style={{ top: '-30%', right: '70%', background: 'radial-gradient(circle, hsl(var(--info) / 0.3), transparent 70%)' }} />
                                        <div className="flex items-center gap-3 z-10">
                                            <div className="w-11 h-11 rounded-os-md bg-info/10 border border-info/20 flex items-center justify-center backdrop-blur-md">
                                                <BellRing className="w-5 h-5 text-info animate-pulse" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-os-sm text-foreground">Real-time Trade Signals</h4>
                                                <p className="text-os-xs text-muted-foreground font-medium">Instant trade alerts</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 z-10">
                                            <button onClick={() => setShowPushPrompt(false)} className="px-3 py-2 text-os-xs font-semibold text-muted-foreground">Skip</button>
                                            <button onClick={async () => { await subscribe(); setShowPushPrompt(false); }} className="px-4 py-2 bg-info text-info-foreground rounded-os-sm text-os-xs font-bold shadow-os-md flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Enable</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="p-4 md:p-6 pb-36 md:pb-6">
                                {children}
                            </div>
                        </PullToRefresh>
                    </ContentSurface>
                </main>

                {/* Mobile & Global Overlays */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                className="fixed inset-0 bg-black/15 backdrop-blur-[2px] z-[1000] md:hidden"
                                onClick={() => setSidebarOpen(false)}
                            />
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                className="fixed inset-y-0 left-0 w-full sm:w-[320px] bg-os-surface-solid z-[1001] md:hidden shadow-[8px_0_40px_rgba(0,0,0,0.12)]"
                            >
                                <TradeOSSidebar
                                    capabilities={capabilities}
                                    isAdmin={isAdmin}
                                    notificationCounts={notificationCounts}
                                    onClose={() => setSidebarOpen(false)}
                                    sidebarOpen={true}
                                    workspaceMode={workspaceMode}
                                />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <MobileBottomNav
                    isBuyer={isBuyer}
                    isSeller={isSeller}
                    isLogistics={isLogistics}
                    isHybrid={isHybridCapability}
                />

                <CommandPalette
                    open={commandPaletteOpen}
                    onClose={() => setCommandPaletteOpen(false)}
                />

                <SystemHealthDrawer
                    isOpen={systemHealthOpen}
                    onClose={() => setSystemHealthOpen(false)}
                />

                <AnimatePresence>
                    {copilotOpen && (
                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed right-0 top-0 bottom-0 w-full md:w-[320px] shadow-2xl z-[1000] border-l border-os-stroke"
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
