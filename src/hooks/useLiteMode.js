/**
 * ============================================================================
 * useLiteMode Hook - Lite Mode State Management
 * ============================================================================
 * 
 * Manages Lite Mode state with localStorage and database persistence
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';

export function useLiteMode() {
    const { user, profile } = useAuth();
    const [isLiteMode, setIsLiteMode] = useState(() => {
        // Initialize from localStorage
        const stored = localStorage.getItem('afrikoni_lite_mode');
        return stored ? JSON.parse(stored) : true; // Default to Lite Mode for new users
    });
    const [loading, setLoading] = useState(true);

    // Load from database on mount
    useEffect(() => {
        if (user && profile?.id) {
            loadLiteModePreference();
        } else {
            setLoading(false);
        }
    }, [user, profile?.id]);

    const loadLiteModePreference = async () => {
        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('lite_mode')
                .eq('user_id', profile.id)
                .single();

            if (!error && data) {
                setIsLiteMode(data.lite_mode ?? true);
                localStorage.setItem('afrikoni_lite_mode', JSON.stringify(data.lite_mode ?? true));
            }
        } catch (err) {
            console.error('Failed to load lite mode preference:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleLiteMode = async () => {
        const newValue = !isLiteMode;
        setIsLiteMode(newValue);
        localStorage.setItem('afrikoni_lite_mode', JSON.stringify(newValue));

        // Persist to database if user is logged in
        if (user && profile?.id) {
            try {
                await supabase
                    .from('user_preferences')
                    .upsert({
                        user_id: profile.id,
                        lite_mode: newValue,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' });
            } catch (err) {
                console.error('Failed to save lite mode preference:', err);
            }
        }
    };

    return {
        isLiteMode,
        toggleLiteMode,
        loading,
    };
}
