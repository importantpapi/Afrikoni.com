import { toast } from 'sonner';

/**
 * Service Worker Registration for Afrikoni Trade OS
 * Handles offline caching and update notifications.
 */
export function registerSW() {
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
                                    // New update available
                                    console.log('[Trade OS] New content is available; please refresh.');
                                    toast.info('New Trade OS version available', {
                                        description: 'Refresh to apply critical updates.',
                                        action: {
                                            label: 'Refresh',
                                            onClick: () => window.location.reload()
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
