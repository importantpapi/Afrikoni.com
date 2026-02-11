import { useState, useEffect } from 'react';

/**
 * Hook to manage PWA installation state and trigger the prompt.
 * Captures the 'beforeinstallprompt' event and provides an install function.
 */
export function usePWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // 1. Listen for the browser's install prompt event
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsInstallable(true);
            console.log('[PWA] beforeinstallprompt event captured');
        };

        // 2. Track successful installments
        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setIsInstallable(false);
            setIsInstalled(true);
            console.log('[PWA] App successfully installed');
        };

        // 3. Check if already running in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            setIsInstalled(true);
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User response to install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, clear it
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return { isInstallable, isInstalled, installApp };
}
