const CACHE_NAME = 'afrikoni-os-v1';
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
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching core assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 2. Activation: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// 3. Fetch Strategy: Hybrid Cache/Network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Strategy A: Network-First for API calls (Supabase)
    if (url.hostname.includes('supabase.co')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Clone and cache the successful response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails (Offline mode)
                    return caches.match(event.request);
                })
        );
        return;
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
