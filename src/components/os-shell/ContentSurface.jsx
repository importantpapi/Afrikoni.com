/**
 * Content Surface Component
 * 
 * Wrapper for main application content that calculates available space
 * after system and identity layers are accounted for.
 * 
 * Dimensions: Calculated based on reserved top space and sidebar/copilot widths
 * Z-Index: 1 (lowest, content layer)
 */

import React from 'react';

export function ContentSurface({
    children,
    copilotOpen = false,
    reservedTop = 104, // default matches OS_DIMENSIONS.reservedTop
    sidebarWidth = 72  // default matches OS_DIMENSIONS.workspaceNav.collapsed
}) {
    return (
        <div
            className="fixed bottom-0 overflow-y-auto overflow-x-hidden bg-afrikoni-offwhite dark:bg-[#0A0A0A] transition-all duration-300 ease-in-out"
            style={{
                top: `${reservedTop}px`,
                left: '0',
                right: copilotOpen ? 'var(--os-copilot-width, 320px)' : '0',
                zIndex: 1
            }}
        >
            {/* Desktop: Add padding for sidebar */}
            <div className="md:pl-[var(--os-sidebar-width,72px)] w-full min-h-full">
                {children}
            </div>
        </div>
    );
}
