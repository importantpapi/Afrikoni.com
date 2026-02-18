import React, { useState, useEffect } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI to notify the user they can add to home screen
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        setIsVisible(false);
        // Show the prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            setDeferredPrompt(null);
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-8 z-50 md:w-96"
            >
                <div className="bg-os-surface-base border border-os-stroke shadow-os-xl rounded-xl p-4 flex items-center gap-4 relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 left-0 w-1 h-full bg-os-accent" />
                    <div className="flex-1">
                        <h4 className="font-semibold text-os-text-primary mb-1">Install Afrikoni App</h4>
                        <p className="text-xs text-os-text-secondary">Add to your home screen for faster access and offline mode.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleInstallClick} className="bg-os-accent text-os-surface-base hover:bg-os-accent/90">
                            Install
                        </Button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-1 hover:bg-os-surface-2 rounded-full text-os-text-secondary"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
