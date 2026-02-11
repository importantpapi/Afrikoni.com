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

import React, { useState } from 'react';
import { SystemLayer } from '@/components/os-shell/SystemLayer';
import { IdentityLayer } from '@/components/os-shell/IdentityLayer';
import { ContentSurface } from '@/components/os-shell/ContentSurface';
import TradeOSSidebar from '@/components/dashboard/TradeOSSidebar';
import { AICopilotSidebar } from '@/components/ai/AICopilotSidebar';
import { AnimatePresence, motion } from 'framer-motion';
import { zIndex } from '@/config/zIndex';

// OS Shell Z-Index Hierarchy
export const OS_Z_INDEX = {
    systemLayer: 1000,
    identityLayer: 999,
    modal: 900,
    dropdown: 800,
    overlay: 700,
    workspaceNav: 100,
    copilot: 50,
    content: 1
};

// OS Shell Dimensions
export const OS_DIMENSIONS = {
    systemLayer: { height: 56 },
    identityLayer: { height: 48 },
    workspaceNav: {
        desktop: 240,
        collapsed: 72
    },
    copilot: { width: 320 },
    // Total reserved top space
    get reservedTop() {
        return this.systemLayer.height + this.identityLayer.height;
    }
};

export default function OSShell({
    children,
    systemState,
    capabilities,
    user,
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

    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* System Layer - Always visible at top */}
            <div
                className="fixed top-0 left-0 right-0"
                style={{
                    height: `${OS_DIMENSIONS.systemLayer.height}px`,
                    zIndex: OS_Z_INDEX.systemLayer
                }}
            >
                <SystemLayer systemState={systemState} />
            </div>

            {/* Identity Layer - Below system layer */}
            <div
                className="fixed left-0 right-0"
                style={{
                    top: `${OS_DIMENSIONS.systemLayer.height}px`,
                    height: `${OS_DIMENSIONS.identityLayer.height}px`,
                    zIndex: OS_Z_INDEX.identityLayer
                }}
            >
                <IdentityLayer
                    user={user}
                    organization={organization}
                    workspaceMode={workspaceMode}
                    onToggleMode={onToggleMode}
                    onOpenCommandPalette={onOpenCommandPalette}
                    notificationCount={notificationCount}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onToggleCopilot={() => setCopilotOpen(!copilotOpen)}
                />
            </div>

            {/* Workspace Navigation Sidebar */}
            <div
                className="fixed left-0 bottom-0"
                style={{
                    top: `${OS_DIMENSIONS.reservedTop}px`,
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
                {children}
            </ContentSurface>

            {/* AI Copilot Sidebar - Optional right sidebar */}
            {copilotOpen && (
                <div
                    className="fixed right-0 bottom-0"
                    style={{
                        top: `${OS_DIMENSIONS.reservedTop}px`,
                        width: `${OS_DIMENSIONS.copilot.width}px`,
                        zIndex: OS_Z_INDEX.copilot
                    }}
                >
                    <AICopilotSidebar onClose={() => setCopilotOpen(false)} />
                </div>
            )}
        </div>
    );
}
