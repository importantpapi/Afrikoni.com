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
    reservedTop = 104, // system (56) + identity (48)
    sidebarWidth = 72 // desktop sidebar width
}) {
    return (
        <div
            className="fixed bottom-0 overflow-y-auto overflow-x-hidden bg-afrikoni-offwhite dark:bg-[#0A0A0A] transition-all duration-300 ease-in-out"
            style={{
                top: `${reservedTop}px`,
                left: '0',
                right: copilotOpen ? '320px' : '0',
                paddingLeft: '0', // Mobile default
                zIndex: 1
            }}
        >
            {/* Desktop: Add padding for sidebar */}
            <div className="md:pl-[72px] w-full min-h-full">
                {children}
            </div>
        </div>
    );
}
