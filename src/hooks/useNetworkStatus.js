import { useState, useEffect } from 'react';

/**
 * useNetworkStatus Hook
 * 
 * Returns the current network connection status.
 * Used to trigger "Offline Mode" UI and pause/resume sync.
 */
export function useNetworkStatus() {
    const [isOnline, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline };
}
