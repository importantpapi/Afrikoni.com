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

import { useOSSettings } from '@/hooks/useOSSettings';

export function LiteModeToggle({ className }) {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { liteMode, interfaceMode, updateSettings } = useOSSettings();
    const [loading, setLoading] = useState(false); // Hook handles loading defaults now

    const toggleInterfaceMode = async () => {
        const isCurrentlySimple = interfaceMode === 'simple';
        const newInterfaceMode = isCurrentlySimple ? 'power' : 'simple';

        // Use performance mode as well for 'simple' interface users
        updateSettings({
            interfaceMode: newInterfaceMode,
            liteMode: newInterfaceMode === 'simple'
        });

        // Persist to database if user is logged in
        if (user && profile?.id) {
            try {
                await supabase
                    .from('user_preferences')
                    .upsert({
                        user_id: profile.id,
                        lite_mode: newInterfaceMode === 'simple',
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' });
            } catch (err) {
                console.error('Failed to save lite mode preference:', err);
            }
        }

        // Navigate to appropriate dashboard
        if (newInterfaceMode === 'simple') {
            navigate('/dashboard/lite');
        } else {
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
                    interfaceMode === 'simple' ? "bg-emerald-500/20" : "bg-os-accent/20"
                )}>
                    {interfaceMode === 'simple' ? (
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                    ) : (
                        <Zap className="w-4 h-4 text-os-accent" />
                    )}
                </div>
                <div className="flex-1">
                    <div className="text-os-sm font-medium text-white">
                        {interfaceMode === 'simple' ? 'Lite Mode' : 'Power Mode'}
                    </div>
                    <div className="text-os-xs text-white/60">
                        {interfaceMode === 'simple' ? 'Simplified interface' : 'Full Trade OS'}
                    </div>
                </div>
            </div>
            <Switch
                checked={interfaceMode !== 'simple'}
                onCheckedChange={() => toggleInterfaceMode()}
                className="data-[state=checked]:bg-os-accent"
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
