import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function usePushNotifications() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);

    // Convert VAPID key
    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const checkSubscription = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setLoading(false);
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
            setIsSubscribed(!!sub);
        } catch (error) {
            console.error('[Push] Error checking subscription:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSubscription();
    }, [checkSubscription]);

    const subscribe = async () => {
        if (!user) return;
        if (!VAPID_PUBLIC_KEY) {
            console.warn('[Push] VAPID public key missing in ENV');
            return;
        }

        try {
            setLoading(true);
            const registration = await navigator.serviceWorker.ready;

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            const { endpoint, keys } = sub.toJSON();

            // Save to Supabase
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    endpoint,
                    p256dh: keys.p256dh,
                    auth: keys.auth,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id, endpoint' });

            if (error) throw error;

            setSubscription(sub);
            setIsSubscribed(true);
            toast.success('Notifications enabled', {
                description: 'You will now receive trade alerts on this device.'
            });
        } catch (error) {
            console.error('[Push] Subscription failed:', error);
            toast.error('Failed to enable notifications');
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        if (!subscription) return;

        try {
            setLoading(true);
            await subscription.unsubscribe();

            // Remove from Supabase
            await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', subscription.endpoint);

            setSubscription(null);
            setIsSubscribed(false);
            toast.info('Notifications disabled');
        } catch (error) {
            console.error('[Push] Unsubscription failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        isSubscribed,
        loading,
        subscribe,
        unsubscribe,
        permission: Notification.permission
    };
}
