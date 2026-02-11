import { useState, useEffect } from 'react';

/**
 * useOSSettings - Manage premium OS preferences (Performance & Interface)
 * 
 * Features:
 * - liteMode: Disables heavy blurs and gradients (Performance)
 * - reducedMotion: Disables spring animations
 * - interfaceMode: 'simple' | 'power' (UI Density)
 * - glassOpacity: Customization of the glass texture
 */
export function useOSSettings() {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('afrikoni_os_settings');
        const legacyLite = localStorage.getItem('afrikoni_lite_mode'); // Migrating old key

        return saved ? JSON.parse(saved) : {
            liteMode: legacyLite === 'true' || false,
            reducedMotion: false,
            interfaceMode: legacyLite === 'true' ? 'simple' : 'power',
            glassOpacity: 0.7,
            performanceTier: 'high'
        };
    });

    useEffect(() => {
        localStorage.setItem('afrikoni_os_settings', JSON.stringify(settings));

        // Apply global classes for CSS-based optimizations
        if (settings.liteMode) {
            document.documentElement.classList.add('os-lite-mode');
        } else {
            document.documentElement.classList.remove('os-lite-mode');
        }

        if (settings.reducedMotion) {
            document.documentElement.classList.add('os-reduced-motion');
        } else {
            document.documentElement.classList.remove('os-reduced-motion');
        }
    }, [settings]);

    const updateSettings = (updates) => {
        setSettings(prev => ({ ...prev, ...updates }));
    };

    return { ...settings, updateSettings };
}
