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
    reservedTop = 0,
    sidebarWidth = 0
}) {
    return (
        <div
            className="w-full h-full overflow-y-auto overflow-x-hidden bg-afrikoni-offwhite dark:bg-[#0A0A0A] transition-all duration-300 ease-in-out scroll-smooth"
            style={{
                zIndex: 1
            }}
        >
            <div className="w-full min-h-full">
                {children}
            </div>
        </div>
    );
}
