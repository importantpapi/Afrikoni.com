import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { telemetry } from '@/services/telemetryService';

/**
 * Enterprise Auto-Update Hook
 * 
 * "Big Tech" Strategy:
 * 1. Polls /meta.json for the active build version.
 * 2. Compares with the local version (injected at build time).
 * 3. If mismatch: Clears caches and allows the app to update.
 * 
 * Prevents "Zombie" clients running stale code against new APIs.
 */
export function useVersionCheck() {
    const lastCheckRef = useRef(Date.now());
    // Frequency: Check every route change or focused window, but throttled to 60s

    useEffect(() => {
        // Only run in production to avoid dev loop
        if (import.meta.env.DEV) return;

        const checkVersion = async () => {
            try {
                // Anti-pattern: caching the version check itself
                const response = await fetch('/meta.json?t=' + Date.now(), {
                    cache: 'no-store'
                });

                if (!response.ok) return;

                const meta = await response.json();
                const localVersion = __BUILD_VERSION__; // Defined in vite.config.js as numeric timestamp
                const remoteVersion = meta.version;

                if (localVersion && remoteVersion && localVersion != remoteVersion) {
                    console.log(`[VersionCheck] New version detected: ${remoteVersion} (Local: ${localVersion})`);

                    // 1. Show Blocking "Update Required" Modal (Direct DOM Injection)
                    // This prevents the user from clicking anything while we prepare the update
                    const overlay = document.createElement('div');
                    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;text-align:center;padding:20px;';
                    overlay.innerHTML = `
                        <div style="font-size:24px;margin-bottom:20px;">Applying Critical Update...</div>
                        <div style="font-family:monospace;opacity:0.7;">v${localVersion} -> v${remoteVersion}</div>
                        <div style="margin-top:20px;width:40px;height:40px;border:3px solid rgba(255,255,255,0.3);border-top-color:#e8c68a;border-radius:50%;animation:spin 1s linear infinite;"></div>
                        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                    `;
                    document.body.appendChild(overlay);

                    // Notify and Log
                    telemetry.trackEvent('version_mismatch_detected', {
                        local: localVersion,
                        remote: remoteVersion
                    });

                    // 2. Clear Caches
                    if ('caches' in window) {
                        try {
                            const keys = await caches.keys();
                            await Promise.all(keys.map(key => caches.delete(key)));
                            console.log('[VersionCheck] Caches cleared');
                        } catch (e) {
                            console.error('[VersionCheck] Cache clear failed:', e);
                        }
                    }

                    // 3. Unregister Service Workers
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of registrations) {
                            await registration.unregister();
                        }
                    }

                    // 4. Force Reload with Cache Bypass
                    window.location.reload(true);
                }
            } catch (err) {
                // Silent fail - network might be flaky, don't nag user
                console.warn('[VersionCheck] Failed to check version:', err);
            }
        };

        // Check on mount
        checkVersion();

        // Check on visibility change (user comes back to tab)
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                const now = Date.now();
                // Check at most once per minute
                if (now - lastCheckRef.current > 60000) {
                    lastCheckRef.current = now;
                    checkVersion();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);
}
