/**
 * ============================================================================
 * LITE MODE TOGGLE - SME-Friendly Interface Switch
 * ============================================================================
 * 
 * Allows users to toggle between:
 * - Lite Mode: Simplified 5-tab interface for beginners
 * - Power Mode: Full Trade OS with all advanced features
 * 
 * Preference is persisted in localStorage and Supabase
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { Switch } from '@/components/shared/ui/switch';
import { Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LiteModeToggle({ className }) {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [isLiteMode, setIsLiteMode] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load preference on mount
    useEffect(() => {
        loadPreference();
    }, [user, profile?.company_id]);

    const loadPreference = async () => {
        setLoading(true);
        try {
            // First check localStorage for immediate response
            const localPref = localStorage.getItem('afrikoni_lite_mode');
            if (localPref !== null) {
                setIsLiteMode(localPref === 'true');
            }

            // Then sync with database if user is logged in
            if (user && profile?.company_id) {
                const { data, error } = await supabase
                    .from('user_preferences')
                    .select('lite_mode')
                    .eq('user_id', user.id)
                    .single();

                if (data) {
                    const dbPref = data.lite_mode ?? false;
                    setIsLiteMode(dbPref);
                    localStorage.setItem('afrikoni_lite_mode', String(dbPref));
                } else if (!error || error.code === 'PGRST116') {
                    // No preference found, default to Lite Mode for new users
                    const defaultMode = true;
                    setIsLiteMode(defaultMode);
                    localStorage.setItem('afrikoni_lite_mode', String(defaultMode));

                    // Create preference in database
                    await supabase.from('user_preferences').upsert({
                        user_id: user.id,
                        company_id: profile.company_id,
                        lite_mode: defaultMode,
                    });
                }
            }
        } catch (err) {
            console.error('Failed to load Lite Mode preference:', err);
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

        // Navigate to appropriate dashboard
        if (newValue) {
            // Switching to Lite Mode - go to simplified dashboard
            navigate('/dashboard/lite');
        } else {
            // Switching to Power Mode - go to full dashboard
            navigate('/dashboard');
        }
    };

    if (loading) {
        return null;
    }

    return (
        <div className={cn("flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10", className)}>
            <div className="flex items-center gap-2 flex-1">
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isLiteMode ? "bg-emerald-500/20" : "bg-[#D4A937]/20"
                )}>
                    {isLiteMode ? (
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                    ) : (
                        <Zap className="w-4 h-4 text-[#D4A937]" />
                    )}
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                        {isLiteMode ? 'Lite Mode' : 'Power Mode'}
                    </div>
                    <div className="text-xs text-white/60">
                        {isLiteMode ? 'Simplified interface' : 'Full Trade OS'}
                    </div>
                </div>
            </div>
            <Switch
                checked={!isLiteMode}
                onCheckedChange={() => toggleLiteMode()}
                className="data-[state=checked]:bg-[#D4A937]"
            />
        </div>
    );
}

/**
 * Hook to check if Lite Mode is active
 */
export function useLiteMode() {
    const [isLiteMode, setIsLiteMode] = useState(() => {
        const stored = localStorage.getItem('afrikoni_lite_mode');
        return stored === 'true' || stored === null; // Default to true for new users
    });

    useEffect(() => {
        const handleStorageChange = () => {
            const stored = localStorage.getItem('afrikoni_lite_mode');
            setIsLiteMode(stored === 'true' || stored === null);
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return isLiteMode;
}
