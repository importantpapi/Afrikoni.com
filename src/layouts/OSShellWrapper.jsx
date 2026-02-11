/**
 * OS Shell Wrapper - Incremental Integration
 * 
 * This is a lightweight wrapper that adds OS Shell architecture around
 * the existing DashboardLayout without breaking existing functionality.
 * 
 * Strategy: Minimal changes, maximum compatibility
 * - Wraps existing layout with OS Shell zones
 * - Preserves all existing state management
 * - Allows testing OS Shell architecture safely
 * - Can be fully integrated later with confidence
 */

import React from 'react';
import { SystemLayer } from '@/components/os-shell/SystemLayer';
import { IdentityLayer } from '@/components/os-shell/IdentityLayer';
import { OS_Z_INDEX, OS_DIMENSIONS } from '@/layouts/OSShell';

export default function OSShellWrapper({
    children,
    systemState,
    user,
    organization,
    workspaceMode = 'simple',
    onToggleMode,
    onOpenCommandPalette,
    onToggleSidebar,
    onToggleCopilot,
    notificationCount = 0,
    showOSShell = true // Feature flag for easy rollback
}) {
    // If OS Shell is disabled, just render children
    if (!showOSShell) {
        return <>{children}</>;
    }

    return (
        <div className="relative w-full min-h-screen">
            {/* System Layer - Trade Readiness Bar */}
            <div
                className="fixed top-0 left-0 right-0"
                style={{
                    height: `${OS_DIMENSIONS.systemLayer.height}px`,
                    zIndex: OS_Z_INDEX.systemLayer
                }}
            >
                <SystemLayer systemState={systemState} />
            </div>

            {/* Identity Layer - User controls */}
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
                    onToggleSidebar={onToggleSidebar}
                    onToggleCopilot={onToggleCopilot}
                />
            </div>

            {/* Content Area - Existing DashboardLayout content */}
            <div
                className="relative"
                style={{
                    marginTop: `${OS_DIMENSIONS.reservedTop}px`
                }}
            >
                {children}
            </div>
        </div>
    );
}
