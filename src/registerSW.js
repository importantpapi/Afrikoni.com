import { toast } from 'sonner';

/**
 * Service Worker Registration for Afrikoni Trade OS
 * Handles offline caching and update notifications.
 */
export function registerSW() {
    // ✅ PWA FIX: Disable SW in dev mode to prevent caching issues
    if (import.meta.env.DEV) {
        console.log('[Trade OS] Dev mode detected - unregistering service workers');
        unregister();
        return;
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const swUrl = '/sw.js';

            navigator.serviceWorker
                .register(swUrl)
                .then((registration) => {
                    console.log('[Trade OS] Service Worker registered: ', registration);

                    // Check for updates
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        if (installingWorker == null) {
                            return;
                        }

                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    // ✅ PWA FIX: Force hard reload to clear all caches
                                    console.log('[Trade OS] New version available - forcing hard reload');
                                    toast.info('Critical Trade OS update available', {
                                        description: 'Click to update now (prevents version conflicts)',
                                        action: {
                                            label: 'Update Now',
                                            onClick: () => {
                                                // Force hard reload (bypass cache)
                                                window.location.reload(true);
                                            }
                                        },
                                        duration: Infinity
                                    });
                                } else {
                                    // Content is cached for offline use
                                    console.log('[Trade OS] Content is cached for offline use.');
                                    toast.success('Ready for offline use');
                                }
                            }
                        };
                    };
                })
                .catch((error) => {
                    console.error('[Trade OS] Service Worker registration failed:', error);
                });
        });
    }
}

export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => {
                registration.unregister();
            })
            .catch((error) => {
                console.error(error.message);
            });
    }
}
