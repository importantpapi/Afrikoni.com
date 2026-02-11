/**
 * Z-Index Configuration for OS Shell
 * 
 * Defines the z-index hierarchy for the entire Trade OS.
 * All components should reference these values instead of hardcoding z-index.
 */

export const osZIndex = {
    // System layers (highest priority)
    systemLayer: 1000,
    identityLayer: 999,

    // Overlays and modals
    modal: 900,
    modalBackdrop: 890,
    dropdown: 800,
    overlay: 700,

    // Navigation
    workspaceNav: 100,

    // Copilot and assistants
    copilot: 50,

    // Content (lowest priority)
    content: 1
};
