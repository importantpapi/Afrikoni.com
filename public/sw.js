// ✅ PWA FIX: Versioned cache with build timestamp to force updates
const CACHE_VERSION = '2026-02-13-v2-stabilized';
const CACHE_NAME = `afrikoni-os-${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/favicon.ico',
    '/favicon.svg',
    '/site.webmanifest',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png'
];

// 1. Installation: Cache core UI assets
self.addEventListener('install', (event) => {
    console.log(`[Service Worker] Installing version ${CACHE_VERSION}`);
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching core assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // ✅ PWA FIX: Skip waiting to activate new SW immediately
    self.skipWaiting();
});

// 2. Activation: Clean up old caches
self.addEventListener('activate', (event) => {
    console.log(`[Service Worker] Activating version ${CACHE_VERSION}`);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            // ✅ PWA FIX: Delete ALL old caches to prevent version conflicts
            const deletePromises = cacheNames.map((cacheName) => {
                if (cacheName !== CACHE_NAME) {
                    console.log('[Service Worker] Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                }
            });
            return Promise.all(deletePromises);
        }).then(() => {
            // ✅ PWA FIX: Immediately claim all clients (no mixed versions)
            console.log('[Service Worker] Claiming all clients');
            return self.clients.claim();
        })
    );
});

// 3. Fetch Strategy: Hybrid Cache/Network
self.addEventListener('fetch', (event) => {
    // ✅ STABILITY FIX: Guard against non-GET requests
    // Service Workers can only cache GET requests
    // This prevents "Failed to execute 'put' on 'Cache': Request method 'POST' is unsupported"
    if (event.request.method !== 'GET') {
        return;
    }

    // ✅ STABILITY FIX: Guard against extension URLs
    // Prevents crashes when browser extensions make requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    const url = new URL(event.request.url);

    // ✅ PWA FIX: Network-First for index.html and root path
    // This is CRITICAL to prevent "Hard Refresh" loops on mobile devices.
    // index.html contains the hashes of all other assets; if it's stale, the app breaks.
    if (url.pathname === '/' || url.pathname === '/index.html') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }

    // ✅ PWA FIX: Network-First for JS bundles (prevent stale code)
    if (url.pathname.endsWith('.js') || url.pathname.includes('/assets/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Only cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Strategy A: Network-Only for API calls (Supabase)
    // ✅ CRITICAL FIX: Do NOT cache API responses in Service Worker.
    // Let the application handle data fetching and state management.
    // Caching API responses here causes "Hard Refresh" bugs where stale data persists.
    if (url.hostname.includes('supabase.co')) {
        return; // Bypass SW, go straight to network
    }

    // Strategy B: Cache-First for static assets
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                // Optionally cache new static assets discovered during browsing
                if (fetchResponse.status === 200 && fetchResponse.type === 'basic') {
                    const responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return fetchResponse;
            });
        })
    );
});

// 4. Push Notification Support
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.body || 'New update from Afrikoni Trade OS',
            icon: '/android-chrome-192x192.png',
            badge: '/favicon-32x32.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/dashboard',
                timestamp: Date.now()
            },
            actions: data.actions || [
                { action: 'view', title: 'Open Dashboard' }
            ],
            tag: data.tag || 'trade-update',
            renotify: true
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Afrikoni OS', options)
        );
    } catch (error) {
        console.error('[Service Worker] Push event error:', error);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // If a window is already open at the target URL, focus it
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise, open a new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});
