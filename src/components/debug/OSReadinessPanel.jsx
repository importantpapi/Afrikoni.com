import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useCapability } from '@/context/CapabilityContext';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { X, Activity, Database, Shield, GitBranch, RefreshCw } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';

/**
 * OS Readiness Panel (Dev Only)
 * Visualizes the internal state of the Trade OS Kernel.
 * Helps verify "Hard Refresh" fixes by showing real-time state.
 */
export default function OSReadinessPanel() {
    // Only available in DEV mode
    if (!import.meta.env.DEV) return null;

    const [isOpen, setIsOpen] = useState(false);
    const { user, profile, authReady, authResolutionComplete } = useAuth();
    const capabilities = useCapability();
    const { isSystemReady, isPreWarming } = useDashboardKernel();

    // Track Boot Trace from window (if available)
    const [bootLogs, setBootLogs] = useState([]);

    useEffect(() => {
        const handleLog = () => {
            // In a real implementation we might hook into console.log
            // For now, we just re-render on intervals to catch up
        };
        const interval = setInterval(() => {
            setBootLogs(window.__BOOT_LOGS || []);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-[9999] bg-black/80 text-afrikoni-gold p-2 rounded-full border border-afrikoni-gold/20 hover:bg-black transition-all shadow-2xl"
                title="Open OS Debug Panel"
            >
                <Activity className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9999] w-[400px] bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden font-mono text-[10px] text-zinc-400">
            {/* HEADER */}
            <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-zinc-100 uppercase tracking-wider">Kernel Status</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            {/* CONTENT */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">

                {/* 1. SYSTEM GATE */}
                <Section title="System Gate" icon={Shield}>
                    <Row label="Is System Ready" value={isSystemReady} good={true} />
                    <Row label="Is Pre-Warming" value={isPreWarming} good={false} warn={true} />
                    <Row label="Auth Ready" value={authReady} good={true} />
                    <Row label="Resolution Complete" value={authResolutionComplete} good={true} />
                </Section>

                {/* 2. IDENTITY */}
                <Section title="Identity Layer" icon={Database}>
                    <Row label="User ID" value={user ? user.id.slice(0, 8) + '...' : 'NULL'} good={!!user} />
                    <Row label="Profile ID" value={profile ? profile.id.slice(0, 8) + '...' : 'NULL'} good={!!profile} />
                    <Row label="Company ID" value={profile?.company_id || 'NULL'} good={!!profile?.company_id} />
                </Section>

                {/* 3. CAPABILITIES */}
                <Section title="Capabilities" icon={GitBranch}>
                    <Row label="Ready" value={capabilities.ready} good={true} />
                    <Row label="Loading" value={capabilities.loading} good={false} inverse={true} />
                    <Row label="Status" value={`${capabilities.sell_status} / ${capabilities.logistics_status}`} plain={true} />
                </Section>

                {/* 4. VERSION */}
                <Section title="Version" icon={GitBranch}>
                    <div className="flex justify-between items-center">
                        <span>Build: {__BUILD_VERSION__}</span>
                        <Button size="xs" variant="outline" onClick={() => window.location.reload(true)}>
                            <RefreshCw className="w-3 h-3 mr-1" /> Hard Reload
                        </Button>
                    </div>
                </Section>

            </div>
        </div>
    );
}

const Section = ({ title, icon: Icon, children }) => (
    <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-zinc-100 font-bold uppercase">
            <Icon className="w-3 h-3" /> {title}
        </h3>
        <div className="bg-black/50 rounded-lg p-2 space-y-1 border border-white/5">
            {children}
        </div>
    </div>
);

const Row = ({ label, value, good, inverse, warn, plain }) => {
    let color = 'text-zinc-500';
    if (!plain) {
        if (warn && value) color = 'text-amber-500';
        else if (inverse) color = value ? 'text-red-500' : 'text-emerald-500';
        else color = value ? 'text-emerald-500' : 'text-red-500';
    }

    return (
        <div className="flex justify-between items-center">
            <span>{label}</span>
            <span className={color}>{String(value)}</span>
        </div>
    );
};
